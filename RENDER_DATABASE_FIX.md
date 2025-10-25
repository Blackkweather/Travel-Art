# Fix DATABASE_URL Error on Render

## 🚨 Error You're Getting:

```
Error: Environment variable not found: DATABASE_URL
```

---

## ✅ Solution: Add Environment Variable in Render

### Method 1: Via Render Dashboard (RECOMMENDED)

1. Go to: https://dashboard.render.com/
2. Click on your **travel-art** service
3. Go to **Environment** tab (left sidebar)
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: `file:./prisma/dev.db`
6. Click **Save Changes**
7. Service will **auto-restart**

---

### Method 2: Add to .env file and redeploy

Your backend `.env` file should have:
```env
DATABASE_URL="file:./dev.db"
```

Then ensure `.env` is being loaded on Render.

---

## 🔄 After Adding DATABASE_URL:

### Option A: Auto-deploy will run (if enabled)

Wait 2-3 minutes, then try migration again:
```bash
cd backend
npx prisma migrate deploy
```

### Option B: Manual restart

1. In Render dashboard
2. Click **Manual Deploy** → **Clear build cache & deploy**
3. Wait for build to complete
4. Run migration

---

## 🧪 Verify Environment Variable:

In Render Shell:
```bash
echo $DATABASE_URL
# Should output: file:./prisma/dev.db
```

---

## ✅ Complete Migration Steps (After DATABASE_URL is set):

```bash
# 1. Navigate to backend
cd ~/project/src/backend

# 2. Check environment
echo $DATABASE_URL

# 3. Run migration
npx prisma migrate deploy

# 4. Verify migration status
npx prisma migrate status
```

---

## 📋 Expected Success Output:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

1 migration found in prisma/migrations

Applying migration `20251025195152_add_phone_to_user`

✔ Applied migration in 45ms

Your database is now in sync with your schema.
```

---

## 🎯 Summary:

**Problem**: `DATABASE_URL` environment variable not set on Render
**Solution**: Add it via Render Dashboard → Environment tab
**Value**: `file:./prisma/dev.db`

Then run migration in backend directory! ✅

