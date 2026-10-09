import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler, CustomError } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { artistRoutes } from './routes/artists';
import { hotelRoutes } from './routes/hotels';
import { adminRoutes } from './routes/admin';
import { commonRoutes } from './routes/common';
import { tripRoutes } from './routes/trips';
import { paymentRoutes } from './routes/payments';
import { bookingRoutes } from './routes/bookings';
import { conventionRoutes } from './routes/conventions';
import { claimRoutes } from './routes/claims';
import { notificationRoutes } from './routes/notifications';
import { maintenanceRoutes } from './routes/maintenance';
import { privacyRoutes } from './routes/privacy';
import { uploadRoutes } from './routes/upload';
import { webhookRoutes } from './routes/webhooks';
import { pingDatabase } from './db';
import { PostgresRateLimitStore } from './services/rateLimitStore';

const app = express();

// Trust proxy for rate limiting behind reverse proxy (Render, etc.)
// Only enable in production when behind a proxy to avoid security warnings
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1); // Trust first proxy only
} else {
  app.set('trust proxy', false);
}

// Security middleware
// Gzip every response above the default 1KB threshold. Without this the API
// and the whole frontend bundle were served uncompressed - the JS entry chunk
// is about 375KB raw and roughly 115KB gzipped. Must sit ahead of any
// middleware that writes a body.
app.use(compression());

app.use(helmet({
  /* Helmet defaults this to `no-referrer`, which strips the Referer header
     from every outbound request the browser makes. That is stricter than it
     sounds: an API key restricted by referrer - which is how ArcGIS, Google
     Maps and most keyed tile providers limit a key that necessarily ships in
     the bundle - can never satisfy its own allowlist, because the browser
     sends nothing to match against. ArcGIS answers 401 with a JSON error,
     Chrome sees JSON arriving at an <img> and blocks it as an opaque
     response, and the map is blank with no CSP violation and no failed
     request to explain it.

     `strict-origin-when-cross-origin` is the modern browser default. It sends
     the full URL only to our own origin, the bare origin to other sites, and
     nothing at all when downgrading HTTPS to HTTP. So a third party learns
     that travel-art.vercel.app made the request and never which page - no
     artist id, no booking id - which is the part worth protecting. */
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // Cloudflare Turnstile, the registration captcha (off unless configured).
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      // This policy now applies to the app's own HTML, which it did not when a
      // CDN served the SPA and Express only answered /api. Uploaded images come
      // back from routes/upload.ts as absolute Blob URLs, so that host has to be
      // named here or every avatar and artwork is blocked.
      imgSrc: [
        "'self'",
        "data:",
        "https://res.cloudinary.com",
        "https://*.public.blob.vercel-storage.com",
        /* Raster tiles for the experiences map. The {s} in the tile URL
           expands to a/b/c, so the wildcard covers all three.

           CARTO is the one actually in use: TravelerExperiencesPage moved to
           basemaps.cartocdn.com because OSM's volunteer tile server blocks
           applications, and this list was not moved with it - so every tile on
           /experiences was refused by our own policy and the map drew blank.
           Measured before the fix: 24 CSP violations on one page load.
           OSM stays listed because the layer is a one-line change back. */
        "https://*.basemaps.cartocdn.com",
        "https://*.tile.openstreetmap.org",
        /* ArcGIS static basemap tiles. Leaflet loads raster tiles as <img>,
           so imgSrc is the directive that matters here; the vector-style and
           geocoding APIs would need connectSrc as well, and neither is used. */
        "https://static-map-tiles-api.arcgis.com",
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      /* Performance videos on an artist profile. This was "'self'", which
         refused every video the platform can actually store: uploads come
         back as absolute Cloudinary or Blob URLs, exactly as images do, and
         imgSrc above already names both hosts. The <video> element on
         PublicArtistProfile was blocked for the same reason the CARTO tiles
         were - the host was never added to our own policy.

         The seeded demo clips live in the frontend's own public/ folder, so
         they are covered by 'self' and need no third-party host here. */
      mediaSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com",
        "https://*.public.blob.vercel-storage.com",
      ],
      /* The same profile embeds YouTube in an iframe when the stored URL is a
         YouTube link, and five seeded artists already had one. frameSrc was
         "'none'", so that branch has never rendered - the player was refused
         before it could load. youtube-nocookie is listed first because it is
         what the embed should use: it sets no advertising cookies, which keeps
         the embed outside the consent banner's remit. */
      frameSrc: [
        "'self'",
        "https://challenges.cloudflare.com",
        "https://www.youtube-nocookie.com",
        "https://www.youtube.com",
        "https://player.vimeo.com",
      ],
    },
  },
}));
// CORS configuration - explicit allowlist. Because credentials are enabled, an
// unrestricted origin would let any site issue authenticated cross-origin calls.
const isDevelopment = config.nodeEnv !== 'production';

