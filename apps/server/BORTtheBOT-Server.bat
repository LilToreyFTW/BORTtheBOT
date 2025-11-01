@echo off
REM # ADDED: Windows batch launcher for BORTtheBOT Server
REM # UPDATED: Configured for WireGuard tunnel network (10.2.0.2)
echo Starting BORTtheBOT Server on WireGuard Network...
echo Server IP: 10.2.0.2:3000
echo.
REM # UPDATED: Change to project root for workspace resolution
cd /d "%~dp0\..\.."
REM Set working directory to server folder for proper path resolution
cd apps\server
REM Set WireGuard network configuration
set HOST=10.2.0.2
set PORT=3000
set CORS_ORIGIN=http://10.2.0.2:3001,http://10.2.0.2:3000,http://localhost:3001,http://localhost:3000
bun run src/launcher.ts
pause

