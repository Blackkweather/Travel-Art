-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "processedAt" DROP NOT NULL,
ALTER COLUMN "processedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "webhook_events_processedAt_idx" ON "webhook_events"("processedAt");
