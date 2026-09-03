import type { MemoryRecord, MemoryStore } from './memoryStore';

const MEMORY_MCP_PROVIDER_ID = 'alfred-dev.memory';

interface Disposable {
  dispose(): void;
}

interface MemoryMcpProvider {
  provideMcpServerDefinitions(): unknown[];
}

interface MemoryMcpRegistrationOptions {
  enabled: boolean;
  registerProvider?: (id: string, provider: MemoryMcpProvider) => Disposable;
  createDefinition?: (serverPath: string, memoryPath: string, version: string) => unknown;
  serverPath: string;
  memoryPath: string;
  version: string;
}

export interface MemoryCommandPromptResult {
  key: string;
  value?: string;
}

interface MemoryCommandUi {
  prompt(request: 'put' | 'get' | 'search'): Promise<MemoryCommandPromptResult | undefined>;
  showInformation(message: string): void;
  showError(message: string): void;
}

export interface MemoryCommandHandlers {
  put(): Promise<void>;
  get(): Promise<void>;
  search(): Promise<void>;
}

/** Registers an MCP definition only when both opt-in and the runtime API are present. */
export function registerMemoryMcpProvider(options: MemoryMcpRegistrationOptions): Disposable | undefined {
  if (!options.enabled || !options.registerProvider || !options.createDefinition) return undefined;
  return options.registerProvider(MEMORY_MCP_PROVIDER_ID, {
    provideMcpServerDefinitions: () => [options.createDefinition!(
      options.serverPath,
      options.memoryPath,
      options.version,
    )],
  });
}

/** Exposes the same bounded store through commands on VS Code versions without MCP support. */
export function createMemoryCommandHandlers(store: MemoryStore, ui: MemoryCommandUi): MemoryCommandHandlers {
  const requireEnabled = async (): Promise<boolean> => {
    if (await store.isEnabled()) return true;
    ui.showError('Activa alfred-dev.memory.enabled para usar la memoria local.');
    return false;
  };

  return {
    put: async () => {
      if (!await requireEnabled()) return;
      const input = await ui.prompt('put');
      if (!input?.value) return;
      await store.put(input.key, input.value);
      ui.showInformation('Memoria local guardada.');
    },
    get: async () => {
      if (!await requireEnabled()) return;
      const input = await ui.prompt('get');
      if (!input) return;
      const value = await store.get(input.key);
      ui.showInformation(value === undefined ? 'No existe una entrada con esa clave.' : value);
    },
    search: async () => {
      if (!await requireEnabled()) return;
      const input = await ui.prompt('search');
      if (!input) return;
      ui.showInformation(formatSearchResults(await store.search(input.key)));
    },
  };
}

function formatSearchResults(records: MemoryRecord[]): string {
  if (records.length === 0) return 'No hay resultados en la memoria local.';
  return records.map((record) => `${record.key}: ${record.value}`).join('\n');
}