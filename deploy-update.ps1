$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
$ProductionBranch = 'main'
$OutputDir = '.pages-dist'
$ProductionUrl = "https://$ProjectName.pages.dev"
$ConfigPath = 'wrangler.jsonc'
$KvBinding = 'SITE_CONTENT'

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    & npx --yes wrangler@latest @CommandArgs
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($CommandArgs -join ' ')" }
}

function Invoke-WranglerText {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    $output = (& npx --yes wrangler@latest @CommandArgs 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($CommandArgs -join ' ')`n$output" }
    return $output.Trim()
}

function Test-EditorV5 {
    param([Parameter(Mandatory = $true)][string]$BaseUrl)
    try {
        $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $adminUrl = "$BaseUrl/admin/?verify=$stamp"
        $adminResponse = Invoke-WebRequest -Uri $adminUrl -UseBasicParsing -Headers @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' } -TimeoutSec 20
        $adminBody = [string]$adminResponse.Content

        $healthUrl = "$BaseUrl/api/health?verify=$stamp"
        $healthResponse = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -Headers @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' } -TimeoutSec 20
        $health = ([string]$healthResponse.Content) | ConvertFrom-Json

        return ($adminBody -match '<meta name="editor-version" content="5">' -and $adminBody -match 'Prévia em tempo real' -and $health.kv -eq $true)
    } catch {
        return $false
    }
}

Write-Host ''
Write-Host '=== LYZANDRA | PUBLICAR EDITOR VISUAL V5 ===' -ForegroundColor Cyan

# Preserva qualquer alteracao local antes de sincronizar.
$dirty = (& git status --porcelain | Out-String).Trim()
if ($dirty) {
    Write-Host "`nHa alteracoes locais. Criando backup automatico..." -ForegroundColor Yellow
    & git stash push -u -m "backup-automatico-antes-do-deploy-$(Get-Date -Format yyyyMMdd-HHmmss)"
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o backup local.' }
}

Write-Host "`nBaixando a versao mais recente do GitHub..." -ForegroundColor Cyan
& git fetch origin main
if ($LASTEXITCODE -ne 0) { throw 'Falha no git fetch origin main.' }
& git checkout main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao acessar a branch main.' }
& git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar com origin/main.' }

$CommitFull = (& git rev-parse HEAD | Out-String).Trim()
$Commit = (& git rev-parse --short HEAD | Out-String).Trim()
Write-Host "Commit: $Commit" -ForegroundColor Green

# Valida o editor antes do upload.
$adminHtml = Get-Content -Raw -Path 'admin/index.html'
if ($adminHtml -notmatch '<meta name="editor-version" content="5">') { throw 'Deploy cancelado: o Editor Visual v5 nao esta no codigo local.' }
if ($adminHtml -match 'CLASSES CSS|CSS INLINE|span-003|Ferramentas técnicas') { throw 'Deploy cancelado: foi detectada interface tecnica antiga.' }
if ($adminHtml -notmatch 'Prévia em tempo real') { throw 'Deploy cancelado: a previa em tempo real nao foi encontrada.' }
Write-Host 'Editor Visual v5 confirmado.' -ForegroundColor Green

# Confirma o binding persistente do KV no arquivo versionado.
$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
$kv = @($config.kv_namespaces | Where-Object { $_.binding -eq $KvBinding }) | Select-Object -First 1
if (-not $kv -or -not $kv.id) { throw 'SITE_CONTENT nao esta configurado no wrangler.jsonc.' }
Write-Host "SITE_CONTENT configurado: $($kv.id)" -ForegroundColor Green

Invoke-Wrangler whoami

# Monta somente os arquivos publicos. Functions sao coletadas automaticamente da pasta /functions.
Write-Host "`nMontando arquivos finais..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html') -Force
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json') -Force
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse -Force
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse -Force }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse -Force }

$distAdmin = Get-Content -Raw -Path (Join-Path $OutputDir 'admin/index.html')
if ($distAdmin -notmatch '<meta name="editor-version" content="5">') { throw 'A pasta de deploy nao contem o Editor Visual v5.' }

# Faz o deploy e captura a URL atomica gerada pelo Pages.
Write-Host "`nPublicando em PRODUCAO..." -ForegroundColor Cyan
$deployOutput = Invoke-WranglerText pages deploy $OutputDir --project-name $ProjectName --branch $ProductionBranch --commit-hash $CommitFull --commit-message "Editor visual v5 $Commit" --commit-dirty=true
Write-Host $deployOutput

$escapedProject = [regex]::Escape($ProjectName)
$match = [regex]::Match($deployOutput, "https://[a-zA-Z0-9-]+\.$escapedProject\.pages\.dev")
$DeploymentUrl = if ($match.Success) { $match.Value } else { $null }

if (-not $DeploymentUrl) {
    Write-Host 'Nao consegui extrair a URL atomica do output do Wrangler.' -ForegroundColor Yellow
    & npx --yes wrangler@latest pages deployment list --project-name $ProjectName
    throw 'Deploy enviado, mas nao consegui validar a URL especifica.'
}

Write-Host "`nDeployment atomico: $DeploymentUrl" -ForegroundColor Cyan

# Primeiro valida a URL atomica, que representa exatamente o upload que acabou de ser criado.
$deploymentVerified = $false
for ($attempt = 1; $attempt -le 8; $attempt++) {
    if (Test-EditorV5 -BaseUrl $DeploymentUrl) {
        $deploymentVerified = $true
        break
    }
    Write-Host "Tentativa ${attempt}: aguardando o deployment atomico responder..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 2
}

if (-not $deploymentVerified) {
    & npx --yes wrangler@latest pages deployment list --project-name $ProjectName
    throw 'O deployment foi criado, mas a propria URL atomica nao confirmou Editor v5 + KV.'
}

Write-Host 'Deployment atomico confirmou Editor v5 + SITE_CONTENT.' -ForegroundColor Green

# Depois verifica o alias principal. Ele pode levar mais tempo para apontar para o novo deployment.
$productionVerified = $false
Write-Host "`nConferindo o dominio principal..." -ForegroundColor Cyan
for ($attempt = 1; $attempt -le 20; $attempt++) {
    if (Test-EditorV5 -BaseUrl $ProductionUrl) {
        $productionVerified = $true
        break
    }
    Write-Host "Tentativa ${attempt}: dominio principal ainda atualizando..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 3
}

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'DEPLOYMENT V5 + PREVIA AO VIVO + KV CONFIRMADOS' -ForegroundColor Green
Write-Host "Commit:      $Commit" -ForegroundColor White
Write-Host "Deployment:  $DeploymentUrl" -ForegroundColor White
Write-Host "Admin agora: $DeploymentUrl/admin/?v=$Commit" -ForegroundColor White
Write-Host "KV:          $($kv.id)" -ForegroundColor White

if ($productionVerified) {
    Write-Host "Site:         $ProductionUrl" -ForegroundColor White
    Write-Host "Admin:        $ProductionUrl/admin/?v=$Commit" -ForegroundColor White
    Write-Host 'Dominio principal tambem confirmado na versao nova.' -ForegroundColor Green
} else {
    Write-Host "Site:         $ProductionUrl" -ForegroundColor Yellow
    Write-Host 'O deployment novo esta correto, mas o alias principal ainda nao atualizou durante a verificacao.' -ForegroundColor Yellow
    Write-Host 'Use a URL atomica acima imediatamente; o dominio principal pode ser conferido depois sem refazer o deploy.' -ForegroundColor Yellow
}

Write-Host '=============================================' -ForegroundColor Green
