/**
 * Lector acotado del snapshot local que consume el TreeView.
 *
 * Verifica el tamaño antes de leer `docs/project/status.md` para evitar que un
 * workspace aporte un fichero desproporcionado al host de extensiones. Depende
 * de la API asíncrona del sistema de ficheros y lo usa `StatusTreeProvider`.
 *
 * @module providers/readStatusFile
 */
import { promises as fs } from 'fs';

export const MAX_STATUS_FILE_SIZE = 64 * 1024;

/**
 * Lee un snapshot UTF-8 dentro del límite permitido.
 *
 * @param filePath Ruta absoluta del fichero `status.md`.
 * @returns Promise con su contenido textual.
 * @throws Error si el fichero supera 64 KiB; propaga los errores de acceso del
 * sistema de ficheros en cualquier otro caso.
 * @example `await readStatusFile('/workspace/docs/project/status.md')`.
 */
export async function readStatusFile(filePath: string): Promise<string> {
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_STATUS_FILE_SIZE) {
    throw new Error('status.md supera el tamaño máximo permitido de 64 KiB');
  }

  return fs.readFile(filePath, 'utf8');
}
