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

/**
 * Registra los comandos de Alfred Dev y los añade a las suscripciones del contexto.
 *
 * @param context Contexto de la extensión donde se conservan las suscripciones.
 * @param statusProvider Proveedor cuyo estado puede refrescar la paleta.
 * @returns `void`.
 * @example `registerCommands(context, statusTreeProvider)` durante `activate`.
 */
export function registerCommands(context: vscode.ExtensionContext, statusProvider: StatusTreeProvider) {
  const startFlowCommand = vscode.commands.registerCommand('alfred-dev.startFlow', async () => {
    const flowType = await vscode.window.showQuickPick(
      ['Feature (Idea -> Entrega)', 'Fix (Diagnóstico -> TDD -> QA)', 'Audit (Seguridad + Calidad)', 'Ship (Publicación)'],
      { placeHolder: 'Selecciona el flujo que deseas arrancar con Alfred Dev' }
    );

    if (flowType) {
      vscode.window.showInformationMessage(`Flujo seleccionado: ${flowType}. Invocando a @alfred en GitHub Copilot...`);
      void vscode.commands.executeCommand('workbench.action.chat.open', `@alfred Arranca el flujo ${flowType}`);
    }
  });

  const refreshStatusCommand = vscode.commands.registerCommand('alfred-dev.refreshStatus', () => {
    statusProvider.refresh();
    vscode.window.showInformationMessage('Estado de Alfred Dev actualizado.');
  });

  const openChatCommand = vscode.commands.registerCommand('alfred-dev.openChat', () => {
    void vscode.commands.executeCommand('workbench.action.chat.open', '@alfred');
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

  context.subscriptions.push(startFlowCommand, refreshStatusCommand, openChatCommand, selectModelProfileCommand);
}
