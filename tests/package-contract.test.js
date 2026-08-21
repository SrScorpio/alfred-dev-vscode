const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const vsceEntrypoint = path.resolve(__dirname, '../node_modules/@vscode/vsce/vsce');
const output = execFileSync(process.execPath, [vsceEntrypoint, 'ls'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const entries = output
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean);
const allowedEntry = /^(README\.md|package\.json|LICENSE|out\/.+\.js)$/;
const forbiddenEntry = /^(src|tests|node_modules|skills|agents|instructions|templates|docs|\.github|\.vscode)(\/|$)|\.map$|\.ts$|-out(\/|$)/;

assert.ok(entries.length > 0, 'vsce ls returned no package entries');
assert.deepEqual(
  entries.filter((entry) => !allowedEntry.test(entry)),
  [],
  `VSIX contains entries outside the allowlist: ${entries.join(', ')}`
);
assert.deepEqual(
  entries.filter((entry) => forbiddenEntry.test(entry)),
  [],
  `VSIX contains explicitly forbidden entries: ${entries.join(', ')}`
);