const test = require('node:test');
const assert = require('node:assert/strict');
const { storeImage, removeLocalImage } = require('../src/services/imageStorage');

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';

test('grava PNG base64 em caminho local de mídia', async () => {
  const files = [];
  try {
    const path = await storeImage(png, 'image/png', files);
    assert.match(path, /^\/media\/[a-f0-9-]{36}\.png$/);
    assert.deepEqual(files, [path]);
  } finally {
    for (const file of files) await removeLocalImage(file);
  }
});

test('aceita URL HTTPS sem gravar arquivo', async () => {
  const files = [];
  assert.equal(await storeImage('https://example.org/test.png', undefined, files), 'https://example.org/test.png');
  assert.deepEqual(files, []);
});

test('rejeita base64 de conteúdo arbitrário', async () => {
  await assert.rejects(() => storeImage(Buffer.from('not-a-png').toString('base64'), 'image/png', []), /não é uma imagem/);
});

test('rejeita tipo declarado divergente', async () => {
  await assert.rejects(() => storeImage(png, 'image/jpeg', []), /não corresponde/);
});
