-- The API connects as travelart_app (row-level security, see
-- prisma/rls/01_role_and_policies.sql). Tables created by the two previous
-- migrations are covered by that file's ALTER DEFAULT PRIVILEGES - but only in
-- a database where it was run by the same owner. Granting here as well means
-- the new tables are reachable on every environment without depending on that,
-- and does nothing where the role does not exist (local development, tests).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelart_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      "media", "hotel_spaces", "hotel_programmes", "rate_limit_buckets"
      TO travelart_app;
  END IF;
END
$$;
