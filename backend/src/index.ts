import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { artistRoutes } from './routes/artists';
import { hotelRoutes } from './routes/hotels';
import { adminRoutes } from './routes/admin';
import { commonRoutes } from './routes/common';

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test image serving
app.get('/test-logo', (req, res) => {
  const logoPath = path.join(frontendPath, 'logo-transparent.png');
  console.log('Logo path:', logoPath);
  console.log('Logo exists:', require('fs').existsSync(logoPath));
  res.sendFile(logoPath);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commonRoutes);

// Serve static files from the frontend build
const frontendPath = path.join(process.cwd(), '../frontend/dist');
console.log('Frontend path:', frontendPath);
console.log('Files in frontend dist:', require('fs').readdirSync(frontendPath));

// Serve static files with explicit configuration
app.use('/static', express.static(frontendPath));
app.use(express.static(frontendPath));

// Handle React routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Travel Art API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export { app, prisma };

