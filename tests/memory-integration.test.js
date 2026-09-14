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
  clearLocalMemory,
} = require('../out/memory/memoryStore.js');
const {
  clearLocalMemoryAndRecycleMcp,
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

test('el proveedor no cachea un rechazo al cargar la clave y reintenta', async () => {
  let attempts = 0;
  const validKey = Buffer.alloc(32, 3).toString('base64');
  const storage = {
    get: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('SecretStorage no disponible');
      return validKey;
    },
    store: async () => {},
    delete: async () => {},
  };
  const provider = new SecretStorageMemoryEncryptionKeyProvider(storage);

  await assert.rejects(() => provider.getKey(), /SecretStorage no disponible/);
  const recoveredKey = await provider.getKey();

  assert.equal(attempts, 2);
  assert.equal(recoveredKey.length, 32);
  assert.equal(recoveredKey.toString('base64'), validKey);
});

test('borrar memoria local elimina el fichero, la clave y no cachea la clave anterior', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-clear-'));
  const memoryPath = path.join(directory, 'memory.json');
  const secrets = new Map();
  const storage = {
    get: async (key) => secrets.get(key),
    store: async (key, value) => { secrets.set(key, value); },
    delete: async (key) => { secrets.delete(key); },
  };
  const provider = new SecretStorageMemoryEncryptionKeyProvider(storage);
  const store = new JsonMemoryStore(memoryPath, provider);
  await store.put('decision', 'local context');
  const originalKey = await provider.getKey();

  await clearLocalMemory(memoryPath, provider);

  await assert.rejects(fs.access(memoryPath));
  assert.equal(secrets.size, 0);
  const regeneratedKey = await provider.getKey();
  assert.equal(regeneratedKey.length, 32);
  assert.notDeepEqual(regeneratedKey, originalKey);
  await store.put('decision', 'new context');
  assert.equal(await store.get('decision'), 'new context');
});

test('borrar memoria local tolera un fichero ausente', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-clear-missing-'));
  const secrets = new Map([['alfred-dev.memory.encryption-key.v1', Buffer.alloc(32, 4).toString('base64')]]);
  const provider = new SecretStorageMemoryEncryptionKeyProvider({
    get: async (key) => secrets.get(key),
    store: async (key, value) => { secrets.set(key, value); },
    delete: async (key) => { secrets.delete(key); },
  });

  await clearLocalMemory(path.join(directory, 'memory.json'), provider);
  assert.equal(secrets.size, 0);
});

test('el proveedor rechaza base64 inválida o una clave de longitud incorrecta', async () => {
  const providerFor = (value) => new SecretStorageMemoryEncryptionKeyProvider({
    get: async () => value,
    store: async () => {},
    delete: async () => {},
  });

  await assert.rejects(() => providerFor('@@@').getKey(), /clave de cifrado almacenada no es válida/);
  await assert.rejects(
    () => providerFor(Buffer.alloc(16, 1).toString('base64')).getKey(),
    /clave de cifrado almacenada no es válida/,
  );
  await assert.rejects(
    () => providerFor(`${Buffer.alloc(32, 2).toString('base64')}extra`).getKey(),
    /clave de cifrado almacenada no es válida/,
  );
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
  assert.equal(subscriptions.length, 2);
  assert.equal(subscriptions[0], trustDisposable);
  assert.notEqual(subscriptions[1], providerDisposable);
});

