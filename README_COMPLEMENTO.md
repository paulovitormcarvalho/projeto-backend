# Projeto Backend — Digital Store

API Node.js + Express + Sequelize + MySQL (Digital College).

Inclui autenticação JWT, CRUD de usuários e categorias, CRUD de produtos e relacionamentos, imagens, opções, filtros de busca, paginação, documentação OpenAPI/Swagger, testes de validação e roteiro de teste de integração com MySQL.

> **Origem:** continuação da API desenvolvida ao longo dos passos 1–184. Os models, o fluxo de usuário e a estrutura inicial são baseados nos arquivos do projeto existente. A referência pública consultada descreve os mesmos endpoints, mas o enunciado oficial não pôde ser aberto diretamente nesta sessão. A validação final deve comparar o código com o edital e testá-lo no MySQL local.

## Importante: projeto existente vs. banco novo

**Caso 1: você já tem o projeto e suas seis migrations aplicadas (é o seu caso).** Use `ATUALIZACAO_PARA_PROJETO_EXISTENTE.zip`. Ele só substitui os arquivos de aplicação necessários; **não substitui** o `.env`, as migrations, `sequelizeMeta`, os models nem as configurações de banco. Veja `README_ATUALIZACAO.md` no ZIP de atualização. **Não execute a migration nova deste projeto completo sobre seu banco existente.**

**Caso 2: instalação limpa em outro banco vazio.** Use este ZIP completo e configure um banco MySQL vazio; a migration única em `migrations/` criará as seis tabelas.

## Instalação limpa (Windows PowerShell/CMD)

1. Instale Node.js 20+ e MySQL 8+.
2. Crie o banco vazio `digital_store` e um usuário MySQL com permissões DDL/DML (ou ajuste `.env` para uma conta já criada).
3. Execute `npm install`.
4. Copie `.env.example` para `.env` e preencha as credenciais. Gere uma chave secreta aleatória. **Nunca publique `.env`.**
5. Em um banco **novo e vazio**, execute `npm run db:migrate`.
6. Execute `npm run dev` e acesse `http://localhost:3000/health`.
7. Abra a documentação em `http://localhost:3000/api-docs` ou JSON em `/openapi.json`.

### Scripts

```sh
npm run dev       # Node --watch
npm start         # Node normal
npm run check     # Sintaxe de todos os arquivos JS
npm test          # Testes unitários de validação
npm run db:migrate # Apenas em banco vazio para este pacote completo
```

## Autenticação

- `POST /v1/user` — cadastro público, `firstname`, `surname`, `email`, `password`, `confirmPassword`.
- `POST /v1/user/token` — login público com email/senha; devolve JWT (1 hora).
- Usuários podem consultar, atualizar e excluir somente a própria conta, após JWT.
- Categorias e produtos têm GET público; POST/PUT/DELETE requerem JWT.
- Para rotas protegidas, envie `Authorization: Bearer SEU_TOKEN`.

## Endpoints

| Método | Caminho | Token | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Saúde da API |
| POST | `/v1/user` | Não | Cadastro |
| POST | `/v1/user/token` | Não | Login JWT |
| GET | `/v1/user/:id` | Sim | Consulta própria conta |
| PUT | `/v1/user/:id` | Sim | Atualização própria conta (campos completos + senha) |
| DELETE | `/v1/user/:id` | Sim | Exclusão própria conta |
| GET | `/v1/category/search` | Não | Busca, paginação e campos |
| GET | `/v1/category/:id` | Não | Detalhes |
| POST | `/v1/category` | Sim | Criação |
| PUT | `/v1/category/:id` | Sim | Atualização |
| DELETE | `/v1/category/:id` | Sim | Exclusão |
| GET | `/v1/product/search` | Não | Busca e filtros |
| GET | `/v1/product/:id` | Não | Produto + imagens + opções + categorias |
| POST | `/v1/product` | Sim | Criação com relações |
| PUT | `/v1/product/:id` | Sim | Atualização de campos e relações |
| DELETE | `/v1/product/:id` | Sim | Exclusão em cascata |

## Produtos: exemplo de criação

`POST /v1/product` com JWT e corpo JSON:

