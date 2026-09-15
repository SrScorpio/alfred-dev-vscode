const assert = require('node:assert/strict');
const test = require('node:test');

const {
  registerSecretDiagnosticsOnChange,
} = require('../out/security/diagnostics.js');

function createHarness(initialEnabled) {
  let enabled = initialEnabled;
  let configListener;
  let registrations = 0;
  let disposals = 0;
  const subscriptions = [];

  const handle = registerSecretDiagnosticsOnChange({
    enabled: () => enabled,
    register: () => {
      registrations += 1;
      return { dispose() { disposals += 1; } };
    },
    onDidChangeConfiguration: (listener) => {
      configListener = listener;
      return { dispose() {} };
    },
    addSubscription: (disposable) => { subscriptions.push(disposable); },
  });

  return {
    handle,
    subscriptions,
    get registrations() { return registrations; },
    get disposals() { return disposals; },
    get configListener() { return configListener; },
    setEnabled(value) { enabled = value; },
  };
}

test('si el opt-in ya está activo registra diagnósticos una sola vez', () => {
  const harness = createHarness(true);

  assert.equal(harness.registrations, 1);
  assert.equal(harness.disposals, 0);
  harness.configListener();
  assert.equal(harness.registrations, 1);
});

test('si el opt-in está desactivado no registra hasta que pase a true', () => {
  const harness = createHarness(false);

  assert.equal(harness.registrations, 0);
  harness.setEnabled(true);
  harness.configListener();
  harness.configListener();
  assert.equal(harness.registrations, 1);
  assert.equal(harness.disposals, 0);
});

test('pasar a false dispone collection y subscription; reactivar no deja huérfanas', () => {
  const harness = createHarness(true);

  harness.setEnabled(false);
  harness.configListener();
  assert.equal(harness.registrations, 1);
  assert.equal(harness.disposals, 1);

  harness.setEnabled(true);
  harness.configListener();
  assert.equal(harness.registrations, 2);
  assert.equal(harness.disposals, 1);
});

test('dispose del handle libera el registro activo', () => {
  const harness = createHarness(true);

  harness.handle.dispose();
  assert.equal(harness.disposals, 1);
  harness.handle.dispose();
  assert.equal(harness.disposals, 1);
});

test('escucha el cambio de configuración mediante una suscripción', () => {
  const harness = createHarness(false);

  assert.equal(harness.subscriptions.length > 0, true);
  assert.equal(typeof harness.configListener, 'function');
});
