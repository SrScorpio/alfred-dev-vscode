import * as vscode from 'vscode';
import { StatusTreeProvider } from '../providers/statusTreeProvider';
import { getModelProfileItems } from './modelProfiles';
import type { ModelProfile } from './modelProfiles';

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
