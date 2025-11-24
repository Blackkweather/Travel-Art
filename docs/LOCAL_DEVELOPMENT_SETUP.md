# Local Development Setup - PostgreSQL Required

**IMPORTANT**: The database schema is now PostgreSQL. You **MUST** use PostgreSQL for local development.

---

## 🚀 Quick Setup Options

### Option 1: Use Production PostgreSQL (Easiest)

1. **Get connection string from Render:**
   - Go to Render Dashboard → Your Database → "Connections"
   - Copy the "External Connection String"

2. **Update `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   ```

3. **Restart backend server**

### Option 2: Docker PostgreSQL (Recommended for Local Dev)

1. **Run PostgreSQL in Docker:**
   ```bash
   docker run --name travelart-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=travelart \
     -p 5432:5432 \
     -d postgres
   ```

2. **Update `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/travelart?schema=public"
   ```

3. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   # OR for development:
   npx prisma db push
   ```

4. **Restart backend server**

### Option 3: Local PostgreSQL Installation

1. **Install PostgreSQL** (if not installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create database:**
   ```bash
   createdb travelart
   ```

3. **Update `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/travelart?schema=public"
   ```

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

## ✅ Verify Setup

1. **Check connection:**
   ```bash
   cd backend
   npx prisma db pull
   ```

2. **Start backend:**
   ```bash
   npm run dev:backend
   ```

3. **Should see:**
   ```
   🐘 Using PostgreSQL database
   ✅ PostgreSQL database connected via Prisma
   ```

---

## 🔧 Troubleshooting

### Error: "URL must start with postgresql://"
- **Fix**: Update `DATABASE_URL` in `backend/.env` to use PostgreSQL connection string

### Error: "Connection refused"
- **Fix**: Make sure PostgreSQL is running
  - Docker: `docker ps` (should see postgres container)
  - Local: Check PostgreSQL service is running

### Error: "Database does not exist"
- **Fix**: Create the database first:
  ```bash
  createdb travelart
  ```

### Error: "Migration not applied"
- **Fix**: Run migrations:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```

---

## 📝 Notes

- **Production**: Uses PostgreSQL automatically (configured in Render)
- **Local Dev**: Must use PostgreSQL (schema requires it)
- **Migrations**: Run `npx prisma migrate deploy` after setting up database
- **Prisma Studio**: `npx prisma studio` to view/edit data

---

**Status**: ✅ PostgreSQL Required | **Ready for Development**

