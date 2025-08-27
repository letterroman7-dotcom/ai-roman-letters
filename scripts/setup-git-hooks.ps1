# scripts/setup-git-hooks.ps1
# Installs a robust pre-push Git hook that runs `npm run verify:all`
# - Writes BOTH a POSIX hook (pre-push) and a Windows CMD hook (pre-push.cmd)
# - Uses repo root at runtime (not .git/hooks)
# - Avoids UTF-8 BOM, keeps ASCII to not break shebang on bash
# - Makes the POSIX file executable when bash is available

$ErrorActionPreference = 'Stop'

# 1) Ensure we're inside a Git repo
try {
  $null = git rev-parse --git-dir 2>$null
} catch {
  Write-Error "Not inside a Git repository. Run this from your project root."
  exit 1
}

# 2) Compute hook directory (prefer modern Git, fallback otherwise)
$gitDir = git rev-parse --git-dir
$hookDir = ''
try {
  # Git >= 2.5
  $hookDir = git rev-parse --git-path hooks
} catch {
  $hookDir = Join-Path $gitDir 'hooks'
}
New-Item -ItemType Directory -Force -Path $hookDir | Out-Null

# 3) Build bodies for both scripts
# POSIX pre-push (bash). NOTE: Use only ASCII and avoid BOM.
$hookPathSh = Join-Path $hookDir 'pre-push'
$hookBodySh = @'
#!/usr/bin/env bash
set -euo pipefail

# Always run from the repo root
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "[pre-push] Running: npm run verify:all"
npm run verify:all
'@

# Windows CMD pre-push (for Git for Windows)
$hookPathCmd = Join-Path $hookDir 'pre-push.cmd'
$hookBodyCmd = @'
@echo off
setlocal enabledelayedexpansion

for /f "usebackq delims=" %%i in (`git rev-parse --show-toplevel`) do set REPO=%%i
if not defined REPO (
  echo [pre-push] Could not determine repo root.
  exit /b 1
)

cd /d "%REPO%"
echo [pre-push] Running: npm run verify:all
npm run verify:all
'@

# 4) Write files (ASCII, no BOM). Add trailing newline for POSIX friendliness.
Set-Content -Path $hookPathSh  -Value $hookBodySh  -Encoding Ascii
Set-Content -Path $hookPathCmd -Value $hookBodyCmd -Encoding Ascii

# 5) Make POSIX hook executable if bash is available (Git Bash, WSL, etc.)
try {
  & bash -lc "chmod +x `"$hookPathSh`""
} catch {
  # It's fine on pure Windows without bash; CMD hook will be used
}

# 6) Status
Write-Host "Installed Git hooks:"
Write-Host "  - $hookPathSh"
Write-Host "  - $hookPathCmd"
Write-Host ""
Write-Host "What it does on push: runs 'npm run verify:all' from the repo root."
Write-Host "To bypass (NOT recommended): git push --no-verify"
