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
  assert.match(vscodeignore, /^agents\//m);
  assert.match(vscodeignore, /^instructions\//m);
  assert.match(vscodeignore, /^templates\//m);
  assert.match(vscodeignore, /^docs\//m);
  assert.match(vscodeignore, /^\.vscode\//m);
  assert.match(vscodeignore, /^\.github\//m);
  assert.match(vscodeignore, /^\*-out\/$/m);
  assert.match(vscodeignore, /^\*\*\/\*\.map$/m);
  assert.match(vscodeignore, /^\*\*\/\*\.ts$/m);
  assert.match(vscodeignore, /^!out\/\*\*\/\*\.js$/m);
  assert.doesNotMatch(vscodeignore, /^!out\/\*\*$/m);
  assert.doesNotMatch(vscodeignore, /^out\//m);
});

test('el proveedor carga status.md de forma asíncrona', () => {
  const provider = readRepositoryFile('src/providers/statusTreeProvider.ts');

  assert.match(provider, /async getChildren\(/);
  assert.doesNotMatch(provider, /existsSync|readFileSync/);
});
