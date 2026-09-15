/**
 * Catálogo de flujos de la paleta Alfred Dev.
 *
 * Expone ids estables, etiquetas en castellano y prompts `@alfred` fijos.
 * `startFlow` consume este módulo para el QuickPick; no duplicar la lista
 * en `commands/index`.
 *
 * @module commands/flows
 */

export interface AlfredFlow {
  id: string;
  label: string;
  prompt: string;
  description?: string;
}

export const ALFRED_FLOWS: readonly AlfredFlow[] = [
  {
    id: 'feature',
    label: 'Feature (idea -> entrega)',
    prompt: '@alfred Arranca el flujo Feature (Idea -> Entrega)',
  },
  {
    id: 'quick',
    label: 'Quick (cambio acotado)',
    prompt: '@alfred Arranca el flujo Quick: cambio pequeño o bien delimitado, menos ceremonia que Feature, TDD igual.',
  },
  {
    id: 'fix',
    label: 'Fix (diagnóstico -> TDD -> QA)',
    prompt: '@alfred Arranca el flujo Fix (Diagnóstico -> TDD -> QA)',
  },
  {
    id: 'spike',
    label: 'Spike (investigación sin implementar)',
    prompt: '@alfred Arranca el flujo Spike (investigación sin implementar)',
  },
  {
    id: 'discuss',
    label: 'Discuss (refinar idea antes de un PRD)',
    prompt: '@alfred Arranca el flujo Discuss (refinar idea antes de un PRD)',
  },
  {
    id: 'audit',
    label: 'Audit (seguridad + calidad)',
    prompt: '@alfred Arranca el flujo Audit (Seguridad + Calidad)',
  },
  {
    id: 'uat',
    label: 'UAT (confirmación humana, no tests)',
    prompt: '@alfred Arranca el flujo UAT (confirmación humana, no tests)',
  },
  {
    id: 'ship',
    label: 'Ship (publicación)',
    prompt: '@alfred Arranca el flujo Ship (Publicación)',
  },
  {
    id: 'lucius',
    label: 'Lucius (segunda opinión en solo lectura)',
    prompt: '@alfred Arranca el flujo Lucius (segunda opinión en solo lectura)',
  },
];

/**
 * Elementos del QuickPick de flujos, con el id estable como descripción.
 *
 * @returns Copia de los flujos listos para `showQuickPick`.
 */
export function getFlowQuickPickItems(): AlfredFlow[] {
  return ALFRED_FLOWS.map((flow) => ({
    ...flow,
    description: flow.id,
  }));
}
