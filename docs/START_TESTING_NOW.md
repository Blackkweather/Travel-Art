# 🚀 Start Testing - Quick Guide

**Status:** All test files ready, servers need to be started manually

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start Backend Server
Open **PowerShell Terminal 1**:
```powershell
cd "C:\MAMP\htdocs\Travel Art\backend"
npm run dev
```
✅ Wait for: `Server running on port 3000` or similar message

### Step 2: Start Frontend Server  
Open **PowerShell Terminal 2**:
```powershell
cd "C:\MAMP\htdocs\Travel Art\frontend"
npm run dev
```
✅ Wait for: `Local: http://localhost:5173/` or similar message

### Step 3: Run Tests
Open **PowerShell Terminal 3**:
```powershell
cd "C:\MAMP\htdocs\Travel Art\frontend"
npm run test:e2e:headless
```

---

## 📊 What Will Be Tested

### Existing Test Suites (38 tests)
- ✅ Authentication (8 tests)
- ✅ Registration (3 tests)  
- ✅ Password Reset (2 tests)
- ✅ Logout (1 test)
- ✅ Booking (8 tests)
- ✅ Responsive (10 tests)
- ✅ Accessibility (6 tests)

### New Test Suites (45 tests)
- 🔒 Security (15 tests) - XSS, CSRF, rate limiting, session security
- ⚡ Performance (10 tests) - Core Web Vitals, bundle size, memory leaks
- 🌐 API (12 tests) - Contract tests, error handling, retry logic
- 🎨 UI Consistency (8 tests) - Design system, component consistency

**Total: 83 automated tests**

---

## 🔍 Verify Servers Are Running

Before running tests, verify both servers:

```powershell
# Check backend (should return True)
Test-NetConnection localhost -Port 3000 -InformationLevel Quiet

# Check frontend (should return True)
Test-NetConnection localhost -Port 5173 -InformationLevel Quiet
```

---

## 🎯 Run Specific Test Suites

Once servers are running, you can run individual suites:

```powershell
# Security tests
npx cypress run --spec "cypress/e2e/security.cy.ts" --headless

# Performance tests
npx cypress run --spec "cypress/e2e/performance.cy.ts" --headless

# API tests
npx cypress run --spec "cypress/e2e/api.cy.ts" --headless

# UI consistency tests
npx cypress run --spec "cypress/e2e/ui-consistency.cy.ts" --headless

# All existing tests
npx cypress run --spec "cypress/e2e/auth.cy.ts" --headless
npx cypress run --spec "cypress/e2e/booking.cy.ts" --headless
npx cypress run --spec "cypress/e2e/responsive.cy.ts" --headless
npx cypress run --spec "cypress/e2e/accessibility.cy.ts" --headless
```

---

## 📝 Expected Output

When tests run successfully, you'll see:
```
✅ Running: auth.cy.ts
✅ Running: booking.cy.ts
✅ Running: responsive.cy.ts
✅ Running: accessibility.cy.ts
✅ Running: security.cy.ts
✅ Running: performance.cy.ts
✅ Running: api.cy.ts
✅ Running: ui-consistency.cy.ts

Tests: 83
Passing: X
Failing: Y
```

---

## 🐛 Troubleshooting

### Issue: "Server not running"
**Solution:** Make sure both servers are running in separate terminals

### Issue: "Port already in use"
**Solution:** 
```powershell
# Find process using port 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id <PID>
```

### Issue: Tests timeout
**Solution:** Check server response times, increase timeout in `cypress.config.mjs`

### Issue: "Cannot find module"
**Solution:** 
```powershell
cd frontend
npm install
```

---

## ✅ Checklist

Before testing:
- [ ] Backend server running (port 3000) ✅
- [ ] Frontend server running (port 5173) ⏳
- [ ] Database seeded
- [ ] Test users created
- [ ] Dependencies installed (`npm install`)

After testing:
- [ ] Review test results
- [ ] Update test tracker
- [ ] Document failures
- [ ] Create bug reports (if needed)

---

## 🎉 Ready to Test!

**All 83 tests are ready to execute!**

Just start the two servers and run:
```powershell
npm run test:e2e:headless
```

---

**Last Updated:** 2024-12-19  
**Status:** Ready to Execute

