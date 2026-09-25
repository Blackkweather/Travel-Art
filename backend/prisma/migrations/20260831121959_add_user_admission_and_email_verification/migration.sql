-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- Backfill. Every account that existed before the admission gate was
-- introduced predates the policy, so it is admitted rather than left waiting
-- for a review nobody was ever asked to perform. Without this, the ADD COLUMN
-- default above would lock every existing user - including the seeded demo
-- accounts and the administrator - out of the application.
UPDATE "users"
SET "approvalStatus" = 'APPROVED',
    "reviewedAt"     = CURRENT_TIMESTAMP,
    "emailVerified"  = true,
    "emailVerifiedAt" = CURRENT_TIMESTAMP;

-- Administrators are admitted by definition; there is no one above them to
-- review the request.
UPDATE "users" SET "approvalStatus" = 'APPROVED' WHERE "role" = 'ADMIN';

-- The admin console lists pending applications oldest-first on every load.
CREATE INDEX "users_approvalStatus_createdAt_idx"
  ON "users" ("approvalStatus", "createdAt");
