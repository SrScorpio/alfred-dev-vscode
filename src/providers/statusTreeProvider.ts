import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseProjectStatus } from './parseStatus';

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
    const actionItems = [
      new StatusItem(
        'Refrescar estado',
        vscode.TreeItemCollapsibleState.None,
        'refresh',
        { command: 'alfred-dev.refreshStatus', title: 'Refrescar estado' },
      ),
      new StatusItem(
        'Hablar con Alfred',
        vscode.TreeItemCollapsibleState.None,
        'comment-discussion',
        { command: 'alfred-dev.openChat', title: 'Hablar con Alfred' },
      ),
      new StatusItem(
        'Seleccionar perfil de modelo',
        vscode.TreeItemCollapsibleState.None,
        'symbol-misc',
        { command: 'alfred-dev.selectModelProfile', title: 'Seleccionar perfil de modelo' },
      ),
    ];

    if (!fs.existsSync(statusPath)) {
      return Promise.resolve([
        ...actionItems,
        new StatusItem('Sin snapshot local. El estado vive en GitHub Issues.', vscode.TreeItemCollapsibleState.None, 'info'),
      ]);
    }

    try {
      const content = fs.readFileSync(statusPath, 'utf8');
      const status = parseProjectStatus(content);
      const items: StatusItem[] = [...actionItems];

      if (status.flow) items.push(new StatusItem(`Flujo: ${status.flow}`, vscode.TreeItemCollapsibleState.None, 'sync'));
      if (status.phase) items.push(new StatusItem(`Fase: ${status.phase}`, vscode.TreeItemCollapsibleState.None, 'play'));
      if (status.pendingGate) items.push(new StatusItem(`Gate: ${status.pendingGate}`, vscode.TreeItemCollapsibleState.None, 'shield'));
      if (status.nextAction) items.push(new StatusItem(`Acción: ${status.nextAction}`, vscode.TreeItemCollapsibleState.None, 'arrow-right'));

      return Promise.resolve(items);
    } catch (err) {
      return Promise.resolve([
        ...actionItems,
        new StatusItem('Error al leer status.md', vscode.TreeItemCollapsibleState.None, 'error'),
      ]);
    }
  }
}

export class StatusItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    icon?: string,
    command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon.replace(/\$|\(|\)/g, ''));
    }
    this.command = command;
    this.tooltip = label;
  }
}
