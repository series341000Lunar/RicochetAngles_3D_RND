@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Launch_Global_LookDev.ps1"
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)
endlocal
