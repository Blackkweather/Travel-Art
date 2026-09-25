-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "acceptedTermsVersion" TEXT;

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_records_userId_kind_idx" ON "consent_records"("userId", "kind");

-- CreateIndex
CREATE INDEX "consent_records_createdAt_idx" ON "consent_records"("createdAt");

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
