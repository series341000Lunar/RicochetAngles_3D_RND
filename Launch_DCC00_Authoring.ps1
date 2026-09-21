param([switch]$NoBrowser,[switch]$Blender)
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$base='http://127.0.0.1:8766'
try {
    $ready=$false
    try {$reply=Invoke-RestMethod "$base/api/workspace" -TimeoutSec 2;$ready=$reply.document.schema -eq 'ra-dcc00-authoring-v0'} catch {}
    if(-not $ready){
        $probe=[Net.Sockets.TcpClient]::new()
        try {$probe.Connect('127.0.0.1',8766);$occupied=$true} catch {$occupied=$false} finally {$probe.Dispose()}
        if($occupied){throw 'Port 8766 is occupied or workspace parse failed. Existing process and data were preserved.'}
        $python=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
        if(-not(Test-Path $python)){throw 'Existing Python runtime not found. Run server/authoring_server.py with installed Python 3.'}
        $logs=Join-Path $root 'dcc00\workspace';New-Item -ItemType Directory -Force $logs | Out-Null
        $tag=Get-Date -Format 'yyyyMMdd_HHmmss_fff'
        Start-Process -FilePath $python -ArgumentList @(('"'+(Join-Path $root 'dcc00\server\authoring_server.py')+'"')) -WorkingDirectory $env:TEMP -WindowStyle Hidden -RedirectStandardOutput "$logs\server-$tag.out.log" -RedirectStandardError "$logs\server-$tag.err.log" | Out-Null
        for($i=0;$i -lt 30;$i++){try{$reply=Invoke-RestMethod "$base/api/workspace" -TimeoutSec 1;$ready=$reply.document.schema -eq 'ra-dcc00-authoring-v0';if($ready){break}}catch{};Start-Sleep -Milliseconds 300}
        if(-not $ready){throw 'DCC-00 server startup failed. Inspect dcc00/workspace/server logs.'}
    }
    Write-Host "Editor:  $base/dcc00/html/editor.html"
    Write-Host "Testbed: $base/dcc00/html/testbed.html"
    if(-not $NoBrowser){Start-Process "$base/dcc00/html/editor.html";Start-Process "$base/dcc00/html/testbed.html"}
    if($Blender){
        $candidates=@(Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue)
        $installed=@(foreach($candidate in $candidates){
            $versionLine=(& $candidate.FullName --version | Select-Object -First 1)
            if($versionLine -match '^Blender (5\.2\.\d+)'){[pscustomobject]@{Path=$candidate.FullName;Version=[version]$Matches[1]}}
        })
        $selected=$installed | Sort-Object Version -Descending | Select-Object -First 1
        if(-not $selected){throw 'Blender 5.2.x primary target not found; no installation or 4.5 fallback was attempted.'}
        $exe=$selected.Path
        Write-Host "Primary Blender: $($selected.Version) - $exe"
        $blend=Join-Path $root 'dcc00\workspace\dcc00.review.blend'
        $args=@('--factory-startup');if(Test-Path $blend){$args+=('"'+$blend+'"')}
        $args+=@('--python',('"'+(Join-Path $root 'dcc00\blender_addon\open_authoring.py')+'"'))
        # Visible Blender is the explicitly requested interactive authoring tool.
        Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory $env:TEMP
    }
} catch {Write-Error $_;exit 1}
