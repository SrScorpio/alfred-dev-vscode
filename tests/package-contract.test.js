const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const packageJson = require('../package.json');
const packageLock = require('../package-lock.json');

assert.equal(packageJson.devDependencies['@cyclonedx/cyclonedx-npm'], '6.0.1');
assert.equal(packageLock.packages[''].devDependencies['@cyclonedx/cyclonedx-npm'], '6.0.1');
assert.equal(packageLock.packages['node_modules/@cyclonedx/cyclonedx-npm'].version, '6.0.1');
assert.equal(
  packageJson.scripts.sbom,
  'cyclonedx-npm --package-lock-only --output-reproducible --spec-version 1.5 --output-format JSON --output-file docs/project/sbom.cdx.json --validate',
);
assert.equal(packageLock.packages['node_modules/js-yaml'].version, '4.3.2');
assert.match(
  packageLock.packages['node_modules/js-yaml'].resolved,
  /js-yaml-4\.3\.2\.tgz$/,
);

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