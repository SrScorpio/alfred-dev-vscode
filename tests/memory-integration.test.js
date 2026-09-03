const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  JsonMemoryStore,
  SecretStorageMemoryEncryptionKeyProvider,
} = require('../out/memory/memoryStore.js');
const {
  createMemoryCommandHandlers,
  registerMemoryMcpProvider,
  registerMemoryMcpProviderOnTrust,
} = require('../out/memory/memoryIntegration.js');
const { handleMcpRequest } = require('../out/memory/memoryMcpServer.js');

const TEST_ENCRYPTION_KEY = Buffer.alloc(32, 11);
const TEST_KEY_PROVIDER = { getKey: async () => TEST_ENCRYPTION_KEY };

test('el proveedor de clave genera y reutiliza una clave custodiada por SecretStorage', async () => {
  const secrets = new Map();
  const writes = [];
  const storage = {
    get: async (key) => secrets.get(key),
    store: async (key, value) => { writes.push([key, value]); secrets.set(key, value); },
    delete: async (key) => { secrets.delete(key); },
  };
  const provider = new SecretStorageMemoryEncryptionKeyProvider(storage);

  const firstKey = await provider.getKey();
  const secondKey = await provider.getKey();

  assert.equal(firstKey.length, 32);
  assert.deepEqual(secondKey, firstKey);
  assert.equal(writes.length, 1);
  assert.equal(Buffer.from(writes[0][1], 'base64').length, 32);
});

test('la memoria desactivada no registra MCP ni construye definiciones', () => {
  let registrations = 0;
  let definitions = 0;

  const registered = registerMemoryMcpProvider({
    enabled: false,
    isTrusted: false,
    registerProvider: () => { registrations += 1; return { dispose() {} }; },
    createDefinition: () => { definitions += 1; return {}; },
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registered, undefined);
  assert.equal(registrations, 0);
  assert.equal(definitions, 0);
});

test('la memoria degrada explícitamente cuando la API MCP no está disponible', () => {
  const registered = registerMemoryMcpProvider({
    enabled: true,
    isTrusted: true,
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registered, undefined);
});

test('el provider MCP se registra una sola vez al conceder confianza sin recargar', () => {
  let trusted = false;
  let trustListener;
  let registrations = 0;
  const subscriptions = [];
  const trustDisposable = { dispose() {} };
  const providerDisposable = { dispose() {} };

  registerMemoryMcpProviderOnTrust({
    enabled: true,
    isTrusted: () => trusted,
    onDidGrantWorkspaceTrust: (listener) => {
      trustListener = listener;
      return trustDisposable;
    },
    addSubscription: (disposable) => { subscriptions.push(disposable); },
    registerProvider: () => { registrations += 1; return providerDisposable; },
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registrations, 0);
  assert.deepEqual(subscriptions, [trustDisposable]);

  trusted = true;
  trustListener();
  trustListener();

  assert.equal(registrations, 1);
  assert.deepEqual(subscriptions, [trustDisposable, providerDisposable]);
});

test('el fallback por comandos persiste mediante el almacén sanitizado', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-command-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), TEST_KEY_PROVIDER);
  const messages = [];
  const handlers = createMemoryCommandHandlers(store, {
    prompt: async (request) => ({ key: 'decision', value: request === 'put' ? `sk-${'a'.repeat(32)}` : 'decision' }),
    showInformation: (message) => { messages.push(message); },
    showError: (message) => { throw new Error(message); },
  });

  await handlers.put();
  await handlers.get();

  assert.equal(await store.get('decision'), '[REDACTED]');
  assert.match(messages.at(-1), /\[REDACTED\]/);
});

test('el provider MCP expone una única definición con la clave fuera del fichero', async () => {
  let provider;
  const disposable = { dispose() {} };
  const result = registerMemoryMcpProvider({
    enabled: true,
    isTrusted: true,
    registerProvider: (_id, candidate) => { provider = candidate; return disposable; },
    createDefinition: (serverPath, memoryPath, encryptionKey, version) => ({
      serverPath,
      memoryPath,
      encryptionKey: encryptionKey.toString('base64'),
      version,
    }),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'memoryMcpServer.js',
    memoryPath: 'memory.json',
    version: '0.6.5',
  });

  assert.equal(result, disposable);
  assert.deepEqual(await provider.provideMcpServerDefinitions(), [{
    serverPath: 'memoryMcpServer.js',
    memoryPath: 'memory.json',
    encryptionKey: TEST_ENCRYPTION_KEY.toString('base64'),
    version: '0.6.5',
  }]);
});

test('la memoria no registra MCP ni permite comandos en workspace no confiable', async () => {
  let registrations = 0;
  const registered = registerMemoryMcpProvider({
    enabled: true,
    isTrusted: false,
    registerProvider: () => { registrations += 1; return { dispose() {} }; },
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registered, undefined);
  assert.equal(registrations, 0);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-untrusted-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), TEST_KEY_PROVIDER);
  let errors = 0;
  const handlers = createMemoryCommandHandlers(store, {
    prompt: async () => ({ key: 'blocked', value: 'must-not-persist' }),
    showInformation: () => {},
    showError: () => { errors += 1; },
  }, () => false);

  await handlers.put();
  assert.equal(errors, 1);
  await assert.rejects(fs.access(path.join(directory, 'memory.json')));
});

test('el servidor MCP ejecuta tools/list y tools/call sobre JsonMemoryStore', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-mcp-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), TEST_KEY_PROVIDER);

  const listed = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, store);
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), ['memory_put', 'memory_get', 'memory_search']);

  const stored = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'memory_put', arguments: { key: 'decision', value: `Authorization: Bearer ${'a'.repeat(32)}` } },
  }, store);
  assert.equal(stored.result.isError, false);

  const fetched = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'memory_get', arguments: { key: 'decision' } },
  }, store);
  assert.doesNotMatch(fetched.result.content[0].text, /a{32}/);
});

test('el proceso MCP stdio persiste mediante el backend de producción', async (testContext) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-mcp-stdio-'));
  const memoryPath = path.join(directory, 'memory.json');
  const server = spawn(process.execPath, [path.resolve(__dirname, '../out/memory/memoryMcpServer.js')], {
    env: {
      ...process.env,
      ALFRED_DEV_MEMORY_PATH: memoryPath,
      ALFRED_DEV_MEMORY_KEY: TEST_ENCRYPTION_KEY.toString('base64'),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  testContext.after(() => server.kill());
  server.stdout.setEncoding('utf8');

  const request = async (message) => {
    const response = once(server.stdout, 'data');
    server.stdin.write(`${JSON.stringify(message)}\n`);
    return JSON.parse((await response)[0].trim());
  };

  const initialized = await request({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05' },
  });
  assert.equal(initialized.result.serverInfo.name, 'alfred-dev-memory');

  await request({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'memory_put', arguments: { key: 'decision', value: `sk-${'a'.repeat(32)}` } },
  });
  const fetched = await request({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'memory_get', arguments: { key: 'decision' } },
  });

  assert.equal(fetched.result.content[0].text, '[REDACTED]');
  assert.doesNotMatch(await fs.readFile(memoryPath, 'utf8'), /sk-/);
  server.stdin.end();
});