// Any loopback origin is acceptable outside production. This used to be a
// hardcoded list of ports (3000, 3001, 3002, 4000, 5173); Vite picks the next
// free port whenever those are taken, so a second dev server — or a stale
// process still holding 5173 — landed on a port the API rejected, and every
// request failed with "Origin http://localhost:5199 is not allowed by CORS".
//
// This stays strictly development-only. In production the allowlist below is
// still the sole authority, because credentials are enabled and a permissive
// origin would let any site make authenticated cross-origin calls.
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const allowedOrigins = [
  config.corsOrigin,
  config.frontendUrl,
].filter((origin): origin is string => Boolean(origin));

// Vercel preview deployments get a generated subdomain per commit.
const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) return true;
  if (isDevelopment && LOOPBACK_ORIGIN.test(origin)) return true;
  return config.previewOriginPattern
    ? new RegExp(config.previewOriginPattern).test(origin)
    : false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no Origin header (curl, server-to-server, same-origin
    // navigations) are not subject to the browser's cross-origin rules.
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) return callback(null, true);

    // A rejected origin is a forbidden request, not a server fault. This threw
    // a bare Error, which the handler defaulted to 500 — so a CORS denial was
    // indistinguishable from the API genuinely breaking.
    callback(new CustomError(`Origin ${origin} is not allowed by CORS`, 403));
  },
  credentials: true
}));

// Rate limiting
/* Both limiters answer in the envelope every other endpoint uses.
   They replied with a bare string, so a client reading the documented shape -
   error.response.data.error.message - found nothing and showed the user
   either silence or "Request failed with status code 429". Being throttled is
   a thing a person can act on, but only if they are told. */
const tooMany = (message: string) => ({
  success: false,
  error: { message },
});

/* Every limiter counts in Postgres (services/rateLimitStore.ts), so the
   count is shared by every server instance instead of restarting on each. */
const limit = (name: string, options: Parameters<typeof rateLimit>[0]) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    store: new PostgresRateLimitStore(name),
    ...options,
  });

