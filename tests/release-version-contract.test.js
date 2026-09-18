const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const packageLock = require('../package-lock.json');
const pluginJson = require('../plugin.json');

const RELEASE_VERSION = '0.8.0';

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('manifiesto, lockfile y plugin publican 0.8.0', () => {
  assert.equal(packageJson.version, RELEASE_VERSION);
  assert.equal(packageLock.version, RELEASE_VERSION);
  assert.equal(packageLock.packages[''].version, RELEASE_VERSION);
  assert.equal(pluginJson.version, RELEASE_VERSION);
});

test('el provider MCP declara la versión del manifiesto', () => {
  const extension = readRepositoryFile('src/extension.ts');
  assert.match(extension, new RegExp(`version:\\s*'${RELEASE_VERSION}'`));
});

test('los tests de memoria MCP esperan la versión 0.8.0', () => {
  const memoryIntegration = readRepositoryFile('tests/memory-integration.test.js');
  assert.match(memoryIntegration, /version:\s*'0\.8\.0'/);
  assert.match(memoryIntegration, /definitions\[0\]\.version,\s*'0\.8\.0'/);
  assert.doesNotMatch(memoryIntegration, /'0\.6\.5'/);
});

test('el changelog congela 0.8.0, conserva 0.7.0 y deja Unreleased vacío', () => {
  const changelog = readRepositoryFile('CHANGELOG.md');
  const unreleased = changelog.indexOf('## [Unreleased]');
  const current = changelog.indexOf('## [0.8.0] - 2026-09-18');
  const previous = changelog.indexOf('## [0.7.0] - 2026-09-15');
  const older = changelog.indexOf('## [0.6.5] - 2026-08-21');

  assert.notEqual(unreleased, -1, 'falta ## [Unreleased]');
  assert.notEqual(current, -1, 'falta ## [0.8.0] - 2026-09-18');
  assert.notEqual(previous, -1, 'falta ## [0.7.0] - 2026-09-15');
  assert.notEqual(older, -1, 'no se debe borrar ## [0.6.5]');
  assert.ok(unreleased < current, '[Unreleased] debe ir antes de [0.8.0]');
  assert.ok(current < previous, '[0.8.0] debe ir antes de [0.7.0]');
  assert.ok(previous < older, '[0.7.0] debe ir antes de [0.6.5]');

  const pendingNotes = changelog.slice(unreleased, current);
  assert.match(pendingNotes, /### Added/);
  assert.match(pendingNotes, /### Changed/);
  assert.match(pendingNotes, /### Fixed/);
  assert.doesNotMatch(pendingNotes, /Iniciar Flujo/);
  assert.doesNotMatch(pendingNotes, /Comprobar actualización/);
  assert.doesNotMatch(pendingNotes, /## \[0\.8\.1\]/);

  const releasedNotes = changelog.slice(current, previous);
  assert.match(releasedNotes, /Iniciar Flujo/);
  assert.match(releasedNotes, /Comprobar actualización/);
  assert.match(releasedNotes, /prd\.json/);
  assert.match(releasedNotes, /prdPath/);
  assert.match(releasedNotes, /issue #3/);
  assert.match(releasedNotes, /syncIssue/);
  assert.doesNotMatch(releasedNotes, /## \[0\.7\.1\]/);

  const frozenNotes = changelog.slice(previous, older);
  assert.match(frozenNotes, /MVP de Issue #2/);
  assert.match(frozenNotes, /matriz de versiones soportadas \(`0\.7\.0`/);
  assert.match(frozenNotes, /\^1\.85\.0/);
  assert.match(frozenNotes, /GitHub Releases/);
  assert.match(frozenNotes, /confirme el tag/);
  assert.doesNotMatch(frozenNotes, /matriz de versiones soportadas \(`0\.6\.5`/);
});

test('SECURITY.md declara 0.8.0 como línea soportada y Releases existentes', () => {
  const security = readRepositoryFile('SECURITY.md');
  assert.match(security, /0\.8\.0/);
  assert.match(security, /0\.7\.0/);
  assert.match(security, /GitHub Releases?/i);
  assert.match(security, /v0\.7\.0/);
  assert.match(security, /No hay publicación en un\s+marketplace de extensiones/i);
  assert.doesNotMatch(security, /publicado en Visual Studio Marketplace/i);
  assert.doesNotMatch(security, /0\.6\.5/);
});

test('README instala el VSIX 0.8.0 desde GitHub Releases, sin Marketplace', () => {
  const readme = readRepositoryFile('README.md');
  assert.match(readme, /Instalar la extensión VSIX/);
  assert.match(readme, /code --install-extension alfred-dev-vscode-0\.8\.0\.vsix/);
  assert.match(readme, /github\.com\/SrScorpio\/alfred-dev-vscode\/releases/i);
  assert.doesNotMatch(readme, /marketplace\.visualstudio\.com\/items\?itemName=SrScorpio/i);
  assert.match(readme, /prdPath/);
  assert.match(readme, /Ralph 1\.10|Ralph Suite 1\.10/);
});
