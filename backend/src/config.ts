import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root first, then backend (backend overrides root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  // For SQLite (dev), use file: protocol. For PostgreSQL (prod), use postgresql://
  databaseUrl: process.env.DATABASE_URL || (process.env.NODE_ENV === 'production' 
    ? 'postgresql://user:password@localhost:5432/travelart'
    : 'file:./prisma/dev.db'),
  corsOrigin: process.env.CORS_ORIGIN || vercelUrl || 'http://localhost:3000',
  // Preview deployments get a generated hostname per commit, so FRONTEND_URL
  // cannot be set to a fixed value for them the way it is for production. With
  // no fallback this resolved to http://localhost:5173 on every preview, which
  // is where Stripe's checkout success_url and the password-reset link pointed.
  // Production sets FRONTEND_URL explicitly and still wins here.
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || vercelUrl || 'http://localhost:5173',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  uploadPath: process.env.UPLOAD_PATH || './uploads',
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
