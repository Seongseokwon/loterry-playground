@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Run this file from the project development environment.
  pause
  exit /b 1
)

echo Lotto draw collection starts with a 15-second request interval.
echo Progress is saved after every successful response and can be resumed.
echo Press Ctrl+C to stop safely.
echo.

node scripts\collect-lotto-draws.mjs --target=1236 --interval-ms=15000
echo.
if errorlevel 1 (
  echo Collection stopped because an error was detected. Check data\collection-state.json.
) else (
  echo Collection completed successfully.
)
pause
endlocal
