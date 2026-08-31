/** Secure style proposal catalog and Webview HTML renderer. */
import { promises as fs } from 'fs';
import * as path from 'path';

export interface StyleOption {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_STYLE_OPTIONS: StyleOption[] = [
  { id: 'quiet-ops', name: 'Quiet Operations', description: 'Denso, sobrio y orientado a flujos de trabajo repetibles.' },
  { id: 'editorial-signal', name: 'Editorial Signal', description: 'Tipografia expresiva y jerarquia clara para decisiones visibles.' },
  { id: 'field-notes', name: 'Field Notes', description: 'Textura documental, contraste util y ritmo de exploracion.' },
];

const MAX_STYLE_OPTIONS_SIZE = 32 * 1024;
const OPTION_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;

function isStyleOption(value: unknown): value is StyleOption {
  return typeof value === 'object' && value !== null
    && typeof (value as StyleOption).id === 'string' && OPTION_ID.test((value as StyleOption).id)
    && typeof (value as StyleOption).name === 'string' && (value as StyleOption).name.length <= 120
    && typeof (value as StyleOption).description === 'string' && (value as StyleOption).description.length <= 240;
}

/** Loads at most three validated local proposals, falling back safely. */
export async function loadStyleOptions(workspaceRoot: string): Promise<StyleOption[]> {
  const optionsPath = path.join(workspaceRoot, '.style-options', 'style-options.json');
  try {
    const stats = await fs.stat(optionsPath);
    if (stats.size > MAX_STYLE_OPTIONS_SIZE) throw new Error('style-options.json supera 32 KiB');
    const parsed: unknown = JSON.parse(await fs.readFile(optionsPath, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('style-options.json no es una lista');
    const options = parsed.filter(isStyleOption).slice(0, 3);
    return options.length === 3 ? options : DEFAULT_STYLE_OPTIONS;
  } catch {
    return DEFAULT_STYLE_OPTIONS;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
}

/** Renders a self-contained Webview with a strict CSP and no remote assets. */
export function renderGalleryHtml(options: StyleOption[], nonce: string): string {
  const cards = options.map((option) => `<button class="proposal" data-id="${escapeHtml(option.id)}"><strong>${escapeHtml(option.name)}</strong><span>${escapeHtml(option.description)}</span></button>`).join('');
  return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${escapeHtml(nonce)}'; script-src 'nonce-${escapeHtml(nonce)}'; img-src 'none';"><style nonce="${escapeHtml(nonce)}">body{font-family:Verdana,sans-serif;padding:24px;color:var(--vscode-foreground)}main{display:grid;gap:12px;max-width:720px}.proposal{display:grid;gap:8px;text-align:left;padding:18px;border:1px solid var(--vscode-panel-border);background:var(--vscode-editor-background);color:inherit;cursor:pointer}.proposal:hover{border-color:var(--vscode-focusBorder)}span{opacity:.8}</style></head><body><main>${cards}</main><script nonce="${escapeHtml(nonce)}">document.querySelectorAll('.proposal').forEach((button) => button.addEventListener('click', () => acquireVsCodeApi().postMessage({type:'select', id:button.dataset.id})));</script></body></html>`;
}

/** Removes control/newline characters before persisting a confirmed choice. */
export function styleDirectionMarkdown(option: StyleOption): string {
  const clean = (value: string) => value.replace(/[\r\n]/g, ' ').trim();
  return `# Dirección de estilo\n\n**Propuesta:** ${clean(option.name)}\n\n${clean(option.description)}\n\n> Seleccionada explícitamente desde Alfred Dev.\n`;
}

/** Persists a confirmed choice using a temporary file and rename. */
export async function saveStyleDirection(workspaceRoot: string, option: StyleOption): Promise<void> {
  const filePath = path.join(workspaceRoot, 'docs', 'style-direction.md');
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(temporaryPath, styleDirectionMarkdown(option), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporaryPath, filePath);
}