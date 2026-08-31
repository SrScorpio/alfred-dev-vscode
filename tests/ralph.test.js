const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  RalphBridge,
  extractIssueIds,
  mapAlfredStatus,
  readRalphConfig,
} = require('../out/integrations/ralph.js');

test('mapea estados Alfred/Ralph y extrae asociaciones ISSUE', () => {
  assert.equal(mapAlfredStatus('backlog'), 'todo');
  assert.equal(mapAlfredStatus('in-progress'), 'inprogress');
  assert.equal(mapAlfredStatus('blocked'), 'blocked');
  assert.equal(mapAlfredStatus('closed'), 'completed');
  assert.deepEqual(extractIssueIds('ISSUE-12 y ISSUE-123'), [12, 123]);
  assert.deepEqual(extractIssueIds('issue-1 ISSUE-0 ISSUE-1000000'), []);
});

test('lee .ralph solo con esquema, rutas e IDs estrictos', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-'));
  await fs.mkdir(path.join(directory, '.ralph'));
  await fs.writeFile(path.join(directory, '.ralph', 'config.json'), JSON.stringify({
    tasks: [{ id: 'task-1', status: 'todo', route: 'tasks/task-1.md' }],
  }));

  const config = await readRalphConfig(directory, true);
  assert.equal(config.tasks[0].id, 'task-1');
  await fs.writeFile(path.join(directory, '.ralph', 'config.json'), JSON.stringify({
    tasks: [{ id: '../escape', status: 'todo', route: '../secret' }],
  }));
  await assert.rejects(readRalphConfig(directory, true), /configuración Ralph no válida/);
  await fs.writeFile(path.join(directory, '.ralph', 'config.json'), JSON.stringify({
    tasks: [{ id: 'task-1', status: 'todo', route: 'tasks/../secret.md' }],
  }));
  await assert.rejects(readRalphConfig(directory, true), /configuración Ralph no válida/);
  await assert.rejects(readRalphConfig(directory, false), /workspace de confianza/);
});

test('los wrappers fallan claro y sincronizan de forma best-effort', async () => {
  const unavailable = new RalphBridge(() => undefined, async () => {});

  await assert.rejects(unavailable.openKanban(), /Ralph Suite no está instalada/);
  assert.deepEqual(await unavailable.syncIssue(12, 'completed'), { synced: false });

  const calls = [];
  const bridge = new RalphBridge(() => ({ isActive: true }), async (...args) => {
    calls.push(args);
  });
  await bridge.runTask('task-1');
  await bridge.startRunner();
  await bridge.stopRunner();
  await bridge.syncIssue(12, 'completed');
  assert.deepEqual(calls.map(([command]) => command), [
    'ralph-suite.runTask',
    'ralph-suite.startRunner',
    'ralph-suite.stopRunner',
    'ralph-suite.syncIssue',
  ]);
});