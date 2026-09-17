const assert = require('node:assert/strict');
const test = require('node:test');

const {
  MAX_STATUS_FIELD_LENGTH,
} = require('../out/providers/parseStatus.js');
const {
  fetchOpenIssues,
  githubIssueTreeEntries,
  listWorkspaceGithubIssues,
  parseOriginUrl,
} = require('../out/providers/githubRemote.js');

const ISSUE_URL = 'https://github.com/acme/widgets/issues/12';
const ISSUES_API_URL = 'https://api.github.com/repos/acme/widgets/issues?state=open&per_page=20';

const originCases = [
  ['https://github.com/acme/widgets.git', { owner: 'acme', repo: 'widgets' }],
  ['https://github.com/acme/widgets', { owner: 'acme', repo: 'widgets' }],
  ['git@github.com:acme/widgets.git', { owner: 'acme', repo: 'widgets' }],
  ['ssh://git@github.com/acme/widgets.git', { owner: 'acme', repo: 'widgets' }],
  ['  git@github.com:acme/widgets.git\n', { owner: 'acme', repo: 'widgets' }],
  ['https://gitlab.com/acme/widgets.git', undefined],
  ['git@gitlab.com:acme/widgets.git', undefined],
  ['not-a-remote', undefined],
  ['', undefined],
];

for (const [url, expected] of originCases) {
  test(`parseOriginUrl acepta o rechaza ${JSON.stringify(url)}`, () => {
    assert.deepEqual(parseOriginUrl(url), expected);
  });
}

test('fetchOpenIssues consulta issues abiertas con User-Agent y Accept, sin token', async () => {
  const calls = [];
  const httpFetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ([
        {
          number: 12,
          title: 'Abrir TreeView',
          html_url: ISSUE_URL,
          state: 'open',
        },
        {
          number: 13,
          title: 'Una PR colada',
          html_url: 'https://github.com/acme/widgets/pull/13',
          state: 'open',
          pull_request: { url: 'https://api.github.com/repos/acme/widgets/pulls/13' },
        },
      ]),
    };
  };

  const issues = await fetchOpenIssues({ owner: 'acme', repo: 'widgets' }, httpFetch);

  assert.deepEqual(issues, [{
    number: 12,
    title: 'Abrir TreeView',
    htmlUrl: ISSUE_URL,
    state: 'open',
  }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ISSUES_API_URL);
  assert.equal(calls[0].options.headers['User-Agent'], 'alfred-dev-vscode');
  assert.equal(calls[0].options.headers.Accept, 'application/vnd.github+json');
  assert.equal(calls[0].options.headers.Authorization, undefined);
});

test('fetchOpenIssues trunca títulos con MAX_STATUS_FIELD_LENGTH', async () => {
  const title = `z`.repeat(MAX_STATUS_FIELD_LENGTH + 40);
  const issues = await fetchOpenIssues({ owner: 'acme', repo: 'widgets' }, async () => ({
    ok: true,
    status: 200,
    json: async () => ([{
      number: 1,
      title,
      html_url: ISSUE_URL,
      state: 'open',
    }]),
  }));

  assert.equal(issues[0].title.length, MAX_STATUS_FIELD_LENGTH);
  assert.match(issues[0].title, /\.\.\.$/);
});

test('fetchOpenIssues limita a 20 issues tras filtrar pull_request', async () => {
  const payload = Array.from({ length: 25 }, (_, index) => ({
    number: index + 1,
    title: `Issue ${index + 1}`,
    html_url: `https://github.com/acme/widgets/issues/${index + 1}`,
    state: 'open',
  }));

  const issues = await fetchOpenIssues({ owner: 'acme', repo: 'widgets' }, async () => ({
    ok: true,
    status: 200,
    json: async () => payload,
  }));

  assert.equal(issues.length, 20);
  assert.equal(issues[0].number, 1);
  assert.equal(issues[19].number, 20);
});

test('fetchOpenIssues trata 404 como error accionable', async () => {
  await assert.rejects(
    () => fetchOpenIssues({ owner: 'acme', repo: 'widgets' }, async () => ({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not Found' }),
    })),
    /no público|sin permiso|issues de GitHub/i,
  );
});

test('fetchOpenIssues propaga fallos de red', async () => {
  await assert.rejects(
    () => fetchOpenIssues({ owner: 'acme', repo: 'widgets' }, async () => {
      throw new Error('ECONNRESET');
    }),
    /ECONNRESET/,
  );
});

