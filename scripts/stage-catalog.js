/**
 * Copia el catálogo al directorio que viaja dentro del VSIX.
 * Lo ejecuta vscode:prepublish, así que `vsce package` no depende de un paso manual.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'catalog');

function copyFiles(sourceDir, targetDir, pattern) {
  fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(sourceDir)) return 0;
  let copied = 0;
  for (const name of fs.readdirSync(sourceDir)) {
    const source = path.join(sourceDir, name);
    if (!fs.statSync(source).isFile() || !pattern.test(name)) continue;
    fs.copyFileSync(source, path.join(targetDir, name));
    copied += 1;
  }
  return copied;
}

function copyDirectories(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(sourceDir)) return 0;
  let copied = 0;
  for (const name of fs.readdirSync(sourceDir)) {
    const source = path.join(sourceDir, name);
    if (!fs.statSync(source).isDirectory()) continue;
    fs.cpSync(source, path.join(targetDir, name), { recursive: true });
    copied += 1;
  }
  return copied;
}

fs.rmSync(target, { recursive: true, force: true });
const agents = copyFiles(path.join(root, 'agents'), path.join(target, 'agents'), /\.agent\.md$/);
const skills = copyDirectories(path.join(root, 'skills', 'core'), path.join(target, 'skills'));
const instructions = copyFiles(path.join(root, 'instructions'), path.join(target, 'instructions'), /\.instructions\.md$/);
const templates = copyFiles(path.join(root, 'templates'), path.join(target, 'templates'), /\.md$/);

if (agents < 12) {
  console.error(`stage-catalog: esperaba 12 agentes y copió ${agents}`);
  process.exit(1);
}
console.log(`stage-catalog: ${agents} agentes, ${skills} skills, ${instructions} instrucciones, ${templates} plantillas`);
