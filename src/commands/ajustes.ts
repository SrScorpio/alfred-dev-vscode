/**
 * QuickPick de ajustes nativos de Alfred Dev.
 *
 * Reutiliza el perfil de modelo, los toggles de memoria y diagnósticos, y el
 * comando de instalar Secret Guard. No inventa settings nuevos.
 *
 * @module commands/ajustes
 */

export type AjustesConfigTarget = 'Global' | 'Workspace';

export interface AjustesQuickPickItem {
  id: string;
  label: string;
  description?: string;
  command?: string;
  setting?: string;
}

export interface AjustesState {
  memoryEnabled: boolean;
  diagnosticsEnabled: boolean;
}

export interface AjustesInspection {
  workspaceValue?: boolean;
}

export interface AjustesCommandDeps {
  quickPick: (items: AjustesQuickPickItem[]) => PromiseLike<AjustesQuickPickItem | undefined>;
  getBoolean: (key: string, defaultValue: boolean) => boolean;
  inspect: (key: string) => AjustesInspection;
  updateBoolean: (key: string, value: boolean, target: AjustesConfigTarget) => PromiseLike<void>;
  executeCommand: (command: string) => PromiseLike<unknown>;
  showInformation?: (message: string) => unknown;
}

const MEMORY_SETTING = 'alfred-dev.memory.enabled';
const DIAGNOSTICS_SETTING = 'alfred-dev.secretGuard.diagnostics';
const MEMORY_DEFAULT = false;
const DIAGNOSTICS_DEFAULT = true;

/**
 * Construye los elementos del QuickPick de ajustes según el estado actual.
 *
 * @param state Valores actuales de memoria y diagnósticos.
 * @returns Items con ids estables para el selector.
 */
export function getAjustesQuickPickItems(state: AjustesState): AjustesQuickPickItem[] {
  return [
    {
      id: 'model-profile',
      label: 'Perfil de modelo',
      description: 'luna / terra / sol (ajuste global)',
      command: 'alfred-dev.selectModelProfile',
    },
    {
      id: 'memory-enabled',
      label: state.memoryEnabled ? 'Desactivar memoria local' : 'Activar memoria local',
      description: MEMORY_SETTING,
      setting: MEMORY_SETTING,
    },
    {
      id: 'secret-guard-diagnostics',
      label: state.diagnosticsEnabled
        ? 'Desactivar diagnósticos de Secret Guard'
        : 'Activar diagnósticos de Secret Guard',
      description: DIAGNOSTICS_SETTING,
      setting: DIAGNOSTICS_SETTING,
    },
    {
      id: 'install-secret-hook',
      label: 'Instalar Secret Guard pre-commit',
      description: 'Reutiliza el comando existente',
      command: 'alfred-dev.installSecretHook',
    },
  ];
}

/**
 * Muestra el selector de ajustes y aplica la opción elegida.
 *
 * Cancelar no cambia configuración ni ejecuta comandos. Los toggles invierten
 * el valor actual. Si hay override de workspace se escribe ahí; si no, Global.
 *
 * @param deps Adaptadores de QuickPick, configuración y comandos.
 * @returns `void`.
 */
export async function runAjustesCommand(deps: AjustesCommandDeps): Promise<void> {
  const selected = await deps.quickPick(getAjustesQuickPickItems({
    memoryEnabled: deps.getBoolean(MEMORY_SETTING, MEMORY_DEFAULT),
    diagnosticsEnabled: deps.getBoolean(DIAGNOSTICS_SETTING, DIAGNOSTICS_DEFAULT),
  }));

  if (!selected) {
    return;
  }

  if (selected.command) {
    await deps.executeCommand(selected.command);
    return;
  }

  if (!selected.setting) {
    return;
  }

  const defaultValue = selected.setting === MEMORY_SETTING ? MEMORY_DEFAULT : DIAGNOSTICS_DEFAULT;
  const current = deps.getBoolean(selected.setting, defaultValue);
  const nextValue = !current;
  const target: AjustesConfigTarget = deps.inspect(selected.setting).workspaceValue !== undefined
    ? 'Workspace'
    : 'Global';
  await deps.updateBoolean(selected.setting, nextValue, target);
  deps.showInformation?.(`${selected.setting}: ${nextValue} (${target})`);
}
