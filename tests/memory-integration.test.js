const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { JsonMemoryStore } = require('../out/memory/memoryStore.js');
const {
  createMemoryCommandHandlers,
  registerMemoryMcpProvider,
} = require('../out/memory/memoryIntegration.js');
const { handleMcpRequest } = require('../out/memory/memoryMcpServer.js');

test('la memoria desactivada no registra MCP ni construye definiciones', () => {
  let registrations = 0;
  let definitions = 0;

  const registered = registerMemoryMcpProvider({
    enabled: false,
    registerProvider: () => { registrations += 1; return { dispose() {} }; },
    createDefinition: () => { definitions += 1; return {}; },
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
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registered, undefined);
});

test('el fallback por comandos persiste mediante el almacén sanitizado', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-command-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'));
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

test('el provider MCP expone una única definición bajo demanda', () => {
  let provider;
  const disposable = { dispose() {} };
  const result = registerMemoryMcpProvider({
    enabled: true,
    isTrusted: true,
    registerProvider: (_id, candidate) => { provider = candidate; return disposable; },
    createDefinition: (serverPath, memoryPath, version) => ({ serverPath, memoryPath, version }),
    serverPath: 'memoryMcpServer.js',
    memoryPath: 'memory.json',
    version: '0.6.5',
  });

  assert.equal(result, disposable);
  assert.deepEqual(provider.provideMcpServerDefinitions(), [{
    serverPath: 'memoryMcpServer.js',
    memoryPath: 'memory.json',
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
    serverPath: 'server.js',
    memoryPath: 'memory.json',
    version: 'test',
  });

  assert.equal(registered, undefined);
  assert.equal(registrations, 0);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-untrusted-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'));
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
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'));

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
    env: { ...process.env, ALFRED_DEV_MEMORY_PATH: memoryPath },
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