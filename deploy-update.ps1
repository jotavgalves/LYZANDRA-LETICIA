$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
$OutputDir = '.pages-dist'
$ProductionUrl = "https://$ProjectName.pages.dev"

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & npx --yes wrangler@latest @Args
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($Args -join ' ')" }
}

Write-Host ''
Write-Host '=== PUBLICANDO EDITOR FACIL V3 ===' -ForegroundColor Cyan
Write-Host 'O script vai sincronizar a main, montar a pasta final, publicar explicitamente em producao e conferir o site online.' -ForegroundColor DarkGray

# 1. Preserva alteracoes locais e sincroniza exatamente com origin/main.
$dirty = (& git status --porcelain | Out-String).Trim()
if ($dirty) {
    Write-Host "`nHa alteracoes locais. Criando backup automatico com git stash..." -ForegroundColor Yellow
    & git stash push -u -m "backup-automatico-antes-do-deploy-$(Get-Date -Format yyyyMMdd-HHmmss)"
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o backup local.' }
}

Write-Host "`nSincronizando com o GitHub..." -ForegroundColor Cyan
& git fetch origin main
if ($LASTEXITCODE -ne 0) { throw 'Falha no git fetch origin main.' }
& git checkout main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao acessar a branch main.' }
& git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar com origin/main.' }

$CommitFull = (& git rev-parse HEAD | Out-String).Trim()
$Commit = (& git rev-parse --short HEAD | Out-String).Trim()
Write-Host "Commit que sera publicado: $Commit" -ForegroundColor Green

# 2. Confirma que o codigo local e realmente o editor novo.
$adminHtml = Get-Content -Raw -Path 'admin/index.html'
if ($adminHtml -notmatch '<meta name="editor-version" content="3">') {
    throw 'Deploy cancelado: admin/index.html nao e o Editor Facil v3.'
}
if ($adminHtml -match 'LYZANDRA EDITOR|CLASSES CSS|CSS INLINE|span-003') {
    throw 'Deploy cancelado: foi detectada a interface tecnica antiga.'
}
Write-Host 'Editor Facil v3 confirmado no codigo local.' -ForegroundColor Green

# 3. Confirma autenticacao Cloudflare.
Invoke-Wrangler whoami

# 4. Monta SOMENTE o conteudo que deve ir para o Pages.
Write-Host "`nMontando $OutputDir..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html') -Force
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json') -Force
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse -Force
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse -Force }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse -Force }

# Confere a propria pasta de upload antes de chamar Wrangler.
$distAdmin = Get-Content -Raw -Path (Join-Path $OutputDir 'admin/index.html')
if ($distAdmin -notmatch '<meta name="editor-version" content="3">' -or $distAdmin -match 'LYZANDRA EDITOR|CLASSES CSS|CSS INLINE') {
    throw "A pasta $OutputDir nao contem o Editor Facil v3. Deploy cancelado."
}
Write-Host "Pasta $OutputDir validada." -ForegroundColor Green

# 5. Publica explicitamente a pasta de saida. Sem --branch: Direct Upload vai para producao.
Write-Host "`nEnviando $OutputDir para o ambiente de PRODUCAO..." -ForegroundColor Cyan
Invoke-Wrangler pages deploy $OutputDir --project-name $ProjectName --commit-hash $CommitFull --commit-message "Editor facil v3 $Commit"

# 6. Confere o proprio pages.dev. Faz varias tentativas porque o alias de producao pode levar alguns segundos.
Write-Host "`nConferindo o site publicado..." -ForegroundColor Cyan
$verified = $false
$lastBody = ''
for ($attempt = 1; $attempt -le 8; $attempt++) {
    try {
        $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $url = "$ProductionUrl/admin/?verify=$Commit-$stamp"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' } -TimeoutSec 20
        $lastBody = [string]$response.Content
        if ($lastBody -match '<meta name="editor-version" content="3">' -and $lastBody -notmatch 'LYZANDRA EDITOR|CLASSES CSS|CSS INLINE') {
            $verified = $true
            break
        }
    } catch {
        Write-Host "Tentativa $attempt: site ainda nao respondeu com a versao nova." -ForegroundColor DarkYellow
    }
    Start-Sleep -Seconds 3
}

if (-not $verified) {
    Write-Host "`nERRO: o upload terminou, mas o dominio principal ainda nao esta servindo o Editor Facil v3." -ForegroundColor Red
    Write-Host 'Listando os deployments para diagnostico:' -ForegroundColor Yellow
    & npx --yes wrangler@latest pages deployment list --project-name $ProjectName
    throw 'A verificacao online encontrou a versao antiga. Copie a saida acima e me envie.'
}

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'EDITOR FACIL V3 PUBLICADO E VERIFICADO' -ForegroundColor Green
Write-Host "Commit: $Commit" -ForegroundColor White
Write-Host "Site:   $ProductionUrl" -ForegroundColor White
Write-Host "Admin:  $ProductionUrl/admin/?v=$Commit" -ForegroundColor White
Write-Host ''
Write-Host 'A pagina online foi lida pelo proprio script e confirmou a versao 3.' -ForegroundColor Yellow
Write-Host '=============================================' -ForegroundColor Green
