// Teste com MySQL real. Exige servidor iniciado e credenciais de usuário de teste.
// Não use banco de produção: cria e exclui uma categoria e um produto temporários.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const base = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
if (!email || !password) {
  console.error('Defina SMOKE_EMAIL e SMOKE_PASSWORD antes de executar o teste.');
  process.exit(1);
}
let token = '';
let categoryId;
let productId;
async function api(method, url, body, jwt = token) {
  const response = await fetch(base + url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}
async function main() {
  const health = await api('GET', '/health');
  assert.equal(health.status, 200);
  const unauthorized = await api('GET', '/v1/user/1', null, '');
  assert.equal(unauthorized.status, 401);
  const login = await api('POST', '/v1/user/token', { email, password }, '');
  assert.equal(login.status, 200);
  token = login.data.token;
  assert.ok(token);
  const suffix = crypto.randomUUID().slice(0, 12);
  const category = await api('POST', '/v1/category', { name: 'Teste Automático', slug: 'smoke-category-' + suffix });
  assert.equal(category.status, 201);
  categoryId = category.data.data.id;
  const product = await api('POST', '/v1/product', {
    enabled: true, name: 'Produto Temporário', slug: 'smoke-product-' + suffix,
    stock: 10, description: 'Criado apenas para teste de integração',
    price: 100, price_with_discount: 90, category_ids: [categoryId],
    images: [{ path: 'https://example.org/imagem.png', enabled: true }],
    options: [{ title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: ['P', 'M'] }],
  });
  assert.equal(product.status, 201);
  productId = product.data.data.id;
  assert.equal(product.data.data.categories.length, 1);
  assert.equal(product.data.data.images.length, 1);
  assert.equal(product.data.data.options.length, 1);
  const list = await api('GET', '/v1/product/search?category_ids=' + categoryId + '&match=Tempor');
  assert.equal(list.status, 200);
  assert.ok(list.data.data.some((p) => p.id === productId));
  const changed = await api('PUT', '/v1/product/' + productId, {
    stock: 8,
    options: [{ id: product.data.data.options[0].id, deleted: true }],
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.data.stock, 8);
  assert.equal(changed.data.data.options.length, 0);
  const forbidden = await api('PUT', '/v1/product/' + productId, { stock: 4 }, 'invalido');
  assert.equal(forbidden.status, 401);
  const found = await api('GET', '/v1/product/' + productId);
  assert.equal(found.status, 200);
  console.log('Smoke test passou: login, JWT, categorias, produtos, filtros, relacionamentos, atualização e rejeição de token falso.');
}
main().catch((e) => { console.error('Teste falhou:', e.message); process.exitCode = 1; }).finally(async () => {
  // Limpa mesmo se alguma asserção falhar.
  try { if (productId) await api('DELETE', '/v1/product/' + productId); }
  catch (e) { console.error('Limpeza de produto pendente:', e.message); }
  try { if (categoryId) await api('DELETE', '/v1/category/' + categoryId); }
  catch (e) { console.error('Limpeza de categoria pendente:', e.message); }
});
