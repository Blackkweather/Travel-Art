# Quick Start - Cypress Tests
**Date**: 2025-01-22

---

## ⚡ QUICK START (3 Steps)

### 1️⃣ Start Backend
```bash
cd backend
npm run dev
```
✅ Wait for: "server running on port 4000"

### 2️⃣ Start Frontend  
```bash
cd frontend
npm run dev
```
✅ Wait for: "Local: http://localhost:3000/"

### 3️⃣ Run Tests
```bash
cd frontend
npm run test:e2e
```

---

## 🔍 VERIFY SERVERS

Before running tests, check:
- ✅ http://localhost:4000/health (Backend)
- ✅ http://localhost:3000 (Frontend)

---

## 📝 PORTS

- **Backend**: 4000
- **Frontend**: 3000
- **Cypress**: Looks for port 3000

---

## 🐛 FIXED

- ✅ Cypress config updated to port 3000
- ✅ PowerShell script updated to check correct ports
- ✅ Configuration matches Vite server port

---

**Status**: ✅ Ready to Run

