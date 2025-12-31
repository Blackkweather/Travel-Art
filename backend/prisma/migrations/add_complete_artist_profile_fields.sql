-- Add complete profile fields to Artist table
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "stageName" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "artisticProfile" TEXT;

-- Add profile picture to Hotel table
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS "artists_stageName_idx" ON "artists"("stageName");
CREATE INDEX IF NOT EXISTS "artists_discipline_idx" ON "artists"("discipline");













