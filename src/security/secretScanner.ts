/** Pure secret scanner shared by diagnostics, memory and the optional hook. */
export interface SecretFinding {
  type: 'github-token' | 'generic-secret';
  line: number;
  redacted: string;
}

const GITHUB_TOKEN = /gh[pousr]_[A-Za-z0-9]{20,}/g;
const GENERIC_SECRET = /((?:api[_-]?key|access[_-]?key|secret|token|password)\s*[:=]\s*["']?)([A-Za-z0-9_./+=-]{12,})/gi;

function redactLine(line: string): string {
  return line
    .replace(GITHUB_TOKEN, '[REDACTED]')
    .replace(GENERIC_SECRET, '$1[REDACTED]');
}

/** Finds likely credentials without returning their original values. */
export function scanSecrets(content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const hasGithubToken = GITHUB_TOKEN.test(line);
    const hasGenericSecret = GENERIC_SECRET.test(line);
    if (hasGithubToken || hasGenericSecret) {
      findings.push({
        type: hasGithubToken ? 'github-token' : 'generic-secret',
        line: index + 1,
        redacted: redactLine(line),
      });
    }
    GITHUB_TOKEN.lastIndex = 0;
    GENERIC_SECRET.lastIndex = 0;
  }

  return findings;
}

/** Replaces likely credentials in text before local persistence. */
export function sanitizeSecrets(content: string): string {
  return content.split(/\r?\n/).map(redactLine).join('\n');
}