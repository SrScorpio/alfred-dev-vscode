/**
 * Registro de los comandos de la interfaz nativa de Alfred Dev.
 *
 * Conecta la paleta de comandos con el chat de Copilot, el TreeView y la
 * preferencia global de perfil. Depende de `StatusTreeProvider` y de la
 * definición de perfiles; `extension.ts` lo invoca durante la activación.
 *
 * @module commands/index
 */
import * as vscode from 'vscode';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { getModelProfileItems } from './modelProfiles';
import type { ModelProfile } from './modelProfiles';
import { openAlfredChat } from './chatCommand';
import { runStartFlowCommand } from './startFlow';
import { runContinuityCommand } from './continuity';
import { runAjustesCommand } from './ajustes';
import { checkForUpdate, fetchLatestRelease } from './checkUpdate';
import { openStyleGallery } from '../gallery/styleGalleryPanel';
import { installSecretHook } from '../security/secretHook';
import {
  RalphBridge,
  readRalphConfig,
  resolveRalphSuiteExtension,
  runRalphTaskCommand,
  runSyncIssueCommand,
  runTrustedRalphAction,
} from '../integrations/ralph';
import type { AlfredStatus } from '../integrations/ralph';
import { clearLocalMemoryAndRecycleMcp, createMemoryCommandHandlers } from '../memory/memoryIntegration';
import type { MemoryStore, SecretStorageMemoryEncryptionKeyProvider } from '../memory/memoryStore';

