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
import {
  createLazyMemoryStore,
  JsonMemoryStore,
  SecretStorageMemoryEncryptionKeyProvider,
} from './memory/memoryStore';
import type { MemoryStore } from './memory/memoryStore';
import { registerMemoryMcpProviderOnTrust } from './memory/memoryIntegration';
import { createMemoryMcpChildEnvironment } from './memory/memoryKeyChannel';
import { registerSecretDiagnostics, registerSecretDiagnosticsOnChange } from './security/diagnostics';
import { installUserCatalog } from './agents/catalogInstaller';

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

  const isMemoryEnabled = () => vscode.workspace.getConfiguration('alfred-dev.memory').get<boolean>('enabled', false);
  const memoryPath = path.join(context.globalStorageUri.fsPath, 'memory.json');
  const memoryKeyProvider = new SecretStorageMemoryEncryptionKeyProvider(context.secrets);
  configuredMemoryStore = createLazyMemoryStore(
    isMemoryEnabled,
    async () => new JsonMemoryStore(memoryPath, memoryKeyProvider),
  );
  const optionalMcpApi = (vscode as typeof vscode & { lm?: typeof vscode.lm }).lm as (typeof vscode.lm & {
    registerMcpServerDefinitionProvider?: typeof vscode.lm.registerMcpServerDefinitionProvider;
  }) | undefined;
  const optionalMcpDefinition = (vscode as typeof vscode & {
    McpStdioServerDefinition?: typeof vscode.McpStdioServerDefinition;
  }).McpStdioServerDefinition;
  const memoryMcp = registerMemoryMcpProviderOnTrust({
    enabled: isMemoryEnabled,
    isTrusted: () => vscode.workspace.isTrusted,
    onDidGrantWorkspaceTrust: (listener) => vscode.workspace.onDidGrantWorkspaceTrust(listener),
    onDidChangeConfiguration: (listener) => vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('alfred-dev.memory.enabled')) listener();
    }),
    addSubscription: (disposable) => { context.subscriptions.push(disposable); },
    registerProvider: typeof optionalMcpApi?.registerMcpServerDefinitionProvider === 'function'
      ? (id, provider) => optionalMcpApi.registerMcpServerDefinitionProvider!(id, provider as vscode.McpServerDefinitionProvider)
      : undefined,
    createDefinition: typeof optionalMcpDefinition === 'function'
      ? (serverPath, configuredMemoryPath, version, socketPath) => new optionalMcpDefinition(
        'Alfred Dev Memory',
        process.execPath,
        [serverPath],
        createMemoryMcpChildEnvironment(configuredMemoryPath, socketPath),
        version,
      )
      : undefined,
    keyProvider: memoryKeyProvider,
    serverPath: context.asAbsolutePath(path.join('out', 'memory', 'memoryMcpServer.js')),
    memoryPath,
    version: '0.9.0',
  });
  registerSecretDiagnosticsOnChange({
    enabled: () => vscode.workspace.getConfiguration('alfred-dev').get<boolean>('secretGuard.diagnostics', true) ?? true,
    register: () => registerSecretDiagnostics(context),
    onDidChangeConfiguration: (listener) => vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('alfred-dev.secretGuard.diagnostics')) listener();
    }),
    addSubscription: (disposable) => { context.subscriptions.push(disposable); },
  });
  registerCommands(context, statusTreeProvider, configuredMemoryStore, {
    filePath: memoryPath,
    keyProvider: memoryKeyProvider,
    recycleMemoryMcp: () => { memoryMcp.recycle(); },
  });

  void installUserCatalog({
    extensionPath: context.extensionPath,
    version: String(context.extension.packageJSON.version ?? ''),
  }).then((result) => {
    if (!result.changed) return;
    void vscode.window.showInformationMessage(
      `Alfred Dev instaló ${result.agents} agentes en tu perfil. Recarga la ventana para verlos en el selector del chat.`,
      'Recargar ventana',
    ).then((choice) => {
      if (choice === 'Recargar ventana') {
        void vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
  }).catch((error: unknown) => {
    void vscode.window.showErrorMessage(
      error instanceof Error ? `No se pudieron instalar los agentes: ${error.message}` : 'No se pudieron instalar los agentes.',
    );
  });
}

/**
 * Libera el punto de entrada de la extensión cuando VS Code la desactiva.
 *
 * @returns `void`.
 */
export function deactivate() {}
