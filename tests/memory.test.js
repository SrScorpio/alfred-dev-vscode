const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  JsonMemoryStore,
  MAX_MEMORY_FILE_SIZE,
  createLazyMemoryStore,
} = require('../out/memory/memoryStore.js');
const {
  sanitizeSecrets,
  scanSecrets,
  scanSecretsBounded,
  MAX_SECRET_DIAGNOSTICS_BYTES,
} = require('../out/security/secretScanner.js');

const TEST_ENCRYPTION_KEY = Buffer.alloc(32, 7);

function createKeyProvider(key = TEST_ENCRYPTION_KEY) {
  return { getKey: async () => key };
}

test('los diagnósticos no escanean contenido que supera 64 KiB', () => {
  const secret = `sk-${'a'.repeat(32)}`;
  assert.equal(scanSecretsBounded(secret).length, 1);
  assert.equal(MAX_SECRET_DIAGNOSTICS_BYTES, 64 * 1024);
  assert.deepEqual(scanSecretsBounded(`${secret}\n${'x'.repeat(MAX_SECRET_DIAGNOSTICS_BYTES)}`), []);
});

test('detecta y sanitiza credenciales sin devolver su valor', () => {
  const content = 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890';
  const findings = scanSecrets(content);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, 'github-token');
  assert.equal(findings[0].line, 1);
  assert.doesNotMatch(findings[0].redacted, /abcdefghijklmnopqrstuvwxyz/);
  assert.equal(sanitizeSecrets(content), 'token=[REDACTED]');
});

test('sanitiza Bearer, sk, PEM y credenciales AWS antes de persistir', () => {
  const sensitiveValues = [
    'Authorization: Bearer header.payload.signature',
    `OPENAI_API_KEY=sk-${'a'.repeat(32)}`,
    '-----BEGIN PRIVATE KEY-----\nprivate-material\n-----END PRIVATE KEY-----',
    `AWS_ACCESS_KEY_ID=AKIA${'A'.repeat(16)}`,
    `AWS_TEMPORARY_ACCESS_KEY_ID=ASIA${'C'.repeat(16)}`,
    `AWS_SECRET_ACCESS_KEY=${'b'.repeat(40)}`,
  ].join('\n');

  const sanitized = sanitizeSecrets(sensitiveValues);

  assert.doesNotMatch(sanitized, /header\.payload|sk-|private-material|AKIA|ASIA|b{40}/);
  assert.ok(scanSecrets(sensitiveValues).length >= 6);
});

test('la memoria desactivada no inicializa su backend', async () => {
  let factoryCalls = 0;
  const memory = createLazyMemoryStore(false, async () => {
    factoryCalls += 1;
    return { put: async () => {} };
  });

  assert.equal(await memory.isEnabled(), false);
  assert.equal(factoryCalls, 0);
});

test('la memoria persiste cifrada, acotada y sanitizada', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-'));
  const memoryPath = path.join(directory, 'memory.json');
  const store = new JsonMemoryStore(memoryPath, createKeyProvider(), {
    maxEntries: 2,
    maxValueLength: 100,
  });

  await store.put('decision', 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890');
  await store.put('second', 'local context');

  assert.equal(await store.get('decision'), 'token=[REDACTED]');
  assert.deepEqual(await store.search('context'), [{ key: 'second', value: 'local context' }]);
  await assert.rejects(store.put('third', 'overflow'), /límite máximo de 2 entradas/);
  const persisted = await fs.readFile(memoryPath, 'utf8');
  assert.doesNotMatch(persisted, /ghp_|decision|local context|REDACTED/);
  assert.equal(JSON.parse(persisted).version, 2);
});

test('la memoria falla cerrada cuando la clave de cifrado no está disponible', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-no-key-'));
  const memoryPath = path.join(directory, 'memory.json');
  const store = new JsonMemoryStore(memoryPath, { getKey: async () => undefined });

  await assert.rejects(store.put('decision', 'local context'), /clave de cifrado no está disponible/);
  await assert.rejects(fs.access(memoryPath));
});

test('la memoria rechaza explícitamente ficheros legados sin cifrar', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-legacy-'));
  const memoryPath = path.join(directory, 'memory.json');
  await fs.writeFile(memoryPath, JSON.stringify({
    version: 1,
    entries: [{ key: 'legacy', value: 'plaintext', updatedAt: new Date().toISOString() }],
  }));
  const store = new JsonMemoryStore(memoryPath, createKeyProvider());

  await assert.rejects(store.get('legacy'), /formato legado no cifrado/);
});

