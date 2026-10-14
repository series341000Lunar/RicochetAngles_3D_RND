param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
try {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'lookdev\index.html'))) { throw 'LookDev entry is missing.' }
    # Existing server/startup checks own port conflicts and hidden process setup.
    & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Launch_MultiAsset_RND.ps1') -NoBrowser
    if ($LASTEXITCODE -ne 0) { throw 'Existing R&D server could not start.' }
    $url = 'http://127.0.0.1:8765/lookdev/'
    if (-not $NoBrowser) { Start-Process ($url + '?launch=' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) }
    Write-Host $url
    exit 0
} catch {
    Write-Host "LookDev launcher error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
