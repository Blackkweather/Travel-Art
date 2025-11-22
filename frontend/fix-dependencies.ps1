# Fix PostCSS dependencies installation
Write-Host "🔧 Fixing PostCSS dependencies..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "`n1. Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clean npm cache
Write-Host "`n2. Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Remove node_modules and lock file
Write-Host "`n3. Removing node_modules and package-lock.json..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "`n4. Installing dependencies..." -ForegroundColor Yellow
npm install

# Verify installation
Write-Host "`n5. Verifying installation..." -ForegroundColor Yellow
$tailwind = Test-Path node_modules/tailwindcss
$postcss = Test-Path node_modules/postcss
$autoprefixer = Test-Path node_modules/autoprefixer

if ($tailwind -and $postcss -and $autoprefixer) {
    Write-Host "`n✅ All packages installed successfully!" -ForegroundColor Green
    Write-Host "   - tailwindcss: $tailwind" -ForegroundColor Green
    Write-Host "   - postcss: $postcss" -ForegroundColor Green
    Write-Host "   - autoprefixer: $autoprefixer" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some packages are still missing:" -ForegroundColor Red
    Write-Host "   - tailwindcss: $tailwind" -ForegroundColor $(if ($tailwind) { "Green" } else { "Red" })
    Write-Host "   - postcss: $postcss" -ForegroundColor $(if ($postcss) { "Green" } else { "Red" })
    Write-Host "   - autoprefixer: $autoprefixer" -ForegroundColor $(if ($autoprefixer) { "Green" } else { "Red" })
    Write-Host "`n⚠️  Try running as Administrator or check Windows Defender/Antivirus" -ForegroundColor Yellow
}

Write-Host "`n✨ Done! You can now run 'npm run dev'" -ForegroundColor Cyan










