const assert = require('node:assert/strict');
const test = require('node:test');

const { runStartFlowCommand } = require('../out/commands/startFlow.js');

test('cancelar el QuickPick no abre el chat', async () => {
  const opened = [];

  await runStartFlowCommand({
    quickPick: async () => undefined,
    openChat: (prompt) => {
      opened.push(prompt);
    },
  });

  assert.deepEqual(opened, []);
});

test('seleccionar un flujo abre el chat con su prompt @alfred', async () => {
  const opened = [];

  await runStartFlowCommand({
    quickPick: async (items) => items.find((item) => item.id === 'quick'),
    openChat: (prompt) => {
      opened.push(prompt);
    },
  });

  assert.equal(opened.length, 1);
  assert.match(opened[0], /^@alfred /);
  assert.match(opened[0], /Quick/);
});
