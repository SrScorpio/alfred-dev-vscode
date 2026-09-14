const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const test = require('node:test');

const execFileAsync = promisify(execFile);
const { installSecretHook } = require('../out/security/secretHook.js');

async function runGit(repositoryPath, args) {
  return execFileAsync('git', ['-C', repositoryPath, ...args], { encoding: 'utf8' });
}

async function createRepository(prefix) {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await runGit(repositoryPath, ['init']);
  await runGit(repositoryPath, ['config', 'user.email', 'tests@alfred.dev']);
  await runGit(repositoryPath, ['config', 'user.name', 'Alfred Tests']);
  return repositoryPath;
}

async function getHooksPath(repositoryPath) {
  const { stdout } = await runGit(repositoryPath, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
  return stdout.trim();
}

test('el Secret Guard analiza el blob staged aunque el working tree sea inocuo', async () => {
  const repositoryPath = await createRepository('alfred-hook-index-');
  const stagedSecret = 'sk-' + 'a'.repeat(32);
  const trackedPath = path.join(repositoryPath, 'configuration.txt');
  await fs.writeFile(trackedPath, `apiKey=${stagedSecret}\n`);
  await runGit(repositoryPath, ['add', 'configuration.txt']);
  await fs.writeFile(trackedPath, 'apiKey=local\n');
  await installSecretHook(repositoryPath);

  const guardPath = path.join(await getHooksPath(repositoryPath), 'alfred-secret-guard.js');
  await assert.rejects(
    execFileAsync(process.execPath, [guardPath], { cwd: repositoryPath, encoding: 'utf8' }),
    (error) => {
      assert.equal(error.code, 1);
      assert.doesNotMatch(`${error.stdout}${error.stderr}`, new RegExp(stagedSecret));
      return true;
    },
  );
});

test('instala el Secret Guard cuando .git es un fichero de worktree', async () => {
  const repositoryPath = await createRepository('alfred-hook-main-');
  await fs.writeFile(path.join(repositoryPath, 'README.md'), '# fixture\n');
  await runGit(repositoryPath, ['add', 'README.md']);
  await runGit(repositoryPath, ['commit', '-m', 'test fixture']);
  const worktreePath = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-hook-worktree-'));
  await fs.rm(worktreePath, { recursive: true, force: true });
  await runGit(repositoryPath, ['worktree', 'add', worktreePath, '-b', `test-${Date.now()}`]);

  const gitMetadata = await fs.stat(path.join(worktreePath, '.git'));
  assert.equal(gitMetadata.isFile(), true);
  await installSecretHook(worktreePath);

  const hooksPath = await getHooksPath(worktreePath);
  assert.match(await fs.readFile(path.join(hooksPath, 'pre-commit'), 'utf8'), /alfred-dev-secret-guard/);
});

test('el hook bloquea identificadores AWS temporales staged', async () => {
  const repositoryPath = await createRepository('alfred-hook-asia-');
  const trackedPath = path.join(repositoryPath, 'aws.env');
  await fs.writeFile(trackedPath, `AWS_ACCESS_KEY_ID=ASIA${'A'.repeat(16)}\n`);
  await runGit(repositoryPath, ['add', 'aws.env']);
  await installSecretHook(repositoryPath);

  const guardPath = path.join(await getHooksPath(repositoryPath), 'alfred-secret-guard.js');
  await assert.rejects(
    execFileAsync(process.execPath, [guardPath], { cwd: repositoryPath, encoding: 'utf8' }),
    (error) => error.code === 1 && /posibles secretos/.test(error.stderr),
  );
});