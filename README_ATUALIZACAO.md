# ATUALIZAÇÃO SEGURA DO PROJETO EXISTENTE (passos 184 em diante)

Este pacote é para `C:\Users\Paulo Vitor\Desktop\projeto-backend`, criado nos passos anteriores.

**Não é necessário apagar nada, recriar o MySQL nem refazer as seis migrations.** O atualizador preserva `.env`, `src/models`, `src/config`, `migrations`, `src/controllers/UserController.js`, `src/routes/userRoutes.js` e a base de dados MySQL existente.

## Aplicar atualização em Windows PowerShell

1. Faça uma cópia da pasta do seu projeto, por segurança.
2. Extraia `ATUALIZACAO_PARA_PROJETO_EXISTENTE.zip` em uma pasta nova, por exemplo `Downloads\atualizacao-backend`.
3. Abra um PowerShell nessa pasta e execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\instalar_atualizacao.ps1 -Projeto "$env:USERPROFILE\Desktop\projeto-backend"
```

4. O script cria uma pasta `projeto-backend-backup-atualizacao_*` **ao lado do projeto**, copia os arquivos novos e instala a única dependência adicional: `swagger-ui-express`.
5. Entre no projeto e inicie a API:

```powershell
cd "$env:USERPROFILE\Desktop\projeto-backend"
node scripts/check.js
node --test
npm run dev
```

6. Acesse `http://localhost:3000/health`, `/api-docs`, `/openapi.json` e `/v1/product/search`.
7. Teste com seu usuário existente usando o script de integração opcional:

```powershell
$env:SMOKE_EMAIL = "usuario.teste.2026@example.com"
$env:SMOKE_PASSWORD = "SENHA_DO_USUARIO_DE_TESTE"
node scripts/smoke.js
Remove-Item Env:SMOKE_EMAIL,Env:SMOKE_PASSWORD
```

Esse teste cria e remove registros temporários, e **deve ser executado apenas no banco de desenvolvimento**.

## Arquivos adicionados/alterados

- `src/app.js` — monta `/v1/product`, Swagger e arquivos de mídia.
- `src/controllers/ProductController.js` — CRUD, buscas, relações e transações.
- `src/controllers/CategoryController.js` — mantém CRUD e acrescenta campos e paginação à busca.
- `src/routes/productRoutes.js` — rotas públicas e protegidas.
- `src/services/productInput.js` — validações.
- `src/services/imageStorage.js` — arquivos PNG/JPEG/WEBP/GIF em base64.
- `src/utils/http.js` — erros e IDs.
- `docs/openapi.json` — referência de API.
- `tests/validation.test.js` — 21 testes unitários.
- `scripts/check.js` e `scripts/smoke.js` — verificações.
- `README_COMPLEMENTO.md` e `docs/CONFERENCIA.md` — documentação.

## Limites da conferência automática

A sintaxe e os testes unitários passaram neste ambiente, mas ainda é preciso validar localmente a comunicação com o MySQL, as migrations existentes e o upload real. Nada foi enviado ao seu GitHub automaticamente. Isso só será considerado pronto após executar os testes e o `git push` no seu computador.
