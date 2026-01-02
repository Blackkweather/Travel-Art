-- AlterTable
-- Add responsible contact fields to hotels table
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "responsiblePhone" TEXT,
ADD COLUMN IF NOT EXISTS "responsibleEmail" TEXT,
ADD COLUMN IF NOT EXISTS "responsibleName" TEXT;

