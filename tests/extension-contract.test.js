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
  assert.ok(commands.some((command) => command.command === 'alfred-dev.openStyleGallery'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.installSecretHook'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.memory.put'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.memory.get'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.memory.search'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.memory.clear'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.ralph.openKanban'));
  assert.ok(commands.some((command) => command.command === 'alfred-dev.ralph.syncIssue'));
  assert.deepEqual(packageJson.contributes.mcpServerDefinitionProviders, [{
    id: 'alfred-dev.memory',
    label: 'Alfred Dev Memory',
  }]);
  assert.equal(packageJson.contributes.configuration.properties['alfred-dev.modelProfile'].default, 'luna');
  assert.equal(packageJson.contributes.configuration.properties['alfred-dev.memory.enabled'].default, false);
  assert.deepEqual(
    packageJson.contributes.configuration.properties['alfred-dev.modelProfile'].enum,
    ['luna', 'terra', 'sol'],
  );
});

test('protege escrituras de galería y Secret Guard con workspace trust', () => {
  const commands = readRepositoryFile('src/commands/index.ts');
  const gallery = readRepositoryFile('src/gallery/styleGalleryPanel.ts');

  assert.match(commands, /installSecretHookCommand[\s\S]*?workspace\.isTrusted[\s\S]*?installSecretHook\(/);
  assert.match(gallery, /workspace\.isTrusted[\s\S]*?loadStyleOptions\(/);
});

test('cablea la memoria configurada a MCP con feature detection y comandos fallback', () => {
  const extension = readRepositoryFile('src/extension.ts');
  const commands = readRepositoryFile('src/commands/index.ts');

  assert.match(extension, /registerMemoryMcpProviderOnTrust\(/);
  assert.match(extension, /onDidGrantWorkspaceTrust/);
  assert.match(extension, /onDidChangeConfiguration/);
  assert.match(extension, /affectsConfiguration\('alfred-dev\.memory\.enabled'\)/);
  assert.match(extension, /SecretStorageMemoryEncryptionKeyProvider\(context\.secrets\)/);
  assert.match(extension, /registerMcpServerDefinitionProvider/);
  assert.match(extension, /McpStdioServerDefinition/);
  assert.match(extension, /optionalMcpApi\?\.registerMcpServerDefinitionProvider/);
  assert.match(extension, /ALFRED_DEV_MEMORY_KEY_SOCKET|createMemoryMcpChildEnvironment/);
  assert.match(extension, /\.recycle\(/);
  assert.doesNotMatch(extension, /ALFRED_DEV_MEMORY_KEY:/);
  assert.match(commands, /createMemoryCommandHandlers\(/);
  assert.match(commands, /alfred-dev\.memory\.(?:put|get|search|clear)/);
  assert.match(commands, /clearLocalMemoryAndRecycleMcp\(/);
  assert.match(commands, /recycleMemoryMcp/);
  assert.match(commands, /readRalphConfig/);
  assert.match(commands, /runRalphTaskCommand\([\s\S]*?readConfig:\s*readRalphConfig/);
});

test('los diagnósticos de secretos limitan el tamaño antes de escanear', () => {
  const diagnostics = readRepositoryFile('src/security/diagnostics.ts');
  const scanner = readRepositoryFile('src/security/secretScanner.ts');

  assert.match(scanner, /MAX_SECRET_DIAGNOSTICS_BYTES = 64 \* 1024/);
  assert.match(diagnostics, /scanSecretsBounded\(/);
  assert.doesNotMatch(diagnostics, /scanSecrets\(/);
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
