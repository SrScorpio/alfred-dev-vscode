/**
 * Instala el catálogo de agentes que viaja dentro del VSIX.
 *
 * Copilot solo muestra agentes que están en el perfil de usuario
 * (`~/.copilot/agents`) o en `.github/agents` del proyecto. El VSIX no puede
 * registrarlos por `package.json`, así que la extensión los copia y deja
 * constancia de la versión instalada.
 *
 * @module agents/catalogInstaller
 */
import { constants, promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

export const CATALOG_MARKER = '.alfred-dev-catalog.json';

export interface CatalogInstallResult {
  agents: number;
  skills: number;
  instructions: number;
  templates: number;
  changed: boolean;
}

export interface CatalogInstallOptions {
  extensionPath: string;
  version: string;
  homeDir?: string;
  appDataDir?: string;
  platform?: NodeJS.Platform;
  /** Ignora el marcador de versión y vuelve a copiar. Lo usa el comando de reparación. */
  force?: boolean;
}

interface Marker {
  version: string;
}

function userAgentsDir(homeDir: string): string {
  return path.join(homeDir, '.copilot', 'agents');
}

function userSkillsDir(homeDir: string): string {
  return path.join(homeDir, '.copilot', 'skills');
}

function userTemplatesDir(homeDir: string): string {
  return path.join(homeDir, '.copilot', 'alfred-dev', 'templates');
}

/** Carpeta de instrucciones de usuario de VS Code (Code estable). */
export function userInstructionsDir(platform: NodeJS.Platform, homeDir: string, appDataDir: string): string {
  if (platform === 'win32') return path.join(appDataDir, 'Code', 'User', 'instructions');
  if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'instructions');
  }
  return path.join(homeDir, '.config', 'Code', 'User', 'instructions');
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readMarker(agentsDir: string): Promise<Marker | undefined> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(path.join(agentsDir, CATALOG_MARKER), 'utf8'));
    if (typeof parsed === 'object' && parsed !== null && typeof (parsed as Marker).version === 'string') {
      return { version: (parsed as Marker).version };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function copyMatchingFiles(sourceDir: string, targetDir: string, pattern: RegExp): Promise<number> {
  if (!(await pathExists(sourceDir))) return 0;
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !pattern.test(entry.name)) continue;
    await fs.copyFile(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
    copied += 1;
  }
  return copied;
}

async function copySkillDirectories(sourceDir: string, targetDir: string): Promise<number> {
  if (!(await pathExists(sourceDir))) return 0;
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const target = path.join(targetDir, entry.name);
    await fs.rm(target, { recursive: true, force: true });
    await fs.cp(path.join(sourceDir, entry.name), target, { recursive: true });
    copied += 1;
  }
  return copied;
}

/**
 * Copia agentes, skills de proceso, instrucciones y plantillas al perfil.
 *
 * No toca las skills de stack (pesan y son opcionales) ni borra agentes que
 * el usuario haya creado. Si el marcador ya coincide con la versión, no copia.
 */
export async function installUserCatalog(options: CatalogInstallOptions): Promise<CatalogInstallResult> {
  const homeDir = options.homeDir ?? os.homedir();
  const platform = options.platform ?? process.platform;
  const appDataDir = options.appDataDir ?? process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming');
  const agentsDir = userAgentsDir(homeDir);
  const marker = await readMarker(agentsDir);
  if (!options.force && marker?.version === options.version && (await pathExists(path.join(agentsDir, 'alfred.agent.md')))) {
    return { agents: 0, skills: 0, instructions: 0, templates: 0, changed: false };
  }

  const bundled = path.join(options.extensionPath, 'catalog');
  const agents = await copyMatchingFiles(path.join(bundled, 'agents'), agentsDir, /\.agent\.md$/);
  const skills = await copySkillDirectories(path.join(bundled, 'skills'), userSkillsDir(homeDir));
  const instructions = await copyMatchingFiles(
    path.join(bundled, 'instructions'),
    userInstructionsDir(platform, homeDir, appDataDir),
    /\.instructions\.md$/,
  );
  const templates = await copyMatchingFiles(
    path.join(bundled, 'templates'),
    userTemplatesDir(homeDir),
    /\.md$/,
  );
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(
    path.join(agentsDir, CATALOG_MARKER),
    JSON.stringify({ version: options.version, installedAt: new Date().toISOString() }),
    'utf8',
  );
  return { agents, skills, instructions, templates, changed: agents > 0 };
}
