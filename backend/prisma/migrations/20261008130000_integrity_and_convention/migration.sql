-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE');

-- CreateEnum
CREATE TYPE "TransportTerms" AS ENUM ('HOTEL_PAYS', 'ARTIST_PAYS', 'SHARED', 'NOT_NEEDED');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "stageNameKey" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "boardType" "BoardType",
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledByRole" "Role",
ADD COLUMN     "companionName" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "performanceDescription" TEXT,
ADD COLUMN     "performanceSchedule" TEXT,
ADD COLUMN     "performanceValueCents" INTEGER,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "stayValueCents" INTEGER,
ADD COLUMN     "transportNotes" TEXT,
ADD COLUMN     "transportTerms" "TransportTerms";

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "nameKey" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneE164" TEXT;

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "rewardedAt" TIMESTAMP(3);
-- Referrals that already exist were credited at registration, the old way.
UPDATE "referrals" SET "rewardedAt" = "createdAt";

-- CreateTable
CREATE TABLE "hotel_programmes" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "audiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appreciated" TEXT,
    "disliked" TEXT,
    "hasStage" BOOLEAN NOT NULL DEFAULT false,
    "stageDimensions" TEXT,
    "hasSound" BOOLEAN NOT NULL DEFAULT false,
    "soundDetails" TEXT,
    "lighting" TEXT,
    "hasScreens" BOOLEAN NOT NULL DEFAULT false,
    "hasCrew" BOOLEAN NOT NULL DEFAULT false,
    "collaborationTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditions" TEXT,
    "durationType" TEXT,
    "residenceDuration" TEXT,
    "openDates" TEXT,
    "offersLodging" BOOLEAN NOT NULL DEFAULT false,
    "offersMeals" BOOLEAN NOT NULL DEFAULT false,
    "offersTransport" BOOLEAN NOT NULL DEFAULT false,
    "facilities" TEXT,
    "freedomLevel" TEXT,
    "expectations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "possibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "otherDetails" TEXT,
    "artistTypesNeeded" TEXT,
    "flowDescription" TEXT,
    "perWeek" INTEGER,
    "perMonth" INTEGER,
    "responseDelay" TEXT,
    "validationProcess" TEXT,
    "decisionMaker" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_programmes_hotelId_key" ON "hotel_programmes"("hotelId");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "artists_stageNameKey_key" ON "artists"("stageNameKey");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_nameKey_key" ON "hotels"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneE164_key" ON "users"("phoneE164");

-- AddForeignKey
ALTER TABLE "hotel_programmes" ADD CONSTRAINT "hotel_programmes_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Backfill the duplicate-detection keys for existing rows.
--
-- The application computes these with foldKey() in src/shared/validation.ts
-- (lower-case, accents removed, letters and digits only). The SQL below is the
-- same transformation for the Latin alphabet, which is what existing names use.
-- Where two existing rows fold to the same key, only the oldest gets it: the
-- others keep NULL and stay visible to an administrator as likely duplicates,
-- rather than this migration choosing which account to break.
-- phoneE164 is not backfilled here - normalising a phone needs the country's
-- numbering plan - and is set whenever an account saves its phone.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ta_fold_key(value text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(regexp_replace(lower(translate(COALESCE(value, ''),
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÇçÑñÝýÿŸ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnYyyY')), '[^a-z0-9؀-ۿ]', '', 'g'), '')
$$;

WITH ranked AS (
  SELECT a."id", ta_fold_key(COALESCE(a."stageName", u."name")) AS k,
         row_number() OVER (PARTITION BY ta_fold_key(COALESCE(a."stageName", u."name")) ORDER BY a."createdAt", a."id") AS rn
  FROM "artists" a JOIN "users" u ON u."id" = a."userId"
)
UPDATE "artists" a SET "stageNameKey" = ranked.k
FROM ranked
WHERE ranked."id" = a."id" AND ranked.rn = 1 AND ranked.k IS NOT NULL;

WITH ranked AS (
  SELECT "id", ta_fold_key("name") || '|' || COALESCE(ta_fold_key("city"), '') AS k,
         row_number() OVER (PARTITION BY ta_fold_key("name") || '|' || COALESCE(ta_fold_key("city"), '') ORDER BY "createdAt", "id") AS rn
  FROM "hotels"
  WHERE ta_fold_key("name") IS NOT NULL
)
UPDATE "hotels" h SET "nameKey" = ranked.k
FROM ranked
WHERE ranked."id" = h."id" AND ranked.rn = 1;

DROP FUNCTION ta_fold_key(text);
