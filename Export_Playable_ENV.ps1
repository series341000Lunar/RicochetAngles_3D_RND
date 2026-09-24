$ErrorActionPreference='Stop'
try {
    $script=Join-Path $PSScriptRoot 'dcc00\env01\playable_environment.py'
    $blend=Join-Path $PSScriptRoot 'dcc00\workspace\playable-env\authoring.blend'
    if(-not(Test-Path -LiteralPath $blend)){throw 'Playable ENV authoring.blend is missing. Preserve the existing QA source.'}
    $versions=@(foreach($file in Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse){
        $line=(& $file.FullName --version | Select-Object -First 1)
        if($line -match '^Blender (5\.2\.\d+)'){[pscustomobject]@{Path=$file.FullName;Version=[version]$Matches[1]}}
    })
    $selected=$versions | Sort-Object Version -Descending | Select-Object -First 1
    if(-not $selected){throw 'Blender 5.2.x not found.'}
    Write-Host 'Exporting the SAVED playable-env/authoring.blend through the existing static GLB exporter.'
    Write-Host 'Save edits in Blender first. After export, reopen the blend to refresh its output revision before another edit/export cycle.'
    & $selected.Path --background --python-exit-code 1 --python $script -- export
    if($LASTEXITCODE -ne 0){throw 'Export failed. Previous GLB is preserved when validation fails.'}
    Write-Host 'Export complete. Reload the playable Multi-Asset page and press START.'
    exit 0
} catch {Write-Error $_;exit 1}
