const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { installUserCatalog, userInstructionsDir } = require('../out/agents/catalogInstaller.js');

async function writeCatalog(extensionPath) {
  const agents = path.join(extensionPath, 'catalog', 'agents');
  await fs.mkdir(agents, { recursive: true });
  await fs.writeFile(path.join(agents, 'alfred.agent.md'), '# alfred\n');
  await fs.writeFile(path.join(agents, 'notas.txt'), 'no debe copiarse\n');
  const skill = path.join(extensionPath, 'catalog', 'skills', 'write-adr');
  await fs.mkdir(skill, { recursive: true });
  await fs.writeFile(path.join(skill, 'SKILL.md'), '# adr\n');
  const instructions = path.join(extensionPath, 'catalog', 'instructions');
  await fs.mkdir(instructions, { recursive: true });
  await fs.writeFile(path.join(instructions, 'global.instructions.md'), '# rules\n');
  const templates = path.join(extensionPath, 'catalog', 'templates');
  await fs.mkdir(templates, { recursive: true });
  await fs.writeFile(path.join(templates, 'status.md'), '# status\n');
}

test('copia el catálogo al perfil y no lo repite si la versión coincide', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-catalog-'));
  const extensionPath = path.join(root, 'extension');
  const homeDir = path.join(root, 'home');
  const appDataDir = path.join(root, 'appdata');
  await writeCatalog(extensionPath);

  const first = await installUserCatalog({
    extensionPath, version: '0.9.1', homeDir, appDataDir, platform: 'win32',
  });
  assert.deepEqual(
    { agents: first.agents, skills: first.skills, instructions: first.instructions, templates: first.templates, changed: first.changed },
    { agents: 1, skills: 1, instructions: 1, templates: 1, changed: true },
  );
  assert.equal(await fs.readFile(path.join(homeDir, '.copilot', 'agents', 'alfred.agent.md'), 'utf8'), '# alfred\n');
  await assert.rejects(fs.access(path.join(homeDir, '.copilot', 'agents', 'notas.txt')));
  assert.equal(
    await fs.readFile(path.join(userInstructionsDir('win32', homeDir, appDataDir), 'global.instructions.md'), 'utf8'),
    '# rules\n',
  );

  const second = await installUserCatalog({
    extensionPath, version: '0.9.1', homeDir, appDataDir, platform: 'win32',
  });
  assert.equal(second.changed, false);

  const forced = await installUserCatalog({
    extensionPath, version: '0.9.1', homeDir, appDataDir, platform: 'win32', force: true,
  });
  assert.equal(forced.changed, true);
});
