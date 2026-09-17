/**
 * Lectura pública de issues abiertas del remoto GitHub del workspace.
 *
 * Parsea `origin`, consulta la API sin token y no escribe `status.md`.
 * El fetch HTTP y `git config` son inyectables para tests.
 *
 * @module providers/githubRemote
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { MAX_STATUS_FIELD_LENGTH } from './parseStatus';

const execFileAsync = promisify(execFile);
const GITHUB_ISSUES_USER_AGENT = 'alfred-dev-vscode';
const OPEN_ISSUES_PER_PAGE = 20;
const ISSUES_READ_ERROR = 'No se pudieron leer issues de GitHub';
const PRIVATE_REPO_ERROR = `${ISSUES_READ_ERROR}: repo no público o sin permiso`;

export interface GithubRepoRef {
  owner: string;
  repo: string;
}

export interface GithubIssue {
  number: number;
  title: string;
  htmlUrl: string;
  state: string;
}

export interface GitHubIssuesHttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type GitHubIssuesHttpFetch = (
  url: string,
  options: { headers: Record<string, string> },
) => Promise<GitHubIssuesHttpResponse>;

export type ExecGit = (args: string[], options: { cwd: string }) => Promise<string>;

export type FetchOpenIssuesFn = (repo: GithubRepoRef) => Promise<GithubIssue[]>;

export type WorkspaceGithubIssuesResult =
  | { kind: 'untrusted' }
  | { kind: 'ok'; issues: GithubIssue[] }
  | { kind: 'error'; message: string };

export interface GithubIssueTreeEntry {
  label: string;
  icon?: string;
  command?: {
    command: string;
    title: string;
    arguments: string[];
  };
}

export interface WorkspaceGithubIssuesDeps {
  isTrusted: boolean;
  execGit?: ExecGit;
  fetchOpenIssues?: FetchOpenIssuesFn;
}

/**
 * Extrae owner/repo de un `origin` HTTPS o SSH de github.com.
 *
 * @param url Valor de `remote.origin.url`.
 * @returns Referencia del repositorio, o `undefined` si no es GitHub.
 */
export function parseOriginUrl(url: string): GithubRepoRef | undefined {
  const trimmed = url.trim();
  const match = trimmed.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/i,
  );
  if (!match) {
    return undefined;
  }

  return { owner: match[1], repo: match[2] };
}

function truncateField(value: string): string {
  if (value.length <= MAX_STATUS_FIELD_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STATUS_FIELD_LENGTH - 3)}...`;
}

/**
 * Lista issues abiertas vía API pública de GitHub.
 *
 * @param repo Propietario y nombre del repositorio.
 * @param httpFetch Adaptador HTTP; por defecto `fetch` global.
 * @returns Issues sin pull requests, títulos truncados, tope de 20.
 */
export async function fetchOpenIssues(
  repo: GithubRepoRef,
  httpFetch: GitHubIssuesHttpFetch = fetch as GitHubIssuesHttpFetch,
): Promise<GithubIssue[]> {
  const response = await httpFetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues?state=open&per_page=${OPEN_ISSUES_PER_PAGE}`,
    {
      headers: {
        'User-Agent': GITHUB_ISSUES_USER_AGENT,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (response.status === 404) {
    throw new Error(PRIVATE_REPO_ERROR);
  }

  if (!response.ok) {
    throw new Error(`${ISSUES_READ_ERROR} (HTTP ${response.status})`);
  }

  const body = await response.json();
  if (!Array.isArray(body)) {
    throw new Error(`${ISSUES_READ_ERROR}: respuesta inesperada`);
  }

  const issues: GithubIssue[] = [];
  for (const item of body) {
    if (!item || typeof item !== 'object' || 'pull_request' in item) {
      continue;
    }

    const candidate = item as {
      number?: unknown;
      title?: unknown;
      html_url?: unknown;
      state?: unknown;
    };
    if (
      typeof candidate.number !== 'number'
      || typeof candidate.title !== 'string'
      || typeof candidate.html_url !== 'string'
      || typeof candidate.state !== 'string'
    ) {
      continue;
    }

    issues.push({
      number: candidate.number,
      title: truncateField(candidate.title),
      htmlUrl: candidate.html_url,
      state: candidate.state,
    });

    if (issues.length === OPEN_ISSUES_PER_PAGE) {
      break;
    }
  }

  return issues;
}

async function defaultExecGit(args: string[], options: { cwd: string }): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  return stdout;
}

/**
 * Obtiene las issues abiertas del `origin` GitHub del workspace.
 *
 * No consulta la red en Restricted Mode. No usa token ni `gh`.
 *
 * @param workspaceRoot Raíz del primer workspace.
 * @param deps Trust y adapters inyectables.
 * @returns Resultado discriminado para el TreeView.
 */
export async function listWorkspaceGithubIssues(
  workspaceRoot: string,
  deps: WorkspaceGithubIssuesDeps,
): Promise<WorkspaceGithubIssuesResult> {
  if (!deps.isTrusted) {
    return { kind: 'untrusted' };
  }

  const execGit = deps.execGit ?? defaultExecGit;
  const loadIssues = deps.fetchOpenIssues ?? fetchOpenIssues;

  let origin: string;
  try {
    origin = await execGit(['config', '--get', 'remote.origin.url'], { cwd: workspaceRoot });
  } catch {
    return { kind: 'error', message: ISSUES_READ_ERROR };
  }

  const repo = parseOriginUrl(origin);
  if (!repo) {
    return { kind: 'error', message: ISSUES_READ_ERROR };
  }

  try {
    const issues = await loadIssues(repo);
    return { kind: 'ok', issues };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes(ISSUES_READ_ERROR)) {
      return { kind: 'error', message };
    }

    return { kind: 'error', message: ISSUES_READ_ERROR };
  }
}

/**
 * Convierte el resultado de issues en entradas planas del TreeView.
 *
 * @param result Resultado de `listWorkspaceGithubIssues`.
 * @returns Cabecera e items clicables, un error, o nada si no hay trust.
 */
export function githubIssueTreeEntries(result: WorkspaceGithubIssuesResult): GithubIssueTreeEntry[] {
  if (result.kind === 'untrusted') {
    return [];
  }

  if (result.kind === 'error') {
    return [{ label: result.message, icon: 'warning' }];
  }

  const issues = result.issues.slice(0, OPEN_ISSUES_PER_PAGE);
  return [
    { label: 'Issues abiertas', icon: 'issues' },
    ...issues.map((issue) => ({
      label: `#${issue.number} ${issue.title}`,
      icon: 'circle-outline',
      command: {
        command: 'vscode.open',
        title: 'Abrir issue',
        arguments: [issue.htmlUrl],
      },
    })),
  ];
}
