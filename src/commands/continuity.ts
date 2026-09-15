/**
 * Catálogo de continuidad de la paleta Alfred Dev.
 *
 * Expone Progress, Pause y Retomar con prompts `@alfred` fijos. Los comandos
 * de paleta y el TreeView reutilizan este módulo; no duplicar los textos en
 * `commands/index`.
 *
 * @module commands/continuity
 */

export interface AlfredContinuityAction {
  id: string;
  label: string;
  prompt: string;
  command: string;
  description?: string;
}

export const ALFRED_CONTINUITY: readonly AlfredContinuityAction[] = [
  {
    id: 'progress',
    label: 'Alfred Dev: Ver progreso',
    command: 'alfred-dev.progress',
    prompt: '@alfred Reconstruye el progreso: issues/PRs de GitHub y docs/project/status.md. No inventes estado.',
  },
  {
    id: 'pause',
    label: 'Alfred Dev: Pausar trabajo',
    command: 'alfred-dev.pause',
    prompt: '@alfred Pausa el trabajo actual: deja handoff en la issue in-progress o en el snapshot. No implementes código.',
  },
  {
    id: 'retomar',
    label: 'Alfred Dev: Retomar trabajo',
    command: 'alfred-dev.retomar',
    prompt: '@alfred Retoma el trabajo in-progress o in-review, o el snapshot local. No reinventes el flujo.',
  },
];

export interface ContinuityCommandDeps {
  quickPick?: (items: AlfredContinuityAction[]) => PromiseLike<AlfredContinuityAction | undefined>;
  openChat: (prompt: string) => unknown;
}

/**
 * Elementos del QuickPick de continuidad, con el id estable como descripción.
 *
 * @returns Copia de las acciones listas para `showQuickPick` o el TreeView.
 */
export function getContinuityQuickPickItems(): AlfredContinuityAction[] {
  return ALFRED_CONTINUITY.map((action) => ({
    ...action,
    description: action.id,
  }));
}

/**
 * Abre el chat con una acción de continuidad.
 *
 * Si llega `actionId`, ejecuta esa acción (comando de paleta). Si no, muestra
 * el QuickPick. Cancelar no abre el chat.
 *
 * @param deps Adaptadores de QuickPick y apertura de chat.
 * @param actionId Id opcional (`progress`, `pause`, `retomar`).
 * @returns `void`.
 */
export async function runContinuityCommand(
  deps: ContinuityCommandDeps,
  actionId?: string,
): Promise<void> {
  const selected = actionId
    ? ALFRED_CONTINUITY.find((action) => action.id === actionId)
    : await deps.quickPick?.(getContinuityQuickPickItems());

  if (!selected) {
    return;
  }

  deps.openChat(selected.prompt);
}
