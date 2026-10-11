-- AlterTable
ALTER TABLE "artist_availability" ADD COLUMN     "preferredHotelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredZones" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "hotel_programmes" ADD COLUMN     "remunerationAmount" INTEGER,
ADD COLUMN     "transportCoverage" TEXT;


-- Existing answers: a hotel that paid the journey paid all of it.
UPDATE "hotel_programmes" SET "transportCoverage" = CASE WHEN "offersTransport" THEN 'FULL' ELSE 'NONE' END WHERE "transportCoverage" IS NULL;
