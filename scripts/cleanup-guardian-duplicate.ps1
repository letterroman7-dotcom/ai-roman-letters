# scripts/cleanup-guardian-duplicate.ps1
[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

# Repo root = parent of this script's folder
$repoRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $repoRoot "modules\guardian"

Write-Host "Checking for duplicate folder:" $target

if (Test-Path -LiteralPath $target) {
    if ($PSCmdlet.ShouldProcess($target, "Remove-Item -Recurse -Force")) {
        Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
        Write-Host "Removed duplicate folder:" $target
    }
}
else {
    Write-Host "No duplicate found at:" $target
}

Write-Host "Done."
