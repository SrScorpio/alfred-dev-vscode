/** Bounded, local JSON memory backend used only when the user opts in. */
import { promises as fs } from 'fs';
import * as path from 'path';
import { sanitizeSecrets } from '../security/secretScanner';

export const MAX_MEMORY_FILE_SIZE = 256 * 1024;
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_MAX_VALUE_LENGTH = 4000;

export interface MemoryRecord {
  key: string;
  value: string;
}

interface StoredMemoryRecord extends MemoryRecord {
  updatedAt: string;
}

interface MemoryFile {
  version: 1;
  entries: StoredMemoryRecord[];
}

export interface MemoryStoreOptions {
  maxEntries?: number;
  maxValueLength?: number;
}

export interface MemoryStore {
  isEnabled(): Promise<boolean>;
  put(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  search(query: string): Promise<MemoryRecord[]>;
}

function validateKey(key: string): string {
  const normalized = key.trim();
  if (!normalized || normalized.length > 128 || /[\r\n]/.test(normalized)) {
    throw new Error('La clave de memoria no es válida');
  }
  return normalized;
}

export class JsonMemoryStore implements MemoryStore {
  private readonly maxEntries: number;
  private readonly maxValueLength: number;

  constructor(private readonly filePath: string, options: MemoryStoreOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.maxValueLength = options.maxValueLength ?? DEFAULT_MAX_VALUE_LENGTH;
  }

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async put(key: string, value: string): Promise<void> {
    const normalizedKey = validateKey(key);
    const sanitizedValue = sanitizeSecrets(value);
    if (sanitizedValue.length > this.maxValueLength) {
      throw new Error(`El valor de memoria supera el límite de ${this.maxValueLength} caracteres`);
    }

    const memory = await this.read();
    const existingIndex = memory.entries.findIndex((entry) => entry.key === normalizedKey);
    const record = { key: normalizedKey, value: sanitizedValue, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) {
      memory.entries[existingIndex] = record;
    } else {
      if (memory.entries.length >= this.maxEntries) {
        throw new Error(`La memoria alcanza el límite máximo de ${this.maxEntries} entradas`);
      }
      memory.entries.push(record);
    }
    await this.write(memory);
  }

  async get(key: string): Promise<string | undefined> {
    return (await this.read()).entries.find((entry) => entry.key === validateKey(key))?.value;
  }

  async search(query: string): Promise<MemoryRecord[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [];
    return (await this.read()).entries
      .filter((entry) => `${entry.key} ${entry.value}`.toLocaleLowerCase().includes(normalizedQuery))
      .map(({ key, value }) => ({ key, value }));
  }

  private async read(): Promise<MemoryFile> {
    try {
      const stats = await fs.stat(this.filePath);
      if (stats.size > MAX_MEMORY_FILE_SIZE) {
        throw new Error('La memoria local supera el tamaño máximo permitido de 256 KiB');
      }
      const parsed: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      if (!isMemoryFile(parsed)) throw new Error('La memoria local tiene un formato no válido');
      return parsed;
    } catch (error: unknown) {
      if (isFileNotFoundError(error)) return { version: 1, entries: [] };
      throw error;
    }
  }

  private async write(memory: MemoryFile): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(memory, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporaryPath, this.filePath);
  }
}

function isMemoryFile(value: unknown): value is MemoryFile {
  return typeof value === 'object' && value !== null && (value as MemoryFile).version === 1
    && Array.isArray((value as MemoryFile).entries);
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

type MemoryFactory = () => Promise<MemoryStore>;

/** Defers backend creation and returns a no-op store while disabled. */
export function createLazyMemoryStore(enabled: boolean, factory: MemoryFactory): MemoryStore {
  let backend: Promise<MemoryStore> | undefined;
  const getBackend = async (): Promise<MemoryStore> => {
    backend ??= factory();
    return backend;
  };

  return {
    isEnabled: async () => enabled,
    put: async (key, value) => { if (enabled) await (await getBackend()).put(key, value); },
    get: async (key) => enabled ? (await getBackend()).get(key) : undefined,
    search: async (query) => enabled ? (await getBackend()).search(query) : [],
  };
}