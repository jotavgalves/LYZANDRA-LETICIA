$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

New-Item -ItemType Directory -Force -Path "images", "assets" | Out-Null

$files = @{
  "images/hero-video.png" = "https://lycilios.vercel.app/images/hero-video.png"
  "images/tec-mega.png" = "https://lycilios.vercel.app/images/tec-mega.png"
  "images/tec-volume-brasileiro.png" = "https://lycilios.vercel.app/images/tec-volume-brasileiro.png"
  "images/tec-molhado.png" = "https://lycilios.vercel.app/images/tec-molhado.png"
  "images/certificate.png" = "https://lycilios.vercel.app/images/certificate.png"
  "images/jamily.png" = "https://lycilios.vercel.app/images/jamily.png"
  "assets/original.css" = "https://lycilios.vercel.app/_next/static/chunks/028f974khuefk.css"
}

foreach ($item in $files.GetEnumerator()) {
  Write-Host "Baixando $($item.Key)..."
  Invoke-WebRequest -Uri $item.Value -OutFile $item.Key -UseBasicParsing
}

$index = Get-Content "index.html" -Raw -Encoding UTF8
$index = $index.Replace("https://lycilios.vercel.app/_next/static/chunks/028f974khuefk.css", "/assets/original.css")
foreach ($name in @("hero-video.png", "tec-mega.png", "tec-volume-brasileiro.png", "tec-molhado.png", "certificate.png", "jamily.png")) {
  $index = $index.Replace("https://lycilios.vercel.app/images/$name", "/images/$name")
}
Set-Content "index.html" $index -Encoding UTF8

Write-Host "Assets internalizados. O site agora pode usar CSS e imagens locais." -ForegroundColor Green
Write-Host "Confira com git status e depois faça commit/push." -ForegroundColor Yellow
