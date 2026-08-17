# LYZANDRA LETICIA — Speed Lash

Clone estático e totalmente editável da referência, preparado para Cloudflare Pages.

## Arquitetura

- `index.html`: landing page.
- `admin/`: editor visual em `/admin/`.
- `functions/api/`: login, sessão, conteúdo e upload.
- `functions/media/`: entrega das imagens armazenadas no KV.
- `SITE_CONTENT` (Workers KV): guarda textos, links, estilos, SEO, ordem das seções e também as imagens enviadas pelo painel.
- `_routes.json`: executa Pages Functions apenas em `/api/*` e `/media/*`.

## Sem R2 e sem token do GitHub

O projeto não usa Cloudflare R2 e o upload de imagens não precisa mais de GitHub PAT.

As imagens são gravadas no próprio KV com chaves `media:*`. O painel limita cada arquivo a 10 MB.

## Instalação automática

Depois de clonar o repositório, rode no PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-cloudflare.ps1
```

O script:

1. autentica o Wrangler na sua conta Cloudflare;
2. cria o projeto Pages caso ainda não exista;
3. cria o namespace KV e adiciona o binding `SITE_CONTENT` ao `wrangler.jsonc`;
4. gera automaticamente `ADMIN_PASSWORD` e `SESSION_SECRET`;
5. grava os secrets no Pages;
6. prepara os arquivos estáticos;
7. faz o deploy.

No final ele mostra a senha gerada para `/admin/`.

## Desenvolvimento local

Depois que `wrangler.jsonc` tiver o binding criado:

```powershell
npx wrangler pages dev .pages-dist
```

O site público continua majoritariamente estático; Functions são chamadas apenas para API/admin e imagens armazenadas no KV.