/**
 * Registra los comandos de Alfred Dev y los añade a las suscripciones del contexto.
 *
 * @param context Contexto de la extensión donde se conservan las suscripciones.
 * @param statusProvider Proveedor cuyo estado puede refrescar la paleta.
 * @param memoryStore Almacén local opt-in usado por los comandos de memoria.
 * @param memoryPersistence Ruta y proveedor de clave para el borrado explícito.
 * @returns `void`.
 * @example `registerCommands(context, statusTreeProvider)` durante `activate`.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  statusProvider: StatusTreeProvider,
  memoryStore: MemoryStore,
  memoryPersistence: {
    filePath: string;
    keyProvider: SecretStorageMemoryEncryptionKeyProvider;
    recycleMemoryMcp?: () => void;
  },
) {
  const getWorkspaceRoot = (): string | undefined => vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const openChatWithPrompt = (prompt?: string) => {
    void openAlfredChat(
      (command, chatPrompt) => vscode.commands.executeCommand(command, chatPrompt),
      (message) => vscode.window.showErrorMessage(message),
      prompt,
    );
  };
  const getRalphBridge = () => new RalphBridge(
    () => resolveRalphSuiteExtension((extensionId) => {
      const extension = vscode.extensions.getExtension(extensionId);
      return extension ? {
        isActive: extension.isActive,
        commands: getRalphCommandIds(extension.packageJSON),
      } : undefined;
    }),
    (command, ...args) => vscode.commands.executeCommand(command, ...args),
  );

  const startFlowCommand = vscode.commands.registerCommand('alfred-dev.startFlow', async () => {
    await runStartFlowCommand({
      quickPick: (items) => vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona el flujo que deseas arrancar con Alfred Dev',
      }),
      openChat: (prompt) => {
        openChatWithPrompt(prompt);
      },
      showInformation: (message) => {
        void vscode.window.showInformationMessage(message);
      },
    });
  });
  const checkUpdateCommand = vscode.commands.registerCommand('alfred-dev.checkUpdate', async () => {
    const result = await checkForUpdate({
      currentVersion: String(context.extension.packageJSON.version ?? ''),
      fetchLatestRelease,
    });
    if (result.isError) {
      void vscode.window.showErrorMessage(result.message);
      return;
    }
    void vscode.window.showInformationMessage(result.message);
  });

  const refreshStatusCommand = vscode.commands.registerCommand('alfred-dev.refreshStatus', () => {
    statusProvider.refresh();
    vscode.window.showInformationMessage('Estado de Alfred Dev actualizado.');
  });

  const openChatCommand = vscode.commands.registerCommand('alfred-dev.openChat', () => {
    openChatWithPrompt();
  });

  const progressCommand = vscode.commands.registerCommand('alfred-dev.progress', async () => {
    await runContinuityCommand({
      openChat: (prompt) => {
        openChatWithPrompt(prompt);
      },
    }, 'progress');
  });
  const pauseCommand = vscode.commands.registerCommand('alfred-dev.pause', async () => {
    await runContinuityCommand({
      openChat: (prompt) => {
        openChatWithPrompt(prompt);
      },
    }, 'pause');
  });
  const retomarCommand = vscode.commands.registerCommand('alfred-dev.retomar', async () => {
    await runContinuityCommand({
      openChat: (prompt) => {
        openChatWithPrompt(prompt);
      },
    }, 'retomar');
  });
  const openSettingsCommand = vscode.commands.registerCommand('alfred-dev.openSettings', async () => {
    await runAjustesCommand({
      quickPick: (items) => vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona un ajuste de Alfred Dev',
        title: 'Alfred Dev: Ajustes',
      }),
      getBoolean: (key, defaultValue) => readAlfredBooleanSetting(key, defaultValue),
      inspect: (key) => inspectAlfredBooleanSetting(key),
      updateBoolean: async (key, value, target) => {
        await updateAlfredBooleanSetting(key, value, target);
      },
      executeCommand: (command) => vscode.commands.executeCommand(command),
      showInformation: (message) => {
        void vscode.window.showInformationMessage(message);
      },
    });
  });

  const selectModelProfileCommand = vscode.commands.registerCommand('alfred-dev.selectModelProfile', async () => {
    const configuration = vscode.workspace.getConfiguration('alfred-dev');
    const selectedProfile = configuration.get<ModelProfile>('modelProfile', 'luna');
    const selected = await vscode.window.showQuickPick(getModelProfileItems(selectedProfile), {
      placeHolder: 'Selecciona el perfil de modelo para Alfred Dev',
      title: 'Perfil de modelo',
    });

    if (!selected) {
      return;
    }

    await configuration.update('modelProfile', selected.profile, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Perfil de modelo guardado: ${selected.label}.`);
  });

  const openStyleGalleryCommand = vscode.commands.registerCommand('alfred-dev.openStyleGallery', () => {
    void openStyleGallery(context).catch((error: unknown) => {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo abrir la galería visual.');
    });
  });
  const installSecretHookCommand = vscode.commands.registerCommand('alfred-dev.installSecretHook', async () => {
    if (!vscode.workspace.isTrusted) {
      vscode.window.showErrorMessage('Secret Guard requiere un workspace de confianza para instalar el hook.');
      return;
    }
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('Abre un workspace para instalar el Secret Guard.');
      return;
    }
    try {
      await installSecretHook(workspaceRoot);
      vscode.window.showInformationMessage('Secret Guard instalado para el pre-commit de este repositorio.');
    } catch (error: unknown) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo instalar el Secret Guard.');
    }
  });
  const memoryHandlers = createMemoryCommandHandlers(memoryStore, {
    prompt: async (request) => {
      const key = await vscode.window.showInputBox({
        prompt: request === 'search' ? 'Texto que buscar en la memoria local' : 'Clave de memoria local',
        ignoreFocusOut: true,
      });
      if (!key) return undefined;
      if (request !== 'put') return { key };
      const value = await vscode.window.showInputBox({
        prompt: 'Contenido que guardar localmente',
        ignoreFocusOut: true,
      });
      return value === undefined ? undefined : { key, value };
    },
    showInformation: (message) => { void vscode.window.showInformationMessage(message); },
    showError: (message) => { void vscode.window.showErrorMessage(message); },
  }, () => vscode.workspace.isTrusted);
  const memoryPutCommand = vscode.commands.registerCommand('alfred-dev.memory.put', () => {
    void executeMemory(() => memoryHandlers.put());
  });
  const memoryGetCommand = vscode.commands.registerCommand('alfred-dev.memory.get', () => {
    void executeMemory(() => memoryHandlers.get());
  });
  const memorySearchCommand = vscode.commands.registerCommand('alfred-dev.memory.search', () => {
    void executeMemory(() => memoryHandlers.search());
  });
  const memoryClearCommand = vscode.commands.registerCommand('alfred-dev.memory.clear', async () => {
    if (!vscode.workspace.isTrusted) {
      vscode.window.showErrorMessage('La memoria local requiere un workspace de confianza.');
      return;
    }
    const confirmed = await vscode.window.showWarningMessage(
      'Esto borra la memoria local cifrada y su clave de este perfil. No se puede deshacer.',
      { modal: true },
      'Borrar memoria local',
    );
    if (confirmed !== 'Borrar memoria local') return;
    try {
      await clearLocalMemoryAndRecycleMcp(
        memoryPersistence.filePath,
        memoryPersistence.keyProvider,
        memoryPersistence.recycleMemoryMcp,
      );
      vscode.window.showInformationMessage('Memoria local y clave eliminadas de este perfil.');
    } catch (error: unknown) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo borrar la memoria local.');
    }
  });
  const ralphOpenKanbanCommand = vscode.commands.registerCommand('alfred-dev.ralph.openKanban', () => {
    void runTrustedRalphAction({
      isTrusted: vscode.workspace.isTrusted,
      action: () => getRalphBridge().openKanban(),
      showError: (message) => { void vscode.window.showErrorMessage(message); },
    });
  });
  const ralphRunTaskCommand = vscode.commands.registerCommand('alfred-dev.ralph.runTask', () => {
    void runRalphTaskCommand({
      isTrusted: vscode.workspace.isTrusted,
      workspaceRoot: getWorkspaceRoot(),
      readConfig: readRalphConfig,
      promptTaskId: async () => vscode.window.showInputBox({
        prompt: 'ID de tarea Ralph',
        validateInput: (value) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value) ? undefined : 'Usa un ID alfanumérico con guiones.',
      }),
      runTask: (taskId) => getRalphBridge().runTask(taskId),
      showError: (message) => { void vscode.window.showErrorMessage(message); },
    });
  });
  const ralphStartRunnerCommand = vscode.commands.registerCommand('alfred-dev.ralph.startRunner', () => {
    void runTrustedRalphAction({
      isTrusted: vscode.workspace.isTrusted,
      action: () => getRalphBridge().startRunner(),
      showError: (message) => { void vscode.window.showErrorMessage(message); },
    });
  });
  const ralphStopRunnerCommand = vscode.commands.registerCommand('alfred-dev.ralph.stopRunner', () => {
    void runTrustedRalphAction({
      isTrusted: vscode.workspace.isTrusted,
      action: () => getRalphBridge().stopRunner(),
      showError: (message) => { void vscode.window.showErrorMessage(message); },
    });
  });
  const ralphSyncIssueCommand = vscode.commands.registerCommand('alfred-dev.ralph.syncIssue', () => {
    const bridge = getRalphBridge();
    void runSyncIssueCommand({
      isTrusted: vscode.workspace.isTrusted,
      promptIssueId: async () => vscode.window.showInputBox({
        prompt: 'Número de issue GitHub que sincronizar con Ralph',
        validateInput: (value) => /^[1-9]\d{0,5}$/.test(value) ? undefined : 'Introduce un número entre 1 y 999999.',
      }),
      promptStatus: async () => {
        const selected = await vscode.window.showQuickPick(
          ['backlog', 'in-progress', 'blocked', 'closed'],
          { placeHolder: 'Estado actual en GitHub (fuente de verdad)' },
        );
        return selected as AlfredStatus | undefined;
      },
      syncIssue: (issueId, status) => bridge.syncIssue(issueId, status),
      showInformation: (message) => { void vscode.window.showInformationMessage(message); },
      showError: (message) => { void vscode.window.showErrorMessage(message); },
    });
  });

  context.subscriptions.push(
    startFlowCommand,
    checkUpdateCommand,
    refreshStatusCommand,
    openChatCommand,
    progressCommand,
    pauseCommand,
    retomarCommand,
    openSettingsCommand,
    selectModelProfileCommand,
    openStyleGalleryCommand,
    installSecretHookCommand,
    memoryPutCommand,
    memoryGetCommand,
    memorySearchCommand,
    memoryClearCommand,
    ralphOpenKanbanCommand,
    ralphRunTaskCommand,
    ralphStartRunnerCommand,
    ralphStopRunnerCommand,
    ralphSyncIssueCommand,
  );
}
async function executeMemory(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error: unknown) {
    vscode.window.showErrorMessage(error instanceof Error ? error.message : 'No se pudo usar la memoria local.');
  }
}

function readAlfredBooleanSetting(key: string, defaultValue: boolean): boolean {
  if (key === 'alfred-dev.memory.enabled') {
    return vscode.workspace.getConfiguration('alfred-dev.memory').get<boolean>('enabled', defaultValue) ?? defaultValue;
  }
  if (key === 'alfred-dev.secretGuard.diagnostics') {
    return vscode.workspace.getConfiguration('alfred-dev').get<boolean>('secretGuard.diagnostics', defaultValue) ?? defaultValue;
  }
  return defaultValue;
}

function inspectAlfredBooleanSetting(key: string): { workspaceValue?: boolean } {
  if (key === 'alfred-dev.memory.enabled') {
    return {
      workspaceValue: vscode.workspace.getConfiguration('alfred-dev.memory').inspect<boolean>('enabled')?.workspaceValue,
    };
  }
  if (key === 'alfred-dev.secretGuard.diagnostics') {
    return {
      workspaceValue: vscode.workspace.getConfiguration('alfred-dev').inspect<boolean>('secretGuard.diagnostics')?.workspaceValue,
    };
  }
  return {};
}

async function updateAlfredBooleanSetting(
  key: string,
  value: boolean,
  target: 'Global' | 'Workspace',
): Promise<void> {
  const configurationTarget = target === 'Global'
    ? vscode.ConfigurationTarget.Global
    : vscode.ConfigurationTarget.Workspace;
  if (key === 'alfred-dev.memory.enabled') {
    await vscode.workspace.getConfiguration('alfred-dev.memory').update('enabled', value, configurationTarget);
    return;
  }
  if (key === 'alfred-dev.secretGuard.diagnostics') {
    await vscode.workspace.getConfiguration('alfred-dev').update('secretGuard.diagnostics', value, configurationTarget);
  }
}

function getRalphCommandIds(packageJson: unknown): string[] {
  if (typeof packageJson !== 'object' || packageJson === null) return [];
  const contributes = (packageJson as { contributes?: { commands?: unknown } }).contributes;
  if (!contributes || !Array.isArray(contributes.commands)) return [];
  return contributes.commands
    .filter((command) => typeof command === 'object' && command !== null
    && typeof (command as { command?: unknown }).command === 'string'
    && (command as { command: string }).command.startsWith('ralph-suite.'))
    .map((command) => (command as { command: string }).command);
}
