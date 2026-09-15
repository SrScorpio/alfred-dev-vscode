/**
 * Comprueba si hay un GitHub Release más reciente que la versión instalada.
 *
 * Usa la API pública de GitHub (no `gh`, no Marketplace). El fetch HTTP es
 * inyectable para tests.
 *
 * @module commands/checkUpdate
 */

export const ALFRED_DEV_GITHUB_OWNER = 'SrScorpio';
export const ALFRED_DEV_GITHUB_REPO = 'alfred-dev-vscode';
export const ALFRED_DEV_RELEASES_PAGE = 'https://github.com/SrScorpio/alfred-dev-vscode/releases';

export interface LatestRelease {
  version: string;
  htmlUrl: string;
}

export interface GitHubReleaseHttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type GitHubReleaseHttpFetch = (
  url: string,
  options: { headers: Record<string, string> },
) => Promise<GitHubReleaseHttpResponse>;

export type FetchLatestRelease = (repo: { owner: string; repo: string }) => Promise<LatestRelease | null>;

export interface UpdateCheckResult {
  message: string;
  isError?: boolean;
}

function stripVersionPrefix(value: string): string {
  return value.trim().replace(/^v/i, '');
}

/**
 * Consulta el latest release del repositorio vía API de GitHub.
 *
 * @param repo Propietario y nombre del repositorio.
 * @param httpFetch Adaptador HTTP; por defecto `fetch` global.
 * @returns Versión (sin `v`) y URL, o `null` si no hay releases (404).
 */
export async function fetchLatestRelease(
  repo: { owner: string; repo: string },
  httpFetch: GitHubReleaseHttpFetch = fetch as GitHubReleaseHttpFetch,
): Promise<LatestRelease | null> {
  const response = await httpFetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`,
    {
      headers: {
        'User-Agent': 'alfred-dev-vscode',
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub Releases respondió ${response.status}`);
  }

  const body = await response.json() as { tag_name?: unknown; html_url?: unknown };
  if (typeof body.tag_name !== 'string' || typeof body.html_url !== 'string') {
    throw new Error('La respuesta de GitHub Releases no incluye tag_name o html_url');
  }

  return {
    version: stripVersionPrefix(body.tag_name),
    htmlUrl: body.html_url,
  };
}

/**
 * Compara la versión local con el latest GitHub Release.
 *
 * @param options Versión instalada y adapter de consulta.
 * @returns Mensaje accionable para la persona usuaria.
 */
export async function checkForUpdate(options: {
  currentVersion: string;
  fetchLatestRelease: FetchLatestRelease;
  owner?: string;
  repo?: string;
}): Promise<UpdateCheckResult> {
  const currentVersion = stripVersionPrefix(options.currentVersion);
  const owner = options.owner ?? ALFRED_DEV_GITHUB_OWNER;
  const repo = options.repo ?? ALFRED_DEV_GITHUB_REPO;

  try {
    const latest = await options.fetchLatestRelease({ owner, repo });
    if (!latest) {
      return {
        message: `No hay GitHub Releases publicados todavía. Consulta ${ALFRED_DEV_RELEASES_PAGE} más tarde.`,
        isError: true,
      };
    }

    const latestVersion = stripVersionPrefix(latest.version);
    if (latestVersion === currentVersion) {
      return {
        message: `Alfred Dev está al día (${currentVersion}).`,
      };
    }

    return {
      message: `Hay ${latestVersion}, local ${currentVersion}: ${latest.htmlUrl}`,
    };
  } catch {
    return {
      message: `No se pudo consultar GitHub Releases (fallo de red). Comprueba la conexión y reintenta en ${ALFRED_DEV_RELEASES_PAGE}.`,
      isError: true,
    };
  }
}
