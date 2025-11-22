# How to Run Cypress Tests
**Quick Start Guide**

---

## 🚀 PREREQUISITES

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
- Should be running on `http://localhost:4000`
- Database should be initialized

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
- Should be running on `http://localhost:3000`

---

## 🧪 RUN TESTS

### Run All Tests (Headless)
```bash
cd frontend
npm run test:e2e
```

### Run All Tests (Interactive)
```bash
cd frontend
npm run test:e2e:open
```

### Run Specific Test Suite
```bash
cd frontend
npx cypress run --spec "cypress/e2e/auth.cy.ts"
npx cypress run --spec "cypress/e2e/booking.cy.ts"
npx cypress run --spec "cypress/e2e/accessibility.cy.ts"
```

---

## 📊 TEST SUITES

1. **auth.cy.ts** - Authentication flows (8 tests)
2. **booking.cy.ts** - Booking flows (8 tests)
3. **accessibility.cy.ts** - Accessibility (6 tests)
4. **responsive.cy.ts** - Responsive design (10 tests)
5. **api.cy.ts** - API integration (12 tests)
6. **security.cy.ts** - Security tests (15 tests)
7. **performance.cy.ts** - Performance (10 tests)
8. **ui-consistency.cy.ts** - UI consistency (8 tests)

**Total**: 77+ test cases

---

## ✅ EXPECTED RESULTS

### First Run
- Some tests may fail if:
  - Test users don't exist
  - API endpoints differ
  - Selectors need adjustment

### After Fixes
- All tests should pass
- Full E2E coverage verified

---

## 🔧 TROUBLESHOOTING

### Tests Can't Find Server
- Verify backend on port 4000
- Verify frontend on port 3000
- Check `cypress.config.mjs` baseUrl

### Tests Fail on Login
- Ensure test users exist:
  - `artist1@example.com` / `password123`
  - `hotel1@example.com` / `password123`
  - `admin@travelart.test` / `Password123!`

### Selector Errors
- Check `data-testid` attributes exist
- Verify component structure matches tests
- Update selectors if needed

---

## 📝 NOTES

- Tests use `data-testid` attributes for reliable selection
- All required test IDs have been added
- Tests are configured for port 3000 (frontend)
- Backend API should be on port 4000

---

**Ready to Run**: ✅ All test IDs added, configuration fixed

