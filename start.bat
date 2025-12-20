@echo off
REM Travel Art Platform - Quick Startup Script
REM This script starts both backend and frontend servers

echo ========================================
echo Travel Art Platform - Startup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Travel Art Platform...
echo.

REM Start backend in a new window
echo Starting Backend Server (Port 4000)...
start "Travel Art Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting Frontend Server (Port 3000)...
start "Travel Art Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo.
echo Frontend:    http://localhost:3000
echo Backend:     http://localhost:4000
echo Health:      http://localhost:4000/api/health
echo.
echo Backend window will open in a few seconds...
echo Frontend window will open after backend starts...
echo.
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C in either window to stop the service
echo.
pause
