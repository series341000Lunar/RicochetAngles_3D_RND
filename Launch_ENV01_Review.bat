@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Launch_DCC00_Authoring.ps1" -Blender -Env01
if errorlevel 1 pause
