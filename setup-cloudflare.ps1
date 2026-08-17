$ErrorActionPreference = 'Stop'

$ProjectName = 'lyzandra-leticia'
$ProductionBranch = 'main'
$OutputDir = '.pages-dist'
$ConfigPath = 'wrangler.jsonc'
$KvBinding = 'SITE_CONTENT'

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    & npx --yes wrangler@latest @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Wrangler falhou: $($CommandArgs -join ' ')"
    }
}

function Invoke-WranglerText {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CommandArgs)
    $output = (& npx --yes wrangler@latest @CommandArgs 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        throw "Wrangler falhou: $($CommandArgs -join ' ')`n$output"
    }
    return $output.Trim()
}

function New-RandomText {
    param([int]$Bytes = 24)
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    $text = ([Convert]::ToBase64String($buffer) -replace '[+/=]', '')
    return $text.Substring(0, [Math]::Min($Bytes, $text.Length))
}

function Get-KvNamespaces {
    $raw = Invoke-WranglerText kv namespace list

    # Wrangler normalmente devolve JSON puro. Este recorte também tolera avisos antes/depois do JSON.
    $start = $raw.IndexOf('[')
    $end = $raw.LastIndexOf(']')
    if ($start -lt 0 -or $end -lt $start) {
        throw "Nao foi possivel interpretar 'wrangler kv namespace list'. Saida:`n$raw"
    }

    $json = $raw.Substring($start, $end - $start + 1)
    try {
        return @($json | ConvertFrom-Json)
    } catch {
        throw "Nao foi possivel ler a lista de namespaces KV. Saida:`n$raw"
    }
}

function Find-SiteContentKv {
    param([object[]]$Namespaces)

    $preferredTitle = "$ProjectName-$KvBinding"

    $match = @($Namespaces | Where-Object { $_.title -eq $preferredTitle }) | Select-Object -First 1
    if ($match) { return $match }

    $match = @($Namespaces | Where-Object { $_.title -eq $KvBinding }) | Select-Object -First 1
    if ($match) { return $match }

    # Compatibilidade com nomes que o Wrangler possa prefixar automaticamente.
    $match = @($Namespaces | Where-Object { $_.title -like "*-$KvBinding" }) | Select-Object -First 1
    return $match
}

function Set-KvBindingInConfig {
    param([Parameter(Mandatory = $true)][string]$NamespaceId)

    if (-not (Test-Path $ConfigPath)) {
        throw "Arquivo $ConfigPath nao encontrado. Rode git pull antes de executar o setup."
    }

    try {
        $config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
    } catch {
        throw "Nao foi possivel ler $ConfigPath como JSON."
    }

    $bindingObject = [pscustomobject][ordered]@{
        binding = $KvBinding
        id = $NamespaceId
    }

    $existingBindings = @()
    if ($config.PSObject.Properties.Name -contains 'kv_namespaces') {
        $existingBindings = @($config.kv_namespaces | Where-Object { $_.binding -ne $KvBinding })
        $config.kv_namespaces = @($existingBindings + $bindingObject)
    } else {
        $config | Add-Member -NotePropertyName 'kv_namespaces' -NotePropertyValue @($bindingObject)
    }

    $json = $config | ConvertTo-Json -Depth 20
    [IO.File]::WriteAllText((Join-Path (Get-Location) $ConfigPath), $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
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

# 3. KV: reutiliza um namespace existente se a execucao anterior o criou antes de falhar.
Write-Host "`nVerificando KV $KvBinding..." -ForegroundColor Cyan
$namespaces = Get-KvNamespaces
$kv = Find-SiteContentKv -Namespaces $namespaces

if (-not $kv) {
    Write-Host "Criando namespace KV $KvBinding..." -ForegroundColor Yellow
    $createOutput = Invoke-WranglerText kv namespace create $KvBinding
    if ($createOutput) { Write-Host $createOutput }

    $namespaces = Get-KvNamespaces
    $kv = Find-SiteContentKv -Namespaces $namespaces
}

if (-not $kv -or -not $kv.id) {
    throw "O namespace KV foi criado/listado, mas nao consegui localizar seu ID automaticamente."
}

Write-Host "KV encontrado: $($kv.title) [$($kv.id)]" -ForegroundColor Green
Set-KvBindingInConfig -NamespaceId ([string]$kv.id)
Write-Host "Binding $KvBinding gravado em $ConfigPath." -ForegroundColor Green

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

# 6. Deploy: wrangler.jsonc e a fonte de verdade para bindings/configuracao.
Write-Host "`nFazendo deploy..." -ForegroundColor Cyan
Invoke-Wrangler pages deploy --project-name $ProjectName --branch $ProductionBranch

# 7. Guarda localmente o resultado para a senha nao se perder no terminal.
$resultPath = Join-Path (Get-Location) '.setup-result.txt'
$resultText = @"
LYZANDRA LETICIA - CLOUDFLARE
Site:  https://$ProjectName.pages.dev
Admin: https://$ProjectName.pages.dev/admin/
Senha do admin: $AdminPassword
KV: $($kv.title)
KV ID: $($kv.id)
"@
[IO.File]::WriteAllText($resultPath, $resultText.Trim() + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host '=============================================' -ForegroundColor Green
Write-Host 'CONFIGURACAO CONCLUIDA' -ForegroundColor Green
Write-Host "Site:  https://$ProjectName.pages.dev" -ForegroundColor White
Write-Host "Admin: https://$ProjectName.pages.dev/admin/" -ForegroundColor White
Write-Host ''
Write-Host 'SENHA DO ADMIN:' -ForegroundColor Yellow
Write-Host $AdminPassword -ForegroundColor White
Write-Host ''
Write-Host "Tambem salvei a senha localmente em: $resultPath" -ForegroundColor DarkGray
Write-Host '=============================================' -ForegroundColor Green
