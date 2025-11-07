# 🚀 Deploy Travel Art to Render

**Repository:** https://github.com/Blackkweather/Travel-Art.git  
**Branch:** master  
**Status:** Ready to Deploy

---

## ⚡ Quick Deploy (Recommended)

### Option 1: Render Dashboard (Easiest)

1. **Go to:** https://dashboard.render.com
2. **Click:** "New +" → "Blueprint"
3. **Connect:** GitHub repository `Blackkweather/Travel-Art`
4. **Render will:**
   - Auto-detect `render.yaml`
   - Create all 3 services (Database, Backend, Frontend)
   - Set up environment variables

5. **After creation, set these environment variables:**

**Backend Service:**
```
JWT_SECRET=<generate-using: openssl rand -base64 32>
```

**Frontend Service:**
```
VITE_CLOUDINARY_CLOUD_NAME=desowqsmy
VITE_CLOUDINARY_VERSION=v1761401364
```

---

## 🔧 Manual Service Creation (If Needed)

### Step 1: Create PostgreSQL Database

1. Go to: https://dashboard.render.com/new/database
2. **Settings:**
   - Name: `travel-art-db`
   - Database: `travelart`
   - User: `travelart`
   - Plan: `Starter` ($7/month)
   - Region: `Oregon`

### Step 2: Create Backend Web Service

1. Go to: https://dashboard.render.com/new/web-service
2. **Connect Repository:** `Blackkweather/Travel-Art`
3. **Settings:**
   - Name: `travel-art-backend`
   - Region: `Oregon`
   - Branch: `master`
   - Root Directory: (leave empty)
   - Runtime: `Node`
   - Build Command: `cd backend && npm install && npx prisma migrate deploy && npm run build`
   - Start Command: `cd backend && npm run start`
   - Plan: `Starter` ($7/month)

4. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<from database connection string>
   JWT_SECRET=<generate secure random string>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=<will be set after frontend deploys>
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   FROM_EMAIL=noreply@travelart.com
   ```

### Step 3: Create Frontend Static Site

1. Go to: https://dashboard.render.com/new/static-site
2. **Connect Repository:** `Blackkweather/Travel-Art`
3. **Settings:**
   - Name: `travel-art-frontend`
   - Region: `Oregon`
   - Branch: `master`
   - Root Directory: (leave empty)
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

4. **Environment Variables:**
   ```
   VITE_API_URL=<backend URL after it deploys>
   VITE_MODE=production
   VITE_CDN_PROVIDER=cloudinary
   VITE_USE_CLOUDINARY=true
   VITE_CLOUDINARY_CLOUD_NAME=desowqsmy
   VITE_CLOUDINARY_VERSION=v1761401364
   ```

5. **After Backend Deploys:**
   - Update `VITE_API_URL` to: `https://travel-art-backend.onrender.com/api`

6. **After Frontend Deploys:**
   - Update Backend `CORS_ORIGIN` to: `https://travel-art-frontend.onrender.com`

---

## 📋 Deployment Checklist

- [ ] Database created and running
- [ ] Backend service created
- [ ] Backend environment variables set
- [ ] Backend deployed successfully
- [ ] Frontend service created
- [ ] Frontend environment variables set
- [ ] Frontend deployed successfully
- [ ] CORS_ORIGIN updated in backend
- [ ] VITE_API_URL updated in frontend
- [ ] Test frontend URL loads
- [ ] Test API connection from frontend
- [ ] Test authentication flow

---

## 🔗 Expected URLs

After deployment:
- **Frontend:** `https://travel-art-frontend.onrender.com`
- **Backend:** `https://travel-art-backend.onrender.com`
- **API Base:** `https://travel-art-backend.onrender.com/api`

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify Node.js version (should be 18+)
- Check for missing dependencies

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify connection string format

### CORS Errors
- Ensure `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes
- Verify HTTPS vs HTTP

### Environment Variables Not Working
- Rebuild service after adding variables
- Check variable names match exactly
- Verify no extra spaces

---

**Ready!** Start with Option 1 (Blueprint) for easiest deployment.

