const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const packageLock = require('../package-lock.json');
const pluginJson = require('../plugin.json');

const RELEASE_VERSION = '0.7.0';

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('manifiesto, lockfile y plugin publican 0.7.0', () => {
  assert.equal(packageJson.version, RELEASE_VERSION);
  assert.equal(packageLock.version, RELEASE_VERSION);
  assert.equal(packageLock.packages[''].version, RELEASE_VERSION);
  assert.equal(pluginJson.version, RELEASE_VERSION);
});

test('el provider MCP declara la versión del manifiesto', () => {
  const extension = readRepositoryFile('src/extension.ts');
  assert.match(extension, new RegExp(`version:\\s*'${RELEASE_VERSION}'`));
});

test('los tests de memoria MCP esperan la versión 0.7.0', () => {
  const memoryIntegration = readRepositoryFile('tests/memory-integration.test.js');
  assert.match(memoryIntegration, /version:\s*'0\.7\.0'/);
  assert.match(memoryIntegration, /definitions\[0\]\.version,\s*'0\.7\.0'/);
  assert.doesNotMatch(memoryIntegration, /'0\.6\.5'/);
});

test('el changelog congela 0.7.0 y deja Unreleased sin notas pendientes', () => {
  const changelog = readRepositoryFile('CHANGELOG.md');
  const unreleased = changelog.indexOf('## [Unreleased]');
  const released = changelog.indexOf('## [0.7.0] - 2026-09-15');
  const previous = changelog.indexOf('## [0.6.5] - 2026-08-21');

  assert.notEqual(unreleased, -1, 'falta ## [Unreleased]');
  assert.notEqual(released, -1, 'falta ## [0.7.0] - 2026-09-15');
  assert.notEqual(previous, -1, 'no se debe borrar ## [0.6.5]');
  assert.ok(unreleased < released, '[Unreleased] debe ir antes de [0.7.0]');
  assert.ok(released < previous, '[0.7.0] debe ir antes de [0.6.5]');

  const pendingNotes = changelog.slice(unreleased, released);
  assert.doesNotMatch(pendingNotes, /^- /m, '[Unreleased] debe quedar vacío');
  assert.match(changelog.slice(released, previous), /MVP de Issue #2/);
});
