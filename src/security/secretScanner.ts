/** Pure secret scanner shared by diagnostics, memory and the optional hook. */
export interface SecretFinding {
  type: 'github-token' | 'openai-token' | 'bearer-token' | 'private-key' | 'aws-credential' | 'generic-secret';
  line: number;
  redacted: string;
}

const GITHUB_TOKEN = /gh[pousr]_[A-Za-z0-9]{20,}/g;
const OPENAI_TOKEN = /\bsk-[A-Za-z0-9_-]{20,}\b/g;
const BEARER_TOKEN = /(Authorization\s*:\s*Bearer\s+)[^\s"']+/gi;
const AWS_ACCESS_KEY = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;
const AWS_SECRET_KEY = /((?:AWS_)?SECRET_ACCESS_KEY\s*[:=]\s*["']?)[A-Za-z0-9/+=]{40}/gi;
const GENERIC_SECRET = /((?:api[_-]?key|access[_-]?key|secret|token|password)\s*[:=]\s*["']?)([A-Za-z0-9_./+=-]{12,})/gi;
const PEM_PRIVATE_KEY = /-----BEGIN ([A-Z0-9 ]*PRIVATE KEY)-----[\s\S]*?-----END \1-----/g;

function redactLine(line: string): string {
  return line
    .replace(GITHUB_TOKEN, '[REDACTED]')
    .replace(OPENAI_TOKEN, '[REDACTED]')
    .replace(BEARER_TOKEN, '$1[REDACTED]')
    .replace(AWS_ACCESS_KEY, '[REDACTED]')
    .replace(AWS_SECRET_KEY, '$1[REDACTED]')
    .replace(GENERIC_SECRET, '$1[REDACTED]');
}

/** Finds likely credentials without returning their original values. */
export function scanSecrets(content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const findingType = detectSecretType(line);
    if (findingType) {
      findings.push({
        type: findingType,
        line: index + 1,
        redacted: redactLine(line),
      });
    }
  }

  return findings;
}

/** Replaces likely credentials in text before local persistence. */
export function sanitizeSecrets(content: string): string {
  return content
    .replace(PEM_PRIVATE_KEY, '[REDACTED PEM PRIVATE KEY]')
    .split(/\r?\n/)
    .map(redactLine)
    .join('\n');
}

function detectSecretType(line: string): SecretFinding['type'] | undefined {
  const detectors: Array<[SecretFinding['type'], RegExp]> = [
    ['github-token', GITHUB_TOKEN],
    ['openai-token', OPENAI_TOKEN],
    ['bearer-token', BEARER_TOKEN],
    ['private-key', /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/],
    ['aws-credential', AWS_ACCESS_KEY],
    ['aws-credential', AWS_SECRET_KEY],
    ['generic-secret', GENERIC_SECRET],
  ];
  for (const [type, pattern] of detectors) {
    const matches = pattern.test(line);
    pattern.lastIndex = 0;
    if (matches) return type;
  }
  return undefined;
}