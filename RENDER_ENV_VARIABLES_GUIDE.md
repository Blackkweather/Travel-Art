# Render Environment Variables Guide

## ✅ Required Variables for Backend Service

### Core Configuration
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `10000` (Render sets this automatically, but good to have)
- ✅ `DATABASE_URL` = (Auto-set from Render database connection)

### Authentication & Security
- ✅ `JWT_SECRET` = (Your secret key - **REQUIRED**)
- ✅ `JWT_EXPIRES_IN` = `7d`
- ✅ `JWT_REFRESH_EXPIRES_IN` = `30d`

### CORS & Frontend
- ✅ `CORS_ORIGIN` = (Should be your frontend URL - auto-set from frontend service)
- ✅ `FRONTEND_URL` = (Optional, but recommended - should match CORS_ORIGIN)

### Rate Limiting
- ✅ `RATE_LIMIT_WINDOW_MS` = `900000` (15 minutes)
- ✅ `RATE_LIMIT_MAX_REQUESTS` = `100`

### File Upload
- ✅ `MAX_FILE_SIZE` = `10485760` (10MB)
- ✅ `UPLOAD_PATH` = `./uploads`

### Email (Optional - only if using email features)
- ⚠️ `SMTP_HOST` = (Your SMTP server)
- ⚠️ `SMTP_PORT` = `587`
- ⚠️ `SMTP_USER` = (Your SMTP username)
- ⚠️ `SMTP_PASS` = (Your SMTP password)
- ✅ `FROM_EMAIL` = `noreply@travelart.com`

### Payments (Optional - only if using Stripe)
- ⚠️ `STRIPE_SECRET_KEY` = (Your Stripe secret key)
- ⚠️ `STRIPE_WEBHOOK_SECRET` = (Your Stripe webhook secret)

### Clerk Authentication (Optional - only if using Clerk)
- ⚠️ `CLERK_SECRET_KEY` = (Your Clerk secret key)
- ⚠️ `CLERK_PUBLISHABLE_KEY` = (Your Clerk publishable key)
- ⚠️ `CLERK_WEBHOOK_SECRET` = (Your Clerk webhook secret)

---

## ❌ NOT NEEDED (Can be removed)

These are **Supabase-specific** variables that are **NOT used** in the code since you're using Render's PostgreSQL database:

- ❌ `SUPABASE_PROJECT_REF` - **Remove** (not used)
- ❌ `SUPABASE_DB_PASSWORD` - **Remove** (not used)
- ❌ `SUPABASE_REGION` - **Remove** (not used)
- ❌ `SUPABASE_URL` - **Remove** (not used)
- ❌ `SUPABASE_ANON_KEY` - **Remove** (not used)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **Remove** (not used)
- ❌ `DIRECT_URL` - **Remove** (Supabase-specific, not used with Render DB)

---

## ✅ Required Variables for Frontend Service

### API Configuration
- ✅ `VITE_API_URL` = (Auto-set from backend service URL)
- ✅ `VITE_MODE` = `production`

### CDN Configuration
- ✅ `VITE_CDN_PROVIDER` = `cloudinary`
- ✅ `VITE_USE_CLOUDINARY` = `true`
- ⚠️ `VITE_CLOUDINARY_CLOUD_NAME` = (Your Cloudinary cloud name)
- ⚠️ `VITE_CLOUDINARY_VERSION` = (Your Cloudinary version)

### Logo URLs (Optional)
- ⚠️ `VITE_LOGO_FINAL_URL` = (Optional - CDN URL for logo)
- ⚠️ `VITE_LOGO_TRANSPARENT_URL` = (Optional - CDN URL for transparent logo)

### Clerk (Optional - only if using Clerk)
- ⚠️ `VITE_CLERK_PUBLISHABLE_KEY` = (Your Clerk publishable key)

---

## 🔍 Important Notes

1. **DATABASE_URL**: Render automatically sets this from your database connection - you don't need to set it manually.

2. **CORS_ORIGIN**: Should be automatically set from your frontend service URL via `render.yaml`, but verify it matches your frontend URL.

3. **PORT**: Render sets this automatically (usually 10000), but having it in env vars is fine.

4. **Supabase Variables**: These are leftover from a previous setup. Since you're using Render's PostgreSQL database, you can safely remove all `SUPABASE_*` variables.

5. **Optional Variables**: Variables marked with ⚠️ are only needed if you're using those features (email, payments, Clerk, etc.).

---

## 🧹 Cleanup Recommendation

**Remove these unused variables from your Render backend service:**
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_REGION`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DIRECT_URL`

This will clean up your environment and avoid confusion.

