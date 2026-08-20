const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('global instructions define compact progress and mandatory exceptions', () => {
  const instructions = readRepositoryFile('instructions/global-instructions.md.instructions.md');

  assert.match(instructions, /Progreso conversacional/);
  assert.match(instructions, /No narrar búsquedas, lecturas, comandos ni microacciones/);
  assert.match(instructions, /comprobaciones internas que terminan correctamente/);
  assert.match(instructions, /bloqueos.*decisiones.*riesgos/s);
  assert.match(instructions, /informes.*gates.*detalle/s);
  assert.match(instructions, /seguridad.*integridad.*coste.*aprobación explícita/s);
});

test('Alfred uses compact phase updates without removing gate reporting', () => {
  const alfred = readRepositoryFile('agents/alfred.agent.md');

  assert.match(alfred, /Formato compacto/);
  assert.match(alfred, /Estado:/);
  assert.match(alfred, /Siguiente:/);
  assert.match(alfred, /Informa al usuario.*compact/s);
  assert.match(alfred, /veredicto/);
  assert.match(alfred, /qa_seguridad_aprobado/);
  assert.match(alfred, /OWASP/);
  assert.match(alfred, /Compliance check/);
});

test('QA accumulates exploratory notes instead of narrating them live', () => {
  const qa = readRepositoryFile('agents/qa-engineer.agent.md');

  assert.match(qa, /notas acumuladas al cierre/);
  assert.doesNotMatch(qa, /Documentación en tiempo real/);
});

test('Lucius keeps confirmation and reports only failures or relevant results', () => {
  const lucius = readRepositoryFile('agents/lucius.agent.md');

  assert.match(lucius, /confirmación explícita/);
  assert.match(lucius, /No narrar comandos ni comprobaciones exitosas/);
  assert.match(lucius, /Nunca ejecutes la auditoría sin confirmación/);
  assert.match(lucius, /--sandbox read-only/);
  assert.match(lucius, /cmp -s/);
});
