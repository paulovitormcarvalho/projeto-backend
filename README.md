# Digital Store — API Backend

API em Node.js + Express, MySQL + Sequelize, JWT e Swagger.

## Desenvolvimento

1. Configure `.env` com DB_HOST, DB_NAME, DB_USER, DB_PASSWORD e JWT_SECRET (não publique o .env).
2. `npm install`
3. Execute as migrations com `npx sequelize-cli db:migrate` (incluindo a migration de conformidade se estiver atualizando um banco existente).
4. `node --test`
5. `npm run dev`

Swagger em `http://localhost:3000/api-docs`; saúde em `http://localhost:3000/health`.

## Endpoints

- Usuários: POST `/v1/user`; POST `/v1/user/token`; GET/PUT/DELETE `/v1/user/:id`.
- Categorias: GET `/v1/category/search`, GET `/v1/category/:id`, POST `/v1/category`, PUT/DELETE `/v1/category/:id`.
- Produtos: GET `/v1/product/search`, GET `/v1/product/:id`, POST `/v1/product`, PUT/DELETE `/v1/product/:id`.

As rotas de escrita de categorias/produtos e as rotas PUT/DELETE de usuários exigem JWT Bearer. GET de usuários é público conforme a especificação da atividade.
PUT de usuários, categorias e produtos retorna 204 sem conteúdo. GET de item retorna o objeto diretamente.
Imagens de produtos recebem `{ "type":"image/png", "content":"<base64>" }` ou URL HTTPS em `content`.

Veja também `docs/openapi.json` e `docs/CONFERENCIA.md`.
