/** Publishes non-blocking secret diagnostics for files as they are saved. */
import * as vscode from 'vscode';
import { scanSecrets } from './secretScanner';

export function registerSecretDiagnostics(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection('alfred-dev-secret-guard');
  const inspect = (document: vscode.TextDocument): void => {
    const findings = scanSecrets(document.getText());
    const diagnostics = findings.map((finding) => new vscode.Diagnostic(
      new vscode.Range(finding.line - 1, 0, finding.line - 1, document.lineAt(finding.line - 1).text.length),
      `Posible secreto detectado (${finding.type}). Revisa el fichero antes de compartirlo.`,
      vscode.DiagnosticSeverity.Warning,
    ));
    collection.set(document.uri, diagnostics);
  };

  context.subscriptions.push(
    collection,
    vscode.workspace.onDidSaveTextDocument(inspect),
  );
}