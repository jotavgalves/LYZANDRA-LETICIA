$ErrorActionPreference = "Stop"
if (-not (Test-Path ".dev.vars")) {
  Copy-Item ".dev.vars.example" ".dev.vars"
  Write-Host "Arquivo .dev.vars criado. Edite ADMIN_PASSWORD e SESSION_SECRET antes de usar o login." -ForegroundColor Yellow
}
npm install
npx wrangler pages dev .
