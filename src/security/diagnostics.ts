/** Publishes non-blocking secret diagnostics for files as they are saved. */
import type * as vscode from 'vscode';
import { scanSecretsBounded } from './secretScanner';

interface Disposable {
  dispose(): void;
}

export interface SecretDiagnosticsChangeOptions {
  enabled: boolean | (() => boolean);
  register(): Disposable;
  onDidChangeConfiguration(listener: () => void): Disposable;
  addSubscription(disposable: Disposable): void;
}

export interface SecretDiagnosticsChangeRegistration {
  dispose(): void;
}

function isDiagnosticsEnabled(enabled: boolean | (() => boolean)): boolean {
  return typeof enabled === 'function' ? enabled() : enabled;
}

/**
 * Crea la collection de diagnósticos y la suscripción al guardado.
 *
 * Devuelve un Disposable para poder liberar collection y listener sin dejar
 * collections huérfanas si el opt-in se desactiva en caliente.
 *
 * @param context Contexto de la extensión; conserva el Disposable en subscriptions.
 * @returns Disposable de collection y `onDidSaveTextDocument`.
 */
export function registerSecretDiagnostics(context: vscode.ExtensionContext): Disposable {
  const vscodeApi = require('vscode') as typeof vscode;
  const collection = vscodeApi.languages.createDiagnosticCollection('alfred-dev-secret-guard');
  const inspect = (document: vscode.TextDocument): void => {
    const findings = scanSecretsBounded(document.getText());
    const diagnostics = findings.map((finding) => new vscodeApi.Diagnostic(
      new vscodeApi.Range(finding.line - 1, 0, finding.line - 1, document.lineAt(finding.line - 1).text.length),
      `Posible secreto detectado (${finding.type}). Revisa el fichero antes de compartirlo.`,
      vscodeApi.DiagnosticSeverity.Warning,
    ));
    collection.set(document.uri, diagnostics);
  };

  const saveSubscription = vscodeApi.workspace.onDidSaveTextDocument(inspect);
  let disposed = false;
  const registration: Disposable = {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      collection.dispose();
      saveSubscription.dispose();
    },
  };
  context.subscriptions.push(registration);
  return registration;
}

/**
 * Registra o dispone los diagnósticos cuando cambia `secretGuard.diagnostics`.
 *
 * Si ya hay un registro activo no crea otro. Si el opt-in pasa a false, dispone
 * collection y subscription. Misma idea que el MCP de memoria.
 *
 * @param options Opt-in, factoría de registro y cambio de configuración inyectados.
 * @returns Handle para disponer el registro activo.
 */
export function registerSecretDiagnosticsOnChange(
  options: SecretDiagnosticsChangeOptions,
): SecretDiagnosticsChangeRegistration {
  let registration: Disposable | undefined;
  let providerSubscriptionAdded = false;
  const disposeRegistration = (): void => {
    registration?.dispose();
    registration = undefined;
  };
  const providerSubscription: Disposable = { dispose: disposeRegistration };
  const syncRegistration = (): void => {
    if (!isDiagnosticsEnabled(options.enabled)) {
      disposeRegistration();
      return;
    }
    if (registration) return;
    registration = options.register();
    if (providerSubscriptionAdded) return;
    providerSubscriptionAdded = true;
    options.addSubscription(providerSubscription);
  };

  syncRegistration();
  options.addSubscription(options.onDidChangeConfiguration(syncRegistration));

  return { dispose: disposeRegistration };
}