const assert = require('node:assert/strict');
const test = require('node:test');

const { parseProjectStatus } = require('../out/providers/parseStatus.js');

test('parsea los campos del snapshot y conserva Siguiente acción', () => {
  const status = parseProjectStatus(`
**Flujo:** Feature
**Fase actual:** Desarrollo
**Gate pendiente:** Tests verdes
**Siguiente acción:** Implementar TreeView
`);

  assert.deepEqual(status, {
    flow: 'Feature',
    phase: 'Desarrollo',
    pendingGate: 'Tests verdes',
    nextAction: 'Implementar TreeView',
  });
});

test('conserva Próxima acción cuando el snapshot usa esa etiqueta', () => {
  const status = parseProjectStatus('**Próxima acción recomendada:** Abrir PR');

  assert.equal(status.nextAction, 'Abrir PR');
});

test('devuelve el mensaje de GitHub Issues si falta el snapshot', () => {
  const status = parseProjectStatus(undefined);

  assert.equal(status.message, 'Sin snapshot local. El estado vive en GitHub Issues.');
});
