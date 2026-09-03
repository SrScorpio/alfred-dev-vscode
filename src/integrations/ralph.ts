/** Optional, command-only bridge to Ralph Suite. */
import { promises as fs } from 'fs';
import * as path from 'path';

export type RalphStatus = 'todo' | 'inprogress' | 'blocked' | 'completed';
export interface RalphTask {
  id: string;
  status: RalphStatus;
  route: string;
}
export interface RalphConfig {
  tasks: RalphTask[];
}

const MAX_RALPH_CONFIG_SIZE = 64 * 1024;
const MAX_RALPH_TASKS = 200;
const TASK_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const RALPH_SUITE_EXTENSION_ID = 'ralph-suite.ralph-suite';
const ALFRED_STATUSES = {
  backlog: 'todo',
  'in-progress': 'inprogress',
  blocked: 'blocked',
  closed: 'completed',
} as const satisfies Record<string, RalphStatus>;
export type AlfredStatus = keyof typeof ALFRED_STATUSES;
export type RalphSyncResult = { synced: true } | {
  synced: false;
  reason: 'unavailable' | 'invalid-issue' | 'command-failed';
};

/** Converts the shared Alfred/GitHub status vocabulary to Ralph status. */
export function mapAlfredStatus(status: keyof typeof ALFRED_STATUSES): RalphStatus {
  return ALFRED_STATUSES[status];
}

/** Extracts bounded ISSUE-123 references without exposing issue bodies to execution. */
export function extractIssueIds(content: string): number[] {
  return [...content.matchAll(/\bISSUE-([1-9]\d{0,5})\b/g)].map((match) => Number(match[1]));
}

function isValidTask(value: unknown): value is RalphTask {
  return typeof value === 'object' && value !== null
    && typeof (value as RalphTask).id === 'string' && TASK_ID.test((value as RalphTask).id)
    && ['todo', 'inprogress', 'blocked', 'completed'].includes((value as RalphTask).status)
    && typeof (value as RalphTask).route === 'string';
}

function isInside(rootPath: string, candidatePath: string): boolean {
  const root = path.resolve(rootPath) + path.sep;
  return path.resolve(candidatePath).startsWith(root);
}

/** Reads a small, trusted-workspace Ralph config with strict path validation. */
export async function readRalphConfig(workspaceRoot: string, isTrusted: boolean): Promise<RalphConfig> {
  if (!isTrusted) throw new Error('Ralph requiere un workspace de confianza');
  const configPath = path.join(workspaceRoot, '.ralph', 'config.json');
  try {
    const stats = await fs.stat(configPath);
    if (stats.size > MAX_RALPH_CONFIG_SIZE) throw new Error('configuración Ralph no válida: supera 64 KiB');
    const parsed: unknown = JSON.parse(await fs.readFile(configPath, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as RalphConfig).tasks)
      || (parsed as RalphConfig).tasks.length > MAX_RALPH_TASKS
      || !(parsed as RalphConfig).tasks.every(isValidTask)) {
      throw new Error('configuración Ralph no válida');
    }
    for (const task of (parsed as RalphConfig).tasks) {
      if (path.isAbsolute(task.route) || task.route.split(/[\\/]/).includes('..')
        || !task.route || !isInside(workspaceRoot, path.join(workspaceRoot, task.route))) {
        throw new Error('configuración Ralph no válida: ruta fuera del workspace');
      }
    }
    return parsed as RalphConfig;
  } catch (error: unknown) {
    if (isFileNotFoundError(error)) return { tasks: [] };
    if (error instanceof SyntaxError) throw new Error('configuración Ralph no válida: JSON inválido');
    throw error;
  }
}

export interface RalphExtension {
  isActive: boolean;
  commands?: string[];
}
type ExtensionLookup = () => RalphExtension | undefined;
type CommandExecutor = (command: string, ...args: unknown[]) => PromiseLike<unknown>;

/** Resolves only the canonical Ralph Suite extension, never command lookalikes. */
export function resolveRalphSuiteExtension(
  getExtension: (extensionId: string) => RalphExtension | undefined,
): RalphExtension | undefined {
  return getExtension(RALPH_SUITE_EXTENSION_ID);
}

/** Provides feature-detected wrappers; absence of Ralph never blocks Alfred. */
export class RalphBridge {
  constructor(private readonly lookup: ExtensionLookup, private readonly execute: CommandExecutor) {}

  async openKanban(): Promise<void> { await this.run('ralph-suite.openKanban'); }
  async runTask(taskId: string): Promise<void> { validateTaskId(taskId); await this.run('ralph-suite.runTask', taskId); }
  async startRunner(): Promise<void> { await this.run('ralph-suite.startRunner'); }
  async stopRunner(): Promise<void> { await this.run('ralph-suite.stopRunner'); }

