import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { uploadRoutes } from './routes/upload';
import { webhookRoutes } from './routes/webhooks';
import { initializeDatabase, prisma } from './db';

const app = express();

// Trust proxy for rate limiting behind reverse proxy (Render, etc.)
// Only enable in production when behind a proxy to avoid security warnings
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1); // Trust first proxy only
} else {
  app.set('trust proxy', false);
}

// Initialize database connection (Prisma or fallback to pg) - non-blocking
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully');
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    console.error('Please check your DATABASE_URL environment variable');
    console.error('Server will start anyway - database will be initialized on first request');
    // Don't exit - let the server start and errors will be caught by error handler
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      // This policy now applies to the app's own HTML, which it did not when a
      // CDN served the SPA and Express only answered /api. Uploaded images come
      // back from routes/upload.ts as absolute Blob URLs, so that host has to be
      // named here or every avatar and artwork is blocked.
      imgSrc: [
        "'self'",
        "data:",
        "https://images.unsplash.com",
        "https://res.cloudinary.com",
        "https://*.public.blob.vercel-storage.com",
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
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
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// The Stripe webhook must see the exact bytes Stripe signed, so it is mounted
// with the raw parser ahead of express.json(). Parsing first would re-serialise
// the body and every signature check would fail.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    // prisma is imported statically at the top of this file. This used to be a
    // dynamic await import('./db'), which a bundler cannot always trace into a
    // serverless function: on Vercel the import itself threw, the catch below
    // turned that into "database: disconnected", and the endpoint reported an
    // outage while every real query in the app was succeeding.
    await prisma.$queryRaw`SELECT 1 as test`;
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
    // Statically imported for the same reason as /health/detailed above.
    await prisma.$queryRaw`SELECT 1 as test`;
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
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
  setHeaders: (res, filePath) => {
    // Set correct Content-Type for webmanifest files
    if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json');
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
  const { prisma } = await import('./db');
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  const { prisma } = await import('./db');
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
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

