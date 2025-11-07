# QA Test Run Guide

**Quick reference for running and executing QA tests**

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
cd frontend
npm install

cd ../backend
npm install
```

### Start Test Environment
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run tests
cd frontend
npm run test:e2e:open
```

---

## 📋 Test Execution Commands

### Run All Tests
```bash
# Headless mode (CI/CD)
npm run test:e2e:headless

# Interactive mode (development)
npm run test:e2e:open
```

### Run Specific Test Suites
```bash
# Authentication tests
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Security tests
npx cypress run --spec "cypress/e2e/security.cy.ts"

# Performance tests
npx cypress run --spec "cypress/e2e/performance.cy.ts"

# API tests
npx cypress run --spec "cypress/e2e/api.cy.ts"

# UI consistency tests
npx cypress run --spec "cypress/e2e/ui-consistency.cy.ts"

# Booking tests
npx cypress run --spec "cypress/e2e/booking.cy.ts"

# Responsive tests
npx cypress run --spec "cypress/e2e/responsive.cy.ts"

# Accessibility tests
npx cypress run --spec "cypress/e2e/accessibility.cy.ts"
```

### Run Tests by Tag
```bash
# Run only P1 (critical) tests
npx cypress run --env grepTags="P1"

# Run only security tests
npx cypress run --env grepTags="security"
```

---

## 🎯 Test Execution Workflow

### 1. Pre-Test Checklist
- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Database seeded with test data
- [ ] Test users created
- [ ] Environment variables configured

### 2. Run Test Suite
```bash
# Option 1: Run all tests
npm run test:e2e:headless

# Option 2: Run specific category
npx cypress run --spec "cypress/e2e/security.cy.ts"
```

### 3. Review Results
- Check test output in terminal
- Review screenshots (if failures)
- Review videos (if failures)
- Check test reports

### 4. Document Results
- Update `TEST_EXECUTION_TRACKER_ENHANCED.md`
- Create bug reports for failures
- Update test cases if needed

---

## 🔧 Test Configuration

### Cypress Configuration
**File:** `frontend/cypress.config.ts`

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1440,
    viewportHeight: 900,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
})
```

### Environment Variables
**File:** `frontend/.env.test`

```env
VITE_API_URL=http://localhost:3000
VITE_TEST_MODE=true
CYPRESS_BASE_URL=http://localhost:5173
```

---

## 📊 Test Data Setup

### Test Users
Test users are defined in `frontend/cypress/support/test-data.ts`:

```typescript
export const testUsers = {
  artist: {
    email: 'artist1@example.com',
    password: 'password123'
  },
  hotel: {
    email: 'hotel1@example.com',
    password: 'password123'
  },
  admin: {
    email: 'admin@example.com',
    password: 'password123'
  }
}
```

### Seed Test Data
```bash
# Backend: Seed database
cd backend
npm run seed

# Or use Prisma Studio to verify
npx prisma studio
```

---

## 🐛 Debugging Failed Tests

### View Test Results
```bash
# Open Cypress in interactive mode
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "cypress/e2e/security.cy.ts" --headed
```

### Check Screenshots
```bash
# Screenshots saved in:
frontend/cypress/screenshots/
```

### Check Videos
```bash
# Videos saved in:
frontend/cypress/videos/
```

### Debug in Browser
```bash
# Run with browser DevTools
npx cypress run --spec "cypress/e2e/security.cy.ts" --headed --browser chrome
```

---

## 🔄 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Daily at 2 AM UTC (scheduled)

### Manual Trigger
```bash
# Trigger workflow manually via GitHub UI
# Actions > QA Test Suite > Run workflow
```

### Local CI Simulation
```bash
# Run all tests as CI would
npm run test:e2e:headless
npm run lint
npm run test
```

---

## 📈 Test Coverage Goals

### Current Status
- **Total Tests:** 83
- **Executed:** 38 (46%)
- **Passed:** 38 (100% of executed)
- **Failed:** 0
- **Pending:** 45

### Target Goals
- **P1 Tests:** 100% executed
- **P2 Tests:** 95% executed
- **Overall:** 90% executed
- **Pass Rate:** ≥95%

---

## 🛠️ Custom Commands

### Available Commands
```typescript
// Login as specific role
cy.loginAsRole('artist')
cy.loginAsRole('hotel')
cy.loginAsRole('admin')

// Wait for API and verify status
cy.waitForApi('@getArtists', 200)

// Test responsive breakpoint
cy.testBreakpoint(375, 667)

// Check performance metric
cy.checkPerformanceMetric('FCP', 1800)

// Verify no console errors
cy.verifyNoConsoleErrors()

// Test XSS prevention
cy.testXSSPrevention('input[name="name"]', '<script>alert("xss")</script>')

// Test rate limiting
cy.testRateLimit('/api/auth/login', 10)

// Check accessibility
cy.checkAccessibility()
```

---

## 📝 Test Execution Best Practices

### 1. Run Tests Regularly
- **Daily:** Smoke tests (5 critical tests)
- **Weekly:** Full regression suite
- **Before Release:** Complete test suite

### 2. Document Results
- Update test tracker after each run
- Document any failures
- Create bug reports for issues

### 3. Maintain Test Data
- Keep test users up to date
- Refresh test data regularly
- Clean up test data after runs

### 4. Review Flaky Tests
- Identify flaky tests
- Fix or remove flaky tests
- Add retry logic if needed

---

## 🚨 Common Issues & Solutions

### Issue: Tests timeout
**Solution:** Increase timeout in `cypress.config.ts`
```typescript
defaultCommandTimeout: 20000
```

### Issue: API calls fail
**Solution:** Ensure backend is running and accessible
```bash
# Check backend health
curl http://localhost:3000/api/health
```

### Issue: Test data not found
**Solution:** Seed database with test data
```bash
cd backend
npm run seed
```

### Issue: Tests fail in CI but pass locally
**Solution:** Check environment variables and test data setup

---

## 📚 Related Documentation

- **Comprehensive Test Plan:** `docs/COMPREHENSIVE_QA_TEST_PLAN.md`
- **Test Execution Tracker:** `docs/TEST_EXECUTION_TRACKER_ENHANCED.md`
- **Quick Checklist:** `docs/QA_QUICK_CHECKLIST.md`
- **Implementation Summary:** `docs/QA_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** 2024-12-19  
**Version:** 2.0  
**Maintained By:** QA Team

