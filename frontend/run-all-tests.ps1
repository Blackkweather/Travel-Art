# PowerShell script to run all Cypress tests
# Usage: .\run-all-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CYPRESS TEST EXECUTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (-not (Test-Path "cypress")) {
    Write-Host "Error: Must run from frontend directory" -ForegroundColor Red
    Write-Host "Please run: cd frontend && .\run-all-tests.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "Checking backend server..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $backendRunning) {
    Write-Host "⚠️  Backend server not running on port 4000" -ForegroundColor Yellow
    Write-Host "   Please start backend: cd backend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check if frontend is running
Write-Host "Checking frontend server..." -ForegroundColor Yellow
$frontendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $frontendRunning) {
    Write-Host "⚠️  Frontend server not running on port 3000" -ForegroundColor Yellow
    Write-Host "   Please start frontend: cd frontend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Servers checked" -ForegroundColor Green
Write-Host ""

# Run all tests
Write-Host "Running all Cypress tests..." -ForegroundColor Cyan
Write-Host ""

npm run test:e2e

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST EXECUTION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

