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
import { registerMemoryMcpProvider } from './memory/memoryIntegration';
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
  const memoryPath = path.join(context.globalStorageUri.fsPath, 'memory.json');
  configuredMemoryStore = createLazyMemoryStore(memoryEnabled, async () => new JsonMemoryStore(memoryPath));
  const optionalMcpApi = (vscode as typeof vscode & { lm?: typeof vscode.lm }).lm as (typeof vscode.lm & {
    registerMcpServerDefinitionProvider?: typeof vscode.lm.registerMcpServerDefinitionProvider;
  }) | undefined;
  const optionalMcpDefinition = (vscode as typeof vscode & {
    McpStdioServerDefinition?: typeof vscode.McpStdioServerDefinition;
  }).McpStdioServerDefinition;
  const mcpRegistration = registerMemoryMcpProvider({
    enabled: memoryEnabled,
    registerProvider: typeof optionalMcpApi?.registerMcpServerDefinitionProvider === 'function'
      ? (id, provider) => optionalMcpApi.registerMcpServerDefinitionProvider!(id, provider as vscode.McpServerDefinitionProvider)
      : undefined,
    createDefinition: typeof optionalMcpDefinition === 'function'
      ? (serverPath, configuredMemoryPath, version) => new optionalMcpDefinition(
        'Alfred Dev Memory',
        process.execPath,
        [serverPath],
        { ELECTRON_RUN_AS_NODE: '1', ALFRED_DEV_MEMORY_PATH: configuredMemoryPath },
        version,
      )
      : undefined,
    serverPath: context.asAbsolutePath(path.join('out', 'memory', 'memoryMcpServer.js')),
    memoryPath,
    version: '0.6.5',
  });
  if (mcpRegistration) context.subscriptions.push(mcpRegistration);
  const diagnosticsEnabled = vscode.workspace.getConfiguration('alfred-dev').get<boolean>('secretGuard.diagnostics', true);
  if (diagnosticsEnabled) registerSecretDiagnostics(context);
  registerCommands(context, statusTreeProvider, configuredMemoryStore);
}

/**
 * Libera el punto de entrada de la extensión cuando VS Code la desactiva.
 *
 * @returns `void`.
 */
export function deactivate() {}
