@echo off
REM # ADDED: Windows batch launcher for BORTtheBOT Server
echo Starting BORTtheBOT Server...
REM # UPDATED: Change to project root for workspace resolution
cd /d "%~dp0\..\.."
REM Set working directory to server folder for proper path resolution
cd apps\server
bun run src/launcher.ts
pause

