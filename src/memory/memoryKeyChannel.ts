import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

export const MEMORY_KEY_BYTES = 32;
export const MEMORY_KEY_SOCKET_ENV = 'ALFRED_DEV_MEMORY_KEY_SOCKET';
export const MEMORY_KEY_HANDOFF_TIMEOUT_MS = 5000;

export interface MemoryKeyHandoff {
  socketPath: string;
  delivered: Promise<void>;
  close(): Promise<void>;
}

export interface MemoryKeyChannelTimeout {
  timeoutMs?: number;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

function timeoutMsFrom(options: MemoryKeyChannelTimeout | undefined, fallback: number): number {
  return options?.timeoutMs ?? fallback;
}

/** Builds a unique local IPC path for a one-shot key handoff. */
export function createMemoryKeySocketPath(): string {
  const entropy = randomBytes(16).toString('hex');
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\alfred-dev-memory-${entropy}`;
  }
  return path.join(os.tmpdir(), `alfred-dev-memory-${entropy}.sock`);
}

/** Environment passed to the MCP child: path and socket only, never the key. */
export function createMemoryMcpChildEnvironment(memoryPath: string, socketPath: string): Record<string, string> {
  return {
    ELECTRON_RUN_AS_NODE: '1',
    ALFRED_DEV_MEMORY_PATH: memoryPath,
    [MEMORY_KEY_SOCKET_ENV]: socketPath,
  };
}

async function unlinkUnixSocket(socketPath: string): Promise<void> {
  if (process.platform === 'win32') return;
  try {
    await fs.unlink(socketPath);
  } catch (error: unknown) {
    if (!isFileNotFoundError(error)) throw error;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/** Listens once, writes exactly 32 bytes, then closes. */
export async function offerMemoryEncryptionKey(
  encryptionKey: Buffer,
  options?: MemoryKeyChannelTimeout,
): Promise<MemoryKeyHandoff> {
  if (encryptionKey.length !== MEMORY_KEY_BYTES) {
    throw new Error('La clave de cifrado no es válida');
  }
  const socketPath = createMemoryKeySocketPath();
  await unlinkUnixSocket(socketPath);

  const delivered = createDeferred<void>();
  void delivered.promise.catch(() => undefined);
  let accepted = false;
  let closed = false;
  let settled = false;
  let timeout: NodeJS.Timeout | undefined;
  const server = net.createServer();

  const settle = (error?: Error): void => {
    if (settled) return;
    settled = true;
    if (error) delivered.reject(error);
    else delivered.resolve();
  };

  const close = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    if (timeout) clearTimeout(timeout);
    await new Promise<void>((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close(() => resolve());
    });
    await unlinkUnixSocket(socketPath);
  };

  timeout = setTimeout(() => {
    settle(new Error('Timeout entregando la clave de memoria'));
    void close();
  }, timeoutMsFrom(options, MEMORY_KEY_HANDOFF_TIMEOUT_MS));

  server.on('connection', (socket) => {
    if (accepted || closed) {
      socket.destroy();
      return;
    }
    accepted = true;
    if (timeout) clearTimeout(timeout);
    server.close();
    socket.end(encryptionKey);
    socket.once('close', () => {
      settle();
      void close();
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(socketPath, resolve);
    });
  } catch (error: unknown) {
    settle(error instanceof Error ? error : new Error('No se pudo abrir el canal de clave'));
    await close();
    throw error;
  }

  return {
    socketPath,
    delivered: delivered.promise,
    close,
  };
}

/** Connects to the one-shot socket and reads exactly 32 bytes. */
export async function receiveMemoryEncryptionKey(
  socketPath: string,
  options?: MemoryKeyChannelTimeout,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  const socket = net.createConnection(socketPath);

  return new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Timeout recibiendo la clave de memoria'));
    }, timeoutMsFrom(options, MEMORY_KEY_HANDOFF_TIMEOUT_MS));

    const fail = (error: Error): void => {
      clearTimeout(timeout);
      socket.destroy();
      reject(error);
    };

    socket.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      receivedBytes += chunk.length;
      if (receivedBytes > MEMORY_KEY_BYTES) {
        fail(new Error('La clave de cifrado no es válida'));
      }
    });
    socket.on('end', () => {
      clearTimeout(timeout);
      const encryptionKey = Buffer.concat(chunks);
      if (encryptionKey.length !== MEMORY_KEY_BYTES) {
        reject(new Error('La clave de cifrado no es válida'));
        return;
      }
      resolve(encryptionKey);
    });
    socket.on('error', (error: Error) => {
      fail(error);
    });
  });
}

/** Reads the key from the socket named in env and deletes that variable. */
export async function takeMemoryEncryptionKeyFromEnv(env: NodeJS.ProcessEnv): Promise<Buffer> {
  const socketPath = env[MEMORY_KEY_SOCKET_ENV];
  if (!socketPath) throw new Error(`Falta ${MEMORY_KEY_SOCKET_ENV}`);
  delete env[MEMORY_KEY_SOCKET_ENV];
  return receiveMemoryEncryptionKey(socketPath);
}
