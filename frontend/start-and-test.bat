@echo off
echo ========================================
echo Travel Art - Test Runner
echo ========================================
echo.

echo Checking backend server...
netstat -an | find "3000" >nul
if %errorlevel% equ 0 (
    echo [OK] Backend server is running on port 3000
) else (
    echo [ERROR] Backend server is NOT running on port 3000
    echo Please start it first: cd backend ^&^& npm run dev
    pause
    exit /b 1
)

echo.
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Waiting for frontend server to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo Checking frontend server...
netstat -an | find "5173" >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running on port 5173
) else (
    echo [WARNING] Frontend server may not be ready yet
    echo Continuing anyway...
)

echo.
echo ========================================
echo Running Cypress Tests...
echo ========================================
echo.

npm run test:e2e:headless

echo.
echo ========================================
echo Tests Complete!
echo ========================================
pause

