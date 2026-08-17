$ErrorActionPreference = "Stop"
Write-Host "=== LYZANDRA LETICIA / Cloudflare Pages ===" -ForegroundColor Magenta
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js não encontrado." }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Git não encontrado." }
npm install
Write-Host "Dependências instaladas." -ForegroundColor Green
Write-Host "Próximo passo: configurar bindings SITE_CONTENT (KV), MEDIA (R2), ADMIN_PASSWORD e SESSION_SECRET." -ForegroundColor Yellow
