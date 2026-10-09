import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root first, then backend (backend overrides root)
// SKIP_DOTENV=1 runs on the process environment alone: a throwaway test
// server must not pick up the developer's real mail, payment or database keys.
if (process.env.SKIP_DOTENV !== '1') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const nodeEnv = process.env.NODE_ENV || 'development';

// Vercel injects VERCEL_URL as a bare hostname (no scheme) on every deployment.
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

// A missing JWT_SECRET in production would silently fall back to a known
// constant, making every issued token forgeable. Fail loudly instead.
const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET must be set to a value of at least 32 characters in production.'
    );
  }

  if (secret) return secret;
  console.warn('⚠️  JWT_SECRET is not set - using an insecure development-only secret.');
  return 'development-only-insecure-secret-do-not-use-in-production';
};

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || vercelUrl || 'http://localhost:3000',
  // Preview deployments get a generated hostname per commit, so FRONTEND_URL
  // cannot be set to a fixed value for them the way it is for production. With
  // no fallback this resolved to http://localhost:5173 on every preview, which
  // is where Stripe's checkout success_url and the password-reset link pointed.
  // Production sets FRONTEND_URL explicitly and still wins here.
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || vercelUrl || 'http://localhost:5173',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  /* 100 per fifteen minutes was small enough for one person working normally
     to exhaust it. The notification bell alone polls every 60s - 15 requests
     an idle quarter of an hour, doubled the moment a second tab is open - and
     a short walk through the dashboard measured 14 more. Running out is
     invisible and total: every later call, including the purchase of credits,
     comes back 429 with a bare string, so the app simply stops working until
     the window rolls over. This is a capacity control against abuse, not the
     credential control - that is the 10-failed-attempts limiter on login,
     registration and password reset, which is untouched. */
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  // Email is sent over Resend (see services/email.ts), which reads
  // RESEND_API_KEY, RESEND_FROM and ADMIN_NOTIFY_EMAIL directly from
  // process.env - there used to be an SMTP config here from before that
  // migration, unread by anything, which left render.yaml and the docs
  // describing SMTP_HOST/SMTP_USER/SMTP_PASS as how to configure email
  // when setting them would have done nothing at all.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  // Regex matching additional allowed CORS origins, e.g. Vercel preview URLs:
  // ^https://travel-art-[a-z0-9-]+\.vercel\.app$
  previewOriginPattern: process.env.PREVIEW_ORIGIN_PATTERN,
  // Cloudflare Turnstile. With the secret unset the captcha is not required,
  // so development and tests run without it; set both keys in production.
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  // The site hostnames a captcha token may come from, comma-separated
  // (e.g. "travel-art.vercel.app,www.travelart.com"). Required whenever the
  // secret is set; production must not list localhost.
  turnstileHostnames: (process.env.TURNSTILE_HOSTNAMES || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
    // A local hostname in production would accept tokens solved on any
    // developer's machine; it is dropped there whatever the variable says.
    .filter((h) => nodeEnv !== 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(h)),
  // Off only for the test suite, which has no network to resolve MX records.
  verifyEmailDomains: process.env.VERIFY_EMAIL_DOMAINS !== '0',
  // The third party of every convention ("le Coordinateur"). Written into the
  // document as configured; blank lines print as lines to fill by hand.
  coordinator: {
    name: process.env.COORDINATOR_NAME || 'Travel Art',
    address: process.env.COORDINATOR_ADDRESS || '',
    registration: process.env.COORDINATOR_REGISTRATION || '',
    representative: process.env.COORDINATOR_REPRESENTATIVE || '',
  },
  /** Where conventions are signed, for "Fait à". */
  conventionPlace: process.env.CONVENTION_PLACE || '',
  /** The coordinator's fee when a hotel cancels a signed convention (article 14). */
  hotelCancellationFeeCents: 8900,
};

/**
 * Confirmation and password-reset links are built from `frontendUrl`.
 * If nothing configures it in production they point at localhost, and
 * the only way to find out is a real person clicking a real link and
 * landing nowhere. Not fatal - the rest of the API is fine - but it has
 * to be visible at boot rather than discovered by a locked-out user.
 */
if (
  process.env.NODE_ENV === 'production' &&
  config.frontendUrl.includes('localhost')
) {
  console.error(
    'WARNING: FRONTEND_URL is not set, so confirmation and password-reset '
      + 'links will point at localhost and no recipient will be able to use them.'
  );
}
