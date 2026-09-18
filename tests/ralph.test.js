const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  RALPH_SUITE_EXTENSION_ID,
  RalphBridge,
  extractIssueIds,
  findRalphWorkspaceRoot,
  mapAlfredStatus,
  ralphCommandContexts,
  readRalphPrd,
  resolveRalphPrdPath,
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

test('lee prd.json con IDs de Ralph y rechaza traversal o trust', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-'));
  await fs.writeFile(path.join(directory, 'prd.json'), JSON.stringify({
    project: 'demo',
    issues: [{ id: 'ISSUE-001', status: 'todo' }],
  }));

  const prd = await readRalphPrd(directory, true);
  assert.equal(prd.issues[0].id, 'ISSUE-001');
  await fs.writeFile(path.join(directory, 'prd.json'), JSON.stringify({
    issues: [{ id: '../escape', status: 'todo' }],
  }));
  await assert.rejects(readRalphPrd(directory, true), /prd\.json de Ralph no válido/);
  await assert.rejects(readRalphPrd(directory, false), /workspace de confianza/);
  const missing = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-missing-'));
  await assert.rejects(readRalphPrd(missing, true), /No se encontró prd\.json/);
});

test('elige la carpeta multi-root con prd.json y no sale del workspace', () => {
  const first = path.join(os.tmpdir(), 'alfred-folder-a');
  const second = path.join(os.tmpdir(), 'alfred-folder-b');
  const prd = path.join(second, 'prd.json');
  assert.equal(findRalphWorkspaceRoot([first, second], 'prd.json', (candidate) => candidate === prd), second);
  assert.equal(findRalphWorkspaceRoot([first], 'prd.json', () => false), first);
  assert.equal(findRalphWorkspaceRoot([], 'prd.json', () => true), undefined);
  assert.equal(resolveRalphPrdPath(first, '../outside.json'), path.join(first, 'prd.json'));
  assert.equal(resolveRalphPrdPath(first, 'prd.json'), path.join(first, 'prd.json'));
});

test('la paleta solo activa capacidades anunciadas por Ralph activo', () => {
  assert.deepEqual(ralphCommandContexts(undefined), {
    'alfred-dev.ralph.openKanban': false,
    'alfred-dev.ralph.runTask': false,
    'alfred-dev.ralph.startRunner': false,
    'alfred-dev.ralph.stopRunner': false,
    'alfred-dev.ralph.syncIssue': false,
  });
  assert.deepEqual(ralphCommandContexts({
    isActive: true,
    commands: ['ralph-suite.openKanban', 'ralph-suite.runTask', 'ralph-suite.startRunner', 'ralph-suite.stopRunner'],
  }), {
    'alfred-dev.ralph.openKanban': true,
    'alfred-dev.ralph.runTask': true,
    'alfred-dev.ralph.startRunner': true,
    'alfred-dev.ralph.stopRunner': true,
    'alfred-dev.ralph.syncIssue': false,
  });
  assert.deepEqual(ralphCommandContexts({ isActive: false, commands: ['ralph-suite.openKanban'] }), {
    'alfred-dev.ralph.openKanban': false,
    'alfred-dev.ralph.runTask': false,
    'alfred-dev.ralph.startRunner': false,
    'alfred-dev.ralph.stopRunner': false,
    'alfred-dev.ralph.syncIssue': false,
  });
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
    readPrd: async () => { configReads += 1; return { issues: [] }; },
    promptTaskId: async () => { prompts += 1; return 'ISSUE-001'; },
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
    readPrd: readRalphPrd,
    promptTaskId: async () => { prompts += 1; return 'ISSUE-001'; },
    runTask: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.match(errors[0], /Abre un workspace/);
});

test('el comando runTask bloquea un prd.json inválido antes de ejecutar', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-invalid-'));
  await fs.writeFile(path.join(directory, 'prd.json'), JSON.stringify({
    issues: [{ id: '../escape', status: 'todo' }],
  }));
  let prompts = 0;
  let executions = 0;
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: true,
    workspaceRoot: directory,
    readPrd: readRalphPrd,
    promptTaskId: async () => { prompts += 1; return 'ISSUE-001'; },
    runTask: async () => { executions += 1; },
    showError: (message) => { errors.push(message); },
  });

  assert.equal(prompts, 0);
  assert.equal(executions, 0);
  assert.match(errors[0], /prd\.json de Ralph no válido/);
});

test('el comando runTask ejecuta solo tras validar prd.json de confianza', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-ralph-valid-'));
  await fs.writeFile(path.join(directory, 'prd.json'), JSON.stringify({
    issues: [{ id: 'ISSUE-001', status: 'todo' }],
  }));
  const calls = [];
  const errors = [];

  await runRalphTaskCommand({
    isTrusted: true,
    workspaceRoot: directory,
    readPrd: readRalphPrd,
    promptTaskId: async (issues) => issues[0]?.id,
    runTask: async (taskId) => { calls.push(taskId); },
    showError: (message) => { errors.push(message); },
  });

  assert.deepEqual(calls, ['ISSUE-001']);
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