import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectStatus } from '../types';

export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> = new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: StatusItem): Thenable<StatusItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return Promise.resolve([new StatusItem('Sin Workspace abierto', vscode.TreeItemCollapsibleState.None)]);
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const statusPath = path.join(rootPath, 'docs', 'project', 'status.md');

    if (!fs.existsSync(statusPath)) {
      return Promise.resolve([
        new StatusItem('Sin flujo activo (docs/project/status.md no existe)', vscode.TreeItemCollapsibleState.None)
      ]);
    }

    try {
      const content = fs.readFileSync(statusPath, 'utf8');
      const items: StatusItem[] = [];

      const flowMatch = content.match(/\*\*Flujo:\*\*\s*(.*)/i);
      const phaseMatch = content.match(/\*\*Fase actual:\*\*\s*(.*)/i);
      const gateMatch = content.match(/\*\*Gate pendiente:\*\*\s*(.*)/i);
      const actionMatch = content.match(/\*\*Próxima acción:\*\*\s*(.*)/i);

      if (flowMatch) items.push(new StatusItem(`Flujo: ${flowMatch[1].trim()}`, vscode.TreeItemCollapsibleState.None, '$(sync)'));
      if (phaseMatch) items.push(new StatusItem(`Fase: ${phaseMatch[1].trim()}`, vscode.TreeItemCollapsibleState.None, '$(play)'));
      if (gateMatch) items.push(new StatusItem(`Gate: ${gateMatch[1].trim()}`, vscode.TreeItemCollapsibleState.None, '$(shield)'));
      if (actionMatch) items.push(new StatusItem(`Acción: ${actionMatch[1].trim()}`, vscode.TreeItemCollapsibleState.None, '$(arrow-right)'));

      return Promise.resolve(items);
    } catch (err) {
      return Promise.resolve([new StatusItem('Error al leer status.md', vscode.TreeItemCollapsibleState.None)]);
    }
  }
}

export class StatusItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    icon?: string
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon.replace(/\$|\(|\)/g, ''));
    }
  }
}
