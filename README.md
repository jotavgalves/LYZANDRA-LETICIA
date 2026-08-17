# LYZANDRA LETICIA — Speed Lash

Clone estático e editável da referência fornecida, preparado para Cloudflare Pages.

## Arquitetura

- `index.html`: landing page baseada no HTML renderizado da referência.
- `admin/`: editor visual em `/admin/`.
- `functions/api/`: autenticação, conteúdo e upload.
- **Workers KV (`SITE_CONTENT`)**: guarda textos, links, estilos, SEO, ordem das seções e demais personalizações do painel.
- **GitHub branch `media`**: guarda as imagens enviadas pelo painel em `uploads/AAAA-MM-DD/`.
- `_routes.json`: executa Pages Functions somente em `/api/*`.

## Sem R2

O projeto não usa mais Cloudflare R2.

Quando uma imagem é enviada no painel:

1. `/api/upload` valida a sessão e o arquivo.
2. A Pages Function usa um token restrito do GitHub.
3. A imagem é gravada na branch `media`, sem alterar a `main`.
4. O painel recebe uma URL de `raw.githubusercontent.com` e a aplica ao elemento selecionado.

A branch `media` é separada para evitar que cada troca de imagem gere um commit na branch de produção.

## Configuração necessária no Cloudflare Pages

### 1. KV

Crie um namespace KV e conecte-o ao projeto com o binding:

`SITE_CONTENT`

### 2. Secrets / variáveis

Configure:

- `ADMIN_PASSWORD`: senha do painel.
- `SESSION_SECRET`: segredo longo e aleatório para as sessões.
- `GITHUB_TOKEN`: Fine-grained Personal Access Token do GitHub.
- `GITHUB_REPO`: opcional; padrão `jotavgalves/LYZANDRA-LETICIA`.
- `GITHUB_MEDIA_BRANCH`: opcional; padrão `media`.

O `GITHUB_TOKEN` deve ter acesso **somente** ao repositório `jotavgalves/LYZANDRA-LETICIA` e, em **Repository permissions**, permissão **Contents: Read and write**. Não coloque o token no código nem faça commit dele.

A branch `media` já existe no repositório.

## Uploads

- Tipos aceitos: imagens (`image/*`).
- Limite por arquivo no painel: 10 MB.
- Caminho: `uploads/AAAA-MM-DD/UUID-nome-do-arquivo` na branch `media`.
- As URLs retornadas são públicas porque este repositório é público.

## Desenvolvimento local

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
npx wrangler pages dev .
```

Edite `.dev.vars` com valores reais. Esse arquivo deve continuar fora do Git.

Abra:

- `http://localhost:8788`
- `http://localhost:8788/admin/`

## Cloudflare Pages

Projeto sem framework: o build command pode ficar vazio. O site público é servido como asset estático e Pages Functions são utilizadas apenas nas rotas `/api/*`.