test('la memoria nunca escribe un JSON superior al límite de lectura', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-size-'));
  const memoryPath = path.join(directory, 'memory.json');
  const store = new JsonMemoryStore(memoryPath, createKeyProvider(), { maxEntries: 100, maxValueLength: 4000 });
  let sizeLimitReached = false;

  for (let index = 0; index < 100; index += 1) {
    try {
      await store.put(`entry-${index}`, `${index}-${'x'.repeat(3990)}`);
    } catch (error) {
      assert.match(error.message, /tamaño máximo/);
      sizeLimitReached = true;
      break;
    }
  }

  assert.equal(sizeLimitReached, true);
  assert.ok((await fs.stat(memoryPath)).size <= MAX_MEMORY_FILE_SIZE);
});

test('las operaciones de memoria desactivada no crean el backend', async () => {
  let factoryCalls = 0;
  const memory = createLazyMemoryStore(false, async () => {
    factoryCalls += 1;
    throw new Error('No debe inicializarse');
  });

  await memory.put('key', 'value');
  assert.equal(await memory.get('key'), undefined);
  assert.deepEqual(await memory.search('value'), []);
  assert.deepEqual(await memory.list(), []);
  assert.equal(await memory.delete('key'), false);
  assert.equal(factoryCalls, 0);
});

test('un payload cifrado con otra clave falla al descifrar', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-key-mismatch-'));
  const memoryPath = path.join(directory, 'memory.json');
  const originalStore = new JsonMemoryStore(memoryPath, createKeyProvider(Buffer.alloc(32, 7)));
  await originalStore.put('decision', 'local context');

  const foreignStore = new JsonMemoryStore(memoryPath, createKeyProvider(Buffer.alloc(32, 9)));
  await assert.rejects(foreignStore.get('decision'), /no se pudo descifrar/);
});

test('la memoria lazy sigue el opt-in que cambia en sesión', async () => {
  let enabled = false;
  let factoryCalls = 0;
  const memory = createLazyMemoryStore(() => enabled, async () => {
    factoryCalls += 1;
    return {
      isEnabled: async () => true,
      put: async () => {},
      get: async () => 'stored',
      search: async () => [{ key: 'decision', value: 'stored' }],
      list: async () => [{ key: 'decision', updatedAt: '2026-01-01T00:00:00.000Z' }],
      delete: async () => true,
    };
  });

  assert.equal(await memory.isEnabled(), false);
  assert.equal(await memory.get('decision'), undefined);
  assert.equal(factoryCalls, 0);

  enabled = true;
  assert.equal(await memory.isEnabled(), true);
  assert.equal(await memory.get('decision'), 'stored');
  assert.equal(factoryCalls, 1);
});

test('list sin entradas devuelve un array vacío', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-list-empty-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), createKeyProvider());

  assert.deepEqual(await store.list(), []);
});

test('list tras put devuelve metadatos sin values', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-list-put-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), createKeyProvider());

  await store.put('decision', 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890');
  const listed = await store.list();

  assert.equal(listed.length, 1);
  assert.equal(listed[0].key, 'decision');
  assert.equal(typeof listed[0].updatedAt, 'string');
  assert.ok(Number.isNaN(Date.parse(listed[0].updatedAt)) === false);
  assert.equal('value' in listed[0], false);
  assert.doesNotMatch(JSON.stringify(listed), /ghp_|abcdefghijklmnopqrstuvwxyz/);
});

test('delete elimina una clave existente y delete inexistente no explota', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-delete-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), createKeyProvider(), {
    maxEntries: 2,
    maxValueLength: 100,
  });

  await store.put('keep', 'local context');
  await store.put('drop', 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890');

  assert.equal(await store.delete('drop'), true);
  assert.equal(await store.get('drop'), undefined);
  assert.equal(await store.get('keep'), 'local context');
  assert.deepEqual((await store.list()).map((entry) => entry.key), ['keep']);
  assert.equal(await store.delete('missing'), false);
  assert.equal(await store.delete('drop'), false);
  await assert.rejects(store.delete('bad\nkey'), /no es válida/);

  await store.put('again', 'second chance');
  assert.deepEqual((await store.list()).map((entry) => entry.key).sort(), ['again', 'keep']);
  await assert.rejects(store.put('third', 'overflow'), /límite máximo de 2 entradas/);
});
