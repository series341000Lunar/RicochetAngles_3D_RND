param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$assetRoot = $PSScriptRoot
$url = 'http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html'
function Test-RndServer {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains('Multi-Asset Game Language R&D</title>')
    } catch { return $false }
}
try {
    if (-not (Test-Path -LiteralPath (Join-Path $assetRoot 'spike\RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html'))) {
        throw 'R&D HTML is missing. Keep this launcher in the ThreeJSDEV folder.'
    }
    if (-not (Test-RndServer)) {
        $probe = New-Object System.Net.Sockets.TcpClient
        try { $probe.Connect('127.0.0.1',8765); $occupied=$true } catch { $occupied=$false } finally { $probe.Dispose() }
        if ($occupied) { throw 'Port 8765 is used by another server. Stop that server and try again. No process was terminated.' }
        $pythonPath = $null
        $pythonPrefix = @()
        $bundled = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
        $candidates = @()
        if (Test-Path -LiteralPath $bundled) { $candidates += @{Path=$bundled;Prefix=@()} }
        $py = Get-Command py.exe -ErrorAction SilentlyContinue
        if ($py) { $candidates += @{Path=$py.Source;Prefix=@('-3')} }
        $python = Get-Command python.exe -ErrorAction SilentlyContinue
        if ($python) { $candidates += @{Path=$python.Source;Prefix=@()} }
        foreach ($candidate in $candidates) {
            $prefix = $candidate.Prefix
            try {
                & $candidate.Path @prefix -c 'import http.server' 2>$null
                if ($LASTEXITCODE -eq 0) { $pythonPath=$candidate.Path; $pythonPrefix=$prefix; break }
            } catch {}
        }
        if (-not $pythonPath) { throw 'Python 3 was not found. Install Python 3 or restore the Codex Python runtime.' }
        $logRoot = Join-Path $env:TEMP 'RicochetAngles_ThreeJSDEV'
        New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
        $tag = Get-Date -Format 'yyyyMMdd_HHmmss_fff'
        $arguments = @($pythonPrefix) + @('-m','http.server','8765','--bind','127.0.0.1','--directory',('"' + $assetRoot + '"'))
        $server = Start-Process -FilePath $pythonPath -ArgumentList $arguments -WorkingDirectory $env:TEMP -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot "$tag.stdout.log") -RedirectStandardError (Join-Path $logRoot "$tag.stderr.log")
        $ready=$false
        for ($i=0;$i -lt 30;$i++) {
            if (Test-RndServer) { $ready=$true; break }
            if ($server.HasExited) { break }
            Start-Sleep -Milliseconds 300
        }
        if (-not $ready) { throw "Server did not become ready. Logs: $logRoot" }
        Write-Host "Local server started (PID $($server.Id))."
    } else { Write-Host 'Reusing the existing R&D server.' }
    if (-not $NoBrowser) { Start-Process ($url + '?launch=' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) }
    Write-Host $url
    exit 0
} catch {
    Write-Host "Launcher error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
