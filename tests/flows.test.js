const assert = require('node:assert/strict');
const test = require('node:test');

const { ALFRED_FLOWS, getFlowQuickPickItems } = require('../out/commands/flows.js');

const REQUIRED_IDS = ['feature', 'quick', 'fix', 'spike', 'discuss', 'audit', 'uat', 'ship', 'lucius'];

test('expone ids estables de la paleta de flujos', () => {
  assert.deepEqual(ALFRED_FLOWS.map((flow) => flow.id), REQUIRED_IDS);
});

test('todos los prompts empiezan por @alfred', () => {
  for (const flow of ALFRED_FLOWS) {
    assert.match(flow.prompt, /^@alfred /);
  }
});

test('incluye los flujos nuevos y los clásicos de Feature/Fix/Audit/Ship', () => {
  const byId = Object.fromEntries(ALFRED_FLOWS.map((flow) => [flow.id, flow]));

  assert.match(byId.quick.label, /Quick/i);
  assert.match(byId.spike.label, /Spike/i);
  assert.match(byId.discuss.label, /Discuss/i);
  assert.match(byId.uat.label, /UAT/i);
  assert.match(byId.lucius.label, /Lucius/i);
  assert.match(byId.feature.label, /Feature/i);
  assert.match(byId.fix.label, /Fix/i);
  assert.match(byId.audit.label, /Audit/i);
  assert.match(byId.ship.label, /Ship/i);

  assert.equal(byId.feature.prompt, '@alfred Arranca el flujo Feature (Idea -> Entrega)');
  assert.equal(byId.fix.prompt, '@alfred Arranca el flujo Fix (Diagnóstico -> TDD -> QA)');
  assert.equal(byId.audit.prompt, '@alfred Arranca el flujo Audit (Seguridad + Calidad)');
  assert.equal(byId.ship.prompt, '@alfred Arranca el flujo Ship (Publicación)');
  assert.equal(
    byId.quick.prompt,
    '@alfred Arranca el flujo Quick: cambio pequeño o bien delimitado, menos ceremonia que Feature, TDD igual.',
  );
});

test('el QuickPick reutiliza id, label y prompt del catálogo', () => {
  const items = getFlowQuickPickItems();

  assert.deepEqual(items.map((item) => item.id), REQUIRED_IDS);
  assert.equal(items[0].label, ALFRED_FLOWS[0].label);
  assert.equal(items[0].prompt, ALFRED_FLOWS[0].prompt);
});
