const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  RALPH_SUITE_EXTENSION_ID,
  RalphBridge,
  extractIssueIds,
  mapAlfredStatus,
  readRalphConfig,
  resolveRalphSuiteExtension,
  runRalphTaskCommand,
  runTrustedRalphAction,
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
  const bridge = new RalphBridge(() => ({ isActive: true, commands: [
    'ralph-suite.runTask', 'ralph-suite.startRunner', 'ralph-suite.stopRunner',
  ] }), async (...args) => {
    calls.push(args);
  });
  await bridge.runTask('task-1');
  await bridge.startRunner();
  await bridge.stopRunner();
  assert.deepEqual(await bridge.syncIssue(12, 'completed'), { synced: false, reason: 'unavailable' });
  assert.deepEqual(calls.map(([command]) => command), [
    'ralph-suite.runTask',
    'ralph-suite.startRunner',
    'ralph-suite.stopRunner',
  ]);
});

test('resuelve únicamente el proveedor Ralph Suite por su ID canónico', () => {
  const requestedIds = [];
  const expectedExtension = { isActive: true, commands: ['ralph-suite.openKanban'] };
  const resolved = resolveRalphSuiteExtension((extensionId) => {
    requestedIds.push(extensionId);
    return extensionId === 'ralph-suite.ralph-suite' ? expectedExtension : undefined;
  });

  assert.equal(RALPH_SUITE_EXTENSION_ID, 'ralph-suite.ralph-suite');
  assert.equal(resolved, expectedExtension);
  assert.deepEqual(requestedIds, ['ralph-suite.ralph-suite']);
  assert.equal(resolveRalphSuiteExtension(() => undefined), undefined);
});

test('cada wrapper exige que Ralph anuncie la capacidad exacta', async () => {
  const calls = [];
  const bridge = new RalphBridge(
    () => ({ isActive: true, commands: ['ralph-suite.runTask'] }),
    async (...args) => { calls.push(args); },
  );

  await bridge.runTask('task-1');
  await assert.rejects(bridge.openKanban(), /no anuncia la capacidad ralph-suite\.openKanban/);
  await assert.rejects(bridge.startRunner(), /no anuncia la capacidad ralph-suite\.startRunner/);
  await assert.rejects(bridge.stopRunner(), /no anuncia la capacidad ralph-suite\.stopRunner/);
  assert.deepEqual(calls, [['ralph-suite.runTask', 'task-1']]);
});

test('las acciones Ralph mutables requieren workspace de confianza', async () => {
  let executions = 0;
  const errors = [];

  await runTrustedRalphAction({
    isTrusted: false,
    action: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(executions, 0);
  assert.match(errors[0], /workspace de confianza/);
});

test('el comando runTask exige workspace trust antes de solicitar el ID', async () => {
  let prompts = 0;
  let executions = 0;
  let configReads = 0;
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: false,
    workspaceRoot: '/tmp/ralph',
    readConfig: async () => { configReads += 1; return { tasks: [] }; },
    promptTaskId: async () => { prompts += 1; return 'task-1'; },
    runTask: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.equal(configReads, 0);
  assert.match(errors[0], /workspace de confianza/);
});

test('el comando runTask exige un workspace abierto para validar la configuración', async () => {
  let prompts = 0;
  let executions = 0;
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: true,
    readConfig: readRalphConfig,
    promptTaskId: async () => { prompts += 1; return 'task-1'; },
    runTask: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.match(errors[0], /Abre un workspace/);
});

test('el comando runTask bloquea una configuración Ralph inválida antes de ejecutar', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-invalid-'));
  await fs.mkdir(path.join(directory, '.ralph'));
  await fs.writeFile(path.join(directory, '.ralph', 'config.json'), JSON.stringify({
    tasks: [{ id: '../escape', status: 'todo', route: '../secret' }],
  }));
  let prompts = 0;
  let executions = 0;
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: true,
    workspaceRoot: directory,
    readConfig: readRalphConfig,
    promptTaskId: async () => { prompts += 1; return 'task-1'; },
    runTask: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.match(errors[0], /configuración Ralph no válida/);
});

test('el comando runTask ejecuta solo tras validar la configuración de confianza', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-valid-'));
  await fs.mkdir(path.join(directory, '.ralph'));
  await fs.writeFile(path.join(directory, '.ralph', 'config.json'), JSON.stringify({
    tasks: [{ id: 'task-1', status: 'todo', route: 'tasks/task-1.md' }],
  }));
  const calls = [];
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: true,
    workspaceRoot: directory,
    readConfig: readRalphConfig,
    promptTaskId: async () => 'task-1',
    runTask: async (taskId) => { calls.push(taskId); },
    showError: (message) => { errors.push(message); },
  });

  assert.deepEqual(calls, ['task-1']);
  assert.deepEqual(errors, []);
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