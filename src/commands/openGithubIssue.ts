/**
 * Abre una issue de GitHub en el navegador validando el protocolo.
 *
 * Acepta `vscode.Uri` o un string `http`/`https`. Rechaza `javascript:`,
 * `file:` y cualquier otro esquema. El adaptador `openExternal` es inyectable
 * para tests; el comando de paleta usa `vscode.env.openExternal`.
 *
 * @module commands/openGithubIssue
 */

export type ExternalUri = {
  scheme: string;
  toString(): string;
};

export type OpenExternal = (uri: ExternalUri) => PromiseLike<boolean>;

const INVALID_ISSUE_URL = 'Solo se pueden abrir issues con una URL http o https válida';

/**
 * Valida el destino y lo abre con el adaptador inyectado.
 *
 * @param target Uri o string de la issue.
 * @param openExternal Adaptador de `vscode.env.openExternal`.
 * @returns Promise que se resuelve cuando el host abre el destino.
 */
export async function openGithubIssue(
  target: ExternalUri | string | undefined,
  openExternal: OpenExternal,
): Promise<void> {
  await openExternal(resolveHttpUri(target));
}

function resolveHttpUri(target: ExternalUri | string | undefined): ExternalUri {
  if (typeof target === 'string') {
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw new Error(INVALID_ISSUE_URL);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(INVALID_ISSUE_URL);
    }

    return {
      scheme: parsed.protocol.replace(/:$/, ''),
      toString() {
        return target;
      },
    };
  }

  if (!target || (target.scheme !== 'https' && target.scheme !== 'http')) {
    throw new Error(INVALID_ISSUE_URL);
  }

  return target;
}
