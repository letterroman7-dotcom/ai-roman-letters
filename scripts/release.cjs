# scripts/setup-git-hooks.ps1
$ErrorActionPreference = 'Stop'
git rev-parse --git-dir *> $null

$gitDir = git rev-parse --git-dir
$hookDir = Join-Path $gitDir 'hooks'
New-Item -ItemType Directory -Force -Path $hookDir | Out-Null

$hookPath = Join-Path $hookDir 'pre-push'
$hookBody = "#!/usr/bin/env bash`nnode scripts/prepush.cjs"
Set-Content -Path $hookPath -Value $hookBody -NoNewline -Encoding Ascii
try { & bash -lc "chmod +x `"$hookPath`"" } catch { }

Write-Host "Installed pre-push hook at $hookPath"
Write-Host "Hook will run: npm run verify:all"
Write-Host "Bypass (not recommended): git push --no-verify"
