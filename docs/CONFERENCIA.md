# Conferência do projeto em relação às referências disponíveis

Enunciado informado na conversa: https://github.com/digitalcollegebr/projeto-backend

Não foi possível abrir diretamente o enunciado oficial neste ambiente (GitHub bloqueou o acesso ao repositório informado). Foram consultadas duas implementações públicas que referenciam a mesma atividade:
- https://github.com/Edsmonteiro/digital-store-backend
- https://github.com/Mattferreira1/Projeto-backend---Digital-college/blob/main/README.md

O código entregue cobre os endpoints, os seis modelos, JWT, CRUD de produtos com categorias/imagens/opções, paginação e filtros, documentação OpenAPI e testes de validação mencionados nas referências. A aderência **exata** à versão do enunciado recebida por sua turma permanece pendente de conferência direta.

## Checklist técnico

- [x] Models: Users, Categories, Products, ProductImages, ProductOptions e ProductCategories.
- [x] Relacionamentos Sequelize.
- [x] Usuários: CRUD e login JWT; senha bcrypt.
- [x] Categoria: CRUD, filtros, paginação.
- [x] Produtos: CRUD, transações, vínculos, opções e imagens.
- [x] Busca: match, category_ids, price-range, option[id], fields, limit, page.
- [x] Validações e códigos HTTP.
- [x] Documentação OpenAPI e Swagger UI.
- [x] 21 testes de validação; sintaxe Node.
- [ ] Teste completo no MySQL do computador do aluno.
- [ ] Comparação integral com o enunciado original.
- [ ] Conferência do Git status e publicação no repositório do aluno.
