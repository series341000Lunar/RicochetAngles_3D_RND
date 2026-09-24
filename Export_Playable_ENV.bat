@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Export_Playable_ENV.ps1"
if errorlevel 1 pause
