/** VS Code Webview panel for choosing and explicitly confirming a style option. */
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { loadStyleOptions, renderGalleryHtml, saveStyleDirection, type StyleOption } from './styleGallery';

export async function openStyleGallery(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Abre un workspace para guardar una dirección de estilo.');
    return;
  }

  const options = await loadStyleOptions(workspaceRoot);
  const panel = vscode.window.createWebviewPanel(
    'alfredDevStyleGallery',
    'Alfred Dev: Galería visual',
    vscode.ViewColumn.One,
    { enableScripts: true, localResourceRoots: [] },
  );
  const nonce = crypto.randomBytes(16).toString('base64');
  panel.webview.html = renderGalleryHtml(options, nonce);
  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    if (!isSelectionMessage(message)) return;
    const option = options.find((candidate) => candidate.id === message.id);
    if (!option) return;
    const confirmation = await vscode.window.showInformationMessage(
      `¿Guardar la propuesta visual "${option.name}" en docs/style-direction.md?`,
      'Confirmar',
      'Cancelar',
    );
    if (confirmation !== 'Confirmar') return;
    try {
      await saveStyleDirection(workspaceRoot, option);
      vscode.window.showInformationMessage(`Dirección de estilo guardada: ${option.name}.`);
    } catch (error: unknown) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la dirección de estilo.');
    }
  }, undefined, context.subscriptions);
}

function isSelectionMessage(value: unknown): value is { type: 'select'; id: string } {
  return typeof value === 'object' && value !== null
    && (value as { type?: unknown }).type === 'select'
    && typeof (value as { id?: unknown }).id === 'string';
}