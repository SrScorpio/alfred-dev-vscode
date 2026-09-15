const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryKeySocketPath,
  createMemoryMcpChildEnvironment,
  offerMemoryEncryptionKey,
  receiveMemoryEncryptionKey,
  takeMemoryEncryptionKeyFromEnv,
  MEMORY_KEY_BYTES,
  MEMORY_KEY_SOCKET_ENV,
} = require('../out/memory/memoryKeyChannel.js');

const MEMORY_KEY_CHANNEL_SOURCE = fs.readFileSync(
  path.join(__dirname, '../src/memory/memoryKeyChannel.ts'),
  'utf8',
);

const TEST_ENCRYPTION_KEY = Buffer.alloc(MEMORY_KEY_BYTES, 11);

test('el path del socket one-shot usa pipe Windows o tmpdir Unix con entropía', () => {
  const firstPath = createMemoryKeySocketPath();
  const secondPath = createMemoryKeySocketPath();

  assert.notEqual(firstPath, secondPath);
  if (process.platform === 'win32') {
    assert.match(firstPath, /^\\\\\.\\pipe\\alfred-dev-memory-[a-f0-9]{32}$/);
    return;
  }
  assert.match(firstPath, /alfred-dev-memory-[a-f0-9]{32}\.sock$/);
});

test('el padre entrega 32 bytes y el hijo los recibe sin dejar la clave en env', async () => {
  const handoff = await offerMemoryEncryptionKey(TEST_ENCRYPTION_KEY);
  const previousSocket = process.env[MEMORY_KEY_SOCKET_ENV];
  process.env[MEMORY_KEY_SOCKET_ENV] = handoff.socketPath;

  try {
    const receivedKey = await takeMemoryEncryptionKeyFromEnv(process.env);
    await handoff.delivered;

    assert.equal(receivedKey.length, MEMORY_KEY_BYTES);
    assert.deepEqual(receivedKey, TEST_ENCRYPTION_KEY);
    assert.equal(process.env[MEMORY_KEY_SOCKET_ENV], undefined);
  } finally {
    await handoff.close();
    if (previousSocket === undefined) delete process.env[MEMORY_KEY_SOCKET_ENV];
    else process.env[MEMORY_KEY_SOCKET_ENV] = previousSocket;
  }
});

test('el canal one-shot aplica chmod 0o600 en Unix y listen exclusive', () => {
  assert.match(MEMORY_KEY_CHANNEL_SOURCE, /chmod(?:Sync)?\([^)]*0o600/);
  assert.match(MEMORY_KEY_CHANNEL_SOURCE, /listen\(\s*\{[\s\S]*exclusive:\s*true/);
  assert.doesNotMatch(MEMORY_KEY_CHANNEL_SOURCE, /\b(?:ffi|koffi|napi)\b/);
});

test('el socket Unix queda 0o600 tras listen y el round-trip de 32 bytes sigue', async (t) => {
  if (process.platform === 'win32') {
    t.skip('chmod de socket Unix no aplica en Windows; Node net no expone DACL del named pipe');
    return;
  }

  const handoff = await offerMemoryEncryptionKey(TEST_ENCRYPTION_KEY);

  try {
    assert.equal(fs.statSync(handoff.socketPath).mode & 0o777, 0o600);
    const receivedKey = await receiveMemoryEncryptionKey(handoff.socketPath);
    await handoff.delivered;
    assert.deepEqual(receivedKey, TEST_ENCRYPTION_KEY);
  } finally {
    await handoff.close();
  }
});

test('el socket one-shot rechaza un segundo connect tras entregar la clave', async () => {
  const handoff = await offerMemoryEncryptionKey(TEST_ENCRYPTION_KEY, { timeoutMs: 2000 });

  try {
    const receivedKey = await receiveMemoryEncryptionKey(handoff.socketPath);
    await handoff.delivered;
    assert.deepEqual(receivedKey, TEST_ENCRYPTION_KEY);

    await assert.rejects(
      () => receiveMemoryEncryptionKey(handoff.socketPath, { timeoutMs: 500 }),
    );
  } finally {
    await handoff.close();
  }
});

test('el socket one-shot caduca si nadie conecta', async () => {
  const handoff = await offerMemoryEncryptionKey(TEST_ENCRYPTION_KEY, { timeoutMs: 50 });

  await assert.rejects(() => handoff.delivered, /Timeout entregando la clave de memoria/);
  await handoff.close();
});

test('el entorno del hijo MCP no incluye ALFRED_DEV_MEMORY_KEY', () => {
  const env = createMemoryMcpChildEnvironment('memory.json', '\\\\.\\pipe\\alfred-dev-memory-test');

  assert.equal(env.ALFRED_DEV_MEMORY_PATH, 'memory.json');
  assert.equal(env[MEMORY_KEY_SOCKET_ENV], '\\\\.\\pipe\\alfred-dev-memory-test');
  assert.equal(env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal('ALFRED_DEV_MEMORY_KEY' in env, false);
});

test('el entorno de listado MCP no incluye socket ni clave', () => {
  const env = createMemoryMcpChildEnvironment('memory.json');

  assert.equal(env.ALFRED_DEV_MEMORY_PATH, 'memory.json');
  assert.equal(env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal(MEMORY_KEY_SOCKET_ENV in env, false);
  assert.equal('ALFRED_DEV_MEMORY_KEY' in env, false);
});

test('el cliente rechaza una entrega que no tiene 32 bytes', async () => {
  const socketPath = createMemoryKeySocketPath();
  const server = net.createServer((socket) => {
    socket.end(Buffer.alloc(8, 1));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });

  try {
    await assert.rejects(
      () => receiveMemoryEncryptionKey(socketPath, { timeoutMs: 1000 }),
      /clave de cifrado no es válida/,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