test('listWorkspaceGithubIssues no hace GET ni exec si el workspace no es trusted', async () => {
  const calls = { exec: 0, fetch: 0 };
  const result = await listWorkspaceGithubIssues('/tmp/project', {
    isTrusted: false,
    execGit: async () => {
      calls.exec += 1;
      return 'https://github.com/acme/widgets.git';
    },
    fetchOpenIssues: async () => {
      calls.fetch += 1;
      return [];
    },
  });

  assert.deepEqual(result, { kind: 'untrusted' });
  assert.equal(calls.exec, 0);
  assert.equal(calls.fetch, 0);
});

test('listWorkspaceGithubIssues lee origin con execGit argv y sin shell', async () => {
  const gitCalls = [];
  const result = await listWorkspaceGithubIssues('/tmp/project', {
    isTrusted: true,
    execGit: async (args, options) => {
      gitCalls.push({ args, options });
      return 'git@github.com:acme/widgets.git\n';
    },
    fetchOpenIssues: async (repo) => {
      assert.deepEqual(repo, { owner: 'acme', repo: 'widgets' });
      return [{
        number: 12,
        title: 'Abrir TreeView',
        htmlUrl: ISSUE_URL,
        state: 'open',
      }];
    },
  });

  assert.deepEqual(gitCalls, [{
    args: ['config', '--get', 'remote.origin.url'],
    options: { cwd: '/tmp/project' },
  }]);
  assert.equal(result.kind, 'ok');
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].number, 12);
});

test('listWorkspaceGithubIssues devuelve error accionable si origin no es GitHub', async () => {
  const result = await listWorkspaceGithubIssues('/tmp/project', {
    isTrusted: true,
    execGit: async () => 'git@gitlab.com:acme/widgets.git',
    fetchOpenIssues: async () => {
      throw new Error('no debería consultar la API');
    },
  });

  assert.equal(result.kind, 'error');
  assert.match(result.message, /No se pudieron leer issues de GitHub/);
});

test('listWorkspaceGithubIssues preserva el 404 accionable y captura fallos de red', async () => {
  const notFound = await listWorkspaceGithubIssues('/tmp/project', {
    isTrusted: true,
    execGit: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      throw new Error('No se pudieron leer issues de GitHub: repo no público o sin permiso');
    },
  });
  assert.equal(notFound.kind, 'error');
  assert.match(notFound.message, /no público|sin permiso/);

  const network = await listWorkspaceGithubIssues('/tmp/project', {
    isTrusted: true,
    execGit: async () => 'https://github.com/acme/widgets.git',
    fetchOpenIssues: async () => {
      throw new Error('ECONNRESET');
    },
  });
  assert.equal(network.kind, 'error');
  assert.match(network.message, /No se pudieron leer issues de GitHub/);
});

test('githubIssueTreeEntries no añade nodos si el workspace no es trusted', () => {
  assert.deepEqual(githubIssueTreeEntries({ kind: 'untrusted' }), []);
});

test('githubIssueTreeEntries muestra el mensaje de error sin inventar issues', () => {
  const entries = githubIssueTreeEntries({
    kind: 'error',
    message: 'No se pudieron leer issues de GitHub',
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].label, 'No se pudieron leer issues de GitHub');
  assert.equal(entries[0].command, undefined);
});

test('githubIssueTreeEntries añade cabecera, tope de 20 y vscode.open con html_url', () => {
  const issues = Array.from({ length: 21 }, (_, index) => ({
    number: index + 1,
    title: `Issue ${index + 1}`,
    htmlUrl: `https://github.com/acme/widgets/issues/${index + 1}`,
    state: 'open',
  }));

  const entries = githubIssueTreeEntries({ kind: 'ok', issues });

  assert.equal(entries[0].label, 'Issues abiertas');
  assert.equal(entries.length, 21);
  assert.equal(entries[1].label, '#1 Issue 1');
  assert.equal(entries[20].label, '#20 Issue 20');
  assert.equal(entries[1].command.command, 'vscode.open');
  assert.deepEqual(entries[1].command.arguments, ['https://github.com/acme/widgets/issues/1']);
  assert.doesNotMatch(JSON.stringify(entries), /gh |Authorization|token/i);
});
