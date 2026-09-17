const assert = require('node:assert/strict');
const test = require('node:test');

const { openGithubIssue } = require('../out/commands/openGithubIssue.js');

const ISSUE_URL = 'https://github.com/acme/widgets/issues/12';

function fakeUri(href, scheme) {
  return {
    scheme,
    toString() {
      return href;
    },
  };
}

test('openGithubIssue abre un string https con openExternal', async () => {
  const opened = [];

  await openGithubIssue(ISSUE_URL, async (uri) => {
    opened.push({ scheme: uri.scheme, href: String(uri) });
    return true;
  });

  assert.deepEqual(opened, [{ scheme: 'https', href: ISSUE_URL }]);
});

test('openGithubIssue abre un Uri http(s)', async () => {
  const opened = [];
  const httpUrl = 'http://github.com/acme/widgets/issues/12';

  await openGithubIssue(fakeUri(httpUrl, 'http'), async (uri) => {
    opened.push({ scheme: uri.scheme, href: String(uri) });
    return true;
  });

  assert.deepEqual(opened, [{ scheme: 'http', href: httpUrl }]);
});

test('openGithubIssue rechaza javascript: y file: sin llamar openExternal', async () => {
  const opened = [];
  const openExternal = async (uri) => {
    opened.push(String(uri));
    return true;
  };

  await assert.rejects(
    () => openGithubIssue('javascript:alert(1)', openExternal),
    /http|https|válid/i,
  );
  await assert.rejects(
    () => openGithubIssue('file:///tmp/secret', openExternal),
    /http|https|válid/i,
  );
  await assert.rejects(
    () => openGithubIssue(fakeUri('javascript:alert(1)', 'javascript'), openExternal),
    /http|https|válid/i,
  );
  await assert.rejects(
    () => openGithubIssue(fakeUri('file:///tmp/secret', 'file'), openExternal),
    /http|https|válid/i,
  );

  assert.deepEqual(opened, []);
});
