/** Secure HTML renderer for the local encrypted memory explorer. */
import type { MemoryListEntry } from './memoryStore';

export type MemoryUiEntry = MemoryListEntry;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] ?? character));
}

function filterEntries(entries: MemoryUiEntry[], query?: string): MemoryUiEntry[] {
  const normalizedQuery = query?.trim().toLocaleLowerCase() ?? '';
  if (!normalizedQuery) return entries;
  return entries.filter((entry) => entry.key.toLocaleLowerCase().includes(normalizedQuery));
}

/** Renders a self-contained Webview with a strict CSP and no memory values. */
export function renderMemoryUiHtml(entries: MemoryUiEntry[], nonce: string, query?: string): string {
  const visibleEntries = filterEntries(entries, query);
  const rows = visibleEntries.map((entry) => {
    const encodedKey = encodeURIComponent(entry.key);
    return [
      '<li class="entry">',
      `<strong>${escapeHtml(entry.key)}</strong>`,
      `<time>${escapeHtml(entry.updatedAt)}</time>`,
      `<button type="button" data-action="reveal" data-key="${escapeHtml(encodedKey)}">Ver</button>`,
      `<button type="button" data-action="delete" data-key="${escapeHtml(encodedKey)}">Borrar</button>`,
      '</li>',
    ].join('');
  }).join('');
  const empty = visibleEntries.length === 0
    ? `<p>${query?.trim() ? 'No hay coincidencias.' : 'No hay claves en la memoria local.'}</p>`
    : '';
  const escapedNonce = escapeHtml(nonce);
  const escapedQuery = escapeHtml(query ?? '');
  return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${escapedNonce}'; script-src 'nonce-${escapedNonce}'; img-src 'none';"><style nonce="${escapedNonce}">body{font-family:Verdana,sans-serif;padding:24px;color:var(--vscode-foreground)}main{display:grid;gap:12px;max-width:720px}form{display:flex;gap:8px}input{flex:1;padding:8px}ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}.entry{display:grid;gap:6px;padding:12px;border:1px solid var(--vscode-panel-border);background:var(--vscode-editor-background)}time{opacity:.8}button{justify-self:start}</style></head><body><main><form><input type="search" name="query" value="${escapedQuery}" placeholder="Buscar claves"><button type="submit">Buscar</button></form>${empty}<ul>${rows}</ul></main><script nonce="${escapedNonce}">const api=acquireVsCodeApi();document.querySelector('form')?.addEventListener('submit',(event)=>{event.preventDefault();api.postMessage({type:'search',query:document.querySelector('input')?.value??''});});document.querySelectorAll('[data-action]').forEach((button)=>button.addEventListener('click',()=>api.postMessage({type:button.dataset.action,key:decodeURIComponent(button.dataset.key??'')})));</script></body></html>`;
}
