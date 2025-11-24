-- Migration: Add Trip model additional fields
-- This migration adds all the new fields to the trips table

-- Add new columns to trips table
ALTER TABLE "trips" 
ADD COLUMN IF NOT EXISTS "artistId" TEXT,
ADD COLUMN IF NOT EXISTS "hotelId" TEXT,
ADD COLUMN IF NOT EXISTS "type" TEXT,
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "duration" TEXT,
ADD COLUMN IF NOT EXISTS "capacity" TEXT,
ADD COLUMN IF NOT EXISTS "schedule" TEXT,
ADD COLUMN IF NOT EXISTS "includes" TEXT,
ADD COLUMN IF NOT EXISTS "artistBio" TEXT,
ADD COLUMN IF NOT EXISTS "venueDetails" TEXT,
ADD COLUMN IF NOT EXISTS "reviews" TEXT;

-- Add foreign key constraints
ALTER TABLE "trips" 
ADD CONSTRAINT "trips_artistId_fkey" 
FOREIGN KEY ("artistId") REFERENCES "artists"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "trips" 
ADD CONSTRAINT "trips_hotelId_fkey" 
FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "trips_artistId_idx" ON "trips"("artistId");
CREATE INDEX IF NOT EXISTS "trips_hotelId_idx" ON "trips"("hotelId");
CREATE INDEX IF NOT EXISTS "trips_status_idx" ON "trips"("status");
CREATE INDEX IF NOT EXISTS "trips_date_idx" ON "trips"("date");

