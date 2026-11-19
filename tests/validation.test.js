const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseProduct, parseOption, parseImage, parsePagination,
  parseFilterIds, parseFields, parseList,
} = require('../src/services/productInput');
const { positiveId, idArray } = require('../src/utils/http');

const product = {
  enabled: true, name: 'Tênis Teste', slug: 'tenis-teste', stock: 10,
  description: 'Descrição', price: 150, price_with_discount: 120,
  category_ids: [1, 2], images: [], options: [],
};

test('aceita produto com campos obrigatórios e relações', () => {
  const result = parseProduct(product);
  assert.equal(result.name, 'Tênis Teste');
  assert.deepEqual(result.category_ids, [1, 2]);
});
test('rejeita preço negativo', () => assert.throws(() => parseProduct({ ...product, price: -1 }), /price/));
test('rejeita estoque decimal e negativo', () => {
  assert.throws(() => parseProduct({ ...product, stock: 2.5 }), /stock/);
  assert.throws(() => parseProduct({ ...product, stock: -2 }), /stock/);
});
test('rejeita campos obrigatórios ausentes', () => assert.throws(() => parseProduct({}), /obrigatórios/));
test('atualização parcial preserva campos omitidos', () => assert.deepEqual(parseProduct({ name: 'Novo' }, true), { name: 'Novo' }));
test('rejeita categorias repetidas', () => assert.throws(() => idArray([1, 1]), /repetições/));
test('valida IDs', () => {
  assert.equal(positiveId('12'), 12);
  assert.throws(() => positiveId('-1'), /inválido/);
  assert.throws(() => positiveId('1abc'), /inválido/);
});
test('aceita opção com values e radius px', () => {
  const result = parseOption({ title: 'Cor', shape: 'square', radius: '4px', type: 'color', values: ['Azul'] }, false);
  assert.equal(result.radius, 4);
});
test('aceita compatibilidade com value', () => {
  const result = parseOption({ title: 'Tam', shape: 'circle', type: 'text', value: ['P'] }, false);
  assert.deepEqual(result.values, ['P']);
});
test('rejeita opção sem valores', () => assert.throws(() => parseOption({ title: 'A', shape: 'square', type: 'text', values: [] }, false), /values/));
test('aceita imagem HTTPS', () => assert.equal(parseImage({ type: 'image/png', path: 'https://example.org/image.png' }, false).enabled, true));
test('rejeita imagens acima da quantidade permitida', () => assert.throws(() => parseProduct({ ...product, images: Array(21).fill({ path: 'x' }) }), /images/));
test('limit -1 retorna todos', () => assert.deepEqual(parsePagination({ limit: '-1' }), { limit: -1, page: 1 }));
test('rejeita limit 0 e page 0', () => {
  assert.throws(() => parsePagination({ limit: '0' }), /limit/);
  assert.throws(() => parsePagination({ page: '0' }), /page/);
});
test('lê category_ids separados por vírgula', () => assert.deepEqual(parseFilterIds('1,2,3', 'category_ids'), [1, 2, 3]));
test('valida fields contra nomes autorizados', () => {
  assert.deepEqual(parseFields('id,name'), ['id', 'name']);
  assert.throws(() => parseFields('password'), /fields/);
});
test('lê múltiplos valores de filtro', () => assert.deepEqual(parseList(['P,M', 'GG'], 'tamanho'), ['P', 'M', 'GG']));
