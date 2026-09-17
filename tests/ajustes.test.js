const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getAjustesQuickPickItems,
  runAjustesCommand,
} = require('../out/commands/ajustes.js');

const REQUIRED_IDS = [
  'model-profile',
  'memory-enabled',
  'secret-guard-diagnostics',
  'install-secret-hook',
  'memory-explore',
];

test('el QuickPick de ajustes expone ids estables', () => {
  const items = getAjustesQuickPickItems({
    memoryEnabled: false,
    diagnosticsEnabled: true,
  });

  assert.deepEqual(items.map((item) => item.id), REQUIRED_IDS);
});

test('el toggle de memoria refleja el valor actual y no inventa settings', () => {
  const disabled = getAjustesQuickPickItems({
    memoryEnabled: false,
    diagnosticsEnabled: true,
  });
  const enabled = getAjustesQuickPickItems({
    memoryEnabled: true,
    diagnosticsEnabled: false,
  });
  const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));

  assert.match(byId(disabled)['memory-enabled'].label, /activar/i);
  assert.match(byId(enabled)['memory-enabled'].label, /desactivar/i);
  assert.equal(byId(disabled)['memory-enabled'].setting, 'alfred-dev.memory.enabled');
  assert.equal(byId(disabled)['secret-guard-diagnostics'].setting, 'alfred-dev.secretGuard.diagnostics');
  assert.equal(byId(disabled)['model-profile'].command, 'alfred-dev.selectModelProfile');
  assert.equal(byId(disabled)['install-secret-hook'].command, 'alfred-dev.installSecretHook');
  assert.equal(byId(disabled)['memory-explore'].command, 'alfred-dev.memory.explore');
  assert.equal(
    itemsHaveOnlyKnownSettings(disabled),
    true,
  );
});

test('cancelar el QuickPick no cambia configuración ni ejecuta comandos', async () => {
  const executed = [];
  const updated = [];

  await runAjustesCommand({
    quickPick: async () => undefined,
    getBoolean: (_key, defaultValue) => defaultValue,
    inspect: () => ({}),
    updateBoolean: async (key, value, target) => {
      updated.push({ key, value, target });
    },
    executeCommand: async (command) => {
      executed.push(command);
    },
  });

  assert.deepEqual(executed, []);
  assert.deepEqual(updated, []);
});

test('elegir perfil, Secret Guard o explorar memoria reutiliza comandos existentes', async () => {
  const executed = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'model-profile'),
    getBoolean: (_key, defaultValue) => defaultValue,
    inspect: () => ({}),
    updateBoolean: async () => {},
    executeCommand: async (command) => {
      executed.push(command);
    },
  });
  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'install-secret-hook'),
    getBoolean: (_key, defaultValue) => defaultValue,
    inspect: () => ({}),
    updateBoolean: async () => {},
    executeCommand: async (command) => {
      executed.push(command);
    },
  });
  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'memory-explore'),
    getBoolean: (_key, defaultValue) => defaultValue,
    inspect: () => ({}),
    updateBoolean: async () => {},
    executeCommand: async (command) => {
      executed.push(command);
    },
  });

  assert.deepEqual(executed, [
    'alfred-dev.selectModelProfile',
    'alfred-dev.installSecretHook',
    'alfred-dev.memory.explore',
  ]);
});

test('el toggle de memoria invierte el valor actual con alcance Global', async () => {
  const updated = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'memory-enabled'),
    getBoolean: (key, defaultValue) => {
      if (key === 'alfred-dev.memory.enabled') return false;
      return defaultValue;
    },
    inspect: () => ({}),
    updateBoolean: async (key, value, target) => {
      updated.push({ key, value, target });
    },
    executeCommand: async () => {},
  });

  assert.deepEqual(updated, [{
    key: 'alfred-dev.memory.enabled',
    value: true,
    target: 'Global',
  }]);
});

test('el toggle de diagnósticos invierte el valor actual con alcance Global', async () => {
  const updated = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'secret-guard-diagnostics'),
    getBoolean: (key, defaultValue) => {
      if (key === 'alfred-dev.secretGuard.diagnostics') return true;
      return defaultValue;
    },
    inspect: () => ({}),
    updateBoolean: async (key, value, target) => {
      updated.push({ key, value, target });
    },
    executeCommand: async () => {},
  });

  assert.deepEqual(updated, [{
    key: 'alfred-dev.secretGuard.diagnostics',
    value: false,
    target: 'Global',
  }]);
});

test('el toggle con override de workspace escribe en Workspace', async () => {
  const updated = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'memory-enabled'),
    getBoolean: (key, defaultValue) => {
      if (key === 'alfred-dev.memory.enabled') return true;
      return defaultValue;
    },
    inspect: (key) => {
      if (key === 'alfred-dev.memory.enabled') return { workspaceValue: true };
      return {};
    },
    updateBoolean: async (key, value, target) => {
      updated.push({ key, value, target });
    },
    executeCommand: async () => {},
  });

  assert.deepEqual(updated, [{
    key: 'alfred-dev.memory.enabled',
    value: false,
    target: 'Workspace',
  }]);
});

test('el toggle sin override de workspace escribe en Global', async () => {
  const updated = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'secret-guard-diagnostics'),
    getBoolean: (key, defaultValue) => {
      if (key === 'alfred-dev.secretGuard.diagnostics') return false;
      return defaultValue;
    },
    inspect: () => ({ workspaceValue: undefined, globalValue: false }),
    updateBoolean: async (key, value, target) => {
      updated.push({ key, value, target });
    },
    executeCommand: async () => {},
  });

  assert.deepEqual(updated, [{
    key: 'alfred-dev.secretGuard.diagnostics',
    value: true,
    target: 'Global',
  }]);
});

test('el toggle informa del valor y el alcance', async () => {
  const messages = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'memory-enabled'),
    getBoolean: () => false,
    inspect: () => ({ workspaceValue: false }),
    updateBoolean: async () => {},
    executeCommand: async () => {},
    showInformation: (message) => { messages.push(message); },
  });

  assert.equal(messages.length, 1);
  assert.match(messages[0], /true/);
  assert.match(messages[0], /Workspace/);
});

function itemsHaveOnlyKnownSettings(items) {
  const settings = items.map((item) => item.setting).filter(Boolean);
  return settings.every((setting) => [
    'alfred-dev.memory.enabled',
    'alfred-dev.secretGuard.diagnostics',
  ].includes(setting));
}
