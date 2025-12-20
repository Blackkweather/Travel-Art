# Travel Art Platform - Quick Start Guide

## 🚀 Running the Platform

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- SQLite (included with Node.js)

### Start the Application

#### Terminal 1 - Backend Server:
```bash
cd backend
npm install      # Only first time
npm run dev      # Starts on port 4000
```

#### Terminal 2 - Frontend Server:
```bash
cd frontend
npm install      # Only first time
npm run dev      # Starts on port 3000
```

#### Access the App:
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:4000/api/health

---

## 📊 What You'll See

When you open http://localhost:3000, you'll see:

1. **Hero Section** - Large banner with "Where Creativity Meets..."
2. **About Section** - Info about the platform
3. **Immersive Experiences** - Grid of available trips/experiences
4. **How It Works** - 3-step process explanation
5. **Featured Artists** - Auto-scrolling carousel of top artists
6. **Partner Hotels** - Auto-scrolling carousel of premium hotels
7. **Top Artists** - Featured high-rated artists
8. **Top Hotels** - Featured luxury hotels
9. **Newsletter** - Signup form
10. **Footer** - Contact and links

---

## 🔍 Debugging

### Open Browser Console (F12)
You'll see logs like:
```
[API Client] Initialized with base URL: /api | Mode: development
[API Success] GET /api/top?type=artists - 200
[API Success] GET /api/top?type=hotels - 200
[API Success] GET /api/trips - 200
```

### Use Debug Tools in Console:
```javascript
// View all API logs
__DEBUG_API__.getLogs()

// Check backend health
__DEBUG_API__.checkHealth()

// Print summary table
__DEBUG_API__.summary()

// Export logs as JSON
JSON.parse(__DEBUG_API__.export())
```

---

## 🧪 Testing Endpoints

### Test in PowerShell:
```powershell
# Health check
curl http://localhost:4000/api/health

# Get top artists
curl http://localhost:4000/api/top?type=artists

# Get top hotels
curl http://localhost:4000/api/top?type=hotels

# Get published trips
curl http://localhost:4000/api/trips
```

---

## 🛠️ Common Issues & Quick Fixes

### Issue: "Cannot connect to backend"
```bash
# Check if backend is running
curl http://localhost:4000/api/health

# Restart backend
cd backend
npm run dev
```

### Issue: "Port already in use"
```bash
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Kill process on port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

### Issue: "No data showing"
```bash
# Check browser console for errors (F12)
# Check backend logs for issues
# Verify database is seeded
cd backend
npm run seed
```

### Issue: "Images not loading"
- Placeholder images will show if originals fail
- Images fallback to https://via.placeholder.com/[size]?text=[label]
- This is expected and working correctly

---

## 📁 Project Structure

```
Travel Art/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   │   ├── trips.ts   # Experiences endpoint (FIXED)
│   │   │   ├── common.ts  # Top artists/hotels endpoint
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # Error handling (ENHANCED)
│   │   ├── db.ts          # Database setup
│   │   └── index.ts       # Server setup (ENHANCED with logging)
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── dev.db         # SQLite database
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── LandingPage.tsx  # Main page (ENHANCED)
│   │   ├── components/
│   │   │   └── HealthCheck.tsx  # Status indicator (NEW)
│   │   └── utils/
│   │       ├── api.ts    # API client (ENHANCED)
│   │       └── debug.ts  # Debug utility (NEW)
│   └── package.json
│
└── docs/
    ├── ENHANCEMENT_AND_TROUBLESHOOTING.md  # Detailed guide
    └── PLATFORM_ENHANCEMENT_COMPLETE.md    # Summary
```

---

## 🔄 Data Flow

```
Database (SQLite)
     ↓
Backend API (Express + Prisma)
     ↓
Frontend API Client (Axios)
     ↓
React Components
     ↓
Browser
```

**Example**: Getting artists:
1. Frontend calls `commonApi.getTopArtists()`
2. Axios makes GET `/api/top?type=artists`
3. Vite proxy forwards to `http://localhost:4000/api/top?type=artists`
4. Backend queries database with Prisma
5. Backend returns `{ success: true, data: [...] }`
6. Frontend logs the response (see console)
7. Frontend renders carousel with artist data

---

## ✅ Verification Checklist

- [x] Frontend server running on port 3000
- [x] Backend server running on port 4000
- [x] Database connected and seeded
- [x] No console errors on page load
- [x] API logs visible in browser console
- [x] Artists carousel showing data
- [x] Hotels carousel showing data
- [x] Experiences grid showing trips
- [x] Images loading (with fallbacks)
- [x] No broken layout elements

---

## 📚 Documentation Files

- **PLATFORM_ENHANCEMENT_COMPLETE.md** - Full feature list and improvements
- **ENHANCEMENT_AND_TROUBLESHOOTING.md** - Detailed troubleshooting guide
- **Code files**: Check inline comments for explanation

---

## 🎉 You're All Set!

The platform is fully operational with all enhancements in place. 

**Visit http://localhost:3000 to see it in action!**

Need help? Check the browser console (F12) for detailed logs and errors.
