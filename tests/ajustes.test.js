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

test('elegir perfil o instalar Secret Guard reutiliza comandos existentes', async () => {
  const executed = [];

  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'model-profile'),
    getBoolean: (_key, defaultValue) => defaultValue,
    updateBoolean: async () => {},
    executeCommand: async (command) => {
      executed.push(command);
    },
  });
  await runAjustesCommand({
    quickPick: async (items) => items.find((item) => item.id === 'install-secret-hook'),
    getBoolean: (_key, defaultValue) => defaultValue,
    updateBoolean: async () => {},
    executeCommand: async (command) => {
      executed.push(command);
    },
  });

  assert.deepEqual(executed, [
    'alfred-dev.selectModelProfile',
    'alfred-dev.installSecretHook',
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

function itemsHaveOnlyKnownSettings(items) {
  const settings = items.map((item) => item.setting).filter(Boolean);
  return settings.every((setting) => [
    'alfred-dev.memory.enabled',
    'alfred-dev.secretGuard.diagnostics',
  ].includes(setting));
}
