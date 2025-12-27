-- Migration: Fix Supabase Database Issues
-- Date: 2025-01-XX
-- Purpose: Add missing columns, enable RLS, add indexes

-- ============================================
-- 1. CRITICAL: Add missing clerkId column to users table
-- ============================================
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "clerkId" TEXT;

-- Add unique constraint on clerkId (as per Prisma schema)
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerkId_key" ON "users"("clerkId") WHERE "clerkId" IS NOT NULL;

-- ============================================
-- 2. SECURITY: Enable Row Level Security (RLS) on all tables
-- ============================================
-- This is CRITICAL for Supabase security
-- Without RLS, anyone can access your data through the Supabase API

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hotels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "availabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "artist_availability" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. PERFORMANCE: Add indexes on foreign keys
-- ============================================
-- These indexes improve query performance significantly

-- admin_logs
CREATE INDEX IF NOT EXISTS "admin_logs_actorUserId_idx" ON "admin_logs"("actorUserId");

-- artist_availability
CREATE INDEX IF NOT EXISTS "artist_availability_artistId_idx" ON "artist_availability"("artistId");

-- availabilities
CREATE INDEX IF NOT EXISTS "availabilities_hotelId_idx" ON "availabilities"("hotelId");

-- bookings
CREATE INDEX IF NOT EXISTS "bookings_artistId_idx" ON "bookings"("artistId");
CREATE INDEX IF NOT EXISTS "bookings_hotelId_idx" ON "bookings"("hotelId");

-- notifications
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");

-- ratings
CREATE INDEX IF NOT EXISTS "ratings_artistId_idx" ON "ratings"("artistId");
CREATE INDEX IF NOT EXISTS "ratings_bookingId_idx" ON "ratings"("bookingId");
CREATE INDEX IF NOT EXISTS "ratings_hotelId_idx" ON "ratings"("hotelId");

-- referrals
CREATE INDEX IF NOT EXISTS "referrals_inviteeUserId_idx" ON "referrals"("inviteeUserId");
CREATE INDEX IF NOT EXISTS "referrals_inviterUserId_idx" ON "referrals"("inviterUserId");

-- transactions
CREATE INDEX IF NOT EXISTS "transactions_artistId_idx" ON "transactions"("artistId");
CREATE INDEX IF NOT EXISTS "transactions_hotelId_idx" ON "transactions"("hotelId");

-- ============================================
-- 4. CLEANUP: Remove unwanted "Travel Art" table (if exists)
-- ============================================
-- This table doesn't exist in your Prisma schema
DROP TABLE IF EXISTS "Travel Art" CASCADE;

-- ============================================
-- 5. BASIC RLS POLICIES (Optional but Recommended)
-- ============================================
-- These are basic policies - you may want to customize them based on your auth setup

-- Users can only see their own data
CREATE POLICY IF NOT EXISTS "Users can view own data" ON "users"
  FOR SELECT USING (auth.uid()::text = id);

-- Artists can view their own profile
CREATE POLICY IF NOT EXISTS "Artists can view own profile" ON "artists"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "artists"."userId" 
      AND "users".id = auth.uid()::text
    )
  );

-- Hotels can view their own profile
CREATE POLICY IF NOT EXISTS "Hotels can view own profile" ON "hotels"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" 
      WHERE "users".id = "hotels"."userId" 
      AND "users".id = auth.uid()::text
    )
  );

-- Public trips can be viewed by anyone (if status = PUBLISHED)
CREATE POLICY IF NOT EXISTS "Public trips are viewable" ON "trips"
  FOR SELECT USING (status = 'PUBLISHED');

-- Note: You'll need to add more policies based on your authentication setup
-- Since you're using Clerk, you may need to use service_role key for backend access
-- or create custom policies that work with your Clerk authentication

