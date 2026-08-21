import { promises as fs } from 'fs';

export const MAX_STATUS_FILE_SIZE = 64 * 1024;

export async function readStatusFile(filePath: string): Promise<string> {
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_STATUS_FILE_SIZE) {
    throw new Error('status.md supera el tamaño máximo permitido de 64 KiB');
  }

  return fs.readFile(filePath, 'utf8');
}