  async syncIssue(issueId: number, status: RalphStatus): Promise<RalphSyncResult> {
    const extension = this.lookup();
    if (!extension?.isActive || !extension.commands?.includes('ralph-suite.syncIssue')) {
      return { synced: false, reason: 'unavailable' };
    }
    if (!Number.isInteger(issueId) || issueId < 1 || issueId > 999999) {
      return { synced: false, reason: 'invalid-issue' };
    }
    try {
      await this.execute('ralph-suite.syncIssue', issueId, status);
      return { synced: true };
    } catch {
      return { synced: false, reason: 'command-failed' };
    }
  }

  private async run(command: string, ...args: unknown[]): Promise<void> {
    const extension = this.lookup();
    if (!extension?.isActive) throw new Error('Ralph Suite no está instalada o activa; instala la extensión para usar esta acción');
    if (!extension.commands?.includes(command)) {
      throw new Error(`Ralph Suite no anuncia la capacidad ${command}`);
    }
    try {
      await this.execute(command, ...args);
    } catch {
      throw new Error(`No se pudo ejecutar ${command}; comprueba que Ralph Suite esté actualizada`);
    }
  }
}

interface SyncIssueCommandOptions {
  isTrusted: boolean;
  promptIssueId(): Promise<string | undefined>;
  promptStatus(): Promise<AlfredStatus | undefined>;
  syncIssue(issueId: number, status: RalphStatus): Promise<RalphSyncResult>;
  showInformation(message: string): void;
  showError(message: string): void;
}

/** Synchronizes only a user-selected GitHub issue number and status, never remote content. */
export async function runSyncIssueCommand(options: SyncIssueCommandOptions): Promise<void> {
  if (!options.isTrusted) {
    options.showError('La sincronización Ralph requiere un workspace de confianza.');
    return;
  }
  const issueInput = await options.promptIssueId();
  if (issueInput === undefined) return;
  if (!/^[1-9]\d{0,5}$/.test(issueInput)) {
    options.showError('Introduce un número de issue GitHub entre 1 y 999999.');
    return;
  }
  const status = await options.promptStatus();
  if (!status) return;
  const issueId = Number(issueInput);
  const result = await options.syncIssue(issueId, mapAlfredStatus(status));
  if (result.synced) {
    options.showInformation(`Issue #${issueId} sincronizada con Ralph desde el estado GitHub seleccionado.`);
    return;
  }
  const errors: Record<Exclude<RalphSyncResult, { synced: true }>['reason'], string> = {
    unavailable: 'Ralph Suite no está disponible; instala o activa Ralph Suite y vuelve a intentarlo.',
    'invalid-issue': 'El número de issue GitHub no es válido.',
    'command-failed': 'Ralph Suite rechazó la sincronización; comprueba que expone ralph-suite.syncIssue y está actualizada.',
  };
  options.showError(errors[result.reason]);
}

function validateTaskId(taskId: string): void {
  if (!TASK_ID.test(taskId)) throw new Error('El ID de tarea Ralph no es válido');
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

interface TrustedRalphActionOptions {
  isTrusted: boolean;
  action(): Promise<void>;
  showError(message: string): void;
}

interface RalphTaskCommandOptions {
  isTrusted: boolean;
  promptTaskId(): Promise<string | undefined>;
  runTask(taskId: string): Promise<void>;
  showError(message: string): void;
}

/** Requests a task only after the workspace trust gate has passed. */
export async function runRalphTaskCommand(options: RalphTaskCommandOptions): Promise<void> {
  if (!options.isTrusted) {
    options.showError('Las acciones Ralph requieren un workspace de confianza.');
    return;
  }
  const taskId = await options.promptTaskId();
  if (!taskId) return;
  try {
    validateTaskId(taskId);
    await options.runTask(taskId);
  } catch (error: unknown) {
    options.showError(error instanceof Error ? error.message : 'No se pudo ejecutar la tarea Ralph.');
  }
}

/** Blocks Ralph operations that can mutate or execute workspace state in Restricted Mode. */
export async function runTrustedRalphAction(options: TrustedRalphActionOptions): Promise<void> {
  if (!options.isTrusted) {
    options.showError('Las acciones Ralph requieren un workspace de confianza.');
    return;
  }
  try {
    await options.action();
  } catch (error: unknown) {
    options.showError(error instanceof Error ? error.message : 'No se pudo ejecutar la acción Ralph.');
  }
}