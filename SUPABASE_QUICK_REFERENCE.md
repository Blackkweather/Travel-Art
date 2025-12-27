# 🚀 SUPABASE MCP - QUICK REFERENCE CARD

## 🔑 Your Project Info

```
Project ID:   rtvtzyjlbtgnvzzqxzxv
Project URL:  https://rtvtzyjlbtgnvzzqxzxv.supabase.co
Region:       eu-west-1 (Ireland)
Database:     PostgreSQL 17.6
```

## 📝 Essential Environment Variables

```bash
# In backend/.env
SUPABASE_PROJECT_REF=rtvtzyjlbtgnvzzqxzxv
SUPABASE_DB_PASSWORD=Trvael69120Arts%3B
SUPABASE_REGION=eu-west-1
DATABASE_URL="postgresql://postgres.rtvtzyjlbtgnvzzqxzxv:Trvael69120Arts%3B@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
SUPABASE_URL=https://rtvtzyjlbtgnvzzqxzxv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnR6eWpsYnRnbnZ6enF4enh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTAzMTMsImV4cCI6MjA4MjA2NjMxM30.uJ_rfHEFJdwsBzk1V6H_kDRZ5btEKcqUqBasq0xkdjE
```

## ⚡ Quick Commands

```bash
# Verify configuration
.\verify-supabase.ps1

# Test connection
cd backend
npx prisma db pull

# Open database browser
npx prisma studio

# Apply security fixes
npx prisma migrate dev --name add_clerk_id_and_rls
```

## 🔐 Get Service Role Key

1. Visit: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/api
2. Copy `service_role` key
3. Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

## 🚨 Critical: Fix RLS

```bash
cd backend
npx prisma migrate dev --name add_clerk_id_and_rls
```

Or run the SQL from: `backend/prisma/migrations/fix_supabase_db.sql`

## 🌐 Connection Ports

- **6543** = Transaction Pooler (RECOMMENDED for APIs) ✅ Currently using
- **5432** = Session Pooler (for migrations)

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection fails | Check region in Dashboard, try different regions |
| Auth error | Verify password encoding (`;` = `%3B`) |
| RLS errors | Use service_role key in backend |
| Migration fails | Use DIRECT_URL (port 5432) |

## 📚 Important Links

- Dashboard: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv
- Database: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/database
- API Keys: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/api
- SQL Editor: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/sql

## ✅ Status

- ✅ Configuration complete
- ✅ Connection verified
- ⚠️ **TODO:** Get service role key
- ⚠️ **TODO:** Enable RLS on tables

