# 🚨 URGENT: FIX SUPABASE CONNECTION

## The Problem

Your application **cannot connect** to Supabase because:
- ❌ Pooler regions don't work
- ❌ Direct connection fails (IPv6 issue)
- ✅ MCP connection works (but uses different credentials)

## ✅ IMMEDIATE SOLUTION (5 minutes)

### Step 1: Get Exact Connection String from Dashboard

1. **Go to your Supabase Dashboard:**
   https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/database

2. **Scroll to "Connection string" section**

3. **Look for these connection types:**

   - **Session pooler** (Port 5432) - for migrations
   - **Transaction pooler** (Port 6543) - for application
   - Or **Direct connection** - if pooler not available

4. **Copy the EXACT connection string** shown there

### Step 2: Enable Pooler (if not enabled)

On the same Database Settings page:

1. Look for **"Connection pooling"** section
2. If it says "Disabled", click **"Enable"**
3. Choose **"Transaction mode"** (recommended for APIs)
4. Save settings

### Step 3: Update Your .env File

Once you have the correct connection string:

```bash
# Open backend/.env and replace DATABASE_URL with the exact string from dashboard

# Example - Transaction Pooler (Port 6543):
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@[CORRECT-HOSTNAME]:6543/postgres?pgbouncer=true"

# Example - Session Pooler (Port 5432):
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@[CORRECT-HOSTNAME]:5432/postgres"
```

**Important:** Make sure to URL-encode your password! (`;` = `%3B`)

### Step 4: Test Connection

```bash
# Stop your server (Ctrl+C in terminal)
# Restart:
npm run dev
```

---

## 🔍 What Went Wrong

The region I configured (`eu-west-1`) might be:
1. **Incorrect** - Supabase might use a different region slug
2. **Pooler not enabled** - Connection pooling needs to be turned on
3. **Different hostname format** - Some projects use different patterns

The MCP works because it's configured separately and has the correct credentials.

---

## 🆘 Alternative: Use MCP Credentials

The MCP is successfully connecting to your database. This means it has the correct connection details. Unfortunately, I can't directly extract those credentials, but you can:

### Option A: Check MCP Configuration

If you configured the Supabase MCP, check where those credentials are stored:
- Cursor MCP settings
- Environment variables used by MCP
- MCP configuration file

### Option B: Use Supabase Dashboard (RECOMMENDED)

This is the most reliable way - get the connection string directly from Supabase.

---

## ✅ QUICK TEST AFTER FIX

After updating your `.env`:

```bash
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('✅ Connected!')).catch(e => console.log('❌ Failed:', e.message)); setTimeout(() => process.exit(), 5000);"
```

If you see "✅ Connected!" - you're good to go!

---

## 📞 Need the Dashboard Link?

**Direct link to your database settings:**
https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/database

Look for the **"Connection string"** section and **"Connection pooling"** section.

---

## 💡 Pro Tip

Once you get it working, save these details:
- Exact connection string format
- Region/hostname pattern
- Whether pooler is enabled
- Which port works (5432 or 6543)

Add a comment in your `.env` so you remember!

