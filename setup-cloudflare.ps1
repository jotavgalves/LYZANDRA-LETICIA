$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
$ProductionBranch = 'main'
$OutputDir = '.pages-dist'

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & npx --yes wrangler@latest @Args
    if ($LASTEXITCODE -ne 0) { throw "Wrangler falhou: $($Args -join ' ')" }
}

function New-RandomText {
    param([int]$Bytes = 24)
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ([Convert]::ToBase64String($buffer) -replace '[+/=]', '').Substring(0, [Math]::Min($Bytes, ([Convert]::ToBase64String($buffer) -replace '[+/=]', '').Length))
}

Write-Host ''
Write-Host '=== LYZANDRA LETICIA | SETUP CLOUDFLARE ===' -ForegroundColor Cyan
Write-Host ''

# 1. Autenticacao
& npx --yes wrangler@latest whoami *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Abrindo login da Cloudflare...' -ForegroundColor Yellow
    Invoke-Wrangler login
}
Invoke-Wrangler whoami

# 2. Projeto Pages
Write-Host "`nVerificando projeto Pages '$ProjectName'..." -ForegroundColor Cyan
$projectsText = (& npx --yes wrangler@latest pages project list --json 2>$null | Out-String).Trim()
$projectExists = $false
if ($projectsText) {
    try {
        $projects = $projectsText | ConvertFrom-Json
        $projectExists = @($projects | Where-Object { $_.name -eq $ProjectName }).Count -gt 0
    } catch {
        $projectExists = $projectsText -match ('"name"\s*:\s*"' + [regex]::Escape($ProjectName) + '"')
    }
}
if (-not $projectExists) {
    Write-Host 'Criando projeto Pages...' -ForegroundColor Yellow
    Invoke-Wrangler pages project create $ProjectName --production-branch $ProductionBranch
} else {
    Write-Host 'Projeto Pages ja existe.' -ForegroundColor Green
}

# 3. KV + binding. Wrangler grava o ID automaticamente no wrangler.jsonc.
$configText = Get-Content -Raw -Path 'wrangler.jsonc'
if ($configText -notmatch '"binding"\s*:\s*"SITE_CONTENT"') {
    Write-Host "`nCriando KV SITE_CONTENT e vinculando ao projeto..." -ForegroundColor Yellow
    Invoke-Wrangler kv namespace create SITE_CONTENT --binding SITE_CONTENT --update-config
} else {
    Write-Host "`nBinding KV SITE_CONTENT ja existe no wrangler.jsonc." -ForegroundColor Green
}

# 4. Secrets gerados automaticamente
$AdminPassword = New-RandomText 18
$SessionSecret = New-RandomText 48
$secretFile = Join-Path $env:TEMP ("lyzandra-secrets-" + [guid]::NewGuid().ToString('N') + '.json')
$secretJson = @{ ADMIN_PASSWORD = $AdminPassword; SESSION_SECRET = $SessionSecret } | ConvertTo-Json -Compress
[IO.File]::WriteAllText($secretFile, $secretJson, (New-Object System.Text.UTF8Encoding($false)))

try {
    Write-Host "`nGravando senha e segredo de sessao no Cloudflare Pages..." -ForegroundColor Yellow
    Invoke-Wrangler pages secret bulk $secretFile --project-name $ProjectName
} finally {
    Remove-Item $secretFile -Force -ErrorAction SilentlyContinue
}

# 5. Monta apenas os assets publicos; Functions continuam em /functions.
Write-Host "`nPreparando arquivos estaticos..." -ForegroundColor Cyan
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Copy-Item 'index.html' (Join-Path $OutputDir 'index.html')
Copy-Item '_routes.json' (Join-Path $OutputDir '_routes.json')
Copy-Item 'admin' (Join-Path $OutputDir 'admin') -Recurse
if (Test-Path 'assets') { Copy-Item 'assets' (Join-Path $OutputDir 'assets') -Recurse }
if (Test-Path 'images') { Copy-Item 'images' (Join-Path $OutputDir 'images') -Recurse }

# 6. Deploy com o wrangler.jsonc como fonte de verdade.
Write-Host "`nFazendo deploy..." -ForegroundColor Cyan
Invoke-Wrangler pages deploy --project-name $ProjectName --branch $ProductionBranch

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'CONFIGURACAO CONCLUIDA' -ForegroundColor Green
Write-Host "Site:  https://$ProjectName.pages.dev" -ForegroundColor White
Write-Host "Admin: https://$ProjectName.pages.dev/admin/" -ForegroundColor White
Write-Host ''
Write-Host 'SENHA DO ADMIN:' -ForegroundColor Yellow
Write-Host $AdminPassword -ForegroundColor White
Write-Host ''
Write-Host 'Guarde essa senha. Ela foi gerada automaticamente e nao foi salva no repositorio.' -ForegroundColor DarkGray
Write-Host '=============================================' -ForegroundColor Green
