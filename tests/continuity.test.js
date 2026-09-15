const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ALFRED_CONTINUITY,
  getContinuityQuickPickItems,
  runContinuityCommand,
} = require('../out/commands/continuity.js');

const REQUIRED_IDS = ['progress', 'pause', 'retomar'];
const REQUIRED_COMMANDS = {
  progress: 'alfred-dev.progress',
  pause: 'alfred-dev.pause',
  retomar: 'alfred-dev.retomar',
};

test('expone ids estables de continuidad', () => {
  assert.deepEqual(ALFRED_CONTINUITY.map((action) => action.id), REQUIRED_IDS);
});

test('los prompts de continuidad empiezan por @alfred y son únicos', () => {
  const prompts = ALFRED_CONTINUITY.map((action) => action.prompt);

  for (const prompt of prompts) {
    assert.match(prompt, /^@alfred /);
  }
  assert.equal(new Set(prompts).size, ALFRED_CONTINUITY.length);
});

test('fija labels de paleta, comandos y prompts de Progress/Pause/Retomar', () => {
  const byId = Object.fromEntries(ALFRED_CONTINUITY.map((action) => [action.id, action]));

  assert.equal(byId.progress.label, 'Alfred Dev: Ver progreso');
  assert.equal(byId.pause.label, 'Alfred Dev: Pausar trabajo');
  assert.equal(byId.retomar.label, 'Alfred Dev: Retomar trabajo');

  assert.equal(byId.progress.command, REQUIRED_COMMANDS.progress);
  assert.equal(byId.pause.command, REQUIRED_COMMANDS.pause);
  assert.equal(byId.retomar.command, REQUIRED_COMMANDS.retomar);

  assert.equal(
    byId.progress.prompt,
    '@alfred Reconstruye el progreso: issues/PRs de GitHub y docs/project/status.md. No inventes estado.',
  );
  assert.equal(
    byId.pause.prompt,
    '@alfred Pausa el trabajo actual: deja handoff en la issue in-progress o en el snapshot. No implementes código.',
  );
  assert.equal(
    byId.retomar.prompt,
    '@alfred Retoma el trabajo in-progress o in-review, o el snapshot local. No reinventes el flujo.',
  );
});

test('el QuickPick reutiliza id, label, prompt y command del catálogo', () => {
  const items = getContinuityQuickPickItems();

  assert.deepEqual(items.map((item) => item.id), REQUIRED_IDS);
  assert.equal(items[0].label, ALFRED_CONTINUITY[0].label);
  assert.equal(items[0].prompt, ALFRED_CONTINUITY[0].prompt);
  assert.equal(items[0].command, ALFRED_CONTINUITY[0].command);
});

test('el comando directo abre el chat con el prompt de la acción', async () => {
  const opened = [];

  await runContinuityCommand({
    openChat: (prompt) => {
      opened.push(prompt);
    },
  }, 'pause');

  assert.deepEqual(opened, [ALFRED_CONTINUITY.find((action) => action.id === 'pause').prompt]);
});

test('cancelar el QuickPick no abre el chat', async () => {
  const opened = [];

  await runContinuityCommand({
    quickPick: async () => undefined,
    openChat: (prompt) => {
      opened.push(prompt);
    },
  });

  assert.deepEqual(opened, []);
});

test('seleccionar una acción del QuickPick abre su prompt @alfred', async () => {
  const opened = [];

  await runContinuityCommand({
    quickPick: async (items) => items.find((item) => item.id === 'retomar'),
    openChat: (prompt) => {
      opened.push(prompt);
    },
  });

  assert.equal(opened.length, 1);
  assert.match(opened[0], /^@alfred /);
  assert.match(opened[0], /Retoma/);
});
