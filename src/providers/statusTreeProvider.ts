/**
 * Proveedor del TreeView que muestra el snapshot local del flujo de Alfred Dev.
 *
 * Lee `docs/project/status.md` del primer workspace mediante el lector y el
 * parser locales. La ausencia del snapshot conserva el estado en GitHub como
 * fuente de verdad; `extension.ts` registra este proveedor en la Activity Bar.
 *
 * @module providers/statusTreeProvider
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { parseProjectStatus } from './parseStatus';
import { readStatusFile } from './readStatusFile';

/**
 * Implementa el árbol de estado y sus acciones de la interfaz nativa.
 */
export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> = new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> = this._onDidChangeTreeData.event;

  /**
   * Solicita a VS Code que vuelva a leer y representar el snapshot.
   *
   * @returns `void`.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Devuelve el elemento que representa una entrada del árbol.
   *
   * @param element Elemento que VS Code quiere representar.
   * @returns El mismo elemento como `TreeItem` de VS Code.
   */
  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  /**
   * Obtiene las acciones y los campos disponibles del snapshot local.
   *
   * @param element Nodo padre opcional; los nodos hoja no tienen descendientes.
   * @returns Promise con las entradas visibles del TreeView.
   */
  async getChildren(element?: StatusItem): Promise<StatusItem[]> {
    if (element) {
      return [];
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [new StatusItem('Sin Workspace abierto', vscode.TreeItemCollapsibleState.None)];
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

    try {
      const content = await readStatusFile(statusPath);
      const status = parseProjectStatus(content);
      const items: StatusItem[] = [...actionItems];

      if (status.flow) items.push(new StatusItem(`Flujo: ${status.flow}`, vscode.TreeItemCollapsibleState.None, 'sync'));
      if (status.phase) items.push(new StatusItem(`Fase: ${status.phase}`, vscode.TreeItemCollapsibleState.None, 'play'));
      if (status.pendingGate) items.push(new StatusItem(`Gate: ${status.pendingGate}`, vscode.TreeItemCollapsibleState.None, 'shield'));
      if (status.nextAction) items.push(new StatusItem(`Acción: ${status.nextAction}`, vscode.TreeItemCollapsibleState.None, 'arrow-right'));

      return items;
    } catch (error: unknown) {
      if (isFileNotFoundError(error)) {
        return [
          ...actionItems,
          new StatusItem('Sin snapshot local. El estado vive en GitHub Issues.', vscode.TreeItemCollapsibleState.None, 'info'),
        ];
      }

      return [
        ...actionItems,
        new StatusItem('Error al leer status.md', vscode.TreeItemCollapsibleState.None, 'error'),
      ];
    }
  }
}

/**
 * Comprueba si un error indica que el snapshot local no existe.
 *
 * @param error Valor capturado por la lectura del fichero.
 * @returns `true` solo para el código de error `ENOENT`.
 */
function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/**
 * Entrada visual del TreeView con icono, tooltip y comando opcionales.
 */
export class StatusItem extends vscode.TreeItem {
  /**
   * Crea una entrada del TreeView.
   *
   * @param label Texto visible de la entrada.
   * @param collapsibleState Estado de expansión que gestiona VS Code.
   * @param icon Identificador opcional del icono de tema de VS Code.
   * @param command Comando opcional que se ejecuta al seleccionar la entrada.
   */
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
