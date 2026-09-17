const assert = require('node:assert/strict');
const test = require('node:test');

const { renderMemoryUiHtml } = require('../out/memory/memoryUi.js');
const { openMemoryUi } = require('../out/memory/memoryUiPanel.js');

test('el HTML de memoria usa CSP con nonce, escape y ningún recurso remoto', () => {
  const html = renderMemoryUiHtml([
    { key: '<script>', updatedAt: '2026-01-01T00:00:00.000Z' },
    { key: '" onerror="alert(1)', updatedAt: '2026-01-02T00:00:00.000Z' },
  ], '123');

  assert.match(html, /default-src 'none'/);
  assert.match(html, /style-src 'nonce-123'/);
  assert.match(html, /script-src 'nonce-123'/);
  assert.match(html, /img-src 'none'/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot; onerror=/);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /<[^>]+onerror=/i);
  assert.doesNotMatch(html, /secret-value|ghp_|sk-/);
});

test('el listado inicial no incrusta values y filtrar por query no los añade', () => {
  const secretValue = 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890';
  const html = renderMemoryUiHtml([
    { key: 'decision', updatedAt: '2026-01-01T00:00:00.000Z' },
    { key: 'notes', updatedAt: '2026-01-02T00:00:00.000Z' },
  ], 'abc', 'decis');

  assert.match(html, />decision</);
  assert.doesNotMatch(html, />notes</);
  assert.doesNotMatch(html, new RegExp(secretValue));
  assert.doesNotMatch(html, /value:/i);
});

test('openMemoryUi no abre panel sin trust ni con memoria desactivada', async () => {
  const created = [];
  const errors = [];
  const store = {
    isEnabled: async () => true,
    list: async () => { throw new Error('no debe listar'); },
    get: async () => { throw new Error('no debe descifrar'); },
    delete: async () => { throw new Error('no debe borrar'); },
  };
  const vscode = {
    window: {
      createWebviewPanel: (...args) => { created.push(args); return dummyPanel(); },
      showErrorMessage: (message) => { errors.push(message); },
    },
  };

  await openMemoryUi({ subscriptions: [] }, store, false, true, vscode);
  await openMemoryUi({ subscriptions: [] }, { ...store, isEnabled: async () => false }, true, false, vscode);

  assert.deepEqual(created, []);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /confianza/);
  assert.match(errors[1], /alfred-dev\.memory\.enabled/);
});

test('search, reveal y delete confirman y no filtran values al HTML inicial', async () => {
  const htmlUpdates = [];
  const warnings = [];
  const infos = [];
  const deleted = [];
  let listed = [
    { key: 'keep', updatedAt: '2026-01-01T00:00:00.000Z' },
    { key: 'drop', updatedAt: '2026-01-02T00:00:00.000Z' },
  ];
  const store = {
    isEnabled: async () => true,
    list: async () => listed.map((entry) => ({ ...entry })),
    get: async (key) => key === 'keep' ? 'local context' : undefined,
    delete: async (key) => {
      deleted.push(key);
      listed = listed.filter((entry) => entry.key !== key);
      return true;
    },
  };
  let messageHandler;
  const panel = {
    webview: {
      html: '',
      onDidReceiveMessage: (handler) => { messageHandler = handler; },
    },
  };
  Object.defineProperty(panel.webview, 'html', {
    set(value) { htmlUpdates.push(value); },
    get() { return htmlUpdates.at(-1) ?? ''; },
  });
  const vscode = {
    window: {
      createWebviewPanel: (_id, _title, _column, options) => {
        assert.deepEqual(options.localResourceRoots, []);
        assert.equal(options.enableScripts, true);
        return panel;
      },
      showErrorMessage: () => {},
      showInformationMessage: (message) => { infos.push(message); },
      showWarningMessage: async (message, ...rest) => {
        const actions = rest.filter((item) => typeof item === 'string');
        warnings.push({ message, actions });
        return actions[0];
      },
    },
  };

  await openMemoryUi({ subscriptions: [] }, store, true, true, vscode);
  assert.equal(htmlUpdates.length, 1);
  assert.match(htmlUpdates[0], /keep/);
  assert.match(htmlUpdates[0], /drop/);
  assert.doesNotMatch(htmlUpdates[0], /local context/);

  await messageHandler({ type: 'search', query: 'keep' });
  assert.match(htmlUpdates.at(-1), /keep/);
  assert.doesNotMatch(htmlUpdates.at(-1), /drop/);
  assert.doesNotMatch(htmlUpdates.at(-1), /local context/);

  await messageHandler({ type: 'reveal', key: 'keep' });
  assert.ok(infos.some((message) => message.includes('local context')));

  await messageHandler({ type: 'delete', key: 'drop' });
  assert.deepEqual(deleted, ['drop']);
  assert.ok(warnings.some((item) => /drop/.test(item.message)));
});

test('cancelar el borrado no llama a store.delete', async () => {
  const deleted = [];
  const listed = [{ key: 'keep', updatedAt: '2026-01-01T00:00:00.000Z' }];
  const store = {
    list: async () => listed.map((entry) => ({ ...entry })),
    get: async () => undefined,
    delete: async (key) => { deleted.push(key); return true; },
  };
  let messageHandler;
  const panel = {
    webview: {
      html: '',
      onDidReceiveMessage: (handler) => { messageHandler = handler; },
    },
  };
  const vscode = {
    window: {
      createWebviewPanel: () => panel,
      showErrorMessage: () => {},
      showInformationMessage: () => {},
      showWarningMessage: async () => undefined,
    },
  };

  await openMemoryUi({ subscriptions: [] }, store, true, true, vscode);
  await messageHandler({ type: 'delete', key: 'keep' });
  assert.deepEqual(deleted, []);
});

function dummyPanel() {
  return {
    webview: {
      html: '',
      onDidReceiveMessage: () => {},
    },
  };
}
