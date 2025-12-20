#!/bin/bash
# Travel Art Platform - Quick Startup Script (macOS/Linux)

echo "========================================"
echo "Travel Art Platform - Startup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Starting Travel Art Platform..."
echo ""

# Start backend in background
echo "Starting Backend Server (Port 4000)..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
echo "Starting Frontend Server (Port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Services Starting..."
echo "========================================"
echo ""
echo "Frontend:    http://localhost:3000"
echo "Backend:     http://localhost:4000"
echo "Health:      http://localhost:4000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
