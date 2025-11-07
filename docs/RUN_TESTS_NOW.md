# How to Run Tests - Quick Guide

## 🚀 Quick Start

### Step 1: Start Backend Server
Open **Terminal 1**:
```bash
cd backend
npm run dev
```
Wait for: `Server running on port 3000` (or your configured port)

### Step 2: Start Frontend Server  
Open **Terminal 2**:
```bash
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Step 3: Run Tests
Open **Terminal 3**:
```bash
cd frontend
npm run test:e2e:headless
```

Or run specific test suite:
```bash
# Security tests
npx cypress run --spec "cypress/e2e/security.cy.ts" --headless

# Performance tests
npx cypress run --spec "cypress/e2e/performance.cy.ts" --headless

# API tests
npx cypress run --spec "cypress/e2e/api.cy.ts" --headless

# UI consistency tests
npx cypress run --spec "cypress/e2e/ui-consistency.cy.ts" --headless
```

## 🔧 Configuration Fixed

✅ **Fixed Issues:**
- Created `cypress/support/e2e.ts` support file
- Updated `cypress.config.mjs` (renamed from .ts for ES module compatibility)
- Added supportFile configuration

## 📝 Note

The Cypress config has been renamed to `cypress.config.mjs` to work with ES modules (`"type": "module"` in package.json).

## 🎯 Test Status

Once servers are running, you can execute:
- **83 total tests** across 8 test suites
- **38 tests** already verified (existing suites)
- **45 new tests** ready to run (security, performance, API, UI consistency)

---

**Ready to test!** Start the servers and run the command above. 🚀