```json
{
  "enabled": true,
  "name": "Tênis Exemplo",
  "slug": "tenis-exemplo",
  "stock": 10,
  "description": "Produto de exemplo",
  "price": 119.9,
  "price_with_discount": 99.9,
  "category_ids": [1],
  "images": [{ "type": "image/png", "path": "BASE64_REAL_DA_IMAGEM" }],
  "options": [{ "title": "Tamanho", "shape": "square", "radius": 4, "type": "text", "values": ["P", "M", "G"] }]
}
```

> Para usar o exemplo, crie antes a categoria ID 1 e informe o base64 de uma imagem de verdade. Também são aceitas URLs HTTPS em `path`, como `https://site.com/foto.png`.

**Atualizar:** `PUT /v1/product/:id` aceita somente os campos que você deseja alterar. Com `category_ids: []`, remove todos os vínculos; a ausência de `category_ids`, `images` ou `options` preserva as relações atuais. Para atualizar uma imagem/opção existente informe seu `id`; para removê-la, `{ "id": 3, "deleted": true }`. Objetos sem `id` são criados.

**Imagens:** PNG, JPEG, WEBP ou GIF em base64 (máximo de 4 MB cada) são validadas e gravadas em `public/media`. A API retorna `/media/UUID.ext`, acessível pela rota estática. URLs HTTPS são armazenadas como referência. Se hospedar a API em nuvem, use armazenamento persistente para a pasta `public/media`.

## Filtros de busca

`GET /v1/product/search` aceita:

- `match=tenis` — procura nome e descrição.
- `category_ids=1,2` — produtos vinculados a alguma das categorias indicadas.
- `price-range=50-200` — intervalo do preço com desconto.
- `option[ID_DA_OPCAO]=P,M` — produto com a opção identificada e pelo menos um valor selecionado; filtros de IDs diferentes são combinados.
- `fields=id,name,price` — seleciona campos de produto.
- `limit=12&page=1` — paginação, limite máximo 100. `limit=-1` devolve todos.

`GET /v1/category/search` aceita `name`, `use_in_menu=true|false`, `fields`, `limit` e `page`.

A resposta paginada possui `{ "data": [], "total": 0, "limit": 12, "page": 1 }`. Produtos retornam também `images` na listagem sem seleção de campos.

## Testes e conferência

`npm run check` realiza a verificação de sintaxe, e `npm test` executa os testes unitários sem acessar o banco. Para o teste HTTP integrado:

1. Inicie o servidor e use um **banco de desenvolvimento**.
2. Cadastre um usuário de teste se ainda não tiver um.
3. Configure `SMOKE_EMAIL` e `SMOKE_PASSWORD` no seu terminal (não cole credenciais em logs).
4. Execute `node scripts/smoke.js`. Esse script cria e remove uma categoria e um produto temporários e exercita login, JWT, filtros, atualização e exclusão.

Exemplo no PowerShell:

```powershell
$env:SMOKE_EMAIL = "usuario.teste.2026@example.com"
$env:SMOKE_PASSWORD = "SENHA_DO_USUARIO_DE_TESTE"
node scripts/smoke.js
Remove-Item Env:SMOKE_EMAIL,Env:SMOKE_PASSWORD
```

**Não foi possível executar testes reais neste ambiente**, pois o servidor MySQL e o repositório local do usuário não estão disponíveis aqui. Portanto, os resultados unitários e de sintaxe não comprovam por si sós a integração com seu MySQL.

## Entrega GitHub

```sh
git status
git add .
git status
# Confira que .env e node_modules não estão no commit
git commit -m "feat: finaliza API digital store"
git push origin main
```

Se sua branch for diferente de `main`, adapte o último comando. **Confira sempre `git status` antes de publicar**. O push precisa ser feito na sua máquina ou por uma integração GitHub autorizada.

## Limitações técnicas e boas práticas

- O código usa DECIMAL(10,2) para preços, conforme os models existentes; algumas referências do exercício usam FLOAT, mas DECIMAL evita erros de arredondamento financeiro.
- As alterações de produto são transacionais no banco de dados; arquivos de imagem locais são compensados em caso de erro, mas banco e disco não oferecem transação distribuída.
- Não há controle de perfis administrativos. Autenticação comprova quem possui o token, não necessariamente privilégios de administração.
- Não implementei interface frontend; o escopo é apenas a API backend.
- O original possuía seis migrations; este pacote completo utiliza uma migration única **apenas para instalação nova**. Para atualizar seu projeto existente preserve as migrations originais.
