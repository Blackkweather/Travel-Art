# Supabase Database Changes Required

## Summary of Issues Found

### 🔴 CRITICAL (Must Fix)

1. **Missing `clerkId` column** in `users` table
   - Required for Clerk authentication integration
   - Should be nullable and unique

2. **Row Level Security (RLS) Disabled** on all tables
   - **SECURITY RISK**: Without RLS, anyone can access your data through Supabase API
   - All 13 tables need RLS enabled

### ⚠️ IMPORTANT (Should Fix)

3. **Missing indexes on foreign keys** (Performance issue)
   - 13 foreign keys without indexes
   - Will slow down queries as data grows

4. **Unwanted table**: "Travel Art" table exists but not in schema
   - Should be removed

---

## How to Apply Changes

### Option 1: Using Supabase MCP (Recommended)

I can apply these changes directly using the Supabase MCP tools. Just say "apply the changes" and I'll run the migration.

### Option 2: Manual Application

1. Go to your Supabase Dashboard: https://rtvtzyjlbtgnvzzqxzxv.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from `backend/prisma/migrations/fix_supabase_db.sql`
4. Run the migration

### Option 3: Using Prisma Migrate

```bash
cd backend
# Create a new migration
npx prisma migrate dev --name add_clerk_id_and_rls
```

---

## Changes Breakdown

### 1. Add clerkId Column
```sql
ALTER TABLE "users" ADD COLUMN "clerkId" TEXT;
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId") WHERE "clerkId" IS NOT NULL;
```

### 2. Enable RLS on All Tables
```sql
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "artists" ENABLE ROW LEVEL SECURITY;
-- ... (all other tables)
```

### 3. Add Performance Indexes
```sql
CREATE INDEX "admin_logs_actorUserId_idx" ON "admin_logs"("actorUserId");
CREATE INDEX "bookings_artistId_idx" ON "bookings"("artistId");
-- ... (all foreign keys)
```

### 4. Remove Unwanted Table
```sql
DROP TABLE IF EXISTS "Travel Art" CASCADE;
```

---

## After Applying Changes

### Next Steps:

1. **Update RLS Policies**: The basic policies I've included are a starting point. You'll need to customize them based on:
   - Your Clerk authentication setup
   - Your application's access patterns
   - Whether you're using Supabase Auth or Clerk exclusively

2. **Test Your Application**: Make sure all queries still work after enabling RLS

3. **Monitor Performance**: Check if the new indexes improve query performance

---

## Security Note

⚠️ **IMPORTANT**: After enabling RLS, you'll need to either:
- Use Supabase's `service_role` key for backend operations (bypasses RLS)
- Create proper RLS policies that work with your Clerk authentication
- Disable Supabase API access and use direct PostgreSQL connections only

Since you're using Clerk for authentication, you'll likely want to use the `service_role` key for backend operations.

---

## Questions?

- Should I apply these changes now?
- Do you want me to create custom RLS policies for your Clerk setup?
- Need help configuring your backend to use Supabase connection string?

