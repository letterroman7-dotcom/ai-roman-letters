param(
    [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 3000 })
)

$base = "http://localhost:$Port"
Write-Host "=== ai-bot smoke against $base ===`n"

function Show-Json($label, $value) {
    Write-Host "→ $label"
    try {
        $value | ConvertTo-Json -Depth 8
    }
    catch {
        Write-Host $value
    }
    Write-Host "`n"
}

# GET /
try {
    $r = Invoke-RestMethod -Uri "$base/" -Method GET
    Show-Json "GET /" $r
}
catch {
    Write-Error "GET / failed: $($_.Exception.Message)"
}

# GET /health
try {
    $r = Invoke-RestMethod -Uri "$base/health" -Method GET
    Show-Json "GET /health" $r
}
catch {
    Write-Error "GET /health failed: $($_.Exception.Message)"
}

# POST /bot (echo)
try {
    $body = @{ text = 'echo hello web' } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/bot" -Method POST -Body $body -ContentType 'application/json'
    Show-Json "POST /bot (echo hello web)" $r
}
catch {
    Write-Error "POST /bot (echo) failed: $($_.Exception.Message)"
}

# POST /bot (reverse)
try {
    $body = @{ text = 'reverse abcdef' } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/bot" -Method POST -Body $body -ContentType 'application/json'
    Show-Json "POST /bot (reverse abcdef)" $r
}
catch {
    Write-Error "POST /bot (reverse) failed: $($_.Exception.Message)"
}

Write-Host "=== smoke done ==="
