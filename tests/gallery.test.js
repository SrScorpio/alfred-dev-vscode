const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_STYLE_OPTIONS,
  loadStyleOptions,
  renderGalleryHtml,
  saveStyleDirection,
} = require('../out/gallery/styleGallery.js');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('la galería fallback ofrece tres propuestas', () => {
  assert.equal(DEFAULT_STYLE_OPTIONS.length, 3);
  assert.ok(DEFAULT_STYLE_OPTIONS.every((option) => option.id && option.name && option.description));
});

test('la galería usa CSP con nonce, escape y ningún recurso remoto', () => {
  const html = renderGalleryHtml([
    { id: 'x', name: '<script>', description: '" onerror="alert(1)' },
  ], '123');

  assert.match(html, /default-src 'none'/);
  assert.match(html, /style-src 'nonce-123'/);
  assert.match(html, /script-src 'nonce-123'/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /<[^>]+onerror=/i);
});

test('usa catálogo local solo si es válido y persiste una elección confirmada', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'alfred-gallery-'));
  assert.deepEqual(await loadStyleOptions(directory), DEFAULT_STYLE_OPTIONS);
  await saveStyleDirection(directory, DEFAULT_STYLE_OPTIONS[0]);

  const saved = await fs.readFile(path.join(directory, 'docs', 'style-direction.md'), 'utf8');
  assert.match(saved, /Quiet Operations/);
  assert.match(saved, /Seleccionada explícitamente/);
});