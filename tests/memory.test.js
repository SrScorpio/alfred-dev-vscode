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
} = require('../out/security/secretScanner.js');

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
    `AWS_SECRET_ACCESS_KEY=${'b'.repeat(40)}`,
  ].join('\n');

  const sanitized = sanitizeSecrets(sensitiveValues);

  assert.doesNotMatch(sanitized, /header\.payload|sk-|private-material|AKIA|b{40}/);
  assert.ok(scanSecrets(sensitiveValues).length >= 5);
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

test('la memoria JSON persiste de forma acotada y sanitizada', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-'));
  const store = new JsonMemoryStore(path.join(directory, 'memory.json'), {
    maxEntries: 2,
    maxValueLength: 100,
  });

  await store.put('decision', 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890');
  await store.put('second', 'local context');

  assert.equal(await store.get('decision'), 'token=[REDACTED]');
  assert.deepEqual(await store.search('context'), [{ key: 'second', value: 'local context' }]);
  await assert.rejects(store.put('third', 'overflow'), /límite máximo de 2 entradas/);
  assert.doesNotMatch(await fs.readFile(path.join(directory, 'memory.json'), 'utf8'), /ghp_/);
});

test('la memoria nunca escribe un JSON superior al límite de lectura', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-memory-size-'));
  const memoryPath = path.join(directory, 'memory.json');
  const store = new JsonMemoryStore(memoryPath, { maxEntries: 100, maxValueLength: 4000 });
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
  assert.equal(factoryCalls, 0);
});
