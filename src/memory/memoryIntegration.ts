import { offerMemoryEncryptionKey } from './memoryKeyChannel';
import { clearLocalMemory, type MemoryEncryptionKeyProvider, type MemoryRecord, type MemoryStore } from './memoryStore';

const MEMORY_MCP_PROVIDER_ID = 'alfred-dev.memory';

interface Disposable {
  dispose(): void;
}

interface MemoryMcpProvider {
  provideMcpServerDefinitions(): Promise<unknown[]>;
  resolveMcpServerDefinition(definition: unknown): Promise<unknown>;
}

interface MemoryKeyHandoffHandle {
  socketPath: string;
}

interface MemoryMcpRegistrationOptions {
  enabled: boolean;
  isTrusted: boolean;
  registerProvider?: (id: string, provider: MemoryMcpProvider) => Disposable;
  createDefinition?: (serverPath: string, memoryPath: string, version: string, socketPath?: string) => unknown;
  offerEncryptionKey?: (encryptionKey: Buffer) => Promise<MemoryKeyHandoffHandle>;
  keyProvider: MemoryEncryptionKeyProvider;
  serverPath: string;
  memoryPath: string;
  version: string;
}

interface MemoryMcpTrustRegistrationOptions extends Omit<MemoryMcpRegistrationOptions, 'enabled' | 'isTrusted'> {
  enabled: boolean | (() => boolean);
  isTrusted(): boolean;
  onDidGrantWorkspaceTrust(listener: () => void): Disposable;
  onDidChangeConfiguration?(listener: () => void): Disposable;
  addSubscription(disposable: Disposable): void;
}

export interface MemoryMcpTrustRegistration {
  dispose(): void;
  recycle(): void;
}

function isMemoryEnabled(enabled: boolean | (() => boolean)): boolean {
  return typeof enabled === 'function' ? enabled() : enabled;
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

type TrustCheck = () => boolean;

export interface MemoryCommandHandlers {
  put(): Promise<void>;
  get(): Promise<void>;
  search(): Promise<void>;
}

/** Registers an MCP definition only when both opt-in and the runtime API are present. */
export function registerMemoryMcpProvider(options: MemoryMcpRegistrationOptions): Disposable | undefined {
  if (!options.enabled || !options.isTrusted || !options.registerProvider || !options.createDefinition) return undefined;
  const offerKey = options.offerEncryptionKey ?? offerMemoryEncryptionKey;
  const createDefinition = options.createDefinition;
  return options.registerProvider(MEMORY_MCP_PROVIDER_ID, {
    provideMcpServerDefinitions: async () => [
      createDefinition(options.serverPath, options.memoryPath, options.version),
    ],
    resolveMcpServerDefinition: async () => {
      const encryptionKey = await options.keyProvider.getKey();
      if (!encryptionKey) throw new Error('La clave de cifrado no está disponible');
      const handoff = await offerKey(encryptionKey);
      return createDefinition(options.serverPath, options.memoryPath, options.version, handoff.socketPath);
    },
  });
}

/** Registers MCP immediately or once when VS Code grants workspace trust. */
export function registerMemoryMcpProviderOnTrust(options: MemoryMcpTrustRegistrationOptions): MemoryMcpTrustRegistration {
  let registration: Disposable | undefined;
  let providerSubscriptionAdded = false;
  const canRegister = Boolean(options.registerProvider && options.createDefinition);
  const disposeRegistration = (): void => {
    registration?.dispose();
    registration = undefined;
  };
  const providerSubscription: Disposable = { dispose: disposeRegistration };
  const syncRegistration = (): void => {
    if (!isMemoryEnabled(options.enabled) || !options.isTrusted()) {
      disposeRegistration();
      return;
    }
    if (registration) return;
    const nextRegistration = registerMemoryMcpProvider({ ...options, enabled: true, isTrusted: true });
    if (!nextRegistration) return;
    registration = nextRegistration;
    if (providerSubscriptionAdded) return;
    providerSubscriptionAdded = true;
    options.addSubscription(providerSubscription);
  };

  syncRegistration();
  if (canRegister) {
    options.addSubscription(options.onDidGrantWorkspaceTrust(syncRegistration));
    if (options.onDidChangeConfiguration) {
      options.addSubscription(options.onDidChangeConfiguration(syncRegistration));
    }
  }

  return {
    dispose: disposeRegistration,
    recycle: () => {
      disposeRegistration();
      syncRegistration();
    },
  };
}

/** Deletes local memory and recycles the MCP child so it cannot keep the old key. */
export async function clearLocalMemoryAndRecycleMcp(
  filePath: string,
  keyProvider: { deleteKey(): Promise<void> },
  recycle?: () => void,
): Promise<void> {
  await clearLocalMemory(filePath, keyProvider);
  recycle?.();
}

/** Exposes the same bounded store through commands on VS Code versions without MCP support. */
export function createMemoryCommandHandlers(store: MemoryStore, ui: MemoryCommandUi, isTrusted: TrustCheck = () => true): MemoryCommandHandlers {
  const requireEnabled = async (): Promise<boolean> => {
    if (!isTrusted()) {
      ui.showError('La memoria local requiere un workspace de confianza.');
      return false;
    }
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