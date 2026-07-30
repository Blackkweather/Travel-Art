-- Add weekly payment fields to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "weeklyPaymentAmount" DOUBLE PRECISION NOT NULL DEFAULT 200.0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "numberOfWeeks" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalPaymentAmount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Update existing bookings to have default values
UPDATE "bookings" SET 
  "numberOfWeeks" = GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("endDate" - "startDate")) / 604800.0)),
  "totalPaymentAmount" = GREATEST(200.0, CEIL(EXTRACT(EPOCH FROM ("endDate" - "startDate")) / 604800.0) * 200.0),
  "paymentStatus" = CASE 
    WHEN "status" = 'CONFIRMED' THEN 'PAID'
    WHEN "status" = 'CANCELLED' THEN 'REFUNDED'
    ELSE 'PENDING'
  END
WHERE "numberOfWeeks" IS NULL;


