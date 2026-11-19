const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProduct, parseOption, parseImage, parseFields } = require('../src/services/productInput');
const { productOutput } = require('../src/services/productOutput');

test('aceita produto sem description e stock opcionais', () => {
  const data = parseProduct({ name: 'A', slug: 'a', price: 12, price_with_discount: 10 });
  assert.equal(data.description, '');
  assert.equal(data.stock, undefined);
});

test('imagem aceita content base64 ou URL', () => {
  assert.equal(parseImage({ type: 'image/png', content: 'https://example.com/a.png' }, false).path, 'https://example.com/a.png');
});

test('imagem rejeita path e content ao mesmo tempo', () => {
  assert.throws(() => parseImage({ content:'abc', path:'abc' }, false), /content ou path/);
});

test('opção aceita omissão de shape/type com valores padrão', () => {
  const data = parseOption({ title: 'Cor', values: ['Azul', 'Branco'] }, false);
  assert.equal(data.shape, 'square');
  assert.equal(data.type, 'text');
});

test('valores CSV rejeitam vírgulas e excesso de comprimento', () => {
  assert.throws(() => parseOption({ title:'Cor', values:['Azul,Branco'] }, false), /vírgulas/);
  assert.throws(() => parseOption({ title:'Cor', values:['x'.repeat(200), 'y'.repeat(100)] }, false), /255/);
});

test('fields permite campos de relacionamentos', () => {
  assert.deepEqual(parseFields('name,images,price'), ['name','images','price']);
});

test('serialização segue o enunciado: category_ids, images.content, preços numéricos', () => {
  const data = productOutput({ id:1, enabled:true, name:'Fone', slug:'fone', stock:1, description:'',
    price:'99.90', price_with_discount:'80.00', categories:[{id:2}],
    images:[{id:3,path:'/media/x.png'}],
    options:[{id:4,title:'Tamanho',shape:'square',radius:0,type:'text',values:['P','M']}] });
  assert.deepEqual(data.category_ids, [2]);
  assert.deepEqual(data.images, [{id:3,content:'/media/x.png'}]);
  assert.deepEqual(data.options[0].values, ['P','M']);
  assert.equal(data.price, 99.90);
  assert.equal(data.categories, undefined);
});
