const assert = require('node:assert/strict');
const test = require('node:test');

const { MODEL_PROFILES, getModelProfileItems } = require('../out/commands/modelProfiles.js');

test('expone los tres perfiles con la política de coste del README', () => {
  assert.deepEqual(Object.keys(MODEL_PROFILES), ['luna', 'terra', 'sol']);

  const items = getModelProfileItems();
  assert.deepEqual(items.map((item) => item.label), ['Luna', 'Terra', 'Sol']);
  assert.match(items[0].description, /frecuente/i);
  assert.match(items[1].description, /razonamiento|auditoría/i);
  assert.match(items[2].description, /complicado/i);
  assert.equal(items[0].picked, true);
  assert.equal(items[1].picked, false);
  assert.equal(items[2].picked, false);
});

test('marca como seleccionado el perfil global guardado', () => {
  const items = getModelProfileItems('terra');

  assert.equal(items[0].picked, false);
  assert.equal(items[1].picked, true);
  assert.equal(items[2].picked, false);
});
