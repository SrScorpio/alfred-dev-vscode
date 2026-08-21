const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  MAX_STATUS_FILE_SIZE,
  readStatusFile,
} = require('../out/providers/readStatusFile.js');

async function createTemporaryStatusFile(content) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-status-'));
  const filePath = path.join(directory, 'status.md');
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

test('rechaza status.md antes de leerlo si supera el tamaño máximo', async () => {
  const statusPath = await createTemporaryStatusFile('x'.repeat(MAX_STATUS_FILE_SIZE + 1));

  await assert.rejects(
    readStatusFile(statusPath),
    /status\.md supera el tamaño máximo/,
  );
});

test('lee un status.md válido mediante una API asíncrona', async () => {
  const statusPath = await createTemporaryStatusFile('**Flujo:** Fix');

  const contentPromise = readStatusFile(statusPath);

  assert.equal(typeof contentPromise.then, 'function');
  assert.equal(await contentPromise, '**Flujo:** Fix');
});
