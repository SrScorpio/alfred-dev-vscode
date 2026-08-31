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
const ALFRED_STATUSES = {
  backlog: 'todo',
  'in-progress': 'inprogress',
  blocked: 'blocked',
  closed: 'completed',
} as const satisfies Record<string, RalphStatus>;

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

interface RalphExtension {
  isActive: boolean;
}
type ExtensionLookup = () => RalphExtension | undefined;
type CommandExecutor = (command: string, ...args: unknown[]) => PromiseLike<unknown>;

/** Provides feature-detected wrappers; absence of Ralph never blocks Alfred. */
export class RalphBridge {
  constructor(private readonly lookup: ExtensionLookup, private readonly execute: CommandExecutor) {}

  async openKanban(): Promise<void> { await this.run('ralph-suite.openKanban'); }
  async runTask(taskId: string): Promise<void> { validateTaskId(taskId); await this.run('ralph-suite.runTask', taskId); }
  async startRunner(): Promise<void> { await this.run('ralph-suite.startRunner'); }
  async stopRunner(): Promise<void> { await this.run('ralph-suite.stopRunner'); }

  async syncIssue(issueId: number, status: RalphStatus): Promise<{ synced: boolean }> {
    if (!this.lookup()?.isActive) return { synced: false };
    if (!Number.isInteger(issueId) || issueId < 1 || issueId > 999999) return { synced: false };
    try {
      await this.execute('ralph-suite.syncIssue', issueId, status);
      return { synced: true };
    } catch {
      return { synced: false };
    }
  }

  private async run(command: string, ...args: unknown[]): Promise<void> {
    if (!this.lookup()?.isActive) throw new Error('Ralph Suite no está instalada o activa; instala la extensión para usar esta acción');
    try {
      await this.execute(command, ...args);
    } catch {
      throw new Error(`No se pudo ejecutar ${command}; comprueba que Ralph Suite esté actualizada`);
    }
  }
}

function validateTaskId(taskId: string): void {
  if (!TASK_ID.test(taskId)) throw new Error('El ID de tarea Ralph no es válido');
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}