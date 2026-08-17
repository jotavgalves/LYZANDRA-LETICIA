$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
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

function Get-KvNamespaces {
    $raw = Invoke-WranglerText kv namespace list
    $start = $raw.IndexOf('[')
    $end = $raw.LastIndexOf(']')
    if ($start -lt 0 -or $end -lt $start) { throw "Nao consegui interpretar a lista de KV.`n$raw" }
    try { return @($raw.Substring($start, $end - $start + 1) | ConvertFrom-Json) }
    catch { throw "Nao consegui ler a lista de KV.`n$raw" }
}

function Find-SiteContentKv {
    param([object[]]$Namespaces)
    $preferred = "$ProjectName-$KvBinding"
    $match = @($Namespaces | Where-Object { $_.title -eq $preferred }) | Select-Object -First 1
    if ($match) { return $match }
    $match = @($Namespaces | Where-Object { $_.title -eq $KvBinding }) | Select-Object -First 1
    if ($match) { return $match }
    return @($Namespaces | Where-Object { $_.title -like "*-$KvBinding" }) | Select-Object -First 1
}

function Ensure-SiteContentKv {
    Write-Host "`nVerificando armazenamento SITE_CONTENT..." -ForegroundColor Cyan
    $list = Get-KvNamespaces
    $kv = Find-SiteContentKv -Namespaces $list
    if (-not $kv) {
        Write-Host 'KV ainda nao existe. Criando automaticamente...' -ForegroundColor Yellow
        Invoke-Wrangler kv namespace create $KvBinding
        $list = Get-KvNamespaces
        $kv = Find-SiteContentKv -Namespaces $list
    }
    if (-not $kv -or -not $kv.id) { throw 'Nao consegui localizar/criar o KV SITE_CONTENT.' }
    Write-Host "KV encontrado: $($kv.title) [$($kv.id)]" -ForegroundColor Green
    return $kv
}

function Set-KvBindingInConfig {
    param([Parameter(Mandatory = $true)][string]$NamespaceId)
    $config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
    $binding = [pscustomobject][ordered]@{ binding = $KvBinding; id = $NamespaceId }
    if ($config.PSObject.Properties.Name -contains 'kv_namespaces') {
        $others = @($config.kv_namespaces | Where-Object { $_.binding -ne $KvBinding })
        $config.kv_namespaces = @($others + $binding)
    } else {
        $config | Add-Member -NotePropertyName 'kv_namespaces' -NotePropertyValue @($binding)
    }
    $json = $config | ConvertTo-Json -Depth 20
    [IO.File]::WriteAllText((Join-Path (Get-Location) $ConfigPath), $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host ''
Write-Host '=== LYZANDRA | PUBLICAR EDITOR VISUAL V5 ===' -ForegroundColor Cyan

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

$adminHtml = Get-Content -Raw -Path 'admin/index.html'
if ($adminHtml -notmatch '<meta name="editor-version" content="5">') { throw 'Deploy cancelado: o Editor Visual v5 nao esta no codigo local.' }
if ($adminHtml -match 'CLASSES CSS|CSS INLINE|span-003|Ferramentas técnicas') { throw 'Deploy cancelado: foi detectada interface tecnica antiga.' }
if ($adminHtml -notmatch 'Prévia em tempo real') { throw 'Deploy cancelado: a previa em tempo real nao foi encontrada.' }
Write-Host 'Editor Visual v5 confirmado.' -ForegroundColor Green

Invoke-Wrangler whoami
$kv = Ensure-SiteContentKv
$originalConfig = Get-Content -Raw -Path $ConfigPath

try {
    Set-KvBindingInConfig -NamespaceId ([string]$kv.id)
    Write-Host 'Binding SITE_CONTENT preparado para este deploy.' -ForegroundColor Green

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

    Write-Host "`nPublicando em PRODUCAO..." -ForegroundColor Cyan
    Invoke-Wrangler pages deploy $OutputDir --project-name $ProjectName --commit-hash $CommitFull --commit-message "Editor visual v5 $Commit"

    Write-Host "`nVerificando editor e KV no site online..." -ForegroundColor Cyan
    $verified = $false
    $lastHealth = ''
    for ($attempt = 1; $attempt -le 10; $attempt++) {
        try {
            $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $adminUrl = "$ProductionUrl/admin/?verify=$Commit-$stamp"
            $adminResponse = Invoke-WebRequest -Uri $adminUrl -UseBasicParsing -Headers @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' } -TimeoutSec 20
            $adminBody = [string]$adminResponse.Content

            $healthUrl = "$ProductionUrl/api/health?verify=$stamp"
            $healthResponse = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -Headers @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' } -TimeoutSec 20
            $lastHealth = [string]$healthResponse.Content
            $health = $lastHealth | ConvertFrom-Json

            if ($adminBody -match '<meta name="editor-version" content="5">' -and $adminBody -match 'Prévia em tempo real' -and $health.kv -eq $true) {
                $verified = $true
                break
            }
            Write-Host "Tentativa ${attempt}: aguardando propagacao do editor/KV..." -ForegroundColor DarkYellow
        } catch {
            Write-Host "Tentativa ${attempt}: site ainda nao confirmou a nova versao." -ForegroundColor DarkYellow
        }
        Start-Sleep -Seconds 3
    }

    if (-not $verified) {
        Write-Host "`nO deploy terminou, mas a verificacao online falhou." -ForegroundColor Red
        Write-Host "Resposta do health: $lastHealth" -ForegroundColor Yellow
        & npx --yes wrangler@latest pages deployment list --project-name $ProjectName
        throw 'Editor v5 ou binding SITE_CONTENT nao foi confirmado online. Envie a saida acima.'
    }

    Write-Host ''
    Write-Host '=============================================' -ForegroundColor Green
    Write-Host 'EDITOR V5 + PREVIA AO VIVO + KV VERIFICADOS' -ForegroundColor Green
    Write-Host "Commit: $Commit" -ForegroundColor White
    Write-Host "Site:   $ProductionUrl" -ForegroundColor White
    Write-Host "Admin:  $ProductionUrl/admin/?v=$Commit" -ForegroundColor White
    Write-Host "KV:     $($kv.title)" -ForegroundColor White
    Write-Host '=============================================' -ForegroundColor Green
}
finally {
    [IO.File]::WriteAllText((Join-Path (Get-Location) $ConfigPath), $originalConfig, (New-Object System.Text.UTF8Encoding($false)))
}
