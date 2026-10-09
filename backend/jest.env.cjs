/**
 * Environment for the test run, set before any module loads.
 *
 * The suites run against a disposable local Postgres (see src/test-setup.ts
 * for the guard) with row-level security on, exactly as production: the app
 * connects as travelart_app, the helpers as the owner.
 */
const base = process.env.TEST_DATABASE_URL || 'postgresql://postgres:test@localhost:5433/travelart_test';
const appUrl = process.env.TEST_APP_DATABASE_URL || base.replace('postgres:test@', 'travelart_app:apppw-local-test-only-2026@');

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: base,
  DIRECT_URL: base,
  APP_DATABASE_URL: appUrl,
  JWT_SECRET: 'test-secret-that-is-at-least-thirty-two-characters-long',
  // No mail provider, no captcha, no DNS: the suites never leave this machine.
  RESEND_API_KEY: '',
  TURNSTILE_SECRET_KEY: '',
  VERIFY_EMAIL_DOMAINS: '0',
  CHECK_VIDEO_LINKS: '0',
  STRIPE_SECRET_KEY: '',
  BLOB_READ_WRITE_TOKEN: '',
  FRONTEND_URL: 'http://localhost:3000',
  // Generous by default; the rate-limit suite lowers its own.
  AUTH_FAILURE_LIMIT: process.env.AUTH_FAILURE_LIMIT || '1000',
  REGISTER_LIMIT: process.env.REGISTER_LIMIT || '1000',
  MAIL_LIMIT: '1000',
  AVAILABILITY_LIMIT: '1000',
});
