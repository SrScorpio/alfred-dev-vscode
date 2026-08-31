/** Installs the opt-in pre-commit guard; it does not intercept editor writes. */
import { promises as fs } from 'fs';
import * as path from 'path';

export const SECRET_HOOK_MARKER = '# alfred-dev-secret-guard';

export const SECRET_HOOK_SCRIPT = `const fs = require('node:fs');
const cp = require('node:child_process');
const files = cp.execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { encoding: 'utf8' }).trim().split(/\\r?\\n/).filter(Boolean);
const patterns = [/gh[pousr]_[A-Za-z0-9]{20,}/, /(?:api[_-]?key|access[_-]?key|secret|token|password)\\s*[:=]\\s*["']?[A-Za-z0-9_./+=-]{12,}/i];
const findings = files.flatMap((file) => { const text = fs.readFileSync(file, 'utf8'); return patterns.some((pattern) => pattern.test(text)) ? [file] : []; });
if (findings.length) { console.error('Alfred Dev Secret Guard: posibles secretos en: ' + findings.join(', ')); process.exit(1); }
`;

/** Installs a managed hook in an existing non-bare repository. */
export async function installSecretHook(workspaceRoot: string): Promise<void> {
  const gitPath = path.join(workspaceRoot, '.git');
  const gitStats = await fs.stat(gitPath).catch(() => undefined);
  if (!gitStats?.isDirectory()) {
    throw new Error('No se encontró un directorio .git compatible para instalar el hook');
  }

  const hooksPath = path.join(gitPath, 'hooks');
  const scriptPath = path.join(hooksPath, 'alfred-secret-guard.js');
  const preCommitPath = path.join(hooksPath, 'pre-commit');
  await fs.mkdir(hooksPath, { recursive: true });
  await fs.writeFile(scriptPath, SECRET_HOOK_SCRIPT, { encoding: 'utf8', mode: 0o700 });
  const current = await fs.readFile(preCommitPath, 'utf8').catch(() => '#!/bin/sh\n');
  if (!current.includes(SECRET_HOOK_MARKER)) {
    await fs.writeFile(preCommitPath, `${current.trimEnd()}\n${SECRET_HOOK_MARKER}\nnode "$(dirname "$0")/alfred-secret-guard.js"\n`, { mode: 0o700 });
  }
}