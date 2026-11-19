# Auditoria da implementação contra o enunciado oficial

Enunciado: https://github.com/digitalcollegebr/projeto-backend

Revisão pós-publicação em 19/11/2026: diferenças encontradas em formatos de GET, retornos PUT, aceitação de `images.content`, atributos opcionais, `option[ID]`, update de usuários sem senha e armazenamento CSV das opções. Este complemento propõe corrigir esses itens.

## Passos obrigatórios de validação no computador com MySQL

1. Backup do banco MySQL antes de migrations.
2. Instalar patch e suas dependências.
3. Rodar `npx sequelize-cli db:migrate`; isso converte a coluna product_options.values de JSON para VARCHAR(255).
4. Rodar `node --test` e `npm run test:jest`.
5. Testar GET, POST, PUT, DELETE dos 3 módulos, filtro `option[ID]`, payload de imagem `{type,content}` e resposta 204 de PUT.
6. Atualizar o Swagger, verificar o Git e publicar outro commit.

O enunciado tem inconsistências internas: seção JWT menciona 400 para token ausente, enquanto várias rotas especificam 401; mantivemos 401 (padrão HTTP). Para GET de usuário, optamos por acesso público porque a seção final especifica autenticação em POST/PUT/DELETE. O cadastro e o login permanecem públicos por necessidade funcional.

Nota: as migrations originais usam os nomes `createdAt` e `updatedAt` conforme Sequelize padrão com `timestamps:true`, enquanto o enunciado descreve `created_at` e `updated_at`; esse ponto deve ser validado com o avaliador antes de alterar um banco existente.
