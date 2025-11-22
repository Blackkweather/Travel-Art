# Travel Art - Test Runner Script
# This script starts the servers and runs the tests

Write-Host "🚀 Travel Art Test Runner" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking backend server..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $backendRunning) {
    Write-Host "❌ Backend server is not running on port 4000" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ Backend server is running on port 4000" -ForegroundColor Green
}

# Check if frontend is running
Write-Host "Checking frontend server..." -ForegroundColor Yellow
$frontendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $frontendRunning) {
    Write-Host "❌ Frontend server is not running on port 3000" -ForegroundColor Red
    Write-Host "Starting frontend server..." -ForegroundColor Yellow
    
    # Start frontend in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized
    
    Write-Host "Waiting for frontend server to start (30 seconds)..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    
    while (-not $frontendRunning -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        $frontendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    
    if ($frontendRunning) {
        Write-Host "✅ Frontend server is running on port 3000" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend server failed to start" -ForegroundColor Red
        Write-Host "Please start it manually:" -ForegroundColor Yellow
        Write-Host "  npm run dev" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "✅ Frontend server is running on port 3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Running Cypress tests..." -ForegroundColor Cyan
Write-Host ""

# Run tests
npm run test:e2e:headless

Write-Host ""
Write-Host "✅ Tests completed!" -ForegroundColor Green

