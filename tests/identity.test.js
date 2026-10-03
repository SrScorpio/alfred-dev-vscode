const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.resolve(__dirname, "..");

const {
  RALPH_IDENTITY_CONTRACT_VERSION,
  AGENTS_MD_OWNER,
  RALPH_ACTION_AGENT,
  getRalphIdentityDTO,
} = require("../out/integrations/identity.js");

const EXPECTED_ACTIONS = ["runTask", "optimizeMemory", "analyzeProject", "initProject", "syncIssue"];

test("el DTO declara la forma v1 y el dueño de AGENTS.md", () => {
  const dto = getRalphIdentityDTO();
  assert.equal(RALPH_IDENTITY_CONTRACT_VERSION, 1);
  assert.equal(AGENTS_MD_OWNER, "alfred-dev");
  assert.equal(dto.contractVersion, 1);
  assert.equal(dto.agentsMdOwner, "alfred-dev");
  assert.deepEqual(Object.keys(dto.actions).sort(), [...EXPECTED_ACTIONS].sort());
});

test("el mapa de acciones apunta al subagente y la mención exactos", () => {
  const dto = getRalphIdentityDTO();
  assert.deepEqual(RALPH_ACTION_AGENT, {
    runTask: "junior-dev",
    optimizeMemory: "tech-writer",
    analyzeProject: "product-owner",
    initProject: "alfred",
    syncIssue: "alfred",
  });
  for (const action of EXPECTED_ACTIONS) {
    const entry = dto.actions[action];
    assert.equal(entry.agent, RALPH_ACTION_AGENT[action], action + ".agent");
    assert.equal(entry.mention, "@" + entry.agent, action + ".mention");
  }
});

test("el subagente anunciado existe como agents/<id>.agent.md y declara su cadena model", () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const file = path.join(repositoryRoot, "agents", dto.actions[action].agent + ".agent.md");
    assert.ok(fs.existsSync(file), action + ": no existe " + file);
    const content = fs.readFileSync(file, "utf8");
    assert.match(content, /^model:\s*\[/m, action + ": el subagente no declara su cadena model");
  }
});

test("el DTO no anuncia proveedor ni modelo: eso vive en la ficha del subagente", () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const entry = dto.actions[action];
    assert.equal(entry.provider, undefined, action + " no debe anunciar provider");
    assert.equal(entry.model, undefined, action + " no debe anunciar model");
  }
  const serialized = JSON.stringify(dto);
  assert.ok(!serialized.includes("openai-codex"), "filtra un vendor de modelo");
  assert.ok(!serialized.includes("GPT 5.6"), "filtra un nombre de modelo");
});

test("preamble es una línea, <=200 caracteres, sin plans/ ni caracteres de control", () => {
  const dto = getRalphIdentityDTO();
  for (const action of EXPECTED_ACTIONS) {
    const preamble = dto.actions[action].preamble;
    const mention = dto.actions[action].mention;
    assert.equal(typeof preamble, "string");
    assert.ok(preamble.length <= 200, action + ".preamble supera 200: " + preamble.length);
    assert.ok(preamble.trim().length > 0);
    assert.ok(!preamble.includes("\n") && !preamble.includes("\r"));
    assert.ok(!/plans\//.test(preamble));
    assert.ok(!/\/plan\//.test(preamble));
    assert.ok(!/[\u0000-\u001F\u007F]/.test(preamble));
    assert.ok(!preamble.includes(mention));
  }
});

test("el DTO es plano, reproducible y portable", () => {
  const dto = getRalphIdentityDTO();
  const serialized = JSON.stringify(dto);
  assert.deepEqual(getRalphIdentityDTO(), dto);
  assert.ok(!/[A-Za-z]:\\/.test(serialized));
  assert.ok(!serialized.includes("/home/"));
  assert.ok(!serialized.includes("modelProfile"));
  assert.ok(!serialized.includes("chatModel"));
  assert.ok(!/token|secret|password/i.test(serialized));
});

test("el comando announceIdentity está contribuido y registrado", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  assert.ok(packageJson.contributes.commands.some((command) => command.command === "alfred-dev.ralph.announceIdentity"));
  const index = fs.readFileSync(path.join(repositoryRoot, "src", "commands", "index.ts"), "utf8");
  assert.match(index, /registerCommand\(\s*['"]alfred-dev\.ralph\.announceIdentity['"]/);
});
