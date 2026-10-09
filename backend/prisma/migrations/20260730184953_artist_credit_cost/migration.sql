-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "bookingCreditCost" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "creditCost" INTEGER NOT NULL DEFAULT 0;
