import * as vscode from 'vscode';
import { StatusTreeProvider } from '../providers/statusTreeProvider';

export function registerCommands(context: vscode.ExtensionContext, statusProvider: StatusTreeProvider) {
  const startFlowCommand = vscode.commands.registerCommand('alfred-dev.startFlow', async () => {
    const flowType = await vscode.window.showQuickPick(
      ['Feature (Idea -> Entrega)', 'Fix (Diagnóstico -> TDD -> QA)', 'Audit (Seguridad + Calidad)', 'Ship (Publicación)'],
      { placeHolder: 'Selecciona el flujo que deseas arrancar con Alfred Dev' }
    );

    if (flowType) {
      vscode.window.showInformationMessage(`Flujo seleccionado: ${flowType}. Invocando a @alfred en GitHub Copilot...`);
      vscode.commands.executeCommand('workbench.action.chat.open', `@alfred Arranca el flujo ${flowType}`);
    }
  });

  const refreshStatusCommand = vscode.commands.registerCommand('alfred-dev.refreshStatus', () => {
    statusProvider.refresh();
    vscode.window.showInformationMessage('Estado de Alfred Dev actualizado.');
  });

  context.subscriptions.push(startFlowCommand, refreshStatusCommand);
}
