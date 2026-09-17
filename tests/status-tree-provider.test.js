const assert = require('node:assert/strict');
const Module = require('node:module');
const test = require('node:test');

const vscode = {
  EventEmitter: class {
    constructor() {
      this.event = () => {};
    }
    fire() {}
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

function labelsOf(items) {
  return items.map((item) => item.label);
}

test('getChildren con fetch reject muestra acciones, snapshot y error de issues', async () => {
  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      throw new Error('No se pudieron leer issues de GitHub: repo no público o sin permiso');
    },
    readStatusFile: async () => SNAPSHOT,
  });

  const items = await provider.getChildren();
  const labels = labelsOf(items);

  assert.ok(labels.includes('Refrescar estado'));
  assert.ok(labels.includes('Hablar con Alfred'));
  assert.ok(labels.includes('Flujo: Feature'));
  assert.ok(labels.some((label) => /issues de GitHub|no público|sin permiso/i.test(label)));
  assert.ok(!labels.includes('Issues abiertas'));
});

test('getChildren lee el snapshot sin esperar a un GET de issues pendiente', async () => {
  let releaseFetch;
  const fetchGate = new Promise((resolve) => {
    releaseFetch = resolve;
  });
  let statusRead = false;

  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      await fetchGate;
      return [];
    },
    readStatusFile: async () => {
      statusRead = true;
      return SNAPSHOT;
    },
  });

  const childrenPromise = provider.getChildren();
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(statusRead, true, 'el snapshot debe leerse mientras el GET sigue pendiente');

  releaseFetch();
  const labels = labelsOf(await childrenPromise);
  assert.ok(labels.includes('Flujo: Feature'));
  assert.ok(labels.includes('Refrescar estado'));
});

test('getChildren abre issues con alfred-dev.openGithubIssue, no vscode.open', async () => {
  const provider = new StatusTreeProvider({
    isTrusted: () => true,
    getRemoteUrl: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => [{
      number: 12,
      title: 'Abrir TreeView',
      htmlUrl: 'https://github.com/acme/widgets/issues/12',
      state: 'open',
    }],
    readStatusFile: async () => SNAPSHOT,
  });

  const items = await provider.getChildren();
  const issue = items.find((item) => item.label === '#12 Abrir TreeView');

  assert.ok(issue);
  assert.equal(issue.command.command, 'alfred-dev.openGithubIssue');
  assert.equal(String(issue.command.arguments[0]), 'https://github.com/acme/widgets/issues/12');
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
