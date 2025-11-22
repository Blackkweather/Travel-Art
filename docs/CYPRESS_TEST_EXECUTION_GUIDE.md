# Cypress Test Execution Guide
**Date**: 2025-01-22  
**Status**: ✅ Configuration Fixed

---

## 🔧 CONFIGURATION FIX

### Issue Found
- **Vite Server**: Running on port 3000
- **Cypress Config**: Was looking for port 5173
- **Fix Applied**: Updated Cypress config to use port 3000

---

## 🚀 HOW TO RUN TESTS

### Step 1: Start Backend Server
```bash
# Terminal 1
cd backend
npm run dev
```

**Expected Output**:
```
🚀 Travel Art API server running on port 4000
✅ SQLite database connected via Prisma
```

### Step 2: Start Frontend Server
```bash
# Terminal 2
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.4.21  ready in X ms
➜  Local:   http://localhost:3000/
```

### Step 3: Run Cypress Tests
```bash
# Terminal 3 (in a new terminal)
cd frontend
npm run test:e2e
```

**Or open Cypress UI**:
```bash
cd frontend
npm run test:e2e:open
```

---

## 📋 AVAILABLE TEST FILES

### E2E Tests (8 files)
1. ✅ `auth.cy.ts` - Authentication flows (15 tests)
2. ✅ `booking.cy.ts` - Booking flows
3. ✅ `api.cy.ts` - API integration
4. ✅ `responsive.cy.ts` - Responsive design
5. ✅ `accessibility.cy.ts` - Accessibility
6. ✅ `ui-consistency.cy.ts` - UI consistency
7. ✅ `performance.cy.ts` - Performance
8. ✅ `security.cy.ts` - Security

---

## ✅ VERIFICATION

### Before Running Tests
- [ ] Backend server running on port 4000
- [ ] Frontend server running on port 3000
- [ ] Database initialized
- [ ] Test users exist in database

### After Running Tests
- [ ] All tests pass
- [ ] Screenshots saved (if failures)
- [ ] Test reports generated

---

## 🐛 TROUBLESHOOTING

### Issue: "Cypress could not verify that this server is running"
**Solution**: 
1. Make sure frontend server is running on port 3000
2. Check `http://localhost:3000` in browser
3. Verify Cypress config has `baseUrl: 'http://localhost:3000'`

### Issue: "API requests failing"
**Solution**:
1. Make sure backend server is running on port 4000
2. Check `http://localhost:4000/health` in browser
3. Verify Vite proxy is configured correctly

### Issue: "Tests timing out"
**Solution**:
1. Increase timeout in `cypress.config.mjs`
2. Check network connectivity
3. Verify test data exists

---

## 📊 TEST EXECUTION

### Run All Tests
```bash
cd frontend
npm run test:e2e
```

### Run Specific Test File
```bash
cd frontend
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

### Run in Headless Mode
```bash
cd frontend
npm run test:e2e:headless
```

### Open Cypress UI
```bash
cd frontend
npm run test:e2e:open
```

---

## ✅ EXPECTED RESULTS

### Authentication Tests
- ✅ Login form displays
- ✅ Login with valid credentials
- ✅ Error on invalid credentials
- ✅ Registration works
- ✅ Password reset works
- ✅ Logout works

### Other Tests
- ✅ Booking flows work
- ✅ API integration works
- ✅ Responsive design works
- ✅ Accessibility standards met
- ✅ UI consistency verified
- ✅ Performance acceptable
- ✅ Security measures in place

---

## 📝 NOTES

- Tests require both servers to be running
- Test data should be seeded in database
- Some tests may require specific user accounts
- Screenshots are saved on test failures

---

**Status**: ✅ Configuration Fixed | Ready to Run

