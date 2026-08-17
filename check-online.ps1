$ErrorActionPreference = 'Stop'

try {
    $Utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::OutputEncoding = $Utf8
    $OutputEncoding = $Utf8
} catch {}

$ProjectName = 'lyzandra-leticia'
$ProductionUrl = "https://$ProjectName.pages.dev"
$WranglerVersion = '4.123.0'

function Get-Status {
    param([Parameter(Mandatory = $true)][string]$BaseUrl)
    $result = [ordered]@{ Ok=$false; Version5=$false; Kv=$false; AdminStatus=$null; HealthStatus=$null; Error='' }
    try {
        $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $headers = @{ 'Cache-Control'='no-cache, no-store'; 'Pragma'='no-cache' }
        $admin = Invoke-WebRequest -Uri "$BaseUrl/admin/?verify=$stamp" -UseBasicParsing -Headers $headers -TimeoutSec 20
        $result.AdminStatus = [int]$admin.StatusCode
        $result.Version5 = ([string]$admin.Content -match '<meta\s+name="editor-version"\s+content="5"')
        $healthResp = Invoke-WebRequest -Uri "$BaseUrl/api/health?verify=$stamp" -UseBasicParsing -Headers $headers -TimeoutSec 20
        $result.HealthStatus = [int]$healthResp.StatusCode
        $health = ([string]$healthResp.Content) | ConvertFrom-Json
        $result.Kv = ($health.kv -eq $true)
        $result.Ok = ($result.Version5 -and $result.Kv)
    } catch {
        $result.Error = $_.Exception.Message
    }
    [pscustomobject]$result
}

function Show-Status {
    param([string]$Name,[string]$Url,$Status)
    $v = if ($Status.Version5) { 'SIM' } else { 'NAO' }
    $k = if ($Status.Kv) { 'SIM' } else { 'NAO' }
    $a = if ($null -ne $Status.AdminStatus) { $Status.AdminStatus } else { '-' }
    $h = if ($null -ne $Status.HealthStatus) { $Status.HealthStatus } else { '-' }
    Write-Host "`n$Name" -ForegroundColor Cyan
    Write-Host "URL: $Url"
    Write-Host "HTML V5: $v | KV: $k | admin HTTP: $a | health HTTP: $h"
    if ($Status.Error) { Write-Host "Detalhe: $($Status.Error)" -ForegroundColor Yellow }
}

Write-Host '=== VERIFICAR LYZANDRA ONLINE (SEM DEPLOY) ===' -ForegroundColor Cyan

$list = (& npx --yes "wrangler@$WranglerVersion" pages deployment list --project-name $ProjectName --environment production 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw "Nao consegui listar os deployments.`n$list" }

$escaped = [regex]::Escape($ProjectName)
$matches = [regex]::Matches($list, "https://[a-zA-Z0-9-]+\.$escaped\.pages\.dev")
$AtomicUrl = if ($matches.Count -gt 0) { $matches[0].Value } else { $null }

if ($AtomicUrl) {
    $atomic = Get-Status -BaseUrl $AtomicUrl
    Show-Status -Name 'ULTIMO DEPLOYMENT PRODUCTION' -Url $AtomicUrl -Status $atomic
} else {
    Write-Host 'Nao consegui localizar a URL do ultimo deployment na tabela do Wrangler.' -ForegroundColor Yellow
    $atomic = $null
}

$main = Get-Status -BaseUrl $ProductionUrl
Show-Status -Name 'DOMINIO PRINCIPAL' -Url $ProductionUrl -Status $main

$OpenUrl = $null
if ($main.Ok) { $OpenUrl = "$ProductionUrl/admin/?v=5" }
elseif ($atomic -and $atomic.Ok) { $OpenUrl = "$AtomicUrl/admin/?v=5" }

Write-Host ''
Write-Host '============================================='
if ($OpenUrl) {
    Write-Host 'EDITOR V5 + KV CONFIRMADOS' -ForegroundColor Green
    Write-Host "Admin: $OpenUrl" -ForegroundColor White
    Write-Host 'Abrindo no navegador...' -ForegroundColor Green
    Start-Process $OpenUrl
} else {
    Write-Host 'O upload existe, mas a verificacao HTTP ainda nao confirmou V5 + KV.' -ForegroundColor Yellow
    Write-Host 'Nao foi feito nenhum novo deploy.' -ForegroundColor Yellow
    Write-Host 'Copie apenas as duas linhas de status acima e me envie.' -ForegroundColor Yellow
}
Write-Host '============================================='
