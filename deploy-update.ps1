$ErrorActionPreference = 'Stop'

# Evita saida corrompida do Wrangler no Windows/PowerShell.
try {
    $Utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::OutputEncoding = $Utf8
    $OutputEncoding = $Utf8
} catch {}

$ProjectName = 'lyzandra-leticia'
$ProductionBranch = 'main'
$OutputDir = '.pages-dist'
$ProductionUrl = "https://$ProjectName.pages.dev"
$ConfigPath = 'wrangler.jsonc'
$KvBinding = 'SITE_CONTENT'
$WranglerVersion = '4.123.0'

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    & npx --yes "wrangler@$WranglerVersion" @CommandArgs
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($CommandArgs -join ' ')" }
}

function Invoke-WranglerText {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    $output = (& npx --yes "wrangler@$WranglerVersion" @CommandArgs 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($CommandArgs -join ' ')`n$output" }
    return $output.Trim()
}

function Get-EditorV5Status {
    param([Parameter(Mandatory = $true)][string]$BaseUrl)

    $result = [ordered]@{
        Ok = $false
        Version5 = $false
        Kv = $false
        AdminStatus = $null
        HealthStatus = $null
        Error = ''
    }

    try {
        $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $headers = @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' }

        $adminUrl = "$BaseUrl/admin/?verify=$stamp"
        $adminResponse = Invoke-WebRequest -Uri $adminUrl -UseBasicParsing -Headers $headers -TimeoutSec 20
        $result.AdminStatus = [int]$adminResponse.StatusCode
        $adminBody = [string]$adminResponse.Content

        # Marcador ASCII e estavel. Nao depende de acentos/encoding do terminal.
        $result.Version5 = ($adminBody -match '<meta\s+name="editor-version"\s+content="5"')

        $healthUrl = "$BaseUrl/api/health?verify=$stamp"
        $healthResponse = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -Headers $headers -TimeoutSec 20
        $result.HealthStatus = [int]$healthResponse.StatusCode
        $health = ([string]$healthResponse.Content) | ConvertFrom-Json
        $result.Kv = ($health.kv -eq $true)

        $result.Ok = ($result.Version5 -and $result.Kv)
    } catch {
        $result.Error = $_.Exception.Message
    }

    return [pscustomobject]$result
}

function Write-CheckStatus {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)]$Status
    )
    $v = if ($Status.Version5) { 'SIM' } else { 'NAO' }
    $k = if ($Status.Kv) { 'SIM' } else { 'NAO' }
    $a = if ($null -ne $Status.AdminStatus) { $Status.AdminStatus } else { '-' }
    $h = if ($null -ne $Status.HealthStatus) { $Status.HealthStatus } else { '-' }
    Write-Host "$Label | HTML V5: $v | KV: $k | admin HTTP: $a | health HTTP: $h" -ForegroundColor DarkYellow
    if ($Status.Error) { Write-Host "  detalhe: $($Status.Error)" -ForegroundColor DarkGray }
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

# Valida localmente com marcadores ASCII.
$adminHtml = Get-Content -Raw -Path 'admin/index.html'
if ($adminHtml -notmatch '<meta\s+name="editor-version"\s+content="5"') {
    throw 'Deploy cancelado: Editor Visual v5 nao encontrado no codigo local.'
}
if ($adminHtml -match 'CLASSES CSS|CSS INLINE|span-003') {
    throw 'Deploy cancelado: interface tecnica antiga detectada.'
}
Write-Host 'Editor Visual v5 confirmado localmente.' -ForegroundColor Green

# Binding KV deve permanecer versionado no wrangler.jsonc.
$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
$kv = @($config.kv_namespaces | Where-Object { $_.binding -eq $KvBinding }) | Select-Object -First 1
if (-not $kv -or -not $kv.id) { throw 'SITE_CONTENT nao esta configurado no wrangler.jsonc.' }
Write-Host "SITE_CONTENT configurado: $($kv.id)" -ForegroundColor Green

Invoke-Wrangler whoami

Write-Host "`nMontando arquivos finais..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html') -Force
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json') -Force
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse -Force
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse -Force }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse -Force }

