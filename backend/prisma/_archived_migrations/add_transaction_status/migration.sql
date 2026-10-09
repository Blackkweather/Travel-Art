-- Add status field to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Update existing transactions to have appropriate status
UPDATE "transactions" SET "status" = 'COMPLETED' WHERE "status" IS NULL;


