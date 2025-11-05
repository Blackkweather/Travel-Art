import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from '@travel-art/shared/middleware/error-handler';
import { Logger } from '@travel-art/shared/utils/logger';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const logger = new Logger('AdminService');

const PORT = process.env.PORT || 3007;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'admin-service',
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Admin Service running on port ${PORT}`);
});

export { app, prisma };














