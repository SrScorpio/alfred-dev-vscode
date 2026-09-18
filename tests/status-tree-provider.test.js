const assert = require('node:assert/strict');
const Module = require('node:module');
const test = require('node:test');

const vscode = {
  EventEmitter: class {
    constructor() {
      this.listeners = [];
      this.event = (listener) => {
        this.listeners.push(listener);
        return { dispose() {} };
      };
    }
    fire(value) {
      for (const listener of this.listeners) {
        listener(value);
      }
    }
  },
  TreeItem: class {
    constructor(label, collapsibleState) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  ThemeIcon: class {
    constructor(id) {
      this.id = id;
    }
  },
  Uri: {
    parse(value) {
      return {
        scheme: new URL(value).protocol.replace(/:$/, ''),
        fsPath: value,
        toString() {
          return value;
        },
      };
    },
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/tmp/alfred-project' } }],
    isTrusted: true,
  },
};

const originalLoad = Module._load;
Module._load = function mockVscode(request, parent, isMain) {
  if (request === 'vscode') {
    return vscode;
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { StatusTreeProvider } = require('../out/providers/statusTreeProvider.js');
Module._load = originalLoad;

const SNAPSHOT = `**Flujo:** Feature
**Fase actual:** Desarrollo
`;

const ISSUE = {
  number: 12,
  title: 'Abrir TreeView',
  htmlUrl: 'https://github.com/acme/widgets/issues/12',
  state: 'open',
};

function labelsOf(items) {
  return items.map((item) => item.label);
}

function waitForTreeChange(provider, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('timeout esperando onDidChangeTreeData')),
      timeoutMs,
    );
    provider.onDidChangeTreeData(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function assertSnapshotAndActions(labels) {
  assert.ok(labels.includes('Refrescar estado'));
  assert.ok(labels.includes('Hablar con Alfred'));
  assert.ok(labels.includes('Flujo: Feature'));
}

async function getChildrenBeforeFetchSettles(provider, timeoutMs = 250) {
  const started = Date.now();
  const items = await Promise.race([
    provider.getChildren(),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('getChildren no debe esperar al GET de issues')),
        timeoutMs,
      );
    }),
  ]);
  assert.ok(
    Date.now() - started < timeoutMs,
    'getChildren debe resolver sin esperar el timeout de 8s del GET',
  );
  return items;
}

test('getChildren pinta acciones y snapshot sin esperar un GET de issues pendiente', async () => {
  let releaseFetch;
  const fetchGate = new Promise((resolve) => {
    releaseFetch = resolve;
  });

  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      await fetchGate;
      return [ISSUE];
    },
    readStatusFile: async () => SNAPSHOT,
  });

  try {
    const labels = labelsOf(await getChildrenBeforeFetchSettles(provider));
    assertSnapshotAndActions(labels);
    assert.ok(!labels.includes('Issues abiertas'));
    assert.ok(!labels.includes('#12 Abrir TreeView'));
  } finally {
    releaseFetch();
  }
});

test('cuando el GET resuelve, el segundo getChildren incluye Issues abiertas', async () => {
  let releaseFetch;
  const fetchGate = new Promise((resolve) => {
    releaseFetch = resolve;
  });

  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      await fetchGate;
      return [ISSUE];
    },
    readStatusFile: async () => SNAPSHOT,
  });

  const changed = waitForTreeChange(provider);
  const firstLabels = labelsOf(await getChildrenBeforeFetchSettles(provider));
  assertSnapshotAndActions(firstLabels);
  assert.ok(!firstLabels.includes('Issues abiertas'));

  releaseFetch();
  await changed;

  const secondLabels = labelsOf(await provider.getChildren());
  assertSnapshotAndActions(secondLabels);
  assert.ok(secondLabels.includes('Issues abiertas'));
  assert.ok(secondLabels.includes('#12 Abrir TreeView'));
});

test('fetch reject: primer tick tiene snapshot; el segundo muestra el error accionable', async () => {
  let rejectFetch;
  const fetchGate = new Promise((_, reject) => {
    rejectFetch = reject;
  });

  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      await fetchGate;
    },
    readStatusFile: async () => SNAPSHOT,
  });

  const changed = waitForTreeChange(provider);
  const firstLabels = labelsOf(await getChildrenBeforeFetchSettles(provider));
  assertSnapshotAndActions(firstLabels);
  assert.ok(!firstLabels.some((label) => /issues de GitHub|no público|sin permiso/i.test(label)));
  assert.ok(!firstLabels.includes('Issues abiertas'));

  rejectFetch(new Error('No se pudieron leer issues de GitHub: repo no público o sin permiso'));
  await changed;

  const secondLabels = labelsOf(await provider.getChildren());
  assertSnapshotAndActions(secondLabels);
  assert.ok(secondLabels.some((label) => /issues de GitHub|no público|sin permiso/i.test(label)));
  assert.ok(!secondLabels.includes('Issues abiertas'));
});

test('getChildren abre issues con alfred-dev.openGithubIssue, no vscode.open', async () => {
  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => [ISSUE],
    readStatusFile: async () => SNAPSHOT,
  });

  const changed = waitForTreeChange(provider);
  await provider.getChildren();
  await changed;

  const items = await provider.getChildren();
  const issue = items.find((item) => item.label === '#12 Abrir TreeView');

  assert.ok(issue);
  assert.equal(issue.command.command, 'alfred-dev.openGithubIssue');
  assert.equal(String(issue.command.arguments[0]), 'https://github.com/acme/widgets/issues/12');
});

test('refresh invalida la cache: primera pintura inmediata, issues en el segundo tick', async () => {
  let fetchCalls = 0;
  let releaseFetch;
  let fetchGate = Promise.resolve([ISSUE]);

  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      fetchCalls += 1;
      return fetchGate;
    },
    readStatusFile: async () => SNAPSHOT,
  });

  const firstChange = waitForTreeChange(provider);
  await provider.getChildren();
  await firstChange;
  assert.ok(labelsOf(await provider.getChildren()).includes('Issues abiertas'));
  assert.equal(fetchCalls, 1);

  fetchGate = new Promise((resolve) => {
    releaseFetch = resolve;
  });
  provider.refresh();

  const afterRefresh = labelsOf(await getChildrenBeforeFetchSettles(provider));
  assertSnapshotAndActions(afterRefresh);
  assert.ok(!afterRefresh.includes('Issues abiertas'));
  assert.ok(!afterRefresh.includes('#12 Abrir TreeView'));

  const secondChange = waitForTreeChange(provider);
  releaseFetch([ISSUE]);
  await secondChange;
  const afterFetch = labelsOf(await provider.getChildren());
  assert.ok(afterFetch.includes('Issues abiertas'));
  assert.equal(fetchCalls, 2);
});

test('Restricted Mode no hace GET, conserva acciones y omite el grupo de issues', async () => {
  const calls = { fetch: 0, remote: 0 };
  const provider = new StatusTreeProvider({
    isTrusted: () => false,
    getRemoteUrl: async () => {
      calls.remote += 1;
      return 'https://github.com/acme/widgets.git';
    },
    fetchOpenIssues: async () => {
      calls.fetch += 1;
      return [];
    },
    readStatusFile: async () => SNAPSHOT,
  });

  const labels = labelsOf(await provider.getChildren());

  assert.equal(calls.fetch, 0);
  assert.equal(calls.remote, 0);
  assert.ok(labels.includes('Refrescar estado'));
  assert.ok(labels.includes('Flujo: Feature'));
  assert.ok(!labels.includes('Issues abiertas'));
  assert.ok(!labels.some((label) => /issues de GitHub/i.test(label)));
});
