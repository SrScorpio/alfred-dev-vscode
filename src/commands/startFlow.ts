/**
 * Arranque del QuickPick de flujos Alfred Dev.
 *
 * Extrae la orquestación cancelar/seleccionar para poder testearla sin VS Code.
 *
 * @module commands/startFlow
 */
import { getFlowQuickPickItems } from './flows';
import type { AlfredFlow } from './flows';

export interface StartFlowCommandDeps {
  quickPick: (items: AlfredFlow[]) => PromiseLike<AlfredFlow | undefined>;
  openChat: (prompt: string) => unknown;
  showInformation?: (message: string) => unknown;
}

/**
 * Muestra el selector de flujos y abre el chat solo si hay selección.
 *
 * @param deps Adaptadores de QuickPick y apertura de chat.
 * @returns `void`. Cancelar no abre el chat.
 */
export async function runStartFlowCommand(deps: StartFlowCommandDeps): Promise<void> {
  const selected = await deps.quickPick(getFlowQuickPickItems());
  if (!selected) {
    return;
  }

  deps.showInformation?.(`Flujo seleccionado: ${selected.label}. Invocando a @alfred en GitHub Copilot...`);
  deps.openChat(selected.prompt);
}
