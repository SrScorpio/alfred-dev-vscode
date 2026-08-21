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
