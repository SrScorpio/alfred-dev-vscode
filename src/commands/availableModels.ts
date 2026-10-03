/**
 * Catálogo vivo de modelos de chat que el IDE expone en el momento de abrir
 * el selector. No es la política de coste (luna, terra, sol) y no reescribe
 * el frontmatter `model` de los agentes.
 *
 * @module commands/availableModels
 */
export interface ChatModelInfo {
  id: string;
  name: string;
  vendor: string;
  family: string;
}

export interface AvailableModelQuickPickItem {
  label: string;
  description: string;
  detail: string;
  modelId: string;
  picked?: boolean;
}

const MAX_LABEL_LENGTH = 120;
const MAX_ID_LENGTH = 200;

/**
 * Normaliza un valor anunciado por el IDE antes de pintarlo o guardarlo.
 * Rechaza vacío, controles y cadenas demasiado largas.
 *
 * @param value Texto crudo del modelo.
 * @param maxLength Tope de caracteres.
 * @returns Texto limpio, o `undefined` si no es usable.
 */
export function sanitizeModelText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return undefined;
  }
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) {
    return undefined;
  }
  return cleaned;
}

/**
 * Ordena por vendor, familia y nombre, y descarta ids repetidos.
 * El primer duplicado gana: el IDE puede anunciar el mismo id dos veces.
 *
 * @param models Modelos devueltos por `vscode.lm.selectChatModels`.
 * @returns Catálogo estable, sin ids vacíos ni repetidos.
 */
export function normalizeChatModels(models: readonly ChatModelInfo[]): ChatModelInfo[] {
  const seen = new Set<string>();
  const usable: ChatModelInfo[] = [];
  for (const model of models) {
    const id = sanitizeModelText(model.id, MAX_ID_LENGTH);
    const name = sanitizeModelText(model.name, MAX_LABEL_LENGTH);
    if (!id || !name || seen.has(id)) {
      continue;
    }
    const vendor = sanitizeModelText(model.vendor, MAX_LABEL_LENGTH) ?? '';
    const family = sanitizeModelText(model.family, MAX_LABEL_LENGTH) ?? '';
    seen.add(id);
    usable.push({ id, name, vendor, family });
  }
  return usable.sort((left, right) => {
    const vendorOrder = left.vendor.localeCompare(right.vendor);
    if (vendorOrder !== 0) {
      return vendorOrder;
    }
    const familyOrder = left.family.localeCompare(right.family);
    if (familyOrder !== 0) {
      return familyOrder;
    }
    return left.name.localeCompare(right.name);
  });
}

/**
 * Prepara el QuickPick. El id guardado se marca si sigue existiendo;
 * si el IDE ya no lo anuncia, no se finge que sigue seleccionado.
 *
 * @param models Catálogo ya normalizado.
 * @param selectedModelId Id guardado en `alfred-dev.chatModel`, si hay.
 * @returns Elementos del selector, en el mismo orden que `models`.
 */
export function getAvailableModelItems(
  models: readonly ChatModelInfo[],
  selectedModelId?: string,
): AvailableModelQuickPickItem[] {
  const selected = sanitizeModelText(selectedModelId, MAX_ID_LENGTH);
  return models.map((model) => {
    const vendor = model.vendor || 'sin vendor';
    const family = model.family ? ` · ${model.family}` : '';
    return {
      label: model.name,
      description: `${vendor}${family}`,
      detail: model.id,
      modelId: model.id,
      picked: model.id === selected,
    };
  });
}
