/**
 * Punto de entrada de la extensión nativa de Alfred Dev para VS Code.
 *
 * Registra el TreeView de estado y delega los comandos en `commands/index`.
 * Depende de los proveedores y comandos de la extensión; VS Code invoca sus
 * funciones de ciclo de vida al activar o desactivar el paquete.
 *
 * @module extension
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { StatusTreeProvider } from './providers/statusTreeProvider';
import { registerCommands } from './commands';
import { createLazyMemoryStore, JsonMemoryStore } from './memory/memoryStore';
import type { MemoryStore } from './memory/memoryStore';
import { registerSecretDiagnostics } from './security/diagnostics';

let configuredMemoryStore: MemoryStore | undefined;

export function getConfiguredMemoryStore(): MemoryStore | undefined {
  return configuredMemoryStore;
}

/**
 * Activa la extensión y registra sus contribuciones programáticas.
 *
 * @param context Contexto que VS Code mantiene durante la vida de la extensión.
 * @returns `void`.
 * @example `activate(context)` se invoca desde el ciclo de vida de VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Alfred Dev extension is now active!');

  const statusTreeProvider = new StatusTreeProvider();
  vscode.window.registerTreeDataProvider('alfred-dev-status', statusTreeProvider);

  const memoryEnabled = vscode.workspace.getConfiguration('alfred-dev.memory').get<boolean>('enabled', false);
  configuredMemoryStore = createLazyMemoryStore(memoryEnabled, async () => new JsonMemoryStore(path.join(context.globalStorageUri.fsPath, 'memory.json')));
  const diagnosticsEnabled = vscode.workspace.getConfiguration('alfred-dev').get<boolean>('secretGuard.diagnostics', true);
  if (diagnosticsEnabled) registerSecretDiagnostics(context);
  registerCommands(context, statusTreeProvider);
}

/**
 * Libera el punto de entrada de la extensión cuando VS Code la desactiva.
 *
 * @returns `void`.
 */
export function deactivate() {}
