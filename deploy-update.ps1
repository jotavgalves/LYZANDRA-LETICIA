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
Write-Host 'Este comando publica exatamente a versao mais recente da main.' -ForegroundColor DarkGray

# Preserva qualquer alteracao local antes de sincronizar.
$dirty = (& git status --porcelain | Out-String).Trim()
if ($dirty) {
    Write-Host "`nHa alteracoes locais. Salvando-as em um stash de seguranca..." -ForegroundColor Yellow
    & git stash push -u -m "backup-automatico-antes-do-deploy-$(Get-Date -Format yyyyMMdd-HHmmss)"
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o backup local com git stash.' }
}

Write-Host "`nBaixando a ultima versao do GitHub..." -ForegroundColor Cyan
& git fetch origin main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao executar git fetch origin main.' }
& git checkout main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao acessar a branch main.' }
& git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar com origin/main.' }

$Commit = (& git rev-parse --short HEAD | Out-String).Trim()
Write-Host "Versao local sincronizada: $Commit" -ForegroundColor Green

# Impede publicar novamente o editor tecnico antigo.
$adminHtml = Get-Content -Raw -Path 'admin/index.html'
if ($adminHtml -notmatch 'editor-version" content="3' -or $adminHtml -notmatch 'Imagens e vídeos') {
    throw 'O admin local nao e o Editor Facil v3. Deploy cancelado para evitar publicar a interface antiga.'
}
Write-Host 'Editor Facil v3 confirmado.' -ForegroundColor Green

Invoke-Wrangler whoami

Write-Host "`nPreparando arquivos do site..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html')
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json')
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse }

Write-Host "`nPublicando sem trocar senha e sem apagar os dados do KV..." -ForegroundColor Cyan
Invoke-Wrangler pages deploy --project-name $ProjectName --branch $ProductionBranch

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'ATUALIZACAO CONCLUIDA' -ForegroundColor Green
Write-Host "Commit publicado: $Commit" -ForegroundColor White
Write-Host "Site:  https://$ProjectName.pages.dev" -ForegroundColor White
Write-Host "Admin: https://$ProjectName.pages.dev/admin/?v=3" -ForegroundColor White
Write-Host ''
Write-Host 'No topo do painel deve aparecer: Editor facil / versao 3.' -ForegroundColor Yellow
Write-Host 'Se aparecer LYZANDRA EDITOR com Classes CSS, esse nao e este deploy.' -ForegroundColor Yellow
Write-Host '=============================================' -ForegroundColor Green