const envInt = (name: string, fallback: number) => {
  const value = parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// The auth limiters below key on the submitted e-mail, so these bodies must be
// parsed before them. (The general JSON parser sits further down, after the
// Stripe webhook that needs the raw bytes; express.json skips a body that is
// already parsed.)
app.use('/api/auth', express.json({ limit: '1mb' }));

// Capacity, not credentials: generous enough that normal use never meets it.
app.use('/api/', limit('global', {
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: tooMany('Trop de requêtes depuis cette adresse. Patientez quelques minutes avant de réessayer.'),
}));

// Wrong answers worth retrying. Only failures count, so a shared office IP
// signing in normally never consumes it.
const credentialLimiter = limit('credentials', {
  windowMs: 15 * 60 * 1000,
  max: envInt('AUTH_FAILURE_LIMIT', 10),
  skipSuccessfulRequests: true,
  message: tooMany('Trop de tentatives échouées depuis cette adresse. Réessayez dans 15 minutes.'),
});
app.use('/api/auth/login', credentialLimiter);
app.use('/api/auth/reset-password', credentialLimiter);

// The same, per account: guessing one person's password from many addresses
// meets this one even when no single address meets the one above.
app.use('/api/auth/login', limit('login-account', {
  windowMs: 15 * 60 * 1000,
  max: envInt('AUTH_FAILURE_LIMIT', 10),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `email:${String(req.body?.email ?? '').trim().toLowerCase().slice(0, 254)}`,
  skip: (req) => typeof req.body?.email !== 'string' || req.body.email.trim() === '',
  message: tooMany('Trop de tentatives sur ce compte. Réessayez dans 15 minutes ou réinitialisez votre mot de passe.'),
}));

// Account creation is counted whether it succeeds or not: a script creating
// accounts succeeds every time, which is exactly what this must stop.
app.use('/api/auth/register', limit('register', {
  windowMs: 60 * 60 * 1000,
  max: envInt('REGISTER_LIMIT', 5),
  message: tooMany('Trop d’inscriptions depuis cette adresse. Réessayez dans une heure.'),
}));

// Anything that sends an e-mail to an address the caller typed. Two counts:
// per address, so nobody's inbox can be flooded, and per connection, wide
// enough for an office or a family testing several accounts. A single count
// of 5 per connection was used up by two people resetting two passwords.
const mailPerAddress = limit('mail-address', {
  windowMs: 60 * 60 * 1000,
  max: envInt('MAIL_PER_ADDRESS_LIMIT', 3),
  keyGenerator: (req) => `email:${String(req.body?.email ?? req.body?.inviteeEmail ?? '').trim().toLowerCase().slice(0, 254)}`,
  skip: (req) => !String(req.body?.email ?? req.body?.inviteeEmail ?? '').trim(),
  message: tooMany('Trois e-mails ont déjà été envoyés à cette adresse dans l’heure. Vérifiez vos courriers indésirables, ou réessayez plus tard.'),
});
const mailPerConnection = limit('mail', {
  windowMs: 60 * 60 * 1000,
  max: envInt('MAIL_LIMIT', 20),
  message: tooMany('Trop de demandes d’e-mail depuis cette connexion. Réessayez dans une heure.'),
});
for (const path of ['/api/auth/forgot-password', '/api/auth/resend-verification', '/api/referrals/invite']) {
  app.use(path, mailPerAddress, mailPerConnection);
}

app.use('/api/auth/check-availability', limit('availability', {
  windowMs: 15 * 60 * 1000,
  max: envInt('AVAILABILITY_LIMIT', 60),
  message: tooMany('Trop de vérifications. Patientez quelques minutes.'),
}));

// The Stripe webhook must see the exact bytes Stripe signed, so it is mounted
// with the raw parser ahead of express.json(). Parsing first would re-serialise
// the body and every signature check would fail.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Fast health check endpoint (no DB check - for keep-alive pings)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check with database
app.get('/health/detailed', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      method: 'prisma',
      uptime: process.uptime()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* Nothing under /api is cacheable. Express attaches an ETag to every JSON
   response and no Cache-Control went with it, so the browser was free to
   revalidate and reuse the body it already had: cancel a residency, watch the
   refresh come back 304, and the list redraws from the copy taken before the
   cancellation. The row only changed after a hard reload, which is exactly
   what it looked like from the outside - a write that had not taken.
   These responses are per-user and change on every write, so they must not be
   stored at all. The webhook route is mounted earlier and is unaffected. */
app.use('/api/', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', conventionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', commonRoutes);

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for uploaded files
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || config.nodeEnv === 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Serve static files from the frontend build
// Try multiple path resolutions to handle different deployment scenarios
const getFrontendDistPath = () => {
  // Try relative to compiled backend (development/build)
  const relativePath = path.join(__dirname, '../../frontend/dist');
  // Try relative to project root (Render deployment)
  const rootPath = path.join(process.cwd(), 'frontend/dist');
  // Try absolute from project root if cwd is backend
  const backendRootPath = path.join(process.cwd(), '../frontend/dist');
  
  // Check which path exists
  if (fs.existsSync(relativePath)) return relativePath;
  if (fs.existsSync(rootPath)) return rootPath;
  if (fs.existsSync(backendRootPath)) return backendRootPath;
  
  // Default to relative path (will fail gracefully if doesn't exist)
  return relativePath;
};

const frontendDistPath = getFrontendDistPath();
console.log(`📁 Serving frontend from: ${frontendDistPath}`);

app.use(express.static(frontendDistPath, {
  // Vite fingerprints everything under /assets, so those filenames change
  // whenever their contents do and can be cached for a year. index.html is the
  // opposite case: it names the current fingerprints, so caching it would
  // leave returning visitors pinned to a previous deploy.
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle React routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Frontend not found. Please ensure frontend is built.' });
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

const PORT = config.port;
// Only start a listener for a long-running process. Under Vercel the exported
// app is invoked as a request handler, and binding a port would be wrong.
const isServerless = Boolean(process.env.VERCEL);
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !isServerless) {
  const startTime = Date.now();
  app.listen(PORT, () => {
    const startupTime = Date.now() - startTime;
    console.log(`🚀 Travel Art API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`⚡ Startup time: ${startupTime}ms`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
}

export { app };
export default app;

