-- =============================================================================
-- Structured data.
--
-- Moves every value that was stored as JSON-in-a-text-column into real
-- columns and tables, turns every status into an enum, and removes the
-- columns and tables nothing should be writing to any more.
--
-- Hand-written rather than generated, because the generated diff would have
-- dropped the old columns before anything was copied out of them. Each block
-- below copies first and drops last. Malformed JSON never aborts the
-- migration: it is read as "no value" and the row is otherwise kept.
-- =============================================================================

-- ------------------------------------------------------------------ helpers
-- Temporary, dropped at the end of this file.

CREATE OR REPLACE FUNCTION ta_try_jsonb(value text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN NULL;
  END IF;
  RETURN value::jsonb;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Accepts the DD/MM/YYYY the registration form produced and ISO dates.
-- Anything else, including impossible dates like 31/02, becomes NULL.
CREATE OR REPLACE FUNCTION ta_try_date(value text) RETURNS date
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF value ~ '^\d{2}/\d{2}/\d{4}$' THEN
    RETURN make_date(substr(value, 7, 4)::int, substr(value, 4, 2)::int, substr(value, 1, 2)::int);
  ELSIF value ~ '^\d{4}-\d{2}-\d{2}' THEN
    RETURN make_date(substr(value, 1, 4)::int, substr(value, 6, 2)::int, substr(value, 9, 2)::int);
  END IF;
  RETURN NULL;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION ta_media_provider(url text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN url ~* '(youtube\.com|youtube-nocookie\.com|youtu\.be)/' THEN 'YOUTUBE'
    WHEN url ~* 'vimeo\.com/' THEN 'VIMEO'
    WHEN url ~* 'instagram\.com/' THEN 'INSTAGRAM'
    WHEN url ~* '^https://[^/]+\.public\.blob\.vercel-storage\.com/' OR url LIKE '/uploads/%' THEN 'UPLOAD'
    ELSE 'LINK'
  END
$$;

CREATE OR REPLACE FUNCTION ta_media_storage_key(url text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN url ~* '^https://[^/]+\.public\.blob\.vercel-storage\.com/' THEN regexp_replace(url, '^https://[^/]+/', '')
    WHEN url LIKE '/uploads/%' THEN regexp_replace(url, '^/uploads/', '')
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION ta_youtube_id(url text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT substring(url FROM '(?:youtu\.be/|[?&]v=|/embed/|/shorts/|/live/)([A-Za-z0-9_-]{11})')
$$;

-- A video if the provider is a video host or the file is a video; otherwise
-- whatever the column it came from says it is.
CREATE OR REPLACE FUNCTION ta_media_kind(url text, fallback text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN ta_media_provider(url) IN ('YOUTUBE', 'VIMEO', 'INSTAGRAM') THEN 'VIDEO'
    WHEN url ~* '\.(mp4|mov|webm|m4v)(\?.*)?$' THEN 'VIDEO'
    ELSE fallback
  END
$$;

-- -------------------------------------------------------------------- enums

CREATE TYPE "Role" AS ENUM ('ARTIST', 'HOTEL', 'ADMIN');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ArtistMembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "MediaProvider" AS ENUM ('UPLOAD', 'LINK', 'YOUTUBE', 'VIMEO', 'INSTAGRAM');
CREATE TYPE "SpaceSetting" AS ENUM ('INDOOR', 'OUTDOOR');
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- -------------------------------------------------------------------- users

UPDATE "users" SET "role" = upper(btrim("role"));
UPDATE "users" SET "role" = 'ARTIST' WHERE "role" NOT IN ('ARTIST', 'HOTEL', 'ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ARTIST';

UPDATE "users" SET "approvalStatus" = upper(btrim("approvalStatus"));
UPDATE "users" SET "approvalStatus" = 'PENDING' WHERE "approvalStatus" NOT IN ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "users" ALTER COLUMN "approvalStatus" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "approvalStatus" TYPE "ApprovalStatus" USING "approvalStatus"::"ApprovalStatus";
ALTER TABLE "users" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

ALTER TABLE "users" ALTER COLUMN "language" SET DEFAULT 'fr';

-- Clerk was never wired up; the column and its index are unused.
DROP INDEX IF EXISTS "users_clerkId_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerkId";

-- An artist's phone lived on both User and Artist. User keeps it.
UPDATE "users" u
SET "phone" = a."phone"
FROM "artists" a
WHERE a."userId" = u."id"
  AND (u."phone" IS NULL OR btrim(u."phone") = '')
  AND a."phone" IS NOT NULL AND btrim(a."phone") <> '';

CREATE INDEX "users_role_approvalStatus_idx" ON "users"("role", "approvalStatus");

-- -------------------------------------------------------------------- media

CREATE TABLE "media" (
  "id"         TEXT NOT NULL,
  "artistId"   TEXT,
  "hotelId"    TEXT,
  "spaceId"    TEXT,
  "tripId"     TEXT,
  "kind"       "MediaKind" NOT NULL,
  "provider"   "MediaProvider" NOT NULL,
  "url"        TEXT NOT NULL,
  "externalId" TEXT,
  "storageKey" TEXT,
  "title"      TEXT,
  "position"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_pkey" PRIMARY KEY ("id"),
  -- Exactly one owner. A media row with no owner is unreachable, and one with
  -- two would be deleted by whichever owner went first.
  CONSTRAINT "media_single_owner" CHECK (num_nonnulls("artistId", "hotelId", "spaceId", "tripId") = 1)
);

-- --------------------------------------------------------------- artists

ALTER TABLE "artists"
  ADD COLUMN "mainCategory"      TEXT,
  ADD COLUMN "secondaryCategory" TEXT,
  ADD COLUMN "categoryType"      TEXT,
  ADD COLUMN "specificCategory"  TEXT,
  ADD COLUMN "domain"            TEXT,
  ADD COLUMN "tributeTo"         TEXT,
  ADD COLUMN "audienceTypes"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "languages"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "otherLanguages"    TEXT,
  ADD COLUMN "birthDate_new"     DATE;

WITH parsed AS (
  SELECT "id", ta_try_jsonb("artisticProfile") AS p
  FROM "artists"
)
UPDATE "artists" a
SET
  "mainCategory"      = NULLIF(btrim(parsed.p->>'mainCategory'), ''),
  "secondaryCategory" = NULLIF(btrim(parsed.p->>'secondaryCategory'), ''),
  "categoryType"      = NULLIF(btrim(parsed.p->>'categoryType'), ''),
  "specificCategory"  = NULLIF(btrim(parsed.p->>'specificCategory'), ''),
  "domain"            = NULLIF(btrim(parsed.p->>'domain'), ''),
  "otherLanguages"    = NULLIF(btrim(parsed.p->>'otherLanguages'), ''),
  "audienceTypes"     = CASE WHEN jsonb_typeof(parsed.p->'audienceType') = 'array'
                          THEN ARRAY(SELECT jsonb_array_elements_text(parsed.p->'audienceType'))
                          ELSE ARRAY[]::TEXT[] END,
  "languages"         = CASE WHEN jsonb_typeof(parsed.p->'languages') = 'array'
                          THEN ARRAY(SELECT jsonb_array_elements_text(parsed.p->'languages'))
                          ELSE ARRAY[]::TEXT[] END
FROM parsed
WHERE parsed."id" = a."id" AND jsonb_typeof(parsed.p) = 'object';

UPDATE "artists" SET "birthDate_new" = ta_try_date("birthDate");
ALTER TABLE "artists" DROP COLUMN "birthDate";
ALTER TABLE "artists" RENAME COLUMN "birthDate_new" TO "birthDate";

UPDATE "artists" SET "discipline" = '' WHERE "discipline" IS NULL;
ALTER TABLE "artists" ALTER COLUMN "discipline" SET DEFAULT '';
ALTER TABLE "artists" ALTER COLUMN "priceRange" SET DEFAULT '';

UPDATE "artists" SET "membershipStatus" = upper(btrim("membershipStatus"));
UPDATE "artists" SET "membershipStatus" = 'INACTIVE'
  WHERE "membershipStatus" NOT IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING');
ALTER TABLE "artists" ALTER COLUMN "membershipStatus" DROP DEFAULT;
ALTER TABLE "artists" ALTER COLUMN "membershipStatus" TYPE "ArtistMembershipStatus"
  USING "membershipStatus"::"ArtistMembershipStatus";
ALTER TABLE "artists" ALTER COLUMN "membershipStatus" SET DEFAULT 'INACTIVE';

-- images and mediaUrls were two lists of photos (the second filled by the
-- upload route); videos were links. One row per distinct URL per artist, in
-- the order the artist arranged them.
WITH items AS (
  SELECT a."id" AS artist_id, e.value #>> '{}' AS url, 'IMAGE' AS fallback, e.ord AS ord, 0 AS src
  FROM "artists" a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(a."images")) = 'array' THEN ta_try_jsonb(a."images") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'string'
  UNION ALL
  SELECT a."id", e.value #>> '{}', 'IMAGE', e.ord, 1
  FROM "artists" a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(a."mediaUrls")) = 'array' THEN ta_try_jsonb(a."mediaUrls") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'string'
  UNION ALL
  SELECT a."id", e.value #>> '{}', 'VIDEO', e.ord, 2
  FROM "artists" a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(a."videos")) = 'array' THEN ta_try_jsonb(a."videos") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'string'
),
cleaned AS (
  SELECT artist_id, btrim(url) AS url, fallback, src, ord
  FROM items
  WHERE btrim(url) ~* '^(https?://|/)'
),
first_seen AS (
  SELECT DISTINCT ON (artist_id, url) artist_id, url, fallback, src, ord
  FROM cleaned
  ORDER BY artist_id, url, src, ord
)
INSERT INTO "media" ("id", "artistId", "kind", "provider", "url", "externalId", "storageKey", "position")
SELECT
  'med_' || md5(artist_id || url),
  artist_id,
  ta_media_kind(url, fallback)::"MediaKind",
  ta_media_provider(url)::"MediaProvider",
  url,
  CASE WHEN ta_media_provider(url) = 'YOUTUBE' THEN ta_youtube_id(url) END,
  ta_media_storage_key(url),
  (row_number() OVER (PARTITION BY artist_id, ta_media_kind(url, fallback) ORDER BY src, ord))::int - 1
FROM first_seen;

ALTER TABLE "artists"
  DROP COLUMN "phone",
  DROP COLUMN "images",
  DROP COLUMN "videos",
  DROP COLUMN "mediaUrls",
  DROP COLUMN "artisticProfile";

CREATE INDEX "artists_mainCategory_idx" ON "artists"("mainCategory");
CREATE INDEX "artists_discipline_idx" ON "artists"("discipline");

-- ----------------------------------------------------------------- hotels

ALTER TABLE "hotels"
  ADD COLUMN "city"         TEXT NOT NULL DEFAULT '',
  ADD COLUMN "country"      TEXT NOT NULL DEFAULT '',
  ADD COLUMN "address"      TEXT,
  ADD COLUMN "hotelType"    TEXT,
  ADD COLUMN "roomCount"    INTEGER,
  ADD COLUMN "website"      TEXT,
  ADD COLUMN "instagramUrl" TEXT,
  ADD COLUMN "facebookUrl"  TEXT,
  ADD COLUMN "youtubeUrl"   TEXT;

WITH parsed AS (
  SELECT "id", ta_try_jsonb("location") AS l FROM "hotels"
)
UPDATE "hotels" h
SET
  "city"    = COALESCE(btrim(parsed.l->>'city'), ''),
  "country" = COALESCE(btrim(parsed.l->>'country'), ''),
  "address" = NULLIF(btrim(COALESCE(parsed.l->>'address', '')), '')
FROM parsed
WHERE parsed."id" = h."id" AND jsonb_typeof(parsed.l) = 'object';

-- Coordinates were mirrored into latitude/longitude by an earlier migration;
-- fill any row that still only had them inside the JSON.
WITH parsed AS (
  SELECT "id", ta_try_jsonb("location") AS l FROM "hotels"
)
UPDATE "hotels" h
SET
  "latitude"  = (parsed.l #>> '{coords,lat}')::double precision,
  "longitude" = (parsed.l #>> '{coords,lng}')::double precision
FROM parsed
WHERE parsed."id" = h."id"
  AND h."latitude" IS NULL
  AND (parsed.l #>> '{coords,lat}') ~ '^-?\d+(\.\d+)?$'
  AND (parsed.l #>> '{coords,lng}') ~ '^-?\d+(\.\d+)?$'
  AND abs((parsed.l #>> '{coords,lat}')::double precision) <= 90
  AND abs((parsed.l #>> '{coords,lng}')::double precision) <= 180;

-- Users who never got a country of their own inherit the hotel's.
UPDATE "hotels" h SET "country" = u."country"
FROM "users" u
WHERE u."id" = h."userId" AND h."country" = '' AND u."country" IS NOT NULL;

CREATE TABLE "hotel_spaces" (
  "id"          TEXT NOT NULL,
  "hotelId"     TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "type"        TEXT,
  "setting"     "SpaceSetting",
  "capacity"    INTEGER,
  "description" TEXT,
  "hours"       TEXT,
  "noiseLevel"  TEXT,
  "position"    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "hotel_spaces_pkey" PRIMARY KEY ("id")
);

WITH spots AS (
  SELECT h."id" AS hotel_id, e.value AS s, e.ord AS ord
  FROM "hotels" h
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(h."performanceSpots")) = 'array' THEN ta_try_jsonb(h."performanceSpots") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'object' AND btrim(COALESCE(e.value->>'name', '')) <> ''
)
INSERT INTO "hotel_spaces" ("id", "hotelId", "name", "type", "setting", "capacity", "description", "hours", "noiseLevel", "position")
SELECT
  'spc_' || md5(hotel_id || ord::text),
  hotel_id,
  btrim(s->>'name'),
  NULLIF(btrim(COALESCE(s->>'type', '')), ''),
  CASE
    WHEN s->>'locationType' ILIKE 'int%' THEN 'INDOOR'::"SpaceSetting"
    WHEN s->>'locationType' ILIKE 'ext%' OR s->>'locationType' ILIKE 'out%' THEN 'OUTDOOR'::"SpaceSetting"
    WHEN s->>'type' IN ('pool', 'beach', 'garden') THEN 'OUTDOOR'::"SpaceSetting"
    WHEN s->>'type' IN ('ballroom', 'lounge', 'resto') THEN 'INDOOR'::"SpaceSetting"
  END,
  CASE WHEN substring(s->>'capacity' FROM '\d{1,6}') IS NOT NULL
       THEN substring(s->>'capacity' FROM '\d{1,6}')::int END,
  NULLIF(btrim(COALESCE(s->>'description', '')), ''),
  NULLIF(btrim(COALESCE(s->>'hours', '')), ''),
  NULLIF(btrim(COALESCE(s->>'noiseLevel', '')), ''),
  (ord - 1)::int
FROM spots;

-- Photos and videos attached to a space in the registration form.
WITH items AS (
  SELECT 'spc_' || md5(h."id" || e.ord::text) AS space_id, m.value #>> '{}' AS url, m.ord AS ord
  FROM "hotels" h
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(h."performanceSpots")) = 'array' THEN ta_try_jsonb(h."performanceSpots") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.value->'media') = 'array' THEN e.value->'media' ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS m(value, ord)
  WHERE jsonb_typeof(m.value) = 'string'
),
first_seen AS (
  SELECT DISTINCT ON (space_id, btrim(url)) space_id, btrim(url) AS url, ord
  FROM items
  WHERE btrim(url) ~* '^(https?://|/)'
    AND EXISTS (SELECT 1 FROM "hotel_spaces" s WHERE s."id" = items.space_id)
  ORDER BY space_id, btrim(url), ord
)
INSERT INTO "media" ("id", "spaceId", "kind", "provider", "url", "externalId", "storageKey", "position")
SELECT
  'med_' || md5(space_id || url),
  space_id,
  ta_media_kind(url, 'IMAGE')::"MediaKind",
  ta_media_provider(url)::"MediaProvider",
  url,
  CASE WHEN ta_media_provider(url) = 'YOUTUBE' THEN ta_youtube_id(url) END,
  ta_media_storage_key(url),
  (row_number() OVER (PARTITION BY space_id ORDER BY ord))::int - 1
FROM first_seen;

WITH items AS (
  SELECT h."id" AS hotel_id, e.value #>> '{}' AS url, e.ord AS ord
  FROM "hotels" h
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(h."images")) = 'array' THEN ta_try_jsonb(h."images") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'string'
),
first_seen AS (
  SELECT DISTINCT ON (hotel_id, btrim(url)) hotel_id, btrim(url) AS url, ord
  FROM items
  WHERE btrim(url) ~* '^(https?://|/)'
  ORDER BY hotel_id, btrim(url), ord
)
INSERT INTO "media" ("id", "hotelId", "kind", "provider", "url", "externalId", "storageKey", "position")
SELECT
  'med_' || md5(hotel_id || url),
  hotel_id,
  ta_media_kind(url, 'IMAGE')::"MediaKind",
  ta_media_provider(url)::"MediaProvider",
  url,
  CASE WHEN ta_media_provider(url) = 'YOUTUBE' THEN ta_youtube_id(url) END,
  ta_media_storage_key(url),
  (row_number() OVER (PARTITION BY hotel_id ORDER BY ord))::int - 1
FROM first_seen;

ALTER TABLE "hotels"
  DROP COLUMN "location",
  DROP COLUMN "images",
  DROP COLUMN "performanceSpots",
  DROP COLUMN "rooms";

CREATE INDEX "hotels_country_city_idx" ON "hotels"("country", "city");
CREATE INDEX "hotel_spaces_hotelId_idx" ON "hotel_spaces"("hotelId");
ALTER TABLE "hotel_spaces" ADD CONSTRAINT "hotel_spaces_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------ trips

ALTER TABLE "trips"
  ADD COLUMN "city"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "includes_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "schedule_new" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "reviews_new"  JSONB NOT NULL DEFAULT '[]';

WITH parsed AS (
  SELECT "id", ta_try_jsonb("location") AS l FROM "trips"
)
UPDATE "trips" t
SET "city" = COALESCE(btrim(parsed.l->>'city'), ''),
    "country" = COALESCE(btrim(parsed.l->>'country'), '')
FROM parsed
WHERE parsed."id" = t."id" AND jsonb_typeof(parsed.l) = 'object';

UPDATE "trips" SET
  "includes_new" = CASE WHEN jsonb_typeof(ta_try_jsonb("includes")) = 'array'
                     THEN ARRAY(SELECT x FROM jsonb_array_elements_text(ta_try_jsonb("includes")) AS x)
                     ELSE ARRAY[]::TEXT[] END,
  "schedule_new" = CASE WHEN jsonb_typeof(ta_try_jsonb("schedule")) = 'array'
                     THEN ta_try_jsonb("schedule") ELSE '[]'::jsonb END,
  "reviews_new"  = CASE WHEN jsonb_typeof(ta_try_jsonb("reviews")) = 'array'
                     THEN ta_try_jsonb("reviews") ELSE '[]'::jsonb END;

WITH items AS (
  SELECT t."id" AS trip_id, e.value #>> '{}' AS url, e.ord AS ord
  FROM "trips" t
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ta_try_jsonb(t."images")) = 'array' THEN ta_try_jsonb(t."images") ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(value, ord)
  WHERE jsonb_typeof(e.value) = 'string'
),
first_seen AS (
  SELECT DISTINCT ON (trip_id, btrim(url)) trip_id, btrim(url) AS url, ord
  FROM items
  WHERE btrim(url) ~* '^(https?://|/)'
  ORDER BY trip_id, btrim(url), ord
)
INSERT INTO "media" ("id", "tripId", "kind", "provider", "url", "externalId", "storageKey", "position")
SELECT
  'med_' || md5(trip_id || url),
  trip_id,
  ta_media_kind(url, 'IMAGE')::"MediaKind",
  ta_media_provider(url)::"MediaProvider",
  url,
  CASE WHEN ta_media_provider(url) = 'YOUTUBE' THEN ta_youtube_id(url) END,
  ta_media_storage_key(url),
  (row_number() OVER (PARTITION BY trip_id ORDER BY ord))::int - 1
FROM first_seen;

ALTER TABLE "trips"
  DROP COLUMN "location",
  DROP COLUMN "images",
  DROP COLUMN "includes",
  DROP COLUMN "schedule",
  DROP COLUMN "reviews";
ALTER TABLE "trips" RENAME COLUMN "includes_new" TO "includes";
ALTER TABLE "trips" RENAME COLUMN "schedule_new" TO "schedule";
ALTER TABLE "trips" RENAME COLUMN "reviews_new" TO "reviews";

UPDATE "trips" SET "status" = upper(btrim("status"));
UPDATE "trips" SET "status" = 'DRAFT' WHERE "status" NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "trips" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "trips" ALTER COLUMN "status" TYPE "TripStatus" USING "status"::"TripStatus";
ALTER TABLE "trips" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- --------------------------------------------------------------- bookings

UPDATE "bookings" SET "status" = upper(btrim("status"));
UPDATE "bookings" SET "status" = 'CANCELLED'
  WHERE "status" NOT IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus" USING "status"::"BookingStatus";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- The fixed 200 EUR/week "payment" to the artist. The exchange model pays the
-- artist nothing: the stay is the counterpart, and the convention says so.
ALTER TABLE "bookings"
  DROP COLUMN "creditsUsed",
  DROP COLUMN "weeklyPaymentAmount",
  DROP COLUMN "numberOfWeeks",
  DROP COLUMN "totalPaymentAmount",
  DROP COLUMN "paymentStatus";

-- ---------------------------------------------------------------- ratings
-- One rating per booking. Where a booking already has more than one, the
-- first written is the one kept.

DELETE FROM "ratings" r
USING "ratings" r2
WHERE r."bookingId" = r2."bookingId"
  AND (r."createdAt", r."id") > (r2."createdAt", r2."id");

DROP INDEX IF EXISTS "ratings_bookingId_idx";
CREATE UNIQUE INDEX "ratings_bookingId_key" ON "ratings"("bookingId");

-- ---------------------------------------------------------- notifications

ALTER TABLE "notifications" ALTER COLUMN "payload" TYPE JSONB
  USING COALESCE(ta_try_jsonb("payload"), '{}'::jsonb);
ALTER TABLE "notifications" ALTER COLUMN "payload" SET DEFAULT '{}';

-- ----------------------------------------------------------- dead tables
-- transactions only ever held the 200 EUR/week booking "fees" and their
-- refunds. Real money is in payments and credit_ledger.
-- payouts paid artists, which the exchange model never does; nothing wrote it.

DROP TABLE IF EXISTS "transactions";
DROP TABLE IF EXISTS "payouts";
DROP TYPE IF EXISTS "PayoutStatus";

-- ----------------------------------------------------------- media keys

CREATE INDEX "media_artistId_kind_idx" ON "media"("artistId", "kind");
CREATE INDEX "media_hotelId_kind_idx" ON "media"("hotelId", "kind");
CREATE INDEX "media_spaceId_idx" ON "media"("spaceId");
CREATE INDEX "media_tripId_idx" ON "media"("tripId");

ALTER TABLE "media" ADD CONSTRAINT "media_artistId_fkey"
  FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_spaceId_fkey"
  FOREIGN KEY ("spaceId") REFERENCES "hotel_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------- cleanup

DROP FUNCTION ta_media_kind(text, text);
DROP FUNCTION ta_youtube_id(text);
DROP FUNCTION ta_media_storage_key(text);
DROP FUNCTION ta_media_provider(text);
DROP FUNCTION ta_try_date(text);
DROP FUNCTION ta_try_jsonb(text);
