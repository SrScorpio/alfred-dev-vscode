/**
 * Parser de los campos que el TreeView necesita del snapshot de proyecto.
 *
 * Reconoce las etiquetas de `templates/status.md` y limita cada valor a 200
 * caracteres antes de entregarlo al proveedor. No interpreta el resto del
 * Markdown ni decide el estado de GitHub.
 *
 * @module providers/parseStatus
 */
export interface ParsedProjectStatus {
  flow?: string;
  phase?: string;
  pendingGate?: string;
  nextAction?: string;
  message?: string;
}

export const MAX_STATUS_FIELD_LENGTH = 200;

const STATUS_FIELDS = {
  flow: /^\*\*Flujo:\*\*\s*(.+)$/im,
  phase: /^\*\*Fase actual:\*\*\s*(.+)$/im,
  pendingGate: /^\*\*Gate pendiente:\*\*\s*(.+)$/im,
  nextAction: /^\*\*(?:Siguiente acción|Próxima acción)(?: recomendada)?:\*\*\s*(.+)$/im,
} as const;

function readField(content: string, pattern: RegExp): string | undefined {
  const value = content.match(pattern)?.[1].trim();
  if (value === undefined || value.length <= MAX_STATUS_FIELD_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STATUS_FIELD_LENGTH - 3)}...`;
}

/**
 * Extrae los campos de flujo visibles en el TreeView.
 *
 * @param content Contenido de `status.md`; si se omite, devuelve el mensaje de
 * ausencia de snapshot local.
 * @returns Campos reconocidos y truncados, o el mensaje de estado sin snapshot.
 * @example `parseProjectStatus('**Flujo:** feature').flow === 'feature'`.
 */
export function parseProjectStatus(content?: string): ParsedProjectStatus {
  if (content === undefined) {
    return { message: 'Sin snapshot local. El estado vive en GitHub Issues.' };
  }

  return {
    flow: readField(content, STATUS_FIELDS.flow),
    phase: readField(content, STATUS_FIELDS.phase),
    pendingGate: readField(content, STATUS_FIELDS.pendingGate),
    nextAction: readField(content, STATUS_FIELDS.nextAction),
  };
}
