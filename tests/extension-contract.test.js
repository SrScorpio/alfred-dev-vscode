const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('declara comandos de chat y selección de perfil de modelo', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const commands = packageJson.contributes.commands;

  assert.ok(commands.some((command) => command.command === 'alfred-dev.openChat'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.selectModelProfile'));
  assert.equal(packageJson.contributes.configuration.properties['alfred-dev.modelProfile'].default, 'luna');
  assert.deepEqual(
    packageJson.contributes.configuration.properties['alfred-dev.modelProfile'].enum,
    ['luna', 'terra', 'sol'],
  );
});

test('el VSIX excluye fuentes, tests, dependencias y skills de stack', () => {
  const vscodeignore = readRepositoryFile('.vscodeignore');

  assert.match(vscodeignore, /^src\//m);
  assert.match(vscodeignore, /^tests\//m);
  assert.match(vscodeignore, /^node_modules\//m);
  assert.match(vscodeignore, /^skills\//m);
  assert.doesNotMatch(vscodeignore, /^out\//m);
});