test('recycle dispone el provider MCP y lo vuelve a registrar una sola vez', () => {
  let registrations = 0;
  let disposals = 0;
  const handle = registerMemoryMcpProviderOnTrust({
    enabled: true,
    isTrusted: () => true,
    onDidGrantWorkspaceTrust: () => ({ dispose() {} }),
    addSubscription: () => {},
    registerProvider: () => {
      registrations += 1;
      return { dispose() { disposals += 1; } };
    },
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(typeof handle.recycle, 'function');
  assert.equal(registrations, 1);
  handle.recycle();
  assert.equal(disposals, 1);
  assert.equal(registrations, 2);
  handle.recycle();
  assert.equal(disposals, 2);
  assert.equal(registrations, 3);
});

test('recycle no apila disposables zombies en addSubscription', () => {
  const subscriptions = [];
  const handle = registerMemoryMcpProviderOnTrust({
    enabled: true,
    isTrusted: () => true,
    onDidGrantWorkspaceTrust: () => ({ dispose() {} }),
    addSubscription: (disposable) => { subscriptions.push(disposable); },
    registerProvider: () => ({ dispose() {} }),
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  const subscriptionsAfterRegister = subscriptions.length;
  handle.recycle();
  handle.recycle();
  assert.equal(subscriptions.length, subscriptionsAfterRegister);
});

test('recycle no re-registra MCP si el opt-in o el trust no aplican', () => {
  let enabled = true;
  let registrations = 0;
  let disposals = 0;
  const handle = registerMemoryMcpProviderOnTrust({
    enabled: () => enabled,
    isTrusted: () => true,
    onDidGrantWorkspaceTrust: () => ({ dispose() {} }),
    addSubscription: () => {},
    registerProvider: () => {
      registrations += 1;
      return { dispose() { disposals += 1; } };
    },
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  enabled = false;
  handle.recycle();
  assert.equal(disposals, 1);
  assert.equal(registrations, 1);
});

test('clearLocalMemoryAndRecycleMcp recicla solo tras un wipe con éxito', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-recycle-'));
  const memoryPath = path.join(directory, 'memory.json');
  const secrets = new Map([['alfred-dev.memory.encryption-key.v1', Buffer.alloc(32, 9).toString('base64')]]);
  const provider = new SecretStorageMemoryEncryptionKeyProvider({
    get: async (key) => secrets.get(key),
    store: async (key, value) => { secrets.set(key, value); },
    delete: async (key) => { secrets.delete(key); },
  });
  await fs.writeFile(memoryPath, 'cipher');
  let recycled = 0;

  await clearLocalMemoryAndRecycleMcp(memoryPath, provider, () => { recycled += 1; });
  assert.equal(recycled, 1);
  await assert.rejects(fs.access(memoryPath));
  assert.equal(secrets.size, 0);

  await assert.rejects(
    () => clearLocalMemoryAndRecycleMcp(memoryPath, {
      deleteKey: async () => { throw new Error('SecretStorage no disponible'); },
    }, () => { recycled += 1; }),
    /SecretStorage no disponible/,
  );
  assert.equal(recycled, 1);
});

test('el provider MCP se registra y se libera al cambiar el opt-in sin doble registro', () => {
  let enabled = false;
  let trusted = true;
  let configListener;
  let registrations = 0;
  let disposals = 0;

  registerMemoryMcpProviderOnTrust({
    enabled: () => enabled,
    isTrusted: () => trusted,
    onDidGrantWorkspaceTrust: () => ({ dispose() {} }),
    onDidChangeConfiguration: (listener) => {
      configListener = listener;
      return { dispose() {} };
    },
    addSubscription: () => {},
    registerProvider: () => {
      registrations += 1;
      return { dispose() { disposals += 1; } };
    },
    createDefinition: () => ({}),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registrations, 0);
  enabled = true;
  configListener();
  configListener();
  assert.equal(registrations, 1);
  assert.equal(disposals, 0);

  enabled = false;
  configListener();
  assert.equal(disposals, 1);

  enabled = true;
  configListener();
  assert.equal(registrations, 2);
  assert.equal(disposals, 1);
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

function registerListedMemoryMcpProvider(overrides = {}) {
  let provider;
  const disposable = { dispose() {} };
  const {
    MEMORY_KEY_SOCKET_ENV,
  } = require('../out/memory/memoryKeyChannel.js');
  const registered = registerMemoryMcpProvider({
    enabled: true,
    isTrusted: true,
    registerProvider: (_id, candidate) => { provider = candidate; return disposable; },
    createDefinition: (serverPath, memoryPath, version, socketPath) => ({
      serverPath,
      memoryPath,
      version,
      env: {
        ALFRED_DEV_MEMORY_PATH: memoryPath,
        ...(socketPath ? { [MEMORY_KEY_SOCKET_ENV]: socketPath } : {}),
      },
    }),
    keyProvider: TEST_KEY_PROVIDER,
    serverPath: 'memoryMcpServer.js',
    memoryPath: 'memory.json',
    version: '0.6.5',
    ...overrides,
  });
  return { provider, registered, disposable };
}

test('provide no abre el canal de clave ni llama a offerKey', async () => {
  const { MEMORY_KEY_SOCKET_ENV } = require('../out/memory/memoryKeyChannel.js');
  let offerCalls = 0;
  const { provider, registered, disposable } = registerListedMemoryMcpProvider({
    keyProvider: {
      getKey: async () => {
        throw new Error('provide no debe pedir la clave');
      },
    },
    offerEncryptionKey: async () => {
      offerCalls += 1;
      return { socketPath: '\\\\.\\pipe\\alfred-dev-memory-should-not-open' };
    },
  });

  assert.equal(registered, disposable);
  const definitions = await provider.provideMcpServerDefinitions();
  assert.equal(offerCalls, 0);
  assert.equal(definitions.length, 1);
  assert.equal(definitions[0].serverPath, 'memoryMcpServer.js');
  assert.equal(definitions[0].memoryPath, 'memory.json');
  assert.equal(definitions[0].version, '0.6.5');
  assert.equal(definitions[0].env.ALFRED_DEV_MEMORY_PATH, 'memory.json');
  assert.equal(MEMORY_KEY_SOCKET_ENV in definitions[0].env, false);
  assert.equal('ALFRED_DEV_MEMORY_KEY' in definitions[0].env, false);
});

test('resolve ofrece el socket y el env del hijo no incluye la clave', async () => {
  const { MEMORY_KEY_SOCKET_ENV } = require('../out/memory/memoryKeyChannel.js');
  let offeredKey;
  const { provider } = registerListedMemoryMcpProvider({
    offerEncryptionKey: async (encryptionKey) => {
      offeredKey = encryptionKey;
      return { socketPath: '\\\\.\\pipe\\alfred-dev-memory-test' };
    },
  });

  const listed = await provider.provideMcpServerDefinitions();
  assert.equal(offeredKey, undefined);
  const resolved = await provider.resolveMcpServerDefinition(listed[0]);

  assert.deepEqual(offeredKey, TEST_ENCRYPTION_KEY);
  assert.equal(resolved.env[MEMORY_KEY_SOCKET_ENV], '\\\\.\\pipe\\alfred-dev-memory-test');
  assert.equal('ALFRED_DEV_MEMORY_KEY' in resolved.env, false);
  assert.equal(resolved.env.ALFRED_DEV_MEMORY_PATH, 'memory.json');
});

test('provide sin resolve no deja un handoff vivo tras el timeout', async () => {
  const {
    MEMORY_KEY_SOCKET_ENV,
    offerMemoryEncryptionKey,
    receiveMemoryEncryptionKey,
  } = require('../out/memory/memoryKeyChannel.js');
  const { provider } = registerListedMemoryMcpProvider({
    offerEncryptionKey: (encryptionKey) => offerMemoryEncryptionKey(encryptionKey, { timeoutMs: 50 }),
  });

  const [definition] = await provider.provideMcpServerDefinitions();
  const socketPath = definition.env?.[MEMORY_KEY_SOCKET_ENV] ?? definition.socketPath;
  await new Promise((resolve) => setTimeout(resolve, 80));
  if (socketPath) {
    await assert.rejects(
      () => receiveMemoryEncryptionKey(socketPath, { timeoutMs: 200 }),
    );
  }
  assert.equal(socketPath, undefined);
});

test('resolve justo antes del spawn entrega 32 bytes al hijo', async () => {
  const {
    MEMORY_KEY_BYTES,
    MEMORY_KEY_SOCKET_ENV,
    offerMemoryEncryptionKey,
    receiveMemoryEncryptionKey,
  } = require('../out/memory/memoryKeyChannel.js');
  const { provider } = registerListedMemoryMcpProvider({
    offerEncryptionKey: (encryptionKey) => offerMemoryEncryptionKey(encryptionKey),
  });

  const listed = await provider.provideMcpServerDefinitions();
  const resolved = await provider.resolveMcpServerDefinition(listed[0]);
  const receivedKey = await receiveMemoryEncryptionKey(resolved.env[MEMORY_KEY_SOCKET_ENV]);

  assert.equal(receivedKey.length, MEMORY_KEY_BYTES);
  assert.deepEqual(receivedKey, TEST_ENCRYPTION_KEY);
  assert.equal('ALFRED_DEV_MEMORY_KEY' in resolved.env, false);
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
  const {
    MEMORY_KEY_SOCKET_ENV,
    createMemoryMcpChildEnvironment,
    offerMemoryEncryptionKey,
  } = require('../out/memory/memoryKeyChannel.js');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-mcp-stdio-'));
  const memoryPath = path.join(directory, 'memory.json');
  const handoff = await offerMemoryEncryptionKey(TEST_ENCRYPTION_KEY);
  testContext.after(() => handoff.close());
  const childEnv = createMemoryMcpChildEnvironment(memoryPath, handoff.socketPath);
  assert.equal('ALFRED_DEV_MEMORY_KEY' in childEnv, false);
  const server = spawn(process.execPath, [path.resolve(__dirname, '../out/memory/memoryMcpServer.js')], {
    env: {
      ...process.env,
      ...childEnv,
      [MEMORY_KEY_SOCKET_ENV]: handoff.socketPath,
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