# Quick Start - Testing Guide
**Date**: 2025-01-22

---

## 🚀 QUICK START

### Run All Backend Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
cd backend
npm test -- bookings.test.ts
npm test -- payments.test.ts
npm test -- hotels.test.ts
```

### Run Frontend Tests
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run Cypress
cd frontend
npm run test:e2e
```

---

## 📊 TEST COVERAGE

### 100% Coverage
- ✅ Bookings API (5/5)
- ✅ Payments API (3/3)
- ✅ Trips API (2/2)

### 50%+ Coverage
- ✅ Hotels API (6/11 - 55%)
- ✅ Artists API (4/5 - 80%)
- ✅ Common API (3/5 - 60%)

### Overall
- **25/46 endpoints** tested (54%)
- **48 tests** total
- **100% pass rate** (individual)

---

## 📁 TEST FILES

1. `backend/src/__tests__/trips.test.ts`
2. `backend/src/__tests__/admin.test.ts`
3. `backend/src/__tests__/auth.test.ts`
4. `backend/src/__tests__/bookings.test.ts`
5. `backend/src/__tests__/payments.test.ts`
6. `backend/src/__tests__/artists.test.ts`
7. `backend/src/__tests__/common.test.ts`
8. `backend/src/__tests__/hotels.test.ts`

---

## 📚 DOCUMENTATION

See `README_TESTING.md` for complete navigation guide.

---

**Status**: ✅ Complete  
**Last Updated**: 2025-01-22

