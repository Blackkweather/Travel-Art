# How to Run Cypress Tests - Step by Step Guide
**Date**: 2025-01-22  
**Status**: ✅ Configuration Fixed

---

## ⚠️ IMPORTANT: Server Requirements

Cypress tests **REQUIRE** both servers to be running:
- **Backend**: Port 4000
- **Frontend**: Port 3000

---

## 🚀 METHOD 1: Manual (Recommended for First Time)

### Step 1: Start Backend Server
Open **Terminal 1**:
```bash
cd backend
npm run dev
```

**Wait for**:
```
🚀 Travel Art API server running on port 4000
✅ SQLite database connected via Prisma
```

**Keep this terminal running!**

---

### Step 2: Start Frontend Server
Open **Terminal 2** (new terminal):
```bash
cd frontend
npm run dev
```

**Wait for**:
```
VITE v5.4.21  ready in X ms
➜  Local:   http://localhost:3000/
```

**Keep this terminal running!**

---

### Step 3: Verify Servers Are Running
Open browser and check:
- ✅ Backend: http://localhost:4000/health
- ✅ Frontend: http://localhost:3000

---

### Step 4: Run Cypress Tests
Open **Terminal 3** (new terminal):
```bash
cd frontend
npm run test:e2e
```

**Or open Cypress UI**:
```bash
cd frontend
npm run test:e2e:open
```

---

## 🚀 METHOD 2: Using PowerShell Script

### Run the Test Script
```powershell
cd frontend
.\run-tests.ps1
```

**What it does**:
1. Checks if backend is running on port 4000
2. Checks if frontend is running on port 3000
3. Starts frontend if not running
4. Waits for servers to be ready
5. Runs Cypress tests

---

## 🚀 METHOD 3: Using Root Script

### Start Both Servers
```bash
# From project root
npm run dev
```

This starts both backend and frontend in parallel.

**Then in another terminal**:
```bash
cd frontend
npm run test:e2e
```

---

## ✅ VERIFICATION CHECKLIST

Before running tests, verify:
- [ ] Backend server running on port 4000
- [ ] Frontend server running on port 3000
- [ ] Can access http://localhost:4000/health
- [ ] Can access http://localhost:3000
- [ ] Database initialized
- [ ] Test users exist (if needed)

---

## 🐛 TROUBLESHOOTING

### Error: "Cypress could not verify that this server is running"
**Cause**: Frontend server not running on port 3000

**Solution**:
1. Check if frontend is running: `http://localhost:3000`
2. If not, start it: `cd frontend && npm run dev`
3. Wait for "ready" message
4. Try running tests again

### Error: "API requests failing"
**Cause**: Backend server not running on port 4000

**Solution**:
1. Check if backend is running: `http://localhost:4000/health`
2. If not, start it: `cd backend && npm run dev`
3. Wait for "server running" message
4. Try running tests again

### Error: "Port already in use"
**Cause**: Another process using the port

**Solution**:
1. Find process using port:
   ```powershell
   # For port 3000
   netstat -ano | findstr :3000
   
   # For port 4000
   netstat -ano | findstr :4000
   ```
2. Kill the process or use different ports

---

## 📊 TEST FILES

### Available Tests
1. `auth.cy.ts` - Authentication flows (15 tests)
2. `booking.cy.ts` - Booking flows
3. `api.cy.ts` - API integration
4. `responsive.cy.ts` - Responsive design
5. `accessibility.cy.ts` - Accessibility
6. `ui-consistency.cy.ts` - UI consistency
7. `performance.cy.ts` - Performance
8. `security.cy.ts` - Security

---

## 🎯 QUICK REFERENCE

### Ports
- **Backend**: 4000
- **Frontend**: 3000
- **Cypress baseUrl**: http://localhost:3000

### Commands
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Run tests
cd frontend && npm run test:e2e

# Open Cypress UI
cd frontend && npm run test:e2e:open
```

---

## ✅ SUCCESS INDICATORS

When everything is working:
- ✅ Backend shows "server running on port 4000"
- ✅ Frontend shows "Local: http://localhost:3000/"
- ✅ Cypress connects successfully
- ✅ Tests start running
- ✅ Test results display

---

**Status**: ✅ Ready to Run | Follow steps above

