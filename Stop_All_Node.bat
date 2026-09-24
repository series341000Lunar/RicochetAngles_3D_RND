@echo off
setlocal
title Stop All Node.js Processes
echo Stopping ALL node.exe processes on this computer...
echo This includes Node.js processes from other projects.
echo.
taskkill /F /IM node.exe
set "stop_result=%ERRORLEVEL%"
echo.
if "%stop_result%"=="0" (
    echo All accessible node.exe processes were stopped.
) else (
    echo No node.exe process was found, or some processes could not be stopped.
    echo Check the taskkill output above. Access denied may require administrator rights.
)
pause
exit /b %stop_result%
