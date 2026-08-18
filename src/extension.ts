import * as vscode from 'vscode';
import { StatusTreeProvider } from './providers/statusTreeProvider';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
  console.log('Alfred Dev extension is now active!');

  const statusTreeProvider = new StatusTreeProvider();
  vscode.window.registerTreeDataProvider('alfred-dev-status', statusTreeProvider);

  registerCommands(context, statusTreeProvider);
}

export function deactivate() {}
