import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { errorHandler } from '@travel-art/shared/middleware/error-handler';
import { Logger } from '@travel-art/shared/utils/logger';

dotenv.config();

const app = express();
const logger = new Logger('ApiGateway');

const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security and logging
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Service registry (can be expanded to arrays for LB)
const services: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  artists: process.env.ARTIST_SERVICE_URL || 'http://artist-service:3002',
  hotels: process.env.HOTEL_SERVICE_URL || 'http://hotel-service:3003',
  bookings: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3004',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
  admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3007'
};

// Helper to create a proxy with auth header forwarding
function serviceProxy(targetBaseUrl: string) {
  return createProxyMiddleware({
    target: targetBaseUrl,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: (path) => {
      // Incoming path is like /api/auth/... -> rewrite to /api/auth/...
      return path; // services expect /api/<service>/...
    },
    onProxyReq: (proxyReq, req) => {
      // Forward Authorization header if present
      const authHeader = (req.headers['authorization'] as string) || '';
      if (authHeader) proxyReq.setHeader('authorization', authHeader);
    },
    selfHandleResponse: false,
    logLevel: 'warn'
  });
}

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Route mappings
app.use('/api/auth', serviceProxy(services.auth));
app.use('/api/artists', serviceProxy(services.artists));
app.use('/api/hotels', serviceProxy(services.hotels));
app.use('/api/bookings', serviceProxy(services.bookings));
app.use('/api/payments', serviceProxy(services.payments));
app.use('/api/notifications', serviceProxy(services.notifications));
app.use('/api/admin', serviceProxy(services.admin));

// Fallback 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
































