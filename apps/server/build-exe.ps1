# # ADDED: PowerShell script to build standalone EXE
Write-Host "🔨 Building BORTtheBOT Server..." -ForegroundColor Cyan

# Change to project root
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
bun install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️  Building TypeScript files..." -ForegroundColor Yellow
Set-Location "apps/server"
bun run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  Note: Bun compile has limitations with workspace dependencies." -ForegroundColor Yellow
Write-Host "📝 The batch file (BORTtheBOT-Server.bat) is the recommended way to run the server." -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 To create a standalone EXE:" -ForegroundColor Cyan
Write-Host "   1. Use Bat To Exe Converter (battoexeconverter.com)" -ForegroundColor White
Write-Host "   2. Convert BORTtheBOT-Server.bat to BORTtheBOT-Server.exe" -ForegroundColor White
Write-Host "   3. Ensure Bun is installed on target systems" -ForegroundColor White
Write-Host ""
Write-Host "✅ Build complete! You can run: bun run src/launcher.ts" -ForegroundColor Green
Write-Host "📄 Or use: BORTtheBOT-Server.bat" -ForegroundColor Cyan
Write-Host ""

