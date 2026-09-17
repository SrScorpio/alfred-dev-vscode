/** VS Code Webview panel for exploring the opt-in encrypted memory store. */
import * as crypto from 'crypto';
import type * as vscode from 'vscode';
import { sanitizeSecrets } from '../security/secretScanner';
import type { MemoryStore } from './memoryStore';
import { renderMemoryUiHtml } from './memoryUi';

interface MemoryUiWindow {
  createWebviewPanel(
    viewType: string,
    title: string,
    showOptions: number,
    options?: { enableScripts?: boolean; localResourceRoots?: readonly unknown[] },
  ): {
    webview: {
      html: string;
      onDidReceiveMessage(
        listener: (message: unknown) => unknown,
        thisArgs?: unknown,
        disposables?: vscode.Disposable[],
      ): vscode.Disposable;
    };
  };
  showErrorMessage(message: string): unknown;
  showInformationMessage(message: string): unknown;
  showWarningMessage(message: string, ...items: unknown[]): Thenable<string | undefined>;
}

export interface MemoryUiApi {
  window: MemoryUiWindow;
}

export async function openMemoryUi(
  context: Pick<vscode.ExtensionContext, 'subscriptions'>,
  store: Pick<MemoryStore, 'list' | 'get' | 'delete'>,
  isTrusted: boolean,
  isEnabled: boolean,
  ui?: MemoryUiApi,
): Promise<void> {
  const window = ui?.window ?? (require('vscode') as typeof vscode).window;
  if (!isTrusted) {
    window.showErrorMessage('La memoria local requiere un workspace de confianza.');
    return;
  }
  if (!isEnabled) {
    window.showErrorMessage('Activa alfred-dev.memory.enabled para usar la memoria local.');
    return;
  }

  const panel = window.createWebviewPanel(
    'alfredDevMemoryUi',
    'Alfred Dev: Explorar memoria local',
    1,
    { enableScripts: true, localResourceRoots: [] },
  );
  let query = '';
  const render = async (): Promise<void> => {
    const nonce = crypto.randomBytes(16).toString('base64');
    panel.webview.html = renderMemoryUiHtml(await store.list(), nonce, query);
  };
  await render();
  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    try {
      if (isSearchMessage(message)) {
        query = message.query;
        await render();
        return;
      }
      if (isRevealMessage(message)) {
        const value = await store.get(message.key);
        window.showInformationMessage(
          value === undefined
            ? 'No existe una entrada con esa clave.'
            : sanitizeSecrets(value),
        );
        return;
      }
      if (!isDeleteMessage(message)) return;
      const confirmation = await window.showWarningMessage(
        `¿Borrar la clave "${message.key}" de la memoria local? No se puede deshacer.`,
        { modal: true },
        'Borrar',
      );
      if (confirmation !== 'Borrar') return;
      await store.delete(message.key);
      await render();
    } catch (error: unknown) {
      window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo usar la memoria local.');
    }
  }, undefined, context.subscriptions);
}

function isSearchMessage(value: unknown): value is { type: 'search'; query: string } {
  return typeof value === 'object' && value !== null
    && (value as { type?: unknown }).type === 'search'
    && typeof (value as { query?: unknown }).query === 'string';
}

function isRevealMessage(value: unknown): value is { type: 'reveal'; key: string } {
  return typeof value === 'object' && value !== null
    && (value as { type?: unknown }).type === 'reveal'
    && typeof (value as { key?: unknown }).key === 'string';
}

function isDeleteMessage(value: unknown): value is { type: 'delete'; key: string } {
  return typeof value === 'object' && value !== null
    && (value as { type?: unknown }).type === 'delete'
    && typeof (value as { key?: unknown }).key === 'string';
}
