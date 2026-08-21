/**
 * Catálogo y tipos del selector global de perfiles de modelo.
 *
 * Expone los valores que puede guardar la configuración de VS Code y prepara
 * sus elementos de QuickPick. No modifica los arrays `model` de los agentes;
 * `commands/index` consume este módulo al abrir el selector.
 *
 * @module commands/modelProfiles
 */
export const MODEL_PROFILES = {
  luna: {
    label: 'Luna',
    description: 'Trabajo frecuente y de protocolo',
  },
  terra: {
    label: 'Terra',
    description: 'Razonamiento y auditoría',
  },
  sol: {
    label: 'Sol',
    description: 'Solo para lo muy complicado',
  },
} as const;

export type ModelProfile = keyof typeof MODEL_PROFILES;

export interface ModelProfileQuickPickItem {
  label: string;
  description: string;
  profile: ModelProfile;
  picked?: boolean;
}

/**
 * Convierte el perfil guardado en elementos para el selector de VS Code.
 *
 * @param selectedProfile Perfil global activo; si se omite, se usa `luna`.
 * @returns Lista ordenada de perfiles con el elemento activo marcado como `picked`.
 * @example `getModelProfileItems('terra')[1].picked === true`.
 */
export function getModelProfileItems(selectedProfile?: ModelProfile): ModelProfileQuickPickItem[] {
  const activeProfile = selectedProfile ?? 'luna';

  return (Object.entries(MODEL_PROFILES) as [ModelProfile, (typeof MODEL_PROFILES)[ModelProfile]][]).map(
    ([profile, details]) => ({
      label: details.label,
      description: details.description,
      profile,
      picked: profile === activeProfile,
    }),
  );
}
