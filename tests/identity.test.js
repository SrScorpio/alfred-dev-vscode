const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');

const {
  RALPH_IDENTITY_CONTRACT_VERSION,
  AGENTS_MD_OWNER,
  RALPH_ACTION_AGENT,
  getRalphIdentityDTO,
} = require('../out/integrations/identity.js');

const PROVIDER_ALLOWLIST = ['copilot', 'codex', 'claude', 'opencode'];
const EXPECTED_ACTIONS = ['runTask', 'optimizeMemory', 'analyzeProject', 'initProject', 'syncIssue'];

/** Reads the frontmatter block (between the first two `---`) of an agent file. */
function readAgentFrontmatter(agentId) {
  const file = path.join(repositoryRoot, 'agents', `${agentId}.agent.md`);
  assert.ok(fs.existsSync(file), `falta agents/${agentId}.agent.md`);
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `agents/${agentId}.agent.md no tiene frontmatter`);
  return match[1];
}

/** First `model` entry of the frontmatter, as a plain string. */
function firstModelEntry(agentId) {
  const frontmatter = readAgentFrontmatter(agentId);
  const line = frontmatter.match(/^model:\s*(.+)$/m);
  assert.ok(line, `agents/${agentId}.agent.md no declara model`);
  const entries = line[1].match(/'([^']+)'|"([^"]+)"/g) ?? [];
  const first = entries[0];
  assert.ok(first, `agents/${agentId}.agent.md no tiene entradas de model`);
  return first.replace(/^['"]|['"]$/g, '');
}

function vendorOf(entry) {
  return entry.match(/\(([^()]*)\)\s*$/)?.[1];
}

function providerOf(entry) {
  const vendor = vendorOf(entry);
  if (vendor === 'openai-codex') return 'codex';
  return PROVIDER_ALLOWLIST.includes(vendor) ? vendor : 'copilot';
}

function modelNameOf(entry) {
  return entry.replace(/\s*\([^()]*\)\s*$/, '').trim();
}

test('el DTO declara la forma v1 y el dueño de AGENTS.md', () => {
  const dto = getRalphIdentityDTO();
  assert.equal(RALPH_IDENTITY_CONTRACT_VERSION, 1);
  assert.equal(AGENTS_MD_OWNER, 'alfred-dev');
  assert.equal(dto.contractVersion, 1);
  assert.equal(dto.agentsMdOwner, 'alfred-dev');
  assert.equal(typeof dto.actions, 'object');
  assert.deepEqual(Object.keys(dto.actions).sort(), [...EXPECTED_ACTIONS].sort());
});

test('el mapa de acciones apunta al agente y la mención exactos', () => {
  const dto = getRalphIdentityDTO();
  assert.deepEqual(RALPH_ACTION_AGENT, {
    runTask: 'junior-dev',
    optimizeMemory: 'tech-writer',
    analyzeProject: 'product-owner',
    initProject: 'alfred',
    syncIssue: 'alfred',
  });
  for (const action of EXPECTED_ACTIONS) {
    const entry = dto.actions[action];
    assert.equal(entry.agent, RALPH_ACTION_AGENT[action], `${action}.agent`);
    assert.equal(entry.mention, `@${entry.agent}`, `${action}.mention`);
  }
});

test('el agente anunciado existe como agents/<id>.agent.md', () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const file = path.join(repositoryRoot, 'agents', `${dto.actions[action].agent}.agent.md`);
    assert.ok(fs.existsSync(file), `${action}: no existe ${file}`);
  }
});

test('provider está en la allowlist de Ralph y coincide con el frontmatter', () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const entry = dto.actions[action];
    assert.ok(PROVIDER_ALLOWLIST.includes(entry.provider), `${action}.provider=${entry.provider}`);
    assert.equal(entry.provider, providerOf(firstModelEntry(entry.agent)), `${action}.provider`);
  }
});

test('model es el nombre legible del frontmatter, sin vendor y nunca vacío', () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const entry = dto.actions[action];
    assert.equal(typeof entry.model, 'string', `${action}.model no es string`);
    assert.notEqual(entry.model, '', `${action}.model está vacío`);
    assert.equal(entry.model, modelNameOf(firstModelEntry(entry.agent)), `${action}.model`);
  }
});

test('preamble es una línea, ≤200 caracteres, sin plans/ ni caracteres de control', () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const { preamble, mention } = dto.actions[action];
    assert.equal(typeof preamble, 'string', `${action}.preamble no es string`);
    assert.ok(preamble.length <= 200, `${action}.preamble supera 200`);
    assert.ok(preamble.trim().length > 0, `${action}.preamble vacío`);
    assert.ok(!preamble.includes('\n') && !preamble.includes('\r'), `${action}.preamble multilinea`);
    assert.ok(!/plans\//.test(preamble), `${action}.preamble contiene plans/`);
    assert.ok(!/\/plan\//.test(preamble), `${action}.preamble contiene /plan/`);
    assert.ok(!/[\u0000-\u001F\u007F]/.test(preamble), `${action}.preamble con control chars`);
    assert.ok(!preamble.includes(mention), `${action}.preamble no debe incrustar la mención cruda`);
  }
});

test('el DTO es plano, reproducible y portable (sin rutas ni ajustes del usuario)', () => {
  const dto = getRalphIdentityDTO();
  const serialized = JSON.stringify(dto);
  assert.deepEqual(getRalphIdentityDTO(), dto, 'dos llamadas divergen');
  assert.ok(!/[A-Za-z]:\\/.test(serialized), 'contiene ruta absoluta Windows');
  assert.ok(!serialized.includes('/home/'), 'contiene ruta absoluta Unix');
  assert.ok(!/(^|[^.\w])~[\\/]/.test(serialized), 'contiene ruta de perfil ~');
  assert.ok(!serialized.includes('modelProfile'), 'filtra modelProfile');
  assert.ok(!serialized.includes('chatModel'), 'filtra chatModel');
  assert.ok(!/token|secret|password/i.test(serialized), 'contiene términos sensibles');
});

test('el comando announceIdentity está contribuido y registrado', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
  const commands = packageJson.contributes.commands;
  assert.ok(
    commands.some((command) => command.command === 'alfred-dev.ralph.announceIdentity'),
    'package.json no contribuye alfred-dev.ralph.announceIdentity',
  );
  const index = fs.readFileSync(path.join(repositoryRoot, 'src', 'commands', 'index.ts'), 'utf8');
  assert.match(index, /registerCommand\(\s*'alfred-dev\.ralph\.announceIdentity'/);
});
