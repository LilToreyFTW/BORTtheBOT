# # ADDED: Build script for GUI EXE
Write-Host "🔨 Building BORTtheBOT Server GUI..." -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    Write-Host "💡 Make sure Node.js and npm are installed" -ForegroundColor Yellow
    exit 1
}

Write-Host "🏗️  Building Electron app..." -ForegroundColor Yellow
npm run build:win

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ GUI EXE built successfully!" -ForegroundColor Green
Write-Host "📦 Installer: dist\BORTtheBOT Server Setup.exe" -ForegroundColor Cyan
Write-Host "📁 Portable: dist\win-unpacked\" -ForegroundColor Cyan
Write-Host ""

