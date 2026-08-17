# LYZANDRA LETICIA — Speed Lash

Clone estático e editável da referência fornecida, preparado para Cloudflare Pages.

## Estrutura

- `index.html`: landing page baseada no HTML renderizado da referência.
- `assets/original.css`: CSS visual capturado da referência.
- `images/`: imagens originais fornecidas no pacote.
- `admin/`: editor visual em `/admin/`.
- `functions/api/`: autenticação, conteúdo e upload.
- `functions/media/`: entrega das imagens enviadas ao R2.
- `_routes.json`: mantém o site público como asset estático e aciona Functions apenas em `/api/*` e `/media/*`.

## Bindings necessários no Cloudflare Pages

Crie e conecte:

1. **KV namespace** com binding `SITE_CONTENT`
2. **R2 bucket** com binding `MEDIA`
3. Variável secreta `ADMIN_PASSWORD`
4. Variável secreta `SESSION_SECRET`

O site público funciona sem bindings. O painel abre, mas salvar/upload exige os recursos acima.

## Desenvolvimento local

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
npx wrangler pages dev .
```

Abra `http://localhost:8788` e `http://localhost:8788/admin/`.

## Cloudflare Pages

Projeto sem framework: o build command pode ficar vazio. Cloudflare Pages suporta Functions na pasta `/functions` e bindings KV/R2 para persistência e mídia.
