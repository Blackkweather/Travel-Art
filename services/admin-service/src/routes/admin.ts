import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError } from '@travel-art/shared/utils/errors';
import { authenticateToken, requireAdmin } from '@travel-art/shared/middleware/auth';
import { HttpClient } from '@travel-art/shared/utils/http-client';

const router = Router();
const prisma = new PrismaClient();

// Service clients
const authService = new HttpClient('AuthService', process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
const artistService = new HttpClient('ArtistService', process.env.ARTIST_SERVICE_URL || 'http://localhost:3002');
const hotelService = new HttpClient('HotelService', process.env.HOTEL_SERVICE_URL || 'http://localhost:3003');
const bookingService = new HttpClient('BookingService', process.env.BOOKING_SERVICE_URL || 'http://localhost:3004');
const paymentService = new HttpClient('PaymentService', process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005');

// Validation schemas
const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

const assignRankSchema = z.object({
  rank: z.enum(['STANDARD', 'PROFESSIONAL', 'DIAMOND', 'SUPERSTAR'])
});

// Get platform statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch data from various services
    const [usersResponse, artistsResponse, hotelsResponse, bookingsResponse, transactionsResponse] = await Promise.all([
      authService.get('/api/auth/users/count'),
      artistService.get('/api/artists?limit=1'),
      hotelService.get('/api/hotels?limit=1'),
      bookingService.get('/api/bookings?limit=1'),
      paymentService.get('/api/payments/transactions?limit=1')
    ]);

    const stats = {
      totalUsers: usersResponse.data?.total || 0,
      totalArtists: artistsResponse.data?.pagination?.total || 0,
      totalHotels: hotelsResponse.data?.pagination?.total || 0,
      totalBookings: bookingsResponse.data?.pagination?.total || 0,
      totalRevenue: transactionsResponse.data?.totalRevenue || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard alias (for frontend compatibility)
router.get('/dashboard', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [usersResponse, artistsResponse, hotelsResponse, bookingsResponse, transactionsResponse] = await Promise.all([
      authService.get('/api/auth/users/count'),
      artistService.get('/api/artists?limit=1'),
      hotelService.get('/api/hotels?limit=1'),
      bookingService.get('/api/bookings?limit=1'),
      paymentService.get('/api/payments/transactions?limit=1')
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: usersResponse.data?.total || 0,
        totalArtists: artistsResponse.data?.pagination?.total || 0,
        totalHotels: hotelsResponse.data?.pagination?.total || 0,
        totalBookings: bookingsResponse.data?.pagination?.total || 0,
        totalRevenue: transactionsResponse.data?.totalRevenue || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive, page = '1', limit = '20' } = req.query;

    const params = new URLSearchParams();
    if (role) params.append('role', role as string);
    if (isActive) params.append('isActive', isActive as string);
    params.append('page', page as string);
    params.append('limit', limit as string);

    const response = await authService.get(`/api/auth/users?${params.toString()}`);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:userId/status', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const data = updateUserStatusSchema.parse(req.body);

    const response = await authService.patch(`/api/auth/users/${userId}/status`, data);

    // Log admin action
    if (req.user) {
      await prisma.adminLog.create({
        data: {
          action: data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          actorUserId: req.user.userId,
          targetId: userId
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Suspend user (alias)
router.post('/users/:userId/suspend', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const response = await authService.patch(`/api/auth/users/${userId}/status`, { isActive: false });

    if (req.user) {
      await prisma.adminLog.create({
        data: {
          action: 'USER_DEACTIVATED',
          actorUserId: req.user.userId,
          targetId: userId
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Activate user (alias)
router.post('/users/:userId/activate', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const response = await authService.patch(`/api/auth/users/${userId}/status`, { isActive: true });

    if (req.user) {
      await prisma.adminLog.create({
        data: {
          action: 'USER_ACTIVATED',
          actorUserId: req.user.userId,
          targetId: userId
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Assign artist rank (Diamond/Superstar)
router.patch('/artists/:artistId/rank', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { artistId } = req.params;
    const data = assignRankSchema.parse(req.body);

    const response = await artistService.patch(`/api/artists/${artistId}/rank`, { rank: data.rank });

    // Log admin action
    if (req.user) {
      await prisma.adminLog.create({
        data: {
          action: 'ARTIST_RANK_ASSIGNED',
          actorUserId: req.user.userId,
          targetId: artistId,
          details: JSON.stringify({ rank: data.rank })
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get all bookings
router.get('/bookings', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const params = new URLSearchParams();
    if (status) params.append('status', status as string);
    params.append('page', page as string);
    params.append('limit', limit as string);

    const response = await bookingService.get(`/api/bookings?${params.toString()}`);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get all transactions
router.get('/transactions', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page = '1', limit = '20' } = req.query;

    const params = new URLSearchParams();
    if (type) params.append('type', type as string);
    params.append('page', page as string);
    params.append('limit', limit as string);

    const response = await paymentService.get(`/api/payments/transactions?${params.toString()}`);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get admin activity logs
router.get('/logs', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, actorUserId, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = action;
    if (actorUserId) where.actorUserId = actorUserId;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adminLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Process refund
router.post('/refund/:transactionId', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    const response = await paymentService.post(`/api/payments/refund/${transactionId}`, {});

    // Log admin action
    if (req.user) {
      await prisma.adminLog.create({
        data: {
          action: 'REFUND_PROCESSED',
          actorUserId: req.user.userId,
          targetId: transactionId
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

