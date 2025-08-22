# scripts/smoke.ps1
# Quick local smoke: verifies panic lock ON/OFF via file; optionally hits HTTP endpoints if reachable.
# Compatible with Windows PowerShell 5.1 and PowerShell 7+

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

function Section([string]$t){ Write-Host "`n=== $t ===" }

function ValueOr([string]$value, [string]$fallback) {
  if ([string]::IsNullOrWhiteSpace($value)) { return $fallback } else { return $value }
}

# --- Load .env into this PowerShell process (simple parser)
function Load-DotEnv([string]$file) {
  if (!(Test-Path $file)) { return }
  Get-Content $file | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    if ($line.StartsWith('#')) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()

    # Strip surrounding quotes if present
    if ($val.Length -ge 2 -and (
        ($val.StartsWith('"') -and $val.EndsWith('"')) -or
        ($val.StartsWith("'") -and $val.EndsWith("'")))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    # Unescape a few common sequences
    $val = $val -replace '\\n', "`n" -replace '\\r', "`r" -replace '\\t', "`t"

    [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
  }
}

# --- Context
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
Load-DotEnv (Join-Path $repo ".env")

$panicRel = if ($env:PANIC_LOCK_FILE) { $env:PANIC_LOCK_FILE } else { "data/guardian/panic.lock" }
$panic = if ([System.IO.Path]::IsPathRooted($panicRel)) { $panicRel } else { Join-Path $repo $panicRel }
$panicDir = Split-Path -Parent $panic

Section "Env"
Write-Host ("APP_NAME    : {0}" -f (ValueOr $env:APP_NAME "<unset>"))
Write-Host ("NODE_ENV    : {0}" -f (ValueOr $env:NODE_ENV "<unset>"))
Write-Host ("PANIC_LOCK  : {0}" -f $panic)

function Panic-Status {
  if (Test-Path $panic) { "ON" } else { "off" }
}
function Panic-On {
  New-Item -ItemType Directory -Force -Path $panicDir | Out-Null
  Set-Content -Encoding Ascii -NoNewline -Path $panic -Value "on"
}
function Panic-Off {
  if (Test-Path $panic) { Remove-Item -Force $panic }
}

# --- File-based checks
Section "Panic (file)"
$initial = Panic-Status
Write-Host ("initial     : {0}" -f $initial)

Write-Host "-> turning ON"
Panic-On
$on = Panic-Status
Write-Host ("status      : {0}" -f $on)
if ($on -ne "ON") { Write-Error "Failed to set panic ON via file"; exit 1 }

Write-Host "-> turning OFF"
Panic-Off
$off = Panic-Status
Write-Host ("status      : {0}" -f $off)
if ($off -ne "off") { Write-Error "Failed to set panic OFF via file"; exit 1 }

# Restore initial state
if ($initial -eq "ON") { Panic-On } else { Panic-Off }
Write-Host ("restored    : {0}" -f (Panic-Status))

# --- Optional HTTP checks (if server is up)
Section "HTTP (optional)"
$base = if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://localhost:3000" }
$ok = $false
try {
  $health = Invoke-RestMethod -Uri ($base + "/health") -Method GET -TimeoutSec 2 -ErrorAction Stop
  Write-Host ("health      : {0}" -f ($health | Out-String).Trim())
  $ok = $true
} catch {
  Write-Host "server not reachable, skipping HTTP tests."
}

if ($ok) {
  try {
    Write-Host "GET /panic/status"
    Invoke-RestMethod -Uri ($base + "/panic/status") -Method GET -TimeoutSec 2 | Out-Host

    Write-Host "POST /panic/on"
    Invoke-RestMethod -Uri ($base + "/panic/on") -Method POST -TimeoutSec 2 | Out-Host

    Write-Host "GET /panic/status"
    Invoke-RestMethod -Uri ($base + "/panic/status") -Method GET -TimeoutSec 2 | Out-Host

    Write-Host "POST /panic/off"
    Invoke-RestMethod -Uri ($base + "/panic/off") -Method POST -TimeoutSec 2 | Out-Host

    Write-Host "GET /panic/status"
    Invoke-RestMethod -Uri ($base + "/panic/status") -Method GET -TimeoutSec 2 | Out-Host
  } catch {
    Write-Warning ("HTTP panic checks failed: {0}" -f $_.Exception.Message)
    # Keep exit 0: HTTP is optional
  }
}

Section "Result"
Write-Host "smoke OK"
exit 0
