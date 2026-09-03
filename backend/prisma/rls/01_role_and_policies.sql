-- =============================================================================
-- Row-level security for the four tables where a leak is financial.
--
-- WHY A SECOND ROLE EXISTS
-- The application currently connects as neondb_owner, which carries
-- rolbypassrls = true. Postgres skips every policy for such a role, so enabling
-- RLS while still connecting as the owner produces a database that reports
-- "RLS enabled" in an audit and enforces nothing. The policies below are only
-- real because travelart_app cannot bypass them.
--
-- WHO IS ASKING
-- Policies read current_setting('app.user_id'), which the application sets per
-- request with set_config(..., true) — the `true` makes it transaction-local, so
-- it cannot leak between requests sharing a pooled connection. Reading it with
-- the missing_ok flag means an unset context yields NULL rather than raising,
-- and NULL matches no rows: the failure mode is an empty result, never a wide
-- open one.
--
-- WHAT IS DELIBERATELY NOT COVERED
-- Migrations, the seed and Stripe webhooks keep using the owner connection.
-- Webhooks have no user to attribute a row to — they are server-to-server calls
-- already authenticated by signature — so forcing them through a user policy
-- would only mean inventing a fake user id.
-- =============================================================================

-- ---------------------------------------------------------------- 1. the role
-- Created by a DO block so re-running this file is safe.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelart_app') THEN
    -- Password is set separately, from the environment, so it never lives here.
    CREATE ROLE travelart_app LOGIN NOBYPASSRLS;
  END IF;
END
$$;

-- The app role reads and writes rows. It owns nothing and cannot alter schema,
-- so a compromised application connection cannot drop a table or disable a
-- policy.
GRANT USAGE ON SCHEMA public TO travelart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO travelart_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO travelart_app;

-- Tables created by future migrations are covered automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO travelart_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO travelart_app;

-- --------------------------------------------------------------- 2. helpers
-- Wrapped in functions so a policy reads as a sentence and the definition of
-- "who am I" lives in exactly one place.
CREATE OR REPLACE FUNCTION app_user_id() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(current_setting('app.user_role', true), '') = 'ADMIN'
$$;

-- The hotel and artist rows belonging to the caller. Marked STABLE so Postgres
-- evaluates them once per statement rather than once per row.
CREATE OR REPLACE FUNCTION app_hotel_ids() RETURNS SETOF text
  LANGUAGE sql STABLE AS $$
    SELECT id FROM hotels WHERE "userId" = app_user_id()
$$;

CREATE OR REPLACE FUNCTION app_artist_ids() RETURNS SETOF text
  LANGUAGE sql STABLE AS $$
    SELECT id FROM artists WHERE "userId" = app_user_id()
$$;

GRANT EXECUTE ON FUNCTION app_user_id(), app_is_admin(),
                          app_hotel_ids(), app_artist_ids() TO travelart_app;

-- -------------------------------------------------------------- 3. bookings
-- A booking is visible to the hotel that made it, the artist it is for, and an
-- administrator. Nobody else, including other hotels and other artists.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_access ON bookings;
CREATE POLICY bookings_access ON bookings
  USING (
    app_is_admin()
    OR "hotelId" IN (SELECT app_hotel_ids())
    OR "artistId" IN (SELECT app_artist_ids())
  )
  WITH CHECK (
    app_is_admin()
    OR "hotelId" IN (SELECT app_hotel_ids())
  );

-- --------------------------------------------------------------- 4. credits
-- A credit balance belongs to one hotel and is nobody else's business.
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credits_access ON credits;
CREATE POLICY credits_access ON credits
  USING (app_is_admin() OR "hotelId" IN (SELECT app_hotel_ids()))
  WITH CHECK (app_is_admin() OR "hotelId" IN (SELECT app_hotel_ids()));

ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_ledger_access ON credit_ledger;
CREATE POLICY credit_ledger_access ON credit_ledger
  USING (app_is_admin() OR "hotelId" IN (SELECT app_hotel_ids()))
  WITH CHECK (app_is_admin() OR "hotelId" IN (SELECT app_hotel_ids()));

-- ---------------------------------------------------------- 5. transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transactions_access ON transactions;
CREATE POLICY transactions_access ON transactions
  USING (
    app_is_admin()
    OR "hotelId" IN (SELECT app_hotel_ids())
    OR "artistId" IN (SELECT app_artist_ids())
  )
  WITH CHECK (app_is_admin() OR "hotelId" IN (SELECT app_hotel_ids()));

-- -------------------------------------------------------------- 6. payments
-- Payments are keyed to the acting user directly rather than through a profile.
-- The column is actorUserId, not userId: Stripe payments are attributed to the
-- person who initiated them, who is not always the profile that benefits.
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_access ON payments;
CREATE POLICY payments_access ON payments
  USING (app_is_admin() OR "actorUserId" = app_user_id())
  WITH CHECK (app_is_admin() OR "actorUserId" = app_user_id());

-- ---------------------------------------------------------------- 7. lookups
-- The policies above read hotels and artists to resolve ownership. Those two
-- tables therefore have to remain readable by the app role, which they are —
-- they carry no RLS of their own by design: an artist roster and a resort list
-- are public catalogue data on this product.
