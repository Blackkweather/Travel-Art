import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@travel-art/shared/utils/errors';
import { authenticateToken } from '@travel-art/shared/middleware/auth';
import { HttpClient } from '@travel-art/shared/utils/http-client';

const router = Router();
const prisma = new PrismaClient();

// Service clients
const hotelService = new HttpClient('HotelService', process.env.HOTEL_SERVICE_URL || 'http://localhost:3003');
const artistService = new HttpClient('ArtistService', process.env.ARTIST_SERVICE_URL || 'http://localhost:3002');
const notificationService = new HttpClient('NotificationService', process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006');

// Validation schemas
const createBookingSchema = z.object({
  hotelId: z.string(),
  artistId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  creditsUsed: z.number().positive(),
  notes: z.string().optional()
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
});

const createRatingSchema = z.object({
  bookingId: z.string(),
  hotelId: z.string(),
  artistId: z.string(),
  stars: z.number().min(1).max(5),
  textReview: z.string(),
  isVisibleToArtist: z.boolean().optional()
});

// Get all bookings (filtered by user)
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { hotelId, artistId, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (hotelId) where.hotelId = hotelId;
    if (artistId) where.artistId = artistId;
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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

// Get booking by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        ratings: true
      }
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Check hotel credits
    const creditsResponse = await hotelService.get(`/api/hotels/${data.hotelId}/credits`);
    
    if (!creditsResponse.success) {
      throw new ValidationError('Unable to verify hotel credits');
    }

    const availableCredits = creditsResponse.data.availableCredits;
    if (availableCredits < data.creditsUsed) {
      throw new ValidationError('Insufficient credits');
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: data.hotelId,
        artistId: data.artistId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        creditsUsed: data.creditsUsed,
        notes: data.notes,
        status: 'PENDING'
      }
    });

    // Use credits
    await hotelService.post(`/api/hotels/${data.hotelId}/credits/use`, {
      amount: data.creditsUsed
    });

    // Send notifications
    try {
      await notificationService.post('/api/notifications', {
        userId: data.hotelId,
        type: 'BOOKING_CREATED',
        payload: JSON.stringify({ bookingId: booking.id })
      });

      await notificationService.post('/api/notifications', {
        userId: data.artistId,
        type: 'BOOKING_REQUEST',
        payload: JSON.stringify({ bookingId: booking.id })
      });
    } catch (notifError) {
      // Log but don't fail the booking
      console.error('Failed to send notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Update booking status
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = updateBookingStatusSchema.parse(req.body);

    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    // Send notification
    try {
      await notificationService.post('/api/notifications', {
        userId: booking.hotelId,
        type: 'BOOKING_STATUS_UPDATED',
        payload: JSON.stringify({ bookingId: booking.id, status })
      });

      await notificationService.post('/api/notifications', {
        userId: booking.artistId,
        type: 'BOOKING_STATUS_UPDATED',
        payload: JSON.stringify({ bookingId: booking.id, status })
      });
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
    }

    // If completed, update artist stats
    if (status === 'COMPLETED') {
      try {
        await artistService.patch(`/api/artists/${booking.artistId}/stats`, {
          totalBookings: 1,
          totalEarnings: booking.creditsUsed * 50 // €50 per booking
        });
      } catch (statsError) {
        console.error('Failed to update artist stats:', statsError);
      }
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Create rating
router.post('/ratings', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRatingSchema.parse(req.body);

    // Verify booking exists and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId }
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'COMPLETED') {
      throw new ValidationError('Can only rate completed bookings');
    }

    const rating = await prisma.rating.create({
      data: {
        bookingId: data.bookingId,
        hotelId: data.hotelId,
        artistId: data.artistId,
        stars: data.stars,
        textReview: data.textReview,
        isVisibleToArtist: data.isVisibleToArtist ?? false
      }
    });

    // Update artist average rating
    try {
      const allRatings = await prisma.rating.findMany({
        where: { artistId: data.artistId }
      });

      const avgRating = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

      await artistService.patch(`/api/artists/${data.artistId}/stats`, {
        averageRating: avgRating
      });
    } catch (statsError) {
      console.error('Failed to update artist rating:', statsError);
    }

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    next(error);
  }
});

// Get ratings for an artist
router.get('/ratings/artist/:artistId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { artistId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { 
        artistId,
        isVisibleToArtist: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    next(error);
  }
});

export default router;































