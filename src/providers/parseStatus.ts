export interface ParsedProjectStatus {
  flow?: string;
  phase?: string;
  pendingGate?: string;
  nextAction?: string;
  message?: string;
}

const STATUS_FIELDS = {
  flow: /^\*\*Flujo:\*\*\s*(.+)$/im,
  phase: /^\*\*Fase actual:\*\*\s*(.+)$/im,
  pendingGate: /^\*\*Gate pendiente:\*\*\s*(.+)$/im,
  nextAction: /^\*\*(?:Siguiente acción|Próxima acción)(?: recomendada)?:\*\*\s*(.+)$/im,
} as const;

function readField(content: string, pattern: RegExp): string | undefined {
  return content.match(pattern)?.[1].trim();
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
