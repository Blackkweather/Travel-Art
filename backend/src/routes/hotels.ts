import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const hotelProfileSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  location: z.string(), // JSON string
  contactPhone: z.string().optional(),
  images: z.string().optional(), // JSON string
  performanceSpots: z.string().optional(), // JSON string
  rooms: z.string().optional(), // JSON string
  repName: z.string().optional()
});

const roomAvailabilitySchema = z.object({
  roomId: z.string(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  price: z.number().optional()
});

const creditPurchaseSchema = z.object({
  amount: z.number().positive(),
  credits: z.number().positive()
});

const bookingSchema = z.object({
  artistId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  specialRequests: z.string().optional()
});

const ratingSchema = z.object({
  stars: z.number().min(1).max(5),
  textReview: z.string().min(10).max(500)
});

// Get hotel profile
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          country: true,
          createdAt: true
        }
      },
      availabilities: {
        where: {
          dateFrom: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      }
    }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found.', 404);
  }

  res.json({
    success: true,
    data: {
      ...hotel,
      // Parse JSON strings
      location: hotel.location ? JSON.parse(hotel.location) : null,
      images: hotel.images ? JSON.parse(hotel.images) : [],
      performanceSpots: hotel.performanceSpots ? JSON.parse(hotel.performanceSpots) : [],
      rooms: hotel.rooms ? JSON.parse(hotel.rooms) : []
    }
  });
}));

// Create or update hotel profile
router.post('/', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = hotelProfileSchema.parse(req.body);

  const hotel = await prisma.hotel.upsert({
    where: { userId: req.user!.id },
    update: profileData,
    create: {
      userId: req.user!.id,
      ...profileData
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: hotel
  });
}));

// Add room availability
router.post('/:id/rooms', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { roomId, dateFrom, dateTo, price } = roomAvailabilitySchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  const availability = await prisma.availability.create({
    data: {
      hotelId: id,
      roomId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      price
    }
  });

  res.status(201).json({
    success: true,
    data: availability
  });
}));

// Purchase credits
router.post('/:id/credits/purchase', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { amount, credits } = creditPurchaseSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Update credits
  const creditRecord = await prisma.credit.upsert({
    where: { hotelId: id },
    update: {
      totalCredits: { increment: credits }
    },
    create: {
      hotelId: id,
      totalCredits: credits,
      usedCredits: 0
    }
  });

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      hotelId: id,
      type: 'CREDIT_PURCHASE',
      amount
    }
  });

  res.json({
    success: true,
    data: {
      credits: creditRecord,
      transaction
    }
  });
}));

// Browse artists with filters
router.get('/:id/artists', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { discipline, location, dateFrom, dateTo, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (discipline) {
    where.discipline = { contains: discipline as string, mode: 'insensitive' };
  }

  if (location) {
    where.user = {
      country: { contains: location as string, mode: 'insensitive' }
    };
  }

  if (dateFrom && dateTo) {
    where.availability = {
      some: {
        dateFrom: { lte: new Date(dateTo as string) },
        dateTo: { gte: new Date(dateFrom as string) }
      }
    };
  }

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            country: true
          }
        },
        availability: {
          where: {
            dateFrom: { gte: new Date() }
          },
          orderBy: { dateFrom: 'asc' },
          take: 1
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.artist.count({ where })
  ]);

  // Add rating badges for each artist
  const artistsWithBadges = await Promise.all(
    artists.map(async (artist) => {
      const ratings = await prisma.rating.findMany({
        where: { artistId: artist.id },
        select: { stars: true }
      });

      let ratingBadge = null;
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
        if (avgRating >= 4.5) {
          ratingBadge = 'Top 10% Performer';
        } else if (avgRating >= 4.0) {
          ratingBadge = 'Excellent Performer';
        } else if (avgRating >= 3.5) {
          ratingBadge = 'Good Performer';
        }
      }

      return {
        ...artist,
        ratingBadge,
        images: artist.images ? JSON.parse(artist.images) : [],
        videos: artist.videos ? JSON.parse(artist.videos) : [],
        mediaUrls: artist.mediaUrls ? JSON.parse(artist.mediaUrls) : []
      };
    })
  );

  res.json({
    success: true,
    data: {
      artists: artistsWithBadges,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Request booking
router.post('/:id/bookings', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { artistId, startDate, endDate, specialRequests } = bookingSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Check if artist has active membership
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { user: true }
  });

  if (!artist) {
    throw new CustomError('Artist not found.', 404);
  }

  if (artist.membershipStatus !== 'ACTIVE') {
    throw new CustomError('Artist must have active membership to be booked.', 400);
  }

  // Check artist availability
  const isAvailable = await prisma.artistAvailability.findFirst({
    where: {
      artistId,
      dateFrom: { lte: new Date(startDate) },
      dateTo: { gte: new Date(endDate) }
    }
  });

  if (!isAvailable) {
    throw new CustomError('Artist is not available for the selected dates.', 400);
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      hotelId: id,
      artistId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PENDING',
      creditsUsed: 1 // Assuming 1 credit per booking
    },
    include: {
      artist: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: booking
  });
}));

// Confirm booking (consumes credits)
router.post('/:id/bookings/:bookingId/confirm', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id, bookingId } = req.params;

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Get booking
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, hotelId: id, status: 'PENDING' }
  });

  if (!booking) {
    throw new CustomError('Booking not found or already processed.', 404);
  }

  // Check available credits
  const credits = await prisma.credit.findUnique({
    where: { hotelId: id }
  });

  if (!credits || (credits.totalCredits - credits.usedCredits) < booking.creditsUsed) {
    throw new CustomError('Insufficient credits to confirm booking.', 400);
  }

  // Update booking status and consume credits
  const [updatedBooking, updatedCredits] = await Promise.all([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    }),
    prisma.credit.update({
      where: { hotelId: id },
      data: { usedCredits: { increment: booking.creditsUsed } }
    })
  ]);

  res.json({
    success: true,
    data: {
      booking: updatedBooking,
      remainingCredits: updatedCredits.totalCredits - updatedCredits.usedCredits
    }
  });
}));

// Rate artist after stay
router.post('/:id/bookings/:bookingId/rate', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id, bookingId } = req.params;
  const { stars, textReview } = ratingSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Get booking
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, hotelId: id, status: 'COMPLETED' }
  });

  if (!booking) {
    throw new CustomError('Booking not found or not completed.', 404);
  }

  // Check if already rated
  const existingRating = await prisma.rating.findFirst({
    where: { bookingId }
  });

  if (existingRating) {
    throw new CustomError('Artist has already been rated for this booking.', 400);
  }

  // Create rating
  const rating = await prisma.rating.create({
    data: {
      bookingId,
      hotelId: id,
      artistId: booking.artistId,
      stars,
      textReview,
      isVisibleToArtist: false // Artists cannot see numeric ratings
    }
  });

  res.status(201).json({
    success: true,
    data: rating
  });
}));

export { router as hotelRoutes };


