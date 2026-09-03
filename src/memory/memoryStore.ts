/** Bounded, local JSON memory backend used only when the user opts in. */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { sanitizeSecrets } from '../security/secretScanner';

export const MAX_MEMORY_FILE_SIZE = 256 * 1024;
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_MAX_VALUE_LENGTH = 4000;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const AUTHENTICATED_CONTEXT = Buffer.from('alfred-dev-memory:v2:aes-256-gcm', 'utf8');
const MEMORY_ENCRYPTION_SECRET_KEY = 'alfred-dev.memory.encryption-key.v1';

export interface MemoryRecord {
  key: string;
  value: string;
}

interface StoredMemoryRecord extends MemoryRecord {
  updatedAt: string;
}

interface MemoryPayload {
  entries: StoredMemoryRecord[];
}

interface EncryptedMemoryFile {
  version: 2;
  algorithm: typeof ENCRYPTION_ALGORITHM;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface MemoryEncryptionKeyProvider {
  getKey(): Promise<Buffer | undefined>;
}

export interface SecretStorageLike {
  get(key: string): PromiseLike<string | undefined>;
  store(key: string, value: string): PromiseLike<void>;
  delete(key: string): PromiseLike<void>;
}

export class SecretStorageMemoryEncryptionKeyProvider implements MemoryEncryptionKeyProvider {
  private keyPromise: Promise<Buffer> | undefined;

  constructor(private readonly secretStorage: SecretStorageLike) {}

  async getKey(): Promise<Buffer> {
    this.keyPromise ??= this.loadOrCreateKey();
    return Buffer.from(await this.keyPromise);
  }

  private async loadOrCreateKey(): Promise<Buffer> {
    const storedKey = await this.secretStorage.get(MEMORY_ENCRYPTION_SECRET_KEY);
    if (storedKey !== undefined) {
      const decodedKey = Buffer.from(storedKey, 'base64');
      if (decodedKey.length !== ENCRYPTION_KEY_BYTES || decodedKey.toString('base64') !== storedKey) {
        throw new Error('La clave de cifrado almacenada no es válida');
      }
      return decodedKey;
    }
    const generatedKey = randomBytes(ENCRYPTION_KEY_BYTES);
    await this.secretStorage.store(MEMORY_ENCRYPTION_SECRET_KEY, generatedKey.toString('base64'));
    return generatedKey;
  }
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

  constructor(
    private readonly filePath: string,
    private readonly keyProvider: MemoryEncryptionKeyProvider = { getKey: async () => undefined },
    options: MemoryStoreOptions = {},
  ) {
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

  private async read(): Promise<MemoryPayload> {
    try {
      const stats = await fs.stat(this.filePath);
      if (stats.size > MAX_MEMORY_FILE_SIZE) {
        throw new Error('La memoria local supera el tamaño máximo permitido de 256 KiB');
      }
      const parsed: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      if (isLegacyMemoryFile(parsed)) {
        throw new Error('La memoria local usa un formato legado no cifrado; elimínala antes de continuar');
      }
      if (!isEncryptedMemoryFile(parsed)) throw new Error('La memoria local tiene un formato no válido');
      return this.decrypt(parsed);
    } catch (error: unknown) {
      if (isFileNotFoundError(error)) return { entries: [] };
      if (error instanceof SyntaxError) throw new Error('La memoria local tiene un formato no válido');
      throw error;
    }
  }

  private async write(memory: MemoryPayload): Promise<void> {
    const serializedMemory = JSON.stringify(await this.encrypt(memory), null, 2);
    if (Buffer.byteLength(serializedMemory, 'utf8') > MAX_MEMORY_FILE_SIZE) {
      throw new Error('La memoria local supera el tamaño máximo permitido de 256 KiB');
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, serializedMemory, { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporaryPath, this.filePath);
  }

  private async encrypt(memory: MemoryPayload): Promise<EncryptedMemoryFile> {
    const key = await this.requireEncryptionKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    cipher.setAAD(AUTHENTICATED_CONTEXT);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(memory), 'utf8'), cipher.final()]);
    return {
      version: 2,
      algorithm: ENCRYPTION_ALGORITHM,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  private async decrypt(memoryFile: EncryptedMemoryFile): Promise<MemoryPayload> {
    const key = await this.requireEncryptionKey();
    try {
      const decipher = createDecipheriv(
        ENCRYPTION_ALGORITHM,
        key,
        Buffer.from(memoryFile.iv, 'base64'),
        { authTagLength: AUTH_TAG_BYTES },
      );
      decipher.setAAD(AUTHENTICATED_CONTEXT);
      decipher.setAuthTag(Buffer.from(memoryFile.authTag, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(memoryFile.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
      const parsed: unknown = JSON.parse(plaintext);
      if (!isMemoryPayload(parsed)) throw new Error('invalid-payload');
      return parsed;
    } catch {
      throw new Error('La memoria local no se pudo descifrar');
    }
  }

  private async requireEncryptionKey(): Promise<Buffer> {
    const key = await this.keyProvider.getKey();
    if (!key || key.length !== ENCRYPTION_KEY_BYTES) {
      throw new Error('La clave de cifrado no está disponible');
    }
    return key;
  }
}

function isMemoryPayload(value: unknown): value is MemoryPayload {
  return typeof value === 'object' && value !== null
    && Array.isArray((value as MemoryPayload).entries)
    && (value as MemoryPayload).entries.every((entry) => typeof entry === 'object' && entry !== null
      && typeof entry.key === 'string' && typeof entry.value === 'string' && typeof entry.updatedAt === 'string');
}

function isEncryptedMemoryFile(value: unknown): value is EncryptedMemoryFile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<EncryptedMemoryFile>;
  return candidate.version === 2
    && candidate.algorithm === ENCRYPTION_ALGORITHM
    && isBase64OfLength(candidate.iv, IV_BYTES)
    && isBase64OfLength(candidate.authTag, AUTH_TAG_BYTES)
    && typeof candidate.ciphertext === 'string' && candidate.ciphertext.length > 0;
}

function isLegacyMemoryFile(value: unknown): boolean {
  return typeof value === 'object' && value !== null && (value as { version?: unknown }).version === 1;
}

function isBase64OfLength(value: unknown, expectedLength: number): value is string {
  return typeof value === 'string' && Buffer.from(value, 'base64').length === expectedLength;
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