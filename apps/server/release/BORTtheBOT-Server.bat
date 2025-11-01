@echo off
REM Self-contained launcher for release folder
echo Starting BORTtheBOT Server (release)...
echo Server IP: 10.2.0.2:3000
echo.
REM Change to the directory of this script
cd /d "%~dp0"

REM Configure WireGuard / local hosting
set HOST=10.2.0.2
set PORT=3000
set CORS_ORIGIN=http://10.2.0.2:3001,http://10.2.0.2:3000,http://localhost:3001,http://localhost:3000

REM Run the compiled server JS using Bun (requires Bun on PATH)
if exist dist\index.js (
	bun dist\index.js
) else (
	echo dist\index.js not found. Please run build first.
)

pause

