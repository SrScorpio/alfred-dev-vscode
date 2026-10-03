const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getAvailableModelItems,
  normalizeChatModels,
  sanitizeModelText,
} = require('../out/commands/availableModels.js');

test('descarta ids vacíos o con controles y no repite un id', () => {
  const models = normalizeChatModels([
    { id: 'gpt\u00007', name: 'Roto', vendor: 'copilot', family: 'gpt' },
    { id: '  grok-4.6  ', name: 'Grok 4.6', vendor: 'xai-grok', family: 'grok' },
    { id: 'grok-4.6', name: 'Grok duplicado', vendor: 'xai-grok', family: 'grok' },
    { id: 'claude', name: 'Claude', vendor: 'anthropic', family: 'claude' },
  ]);

  assert.deepEqual(models.map((model) => model.id), ['claude', 'grok-4.6']);
  assert.equal(models[1].name, 'Grok 4.6');
});

test('ordena por vendor, familia y nombre, sin filtrar proveedor', () => {
  const models = normalizeChatModels([
    { id: 'sol', name: 'GPT 5.6 Sol', vendor: 'openai-codex', family: 'gpt-5.6' },
    { id: 'glm', name: 'GLM-5.3', vendor: 'glm', family: 'glm' },
    { id: 'luna', name: 'GPT 5.6 Luna', vendor: 'openai-codex', family: 'gpt-5.6' },
    { id: 'haiku', name: 'Haiku', vendor: 'copilot', family: 'claude' },
  ]);

  assert.deepEqual(models.map((model) => model.vendor), ['copilot', 'glm', 'openai-codex', 'openai-codex']);
  assert.deepEqual(
    models.filter((model) => model.vendor === 'openai-codex').map((model) => model.name),
    ['GPT 5.6 Luna', 'GPT 5.6 Sol'],
  );
});

test('marca solo el id guardado que sigue anunciado', () => {
  const models = normalizeChatModels([
    { id: 'grok-4.6', name: 'Grok 4.6', vendor: 'xai-grok', family: 'grok' },
    { id: 'luna', name: 'GPT 5.6 Luna', vendor: 'openai-codex', family: 'gpt-5.6' },
  ]);

  const fresh = getAvailableModelItems(models, 'grok-4.6');
  assert.equal(fresh.find((item) => item.modelId === 'grok-4.6').picked, true);
  assert.equal(fresh.find((item) => item.modelId === 'luna').picked, false);
  assert.match(fresh[0].description, /openai-codex/);

  const stale = getAvailableModelItems(models, 'modelo-que-ya-no-esta');
  assert.equal(stale.some((item) => item.picked), false);
});

test('rechaza texto que no se puede guardar', () => {
  assert.equal(sanitizeModelText('  glm-5.3  ', 20), 'glm-5.3');
  assert.equal(sanitizeModelText('', 20), undefined);
  assert.equal(sanitizeModelText('a\nb', 20), undefined);
  assert.equal(sanitizeModelText(12, 20), undefined);
});
