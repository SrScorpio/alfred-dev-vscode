const assert = require('node:assert/strict');
const test = require('node:test');

const {
  checkForUpdate,
  fetchLatestRelease,
} = require('../out/commands/checkUpdate.js');

const RELEASE_URL = 'https://github.com/SrScorpio/alfred-dev-vscode/releases/tag/v0.8.0';

test('si la release coincide con la versión local, informa que está al día', async () => {
  const result = await checkForUpdate({
    currentVersion: '0.7.0',
    fetchLatestRelease: async () => ({ version: '0.7.0', htmlUrl: RELEASE_URL }),
  });

  assert.match(result.message, /al día/i);
  assert.match(result.message, /0\.7\.0/);
});

test('si hay una release mayor, informa versión local, nueva y URL', async () => {
  const result = await checkForUpdate({
    currentVersion: '0.7.0',
    fetchLatestRelease: async () => ({ version: '0.8.0', htmlUrl: RELEASE_URL }),
  });

  assert.match(result.message, /0\.8\.0/);
  assert.match(result.message, /0\.7\.0/);
  assert.match(result.message, /https:\/\/github\.com\/SrScorpio\/alfred-dev-vscode\/releases\/tag\/v0\.8\.0/);
  assert.doesNotMatch(result.message, /Marketplace/i);
});

test('si no hay releases (404), informa un error accionable sin Marketplace', async () => {
  const result = await checkForUpdate({
    currentVersion: '0.7.0',
    fetchLatestRelease: async () => null,
  });

  assert.match(result.message, /no hay/i);
  assert.match(result.message, /release/i);
  assert.doesNotMatch(result.message, /Marketplace/i);
});

test('si la red falla, informa un error accionable sin Marketplace', async () => {
  const result = await checkForUpdate({
    currentVersion: '0.7.0',
    fetchLatestRelease: async () => {
      throw new Error('network down');
    },
  });

  assert.match(result.message, /red|GitHub|comprobar/i);
  assert.doesNotMatch(result.message, /Marketplace/i);
});

test('el adapter HTTP consulta GitHub Releases con User-Agent y Accept', async () => {
  const calls = [];
  const httpFetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: 'v0.8.0',
        html_url: RELEASE_URL,
      }),
    };
  };

  const latest = await fetchLatestRelease({ owner: 'SrScorpio', repo: 'alfred-dev-vscode' }, httpFetch);

  assert.equal(latest.version, '0.8.0');
  assert.equal(latest.htmlUrl, RELEASE_URL);
  assert.equal(calls[0].url, 'https://api.github.com/repos/SrScorpio/alfred-dev-vscode/releases/latest');
  assert.equal(calls[0].options.headers['User-Agent'], 'alfred-dev-vscode');
  assert.equal(calls[0].options.headers.Accept, 'application/vnd.github+json');
});

test('el adapter HTTP trata 404 como ausencia de releases', async () => {
  const latest = await fetchLatestRelease({ owner: 'SrScorpio', repo: 'alfred-dev-vscode' }, async () => ({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Not Found' }),
  }));

  assert.equal(latest, null);
});

test('el adapter HTTP propaga fallos de red', async () => {
  await assert.rejects(
    () => fetchLatestRelease({ owner: 'SrScorpio', repo: 'alfred-dev-vscode' }, async () => {
      throw new Error('ECONNRESET');
    }),
    /ECONNRESET/,
  );
});
