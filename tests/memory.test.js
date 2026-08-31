const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  JsonMemoryStore,
  createLazyMemoryStore,
} = require('../out/memory/memoryStore.js');
const {
  sanitizeSecrets,
  scanSecrets,
} = require('../out/security/secretScanner.js');
const {
  installSecretHook,
  SECRET_HOOK_MARKER,
} = require('../out/security/secretHook.js');

test('detecta y sanitiza credenciales sin devolver su valor', () => {
  const content = 'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890';
  const findings = scanSecrets(content);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, 'github-token');
  assert.equal(findings[0].line, 1);
  assert.doesNotMatch(findings[0].redacted, /abcdefghijklmnopqrstuvwxyz/);
  assert.equal(sanitizeSecrets(content), 'token=[REDACTED]');
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

test('el hook solo se instala mediante una acción explícita', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-hook-'));
  await fs.mkdir(path.join(directory, '.git', 'hooks'), { recursive: true });

  await installSecretHook(directory);

  const hook = await fs.readFile(path.join(directory, '.git', 'hooks', 'pre-commit'), 'utf8');
  assert.match(hook, new RegExp(SECRET_HOOK_MARKER));
  assert.match(await fs.readFile(path.join(directory, '.git', 'hooks', 'alfred-secret-guard.js'), 'utf8'), /git/);
});