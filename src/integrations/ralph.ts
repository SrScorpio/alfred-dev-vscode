/** Optional, command-only bridge to Ralph Suite. */
import { promises as fs } from 'fs';
import * as path from 'path';

export type RalphStatus = 'todo' | 'inprogress' | 'blocked' | 'completed';
export interface RalphPrdIssue {
  id: string;
  status: RalphStatus;
}
export interface RalphPrd {
  issues: RalphPrdIssue[];
}

const MAX_RALPH_PRD_SIZE = 64 * 1024;
const MAX_RALPH_ISSUES = 200;
/** IDs that survive Ralph `safeTaskId` (letters, digits, `_`, `.`, `-`, max 80). */
export const RALPH_TASK_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/;
export const RALPH_SUITE_EXTENSION_ID = 'ralph-suite.ralph-suite';
export const RALPH_PALETTE_CONTEXTS = [
  'alfred-dev.ralph.openKanban',
  'alfred-dev.ralph.runTask',
  'alfred-dev.ralph.startRunner',
  'alfred-dev.ralph.stopRunner',
  'alfred-dev.ralph.syncIssue',
] as const;
const RALPH_COMMAND_BY_CONTEXT: Record<(typeof RALPH_PALETTE_CONTEXTS)[number], string> = {
  'alfred-dev.ralph.openKanban': 'ralph-suite.openKanban',
  'alfred-dev.ralph.runTask': 'ralph-suite.runTask',
  'alfred-dev.ralph.startRunner': 'ralph-suite.startRunner',
  'alfred-dev.ralph.stopRunner': 'ralph-suite.stopRunner',
  'alfred-dev.ralph.syncIssue': 'ralph-suite.syncIssue',
};
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

function isValidIssue(value: unknown): value is RalphPrdIssue {
  return typeof value === 'object' && value !== null
    && typeof (value as RalphPrdIssue).id === 'string' && RALPH_TASK_ID.test((value as RalphPrdIssue).id)
    && ['todo', 'inprogress', 'blocked', 'completed'].includes((value as RalphPrdIssue).status);
}

function isInside(rootPath: string, candidatePath: string): boolean {
  const root = path.resolve(rootPath);
  const resolved = path.resolve(candidatePath);
  return resolved === root || resolved.startsWith(root + path.sep);
}

/** Resolves `ralph-suite.prdPath` inside the folder; traversal falls back to `prd.json`. */
export function resolveRalphPrdPath(workspaceRoot: string, configuredPath = 'prd.json'): string {
  const root = path.resolve(workspaceRoot);
  const target = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(root, configuredPath || 'prd.json');
  const resolved = path.resolve(target);
  if (!isInside(root, resolved)) return path.join(root, 'prd.json');
  return resolved;
}

/** Prefers the multi-root folder that actually contains the PRD; otherwise folder[0]. */
export function findRalphWorkspaceRoot(
  folders: readonly string[],
  configuredPath = 'prd.json',
  hasPrd: (prdPath: string) => boolean = () => false,
): string | undefined {
  if (folders.length === 0) return undefined;
  for (const folder of folders) {
    if (hasPrd(resolveRalphPrdPath(folder, configuredPath))) return folder;
  }
  return folders[0];
}

/** Palette `when` keys: true only if Ralph is active and announces that exact command. */
export function ralphCommandContexts(
  extension: RalphExtension | undefined,
): Record<(typeof RALPH_PALETTE_CONTEXTS)[number], boolean> {
  const commands = new Set(extension?.isActive ? extension.commands ?? [] : []);
  return {
    'alfred-dev.ralph.openKanban': commands.has(RALPH_COMMAND_BY_CONTEXT['alfred-dev.ralph.openKanban']),
    'alfred-dev.ralph.runTask': commands.has(RALPH_COMMAND_BY_CONTEXT['alfred-dev.ralph.runTask']),
    'alfred-dev.ralph.startRunner': commands.has(RALPH_COMMAND_BY_CONTEXT['alfred-dev.ralph.startRunner']),
    'alfred-dev.ralph.stopRunner': commands.has(RALPH_COMMAND_BY_CONTEXT['alfred-dev.ralph.stopRunner']),
    'alfred-dev.ralph.syncIssue': commands.has(RALPH_COMMAND_BY_CONTEXT['alfred-dev.ralph.syncIssue']),
  };
}

