# Digital Store — API Backend

API REST desenvolvida como projeto do módulo de **Backend da Digital College**, seguindo o [enunciado oficial do projeto](https://github.com/digitalcollegebr/projeto-backend).

A aplicação gerencia **usuários, categorias e produtos**, com autenticação por **JWT**, senhas protegidas por **bcrypt**, persistência em **MySQL/Sequelize**, associação de produtos a categorias, imagens e opções, pesquisas com filtros e paginação, documentação **Swagger/OpenAPI** e testes automatizados.

## Tecnologias

| Tecnologia | Utilização |
| --- | --- |
| Node.js | Execução do JavaScript no servidor |
| Express.js | API HTTP e roteamento |
| MySQL 8+ | Banco de dados relacional |
| Sequelize e Sequelize CLI | Models, relacionamentos e migrations |
| dotenv | Variáveis de ambiente |
| bcryptjs | Hash e verificação de senhas |
| jsonwebtoken | Emissão e verificação de tokens JWT |
| Swagger UI / OpenAPI 3 | Documentação interativa dos endpoints |
| Node.js Test Runner e Jest | Testes automatizados |

## Funcionalidades

- **Usuários:** cadastro, consulta pública por ID, atualização e exclusão autenticadas, login com JWT e verificação de permissão para alterar a própria conta.
- **Categorias:** CRUD, filtro de exibição no menu, seleção de campos e paginação.
- **Produtos:** CRUD, preços, estoque, descrição, associação a categorias, imagens e opções como cor e tamanho.
- **Busca:** filtros por termo, categorias, faixa de preços e opções, além de seleção de campos e paginação.
- **Imagens:** cadastro via Base64 ou endereço HTTPS; arquivos locais são disponibilizados por `/media`.
- **Segurança:** validação de entrada, JWT Bearer nas rotas de escrita, tratamento de erros e segredos fora do Git.
- **Qualidade:** documentação Swagger e testes automatizados.

## Pré-requisitos

- Node.js **20 ou superior** e npm.
- MySQL Server **8 ou superior**.
- Git, para clonar o repositório.
- Postman ou outro cliente HTTP, caso queira testar as rotas manualmente.

## Instalação e execução

### 1. Clonar o projeto

```bash
git clone https://github.com/paulovitormcarvalho/projeto-backend.git
cd projeto-backend
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar e configurar o banco de dados

Crie um banco MySQL, por exemplo:

```sql
CREATE DATABASE IF NOT EXISTS digital_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Utilize um usuário MySQL que possua as permissões necessárias para aplicar as migrations e consultar/alterar os registros desse banco.

### 4. Configurar o `.env`

Na raiz do projeto, crie um arquivo chamado **`.env`**. Exemplo com valores ilustrativos:

```dotenv
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_store
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql

JWT_SECRET=substitua_por_uma_chave_aleatoria_segura
```

Gere uma chave secreta para JWT executando:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie o valor gerado para `JWT_SECRET`. **Não publique a chave nem as credenciais reais.** O `.env` está listado no `.gitignore`.

Opcionalmente, é possível autorizar uma origem de frontend por meio de:

```dotenv
CORS_ORIGIN=http://localhost:5173
```

### 5. Criar as tabelas

```bash
npx sequelize-cli db:migrate
```

As migrations criam as tabelas e aplicam os ajustes de estrutura necessários. Em instalações que já possuem migrations executadas, o Sequelize executa somente as pendentes.

### 6. Iniciar a API

```bash
npm run dev
```

Ou, sem o reinício automático:

```bash
npm start
```

Por padrão, o servidor estará em **http://localhost:3000**.

Verifique seu funcionamento:

```http
GET http://localhost:3000/health
```

Resposta `200 OK`:

```json
{
  "status": "ok",
  "message": "API funcionando!"
}
```

## Documentação da API

Com o servidor iniciado:

- **Swagger UI:** http://localhost:3000/api-docs
- **Especificação OpenAPI:** http://localhost:3000/openapi.json
- **Arquivo da especificação:** `docs/openapi.json`

O Swagger permite consultar parâmetros, modelos de requisição, respostas e quais rotas exigem autenticação.

## Endpoints

### Usuários

| Método | Rota | Descrição | JWT |
| --- | --- | --- | --- |
| `GET` | `/v1/user/:id` | Consulta os dados públicos do usuário | Não |
| `POST` | `/v1/user` | Cadastra usuário | Não |
| `POST` | `/v1/user/token` | Autentica e gera um JWT | Não |
| `PUT` | `/v1/user/:id` | Atualiza nome, sobrenome e e-mail | Sim |
| `DELETE` | `/v1/user/:id` | Exclui o usuário | Sim |

**Observação:** nas operações autenticadas de alteração ou exclusão de usuários, o ID do recurso deve corresponder ao usuário identificado pelo JWT.

### Categorias

| Método | Rota | Descrição | JWT |
| --- | --- | --- | --- |
| `GET` | `/v1/category/search` | Lista categorias com filtros | Não |
| `GET` | `/v1/category/:id` | Consulta uma categoria | Não |
| `POST` | `/v1/category` | Cadastra categoria | Sim |
| `PUT` | `/v1/category/:id` | Atualiza categoria | Sim |
| `DELETE` | `/v1/category/:id` | Exclui categoria | Sim |

### Produtos

| Método | Rota | Descrição | JWT |
| --- | --- | --- | --- |
| `GET` | `/v1/product/search` | Lista produtos com filtros e paginação | Não |
| `GET` | `/v1/product/:id` | Consulta um produto e suas relações | Não |
| `POST` | `/v1/product` | Cadastra produto, imagens e opções | Sim |
| `PUT` | `/v1/product/:id` | Atualiza produto e suas relações | Sim |
| `DELETE` | `/v1/product/:id` | Exclui produto | Sim |

## Exemplos de requisições

Nas requisições com JSON, utilize o cabeçalho `Content-Type: application/json`.

### Cadastrar usuário

`POST /v1/user`

```json
{
  "firstname": "João",
  "surname": "Silva",
  "email": "joao.silva@example.com",
  "password": "SenhaForte@123",
  "confirmPassword": "SenhaForte@123"
}
```

**Sucesso:** `201 Created`. A senha é armazenada como hash de bcrypt e não aparece na resposta HTTP.

### Login

`POST /v1/user/token`

```json
{
  "email": "joao.silva@example.com",
  "password": "SenhaForte@123"
}
```

Exemplo da estrutura retornada em `200 OK`:

```json
{
  "token": "SEU_JWT_AQUI",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Para acessar rotas protegidas, envie:

```http
Authorization: Bearer SEU_JWT_AQUI
```

O JWT tem validade de **1 hora**. O cliente deve obter outro token por meio de um novo login após sua expiração.

### Consultar e atualizar usuário

`GET /v1/user/1` retorna os dados públicos diretamente:

```json
{
  "id": 1,
  "firstname": "João",
  "surname": "Silva",
  "email": "joao.silva@example.com"
}
```

`PUT /v1/user/1` exige JWT pertencente ao próprio usuário:

```json
{
  "firstname": "João",
  "surname": "Oliveira",
  "email": "joao.oliveira@example.com"
}
```

**Sucesso:** `204 No Content`, sem corpo na resposta. Não é necessário informar uma nova senha para atualizar esses dados.

### Criar categoria

`POST /v1/category` (JWT obrigatório):

```json
{
  "name": "Calçados",
  "slug": "calcados",
  "use_in_menu": true
}
```

**Sucesso:** `201 Created`.

### Criar produto

`POST /v1/product` (JWT obrigatório):

```json
{
  "enabled": true,
  "name": "Tênis Esportivo",
  "slug": "tenis-esportivo",
  "stock": 20,
  "description": "Tênis esportivo para uso diário.",
  "price": 299.90,
  "price_with_discount": 249.90,
  "category_ids": [1],
  "images": [
    {
      "type": "image/png",
      "content": "https://exemplo.com/imagens/tenis.png"
    }
  ],
  "options": [
    {
      "title": "Tamanho",
      "shape": "square",
      "radius": "4px",
      "type": "text",
      "values": ["38", "39", "40", "41"]
    },
    {
      "title": "Cor",
      "shape": "circle",
      "type": "color",
      "values": ["#000000", "#FFFFFF"]
    }
  ]
}
```

**Sucesso:** `201 Created`. O ID informado em `category_ids` deve existir previamente no banco.

Os campos obrigatórios são `name`, `slug`, `price` e `price_with_discount`. Os demais campos são opcionais, observadas as regras de validação.

A resposta de consulta de um produto apresenta campos como `id`, `enabled`, `name`, `slug`, `stock`, `description`, `price`, `price_with_discount`, `category_ids`, `images` e `options`.

### Atualizar produto

`PUT /v1/product/1` (JWT obrigatório):

```json
{
  "stock": 15,
  "price_with_discount": 229.90
}
```

**Sucesso:** `204 No Content`. É possível atualizar apenas os campos enviados. Imagens e opções também podem ser adicionadas, alteradas ou removidas por meio dos campos `images`, `options`, `id` e `deleted`, conforme documentado no Swagger.

### Excluir recurso

`DELETE /v1/product/1` e as demais rotas DELETE autenticadas retornam **`204 No Content`** em caso de sucesso.

## Pesquisa, filtros e paginação

### Categorias — `GET /v1/category/search`

| Parâmetro | Descrição | Exemplo |
| --- | --- | --- |
| `limit` | Número de registros; `-1` retorna todos | `limit=12` |
| `page` | Página solicitada | `page=1` |
| `fields` | Seleção de campos | `fields=name,slug` |
| `use_in_menu` | Filtra categorias do menu | `use_in_menu=true` |
| `name` | Busca pelo nome | `name=Calçados` |

Exemplo:

```http
GET /v1/category/search?limit=12&page=1&use_in_menu=true
```

### Produtos — `GET /v1/product/search`

| Parâmetro | Descrição | Exemplo |
| --- | --- | --- |
| `limit` | Registros por página; `-1` retorna todos | `limit=12` |
| `page` | Página solicitada | `page=1` |
| `fields` | Campos da resposta | `fields=name,images,price` |
| `match` | Termo presente no nome ou na descrição | `match=tenis` |
| `category_ids` | Filtra por uma ou mais categorias | `category_ids=1,2` |
| `price-range` | Intervalo de preço com desconto | `price-range=100-300` |
| `option[ID]` | Filtra por valores de uma opção | `option[45]=GG,PP` |

Exemplos:

```http
GET /v1/product/search?limit=12&page=1&match=tenis
GET /v1/product/search?category_ids=1&price-range=100-300
GET /v1/product/search?limit=-1
```

A paginação utiliza **`limit=12` e `page=1`** como valores padrão. Com `limit=-1`, a API retorna todos os resultados correspondentes ao filtro.

Formato da resposta paginada:

```json
{
  "data": [],
  "total": 0,
  "limit": 12,
  "page": 1
}
```

## Modelo de dados

A API possui seis entidades principais:

| Entidade | Responsabilidade |
| --- | --- |
| `User` | Usuários e hashes das senhas |
| `Category` | Categorias e exibição no menu |
| `Product` | Dados e preços dos produtos |
| `ProductImage` | Referências das imagens de cada produto |
| `ProductOption` | Opções de produto, como cor e tamanho |
| `ProductCategory` | Relação muitos-para-muitos entre produtos e categorias |

**Relacionamentos:** um produto pode possuir várias imagens e opções, além de pertencer a várias categorias; uma categoria pode conter vários produtos.

As tabelas são criadas e atualizadas pelas migrations em `src/migrations`.

## Imagens dos produtos

O campo `images` recebe objetos com `content`. São aceitas duas formas:

**1. Base64:**

```json
{
  "type": "image/png",
  "content": "CONTEUDO_BASE64_DA_IMAGEM"
}
```

**2. URL HTTPS:**

```json
{
  "type": "image/png",
  "content": "https://exemplo.com/imagem.png"
}
```

Imagens Base64 são validadas e salvas no servidor, em `public/media/`. A API também pode armazenar uma URL HTTPS como referência, sem baixar o arquivo. Para arquivos locais, a aplicação disponibiliza os caminhos em `/media/`.

São aceitos os formatos PNG, JPEG, WebP e GIF, conforme a validação implementada. O limite de upload é de **4 MB por imagem**, e há limites de quantidade de imagens por produto.

**Versionamento:** `public/media/.gitkeep` permanece no GitHub para preservar a pasta; as imagens geradas durante o uso da API não devem ser versionadas.

## Respostas HTTP

| Código | Significado |
| --- | --- |
| `200 OK` | Consulta ou login realizado com sucesso |
| `201 Created` | Recurso criado |
| `204 No Content` | Atualização ou exclusão concluída sem corpo |
| `400 Bad Request` | Dados ou parâmetros inválidos |
| `401 Unauthorized` | JWT ausente, inválido ou expirado; credenciais inválidas no login |
| `403 Forbidden` | Usuário autenticado sem permissão para alterar outra conta |
| `404 Not Found` | Recurso inexistente |
| `409 Conflict` | Conflito de dados únicos, quando aplicável |
| `413 Payload Too Large` | Corpo da requisição acima do limite aceito |
| `500 Internal Server Error` | Erro interno da aplicação |

## Testes e validação

Verificação de sintaxe dos arquivos JavaScript:

```bash
npm run check
```

Testes com o executor nativo do Node.js:

```bash
npm test
```

Testes de contrato com Jest:

```bash
npm run test:jest
```

**Resultados obtidos durante o desenvolvimento:**

| Verificação | Resultado |
| --- | --- |
| Testes Node.js | 28 aprovados |
| Testes Jest | 4 aprovados |
| Total de testes automatizados | **32 aprovados** |
| Falhas nesses testes | **0** |
| Migration de conformidade | Aplicada com sucesso |
| Testes manuais com Postman e MySQL | CRUD, login, autenticação e relacionamentos exercitados |

Os testes automatizados não substituem uma revisão de segurança ou testes de carga em um ambiente de produção.

## Estrutura de diretórios

```text
projeto-backend/
├── docs/
│   ├── CONFERENCIA.md
│   └── openapi.json
├── public/
│   └── media/
│       └── .gitkeep
├── scripts/
│   ├── check.js
│   └── smoke.js
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── tests/
│   ├── jest/
│   ├── contract.test.js
│   ├── imageStorage.test.js
│   └── validation.test.js
├── .gitignore
├── .sequelizerc
├── package.json
├── package-lock.json
└── README.md
```

O `.env` é criado localmente e não faz parte do repositório.

## Segurança e observações de produção

- As senhas são armazenadas como hashes de bcrypt e não são expostas nas respostas públicas.
- O JWT utiliza assinatura HS256 e expira após uma hora.
- As rotas de escrita de categorias e produtos, além da atualização e exclusão de usuários, exigem JWT Bearer.
- O servidor valida IDs, dados de entrada, formatos de imagem e campos de pesquisa.
- Segredos ficam no `.env`; não devem ser enviados ao GitHub.
- Para uma implantação real, recomenda-se HTTPS, política de backups, monitoramento, controle de tentativas de login e atualização periódica das dependências.

O projeto foi desenvolvido com finalidade educacional. Durante a auditoria local, `npm audit --omit=dev` não identificou vulnerabilidades conhecidas nas dependências de produção; a auditoria geral apontou vulnerabilidades moderadas em dependências transitivas de desenvolvimento relacionadas ao Jest. Elas não foram atualizadas nesta entrega.

## Referências

- [Enunciado oficial — Digital College](https://github.com/digitalcollegebr/projeto-backend)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [MySQL](https://dev.mysql.com/doc/)
- [Jest](https://jestjs.io/)
- [OpenAPI / Swagger](https://swagger.io/)

## Repositório

**Código-fonte:** https://github.com/paulovitormcarvalho/projeto-backend

---

Projeto desenvolvido para a atividade de Backend da **Geração Tech 4.0**.