$distAdmin = Get-Content -Raw -Path (Join-Path $OutputDir 'admin/index.html')
if ($distAdmin -notmatch '<meta\s+name="editor-version"\s+content="5"') {
    throw 'A pasta de deploy nao contem o Editor Visual v5.'
}

Write-Host "`nPublicando em PRODUCAO..." -ForegroundColor Cyan
$deployOutput = Invoke-WranglerText pages deploy $OutputDir --project-name $ProjectName --branch $ProductionBranch --commit-hash $CommitFull --commit-message "Editor visual v5 $Commit" --commit-dirty=true
Write-Host $deployOutput

$escapedProject = [regex]::Escape($ProjectName)
$match = [regex]::Match($deployOutput, "https://[a-zA-Z0-9-]+\.$escapedProject\.pages\.dev")
$DeploymentUrl = if ($match.Success) { $match.Value } else { $null }

if (-not $DeploymentUrl) {
    Write-Host 'Upload concluido, mas nao consegui ler a URL atomica do texto do Wrangler.' -ForegroundColor Yellow
    & npx --yes "wrangler@$WranglerVersion" pages deployment list --project-name $ProjectName
    Write-Host 'O deploy nao sera repetido automaticamente.' -ForegroundColor Yellow
    exit 0
}

Write-Host "`nDeployment criado: $DeploymentUrl" -ForegroundColor Cyan

# A URL hash pode demorar para resolver em alguns provedores/DNS locais.
$deploymentVerified = $false
$deploymentStatus = $null
for ($attempt = 1; $attempt -le 15; $attempt++) {
    $deploymentStatus = Get-EditorV5Status -BaseUrl $DeploymentUrl
    if ($deploymentStatus.Ok) {
        $deploymentVerified = $true
        break
    }
    Write-CheckStatus -Label "Atomico tentativa $attempt" -Status $deploymentStatus
    Start-Sleep -Seconds 3
}

# Independente do resultado da URL atomica, confere o alias principal.
$productionVerified = $false
$productionStatus = $null
Write-Host "`nConferindo dominio principal..." -ForegroundColor Cyan
for ($attempt = 1; $attempt -le 20; $attempt++) {
    $productionStatus = Get-EditorV5Status -BaseUrl $ProductionUrl
    if ($productionStatus.Ok) {
        $productionVerified = $true
        break
    }
    Write-CheckStatus -Label "Principal tentativa $attempt" -Status $productionStatus
    Start-Sleep -Seconds 3
}

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'UPLOAD DO EDITOR V5 CONCLUIDO' -ForegroundColor Green
Write-Host "Commit:     $Commit" -ForegroundColor White
Write-Host "Deployment: $DeploymentUrl" -ForegroundColor White
Write-Host "KV:         $($kv.id)" -ForegroundColor White

if ($deploymentVerified) {
    Write-Host 'URL atomica: V5 + KV confirmados.' -ForegroundColor Green
} else {
    Write-Host 'URL atomica: ainda nao confirmou por HTTP; o deployment existe em Production.' -ForegroundColor Yellow
    if ($deploymentStatus) { Write-CheckStatus -Label 'Ultimo teste atomico' -Status $deploymentStatus }
}

if ($productionVerified) {
    Write-Host "Site:       $ProductionUrl" -ForegroundColor White
    Write-Host "Admin:      $ProductionUrl/admin/?v=$Commit" -ForegroundColor White
    Write-Host 'Dominio principal: V5 + KV confirmados.' -ForegroundColor Green
} else {
    Write-Host "Site:       $ProductionUrl" -ForegroundColor Yellow
    Write-Host "Admin:      $ProductionUrl/admin/?v=$Commit" -ForegroundColor Yellow
    Write-Host 'Dominio principal ainda nao confirmou durante a janela de teste.' -ForegroundColor Yellow
    if ($productionStatus) { Write-CheckStatus -Label 'Ultimo teste principal' -Status $productionStatus }
    Write-Host 'IMPORTANTE: nao rode outro deploy por causa disso. O Wrangler ja criou o deployment Production.' -ForegroundColor Yellow
}

Write-Host '=============================================' -ForegroundColor Green
