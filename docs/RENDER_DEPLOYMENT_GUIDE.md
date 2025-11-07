# Render Deployment Guide

**Repository:** https://github.com/Blackkweather/Travel-Art.git  
**Status:** Ready to Deploy

---

## 🚀 Quick Deploy Options

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Connect Repository:**
   - Click "New +" → "Blueprint"
   - Connect GitHub repository: `Blackkweather/Travel-Art`
   - Render will auto-detect `render.yaml`

3. **Render will create:**
   - ✅ PostgreSQL Database (`travel-art-db`)
   - ✅ Backend Web Service (`travel-art-backend`)
   - ✅ Frontend Static Site (`travel-art-frontend`)

4. **Set Environment Variables:**
   - `JWT_SECRET` (generate a secure random string)
   - `STRIPE_SECRET_KEY` (if using Stripe)
   - `SMTP_*` variables (if using email)
   - `VITE_CLOUDINARY_*` variables (for frontend)

### Option 2: Deploy via Render MCP (If Workspace Selected)

The MCP tools can create services, but workspace must be selected first.

---

## 📋 Services Configuration

### 1. PostgreSQL Database

**Name:** `travel-art-db`  
**Plan:** starter  
**Region:** oregon

**Auto-created from:** `render.yaml`

### 2. Backend Web Service

**Name:** `travel-art-backend`  
**Type:** Web Service  
**Runtime:** Node.js  
**Plan:** starter  
**Region:** oregon

**Build Command:**
```bash
cd backend && npm install && npx prisma migrate deploy && npm run build
```

**Start Command:**
```bash
cd backend && npm run start
```

**Environment Variables (from render.yaml):**
- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL` (auto from database)
- `JWT_SECRET` (set manually)
- `CORS_ORIGIN` (auto from frontend URL)
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

### 3. Frontend Static Site

**Name:** `travel-art-frontend`  
**Type:** Static Site  
**Plan:** free  
**Region:** oregon

**Build Command:**
```bash
cd frontend && npm install && npm run build
```

**Publish Path:**
```
frontend/dist
```

**Environment Variables:**
- `VITE_API_URL` (auto from backend URL)
- `VITE_MODE=production`
- `VITE_USE_CLOUDINARY=true`
- `VITE_CLOUDINARY_CLOUD_NAME` (set manually)

---

## 🔧 Required Environment Variables

### Backend (Web Service)

**Required:**
- `JWT_SECRET` - Generate: `openssl rand -base64 32`

**Optional (but recommended):**
- `STRIPE_SECRET_KEY` - If using payments
- `STRIPE_WEBHOOK_SECRET` - If using webhooks
- `SMTP_HOST` - Email server
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password

### Frontend (Static Site)

**Required:**
- `VITE_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `VITE_CLOUDINARY_VERSION` - Cloudinary version

**Optional:**
- `VITE_LOGO_FINAL_URL` - CDN URL for logo
- `VITE_LOGO_TRANSPARENT_URL` - CDN URL for transparent logo

---

## 📝 Deployment Steps

### Step 1: Ensure Code is Pushed

✅ **Already Done!** Code is pushed to GitHub:
- Repository: `https://github.com/Blackkweather/Travel-Art.git`
- Branch: `master`
- Commit: `71f6c32`

### Step 2: Deploy via Render Dashboard

1. Visit: https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect: `Blackkweather/Travel-Art`
4. Render will read `render.yaml` and create all services

### Step 3: Configure Environment Variables

After services are created, set these in Render dashboard:

**Backend:**
```
JWT_SECRET=<generate-secure-random-string>
```

**Frontend:**
```
VITE_CLOUDINARY_CLOUD_NAME=desowqsmy
VITE_CLOUDINARY_VERSION=v1761401364
```

### Step 4: Wait for Deployment

- Database: ~2-3 minutes
- Backend: ~5-10 minutes (first deploy)
- Frontend: ~3-5 minutes

### Step 5: Verify Deployment

- Backend: Check health endpoint
- Frontend: Visit the static site URL
- Database: Check connection in backend logs

---

## 🔗 Service URLs

After deployment, you'll get:

- **Frontend:** `https://travel-art-frontend.onrender.com`
- **Backend:** `https://travel-art-backend.onrender.com`
- **Database:** Internal connection string

---

## 🐛 Troubleshooting

### Issue: Build Fails
**Solution:** Check build logs in Render dashboard

### Issue: Database Connection Fails
**Solution:** Verify `DATABASE_URL` is set correctly

### Issue: CORS Errors
**Solution:** Verify `CORS_ORIGIN` points to frontend URL

### Issue: Environment Variables Not Set
**Solution:** Set all required variables in Render dashboard

---

## ✅ Post-Deployment Checklist

- [ ] Database connected
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] API calls work from frontend
- [ ] Authentication works
- [ ] Environment variables set
- [ ] SSL certificates active (automatic on Render)

---

**Ready to deploy!** Use Render dashboard or MCP tools (if workspace selected).

