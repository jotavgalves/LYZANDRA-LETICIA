$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
$ProductionBranch = 'main'
$OutputDir = '.pages-dist'

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & npx --yes wrangler@latest @Args
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($Args -join ' ')" }
}

Write-Host ''
Write-Host '=== ATUALIZANDO LYZANDRA LETICIA ===' -ForegroundColor Cyan

Invoke-Wrangler whoami

Write-Host "`nPreparando arquivos do site..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html')
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json')
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse }

Write-Host "`nPublicando sem alterar sua senha ou seus dados..." -ForegroundColor Cyan
Invoke-Wrangler pages deploy --project-name $ProjectName --branch $ProductionBranch

Write-Host ''
Write-Host 'ATUALIZACAO CONCLUIDA' -ForegroundColor Green
Write-Host "Site:  https://$ProjectName.pages.dev" -ForegroundColor White
Write-Host "Admin: https://$ProjectName.pages.dev/admin/" -ForegroundColor White
Write-Host ''
