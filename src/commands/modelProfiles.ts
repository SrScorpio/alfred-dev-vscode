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
}

export function getModelProfileItems(): ModelProfileQuickPickItem[] {
  return (Object.entries(MODEL_PROFILES) as [ModelProfile, (typeof MODEL_PROFILES)[ModelProfile]][]).map(
    ([profile, details]) => ({
      label: details.label,
      description: details.description,
      profile,
    }),
  );
}
