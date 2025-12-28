import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { clerkRoutes } from './routes/clerk';
import { clerkWebhookRoutes } from './routes/clerk-webhook';
import { quickAuthRoutes } from './routes/quick-auth';
import { artistRoutes } from './routes/artists';
import { hotelRoutes } from './routes/hotels';
import { adminRoutes } from './routes/admin';
import { commonRoutes } from './routes/common';
import { tripRoutes } from './routes/trips';
import { paymentRoutes } from './routes/payments';
import { bookingRoutes } from './routes/bookings';
import { uploadRoutes } from './routes/upload';
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
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
// CORS configuration - allow multiple origins for flexibility
const allowedOrigins = [
  config.corsOrigin,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4000',
  'http://localhost:5173', // Vite default port
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, also allow same-origin requests
    callback(null, true);
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

// Body parsing middleware
// Note: Clerk webhook needs raw body for signature verification
app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }));
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
    // Test database connection using Prisma
    const { prisma } = await import('./db');
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
    // Test database connection using Prisma
    const { prisma } = await import('./db');
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
app.use('/api/auth/clerk', clerkRoutes);
app.use('/api/webhooks/clerk', clerkWebhookRoutes);
app.use('/api/quick-auth', quickAuthRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', commonRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
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