function normalizeRalphStatus(raw: unknown): RalphStatus {
  const status = String(raw ?? 'todo').toLowerCase().trim();
  if (status === 'inprogress' || status === 'in_progress' || status === 'in-progress') return 'inprogress';
  if (status === 'completed' || status === 'done' || status === 'closed') return 'completed';
  if (status === 'blocked') return 'blocked';
  return 'todo';
}

/** Reads a small, trusted-workspace Ralph PRD (`prd.json`), never `.ralph/config.json`. */
export async function readRalphPrd(
  workspaceRoot: string,
  isTrusted: boolean,
  configuredPath = 'prd.json',
): Promise<RalphPrd> {
  if (!isTrusted) throw new Error('Ralph requiere un workspace de confianza');
  const prdPath = resolveRalphPrdPath(workspaceRoot, configuredPath);
  try {
    const stats = await fs.stat(prdPath);
    if (stats.size > MAX_RALPH_PRD_SIZE) throw new Error('prd.json de Ralph no válido: supera 64 KiB');
    const parsed: unknown = JSON.parse(await fs.readFile(prdPath, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null) throw new Error('prd.json de Ralph no válido');
    const rawItems = Array.isArray((parsed as { issues?: unknown }).issues)
      ? (parsed as { issues: unknown[] }).issues
      : Array.isArray((parsed as { userStories?: unknown }).userStories)
        ? (parsed as { userStories: unknown[] }).userStories
        : null;
    if (!rawItems || rawItems.length > MAX_RALPH_ISSUES) {
      throw new Error('prd.json de Ralph no válido');
    }
    const issues = rawItems.map((item) => {
      if (typeof item !== 'object' || item === null) throw new Error('prd.json de Ralph no válido');
      const issue = { id: (item as { id?: unknown }).id, status: normalizeRalphStatus((item as { status?: unknown }).status) };
      if (!isValidIssue(issue)) throw new Error('prd.json de Ralph no válido');
      return issue;
    });
    return { issues };
  } catch (error: unknown) {
    if (isFileNotFoundError(error)) throw new Error('No se encontró prd.json en el workspace');
    if (error instanceof SyntaxError) throw new Error('prd.json de Ralph no válido: JSON inválido');
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
  if (!RALPH_TASK_ID.test(taskId)) throw new Error('El ID de tarea Ralph no es válido');
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
  workspaceRoot?: string;
  prdPath?: string;
  readPrd?(workspaceRoot: string, isTrusted: boolean, configuredPath?: string): Promise<RalphPrd>;
  promptTaskId(issues: RalphPrdIssue[]): Promise<string | undefined>;
  runTask(taskId: string): Promise<void>;
  showError(message: string): void;
}

/** Requests a task only after trust and a valid Ralph PRD have passed. */
export async function runRalphTaskCommand(options: RalphTaskCommandOptions): Promise<void> {
  if (!options.isTrusted) {
    options.showError('Las acciones Ralph requieren un workspace de confianza.');
    return;
  }
  try {
    if (options.readPrd) {
      if (!options.workspaceRoot) {
        options.showError('Abre un workspace para ejecutar una tarea Ralph.');
        return;
      }
      const prd = await options.readPrd(options.workspaceRoot, options.isTrusted, options.prdPath);
      if (prd.issues.length === 0) {
        options.showError('prd.json no tiene issues para ejecutar.');
        return;
      }
      const taskId = await options.promptTaskId(prd.issues);
      if (!taskId) return;
      validateTaskId(taskId);
      if (!prd.issues.some((issue) => issue.id === taskId)) {
        options.showError('El ID de tarea Ralph no está en prd.json.');
        return;
      }
      await options.runTask(taskId);
      return;
    }
    const taskId = await options.promptTaskId([]);
    if (!taskId) return;
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