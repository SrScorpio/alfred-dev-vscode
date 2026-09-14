import * as readline from 'readline';
import { JsonMemoryStore, type MemoryStore } from './memoryStore';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS = [
  {
    name: 'memory_put',
    description: 'Guarda contexto local sanitizado con una clave.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'], additionalProperties: false },
  },
  {
    name: 'memory_get',
    description: 'Obtiene contexto local por clave.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'], additionalProperties: false },
  },
  {
    name: 'memory_search',
    description: 'Busca texto en el contexto local.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
  },
] as const;

export async function handleMcpRequest(request: JsonRpcRequest, store: MemoryStore): Promise<JsonRpcResponse> {
  const id = request.id ?? null;
  try {
    if (request.method === 'initialize') {
      return response(id, { protocolVersion: requestedProtocolVersion(request.params), capabilities: { tools: {} }, serverInfo: { name: 'alfred-dev-memory', version: '1.0.0' } });
    }
    if (request.method === 'ping') return response(id, {});
    if (request.method === 'tools/list') return response(id, { tools: TOOLS });
    if (request.method === 'tools/call') return response(id, await callTool(request.params, store));
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Método MCP no soportado' } };
  } catch (error: unknown) {
    return { jsonrpc: '2.0', id, error: { code: -32602, message: error instanceof Error ? error.message : 'Solicitud MCP no válida' } };
  }
}

async function callTool(params: unknown, store: MemoryStore): Promise<{ content: Array<{ type: 'text'; text: string }>; isError: boolean }> {
  if (!isObject(params) || typeof params.name !== 'string' || !isObject(params.arguments)) {
    throw new Error('Parámetros de herramienta no válidos');
  }
  if (params.name === 'memory_put') {
    const key = requiredString(params.arguments, 'key');
    const value = requiredString(params.arguments, 'value');
    await store.put(key, value);
    return toolResult('Memoria local guardada.');
  }
  if (params.name === 'memory_get') {
    const value = await store.get(requiredString(params.arguments, 'key'));
    return toolResult(value ?? 'Entrada no encontrada.');
  }
  if (params.name === 'memory_search') {
    const records = await store.search(requiredString(params.arguments, 'query'));
    return toolResult(JSON.stringify(records));
  }
  throw new Error('Herramienta MCP no soportada');
}

function toolResult(text: string): { content: Array<{ type: 'text'; text: string }>; isError: boolean } {
  return { content: [{ type: 'text', text }], isError: false };
}

function requiredString(value: Record<string, unknown>, property: string): string {
  const candidate = value[property];
  if (typeof candidate !== 'string') throw new Error(`El campo ${property} debe ser texto`);
  return candidate;
}

function requestedProtocolVersion(params: unknown): string {
  return isObject(params) && typeof params.protocolVersion === 'string' ? params.protocolVersion : '2024-11-05';
}

function response(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function runServer(): Promise<void> {
  const memoryPath = process.env.ALFRED_DEV_MEMORY_PATH;
  if (!memoryPath) throw new Error('Falta ALFRED_DEV_MEMORY_PATH');
  const encodedEncryptionKey = process.env.ALFRED_DEV_MEMORY_KEY;
  if (!encodedEncryptionKey) throw new Error('Falta ALFRED_DEV_MEMORY_KEY');
  const encryptionKey = Buffer.from(encodedEncryptionKey, 'base64');
  if (encryptionKey.length !== 32 || encryptionKey.toString('base64') !== encodedEncryptionKey) {
    throw new Error('ALFRED_DEV_MEMORY_KEY no es válida');
  }
  const store = new JsonMemoryStore(memoryPath, { getKey: async () => encryptionKey });
  const input = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of input) {
    if (!line.trim()) continue;
    let request: JsonRpcRequest;
    try {
      request = JSON.parse(line) as JsonRpcRequest;
    } catch {
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON no válido' } })}\n`);
      continue;
    }
    if (request.id === undefined) continue;
    process.stdout.write(`${JSON.stringify(await handleMcpRequest(request, store))}\n`);
  }
}

if (require.main === module) {
  void runServer().catch(() => {
    process.stderr.write('Alfred Dev Memory MCP no pudo iniciarse.\n');
    process.exitCode = 1;
  });
}