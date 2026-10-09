-- CreateEnum
CREATE TYPE "ConventionParty" AS ENUM ('HOTEL', 'PARTICIPANT', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('DUE', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "TransportClaimStatus" AS ENUM ('SUBMITTED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaVerification" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "verificationCode" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "conventionFinalizedAt" TIMESTAMP(3),
ADD COLUMN     "conventionHash" TEXT,
ADD COLUMN     "includedServices" TEXT,
ADD COLUMN     "performanceDuration" TEXT,
ADD COLUMN     "performanceLocation" TEXT,
ADD COLUMN     "roomType" TEXT,
ADD COLUMN     "socialContent" TEXT,
ADD COLUMN     "technicalConditions" TEXT;

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "signatoryName" TEXT,
ADD COLUMN     "signatoryTitle" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "authorUrl" TEXT,
ADD COLUMN     "verification" "MediaVerification" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verificationMethod" TEXT,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "claimId" TEXT;

-- CreateTable
CREATE TABLE "convention_signatures" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "party" "ConventionParty" NOT NULL,
    "userId" TEXT,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT,
    "identity" JSONB NOT NULL DEFAULT '{}',
    "documentHash" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convention_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_claims" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 8900,
    "feeStatus" "FeeStatus" NOT NULL DEFAULT 'DUE',
    "feeDueAt" TIMESTAMP(3) NOT NULL,
    "feeSettledAt" TIMESTAMP(3),
    "feeNote" TEXT,
    "transportEligible" BOOLEAN NOT NULL,
    "transportStatus" "TransportClaimStatus",
    "transportAmountCents" INTEGER,
    "transportNote" TEXT,
    "transportProofUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transportProofKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transportSubmittedAt" TIMESTAMP(3),
    "transportDueAt" TIMESTAMP(3),
    "transportSettledAt" TIMESTAMP(3),
    "transportSettleNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancellation_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convention_signatures_bookingId_party_key" ON "convention_signatures"("bookingId", "party");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_claims_bookingId_key" ON "cancellation_claims"("bookingId");

-- CreateIndex
CREATE INDEX "cancellation_claims_feeStatus_idx" ON "cancellation_claims"("feeStatus");

-- CreateIndex
CREATE INDEX "cancellation_claims_transportStatus_idx" ON "cancellation_claims"("transportStatus");

-- CreateIndex
CREATE UNIQUE INDEX "artists_verificationCode_key" ON "artists"("verificationCode");

-- CreateIndex
CREATE INDEX "payments_claimId_idx" ON "payments"("claimId");

-- AddForeignKey
ALTER TABLE "convention_signatures" ADD CONSTRAINT "convention_signatures_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_claims" ADD CONSTRAINT "cancellation_claims_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "cancellation_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- The API connects as travelart_app; see 20261009090000_grant_app_role_new_tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelart_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "convention_signatures", "cancellation_claims" TO travelart_app;
  END IF;
END
$$;