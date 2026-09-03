-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "hotels_latitude_longitude_idx" ON "hotels"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "trips_latitude_longitude_idx" ON "trips"("latitude", "longitude");

-- Backfill from the JSON already stored in `location`.
--
-- The column holds either {"lat":..,"lng":..} or {"coords":{"lat":..,"lng":..}}
-- depending on which writer created the row, so both are read. Rows whose JSON
-- is malformed or missing coordinates keep NULL rather than defaulting to 0,0 —
-- that default is precisely the bug that put all 35 resorts in the Gulf of
-- Guinea, and a NULL is honest about not knowing.
UPDATE "hotels"
SET "latitude"  = COALESCE(
      ("location"::jsonb -> 'coords' ->> 'lat')::double precision,
      ("location"::jsonb ->> 'lat')::double precision
    ),
    "longitude" = COALESCE(
      ("location"::jsonb -> 'coords' ->> 'lng')::double precision,
      ("location"::jsonb ->> 'lng')::double precision
    )
WHERE "location" IS NOT NULL
  AND "location" <> ''
  AND jsonb_typeof("location"::jsonb) = 'object';

UPDATE "trips"
SET "latitude"  = COALESCE(
      ("location"::jsonb -> 'coords' ->> 'lat')::double precision,
      ("location"::jsonb ->> 'lat')::double precision
    ),
    "longitude" = COALESCE(
      ("location"::jsonb -> 'coords' ->> 'lng')::double precision,
      ("location"::jsonb ->> 'lng')::double precision
    )
WHERE "location" IS NOT NULL
  AND "location" <> ''
  AND jsonb_typeof("location"::jsonb) = 'object';

-- A coordinate pair is only meaningful together, and only inside these ranges.
ALTER TABLE "hotels" ADD CONSTRAINT hotels_coords_valid CHECK (
  ("latitude" IS NULL) = ("longitude" IS NULL)
  AND ("latitude"  IS NULL OR "latitude"  BETWEEN -90  AND 90)
  AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180)
);

ALTER TABLE "trips" ADD CONSTRAINT trips_coords_valid CHECK (
  ("latitude" IS NULL) = ("longitude" IS NULL)
  AND ("latitude"  IS NULL OR "latitude"  BETWEEN -90  AND 90)
  AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180)
);
