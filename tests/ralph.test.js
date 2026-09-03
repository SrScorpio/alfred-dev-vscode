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
  runSyncIssueCommand,
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
  assert.deepEqual(await unavailable.syncIssue(12, 'completed'), { synced: false, reason: 'unavailable' });

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

test('el comando syncIssue exige workspace trust antes de solicitar datos', async () => {
  let prompts = 0;
  let executions = 0;
  const errors = [];

  await runSyncIssueCommand({
    isTrusted: false,
    promptIssueId: async () => { prompts += 1; return '12'; },
    promptStatus: async () => 'closed',
    syncIssue: async () => { executions += 1; return { synced: true }; },
    showInformation: () => {},
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.match(errors[0], /workspace de confianza/);
});

test('el comando syncIssue informa cuando Ralph no está disponible', async () => {
  const errors = [];

  await runSyncIssueCommand({
    isTrusted: true,
    promptIssueId: async () => '12',
    promptStatus: async () => 'in-progress',
    syncIssue: async () => ({ synced: false, reason: 'unavailable' }),
    showInformation: () => {},
    showError: (message) => { errors.push(message); },
  });

  assert.match(errors[0], /instala o activa Ralph Suite/);
});

test('el comando syncIssue envía solo issue y estado mapeado y confirma el resultado', async () => {
  const calls = [];
  const messages = [];

  await runSyncIssueCommand({
    isTrusted: true,
    promptIssueId: async () => '42',
    promptStatus: async () => 'closed',
    syncIssue: async (...args) => { calls.push(args); return { synced: true }; },
    showInformation: (message) => { messages.push(message); },
    showError: (message) => { throw new Error(message); },
  });

  assert.deepEqual(calls, [[42, 'completed']]);
  assert.match(messages[0], /Issue #42 sincronizada/);
});