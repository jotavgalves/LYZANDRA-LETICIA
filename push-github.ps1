$ErrorActionPreference = "Stop"
$remote = "https://github.com/jotavgalves/LYZANDRA-LETICIA.git"

if (-not (Test-Path ".git")) {
  git init -b main
}

if (-not (git config user.name)) { git config user.name "jotavgalves" }
if (-not (git config user.email)) { git config user.email "jotavgalves@users.noreply.github.com" }

$origin = git remote 2>$null
if ($origin -contains "origin") {
  git remote set-url origin $remote
} else {
  git remote add origin $remote
}

git add -A
$changes = git status --porcelain
if ($changes) {
  git commit -m "feat: recreate Speed Lash with editable admin panel"
}

git branch -M main
git push -u origin main
Write-Host "Publicado em $remote" -ForegroundColor Green
