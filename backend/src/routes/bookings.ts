import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createBookingSchema = z.object({
  hotelId: z.string(),
  artistId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  creditsUsed: z.number().int().positive(),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
});

const ratingSchema = z.object({
  bookingId: z.string(),
  hotelId: z.string(),
  artistId: z.string(),
  stars: z.number().min(1).max(5),
  textReview: z.string().min(10).max(500),
  isVisibleToArtist: z.boolean().optional().default(false)
});

// Get bookings (for artists and hotels)
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { artistId, hotelId, status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by role - artists can only see their bookings, hotels can only see their bookings
    if (req.user!.role === 'ARTIST') {
      // Get artist ID from user
      const artist = await prisma.artist.findUnique({
        where: { userId: req.user!.id }
      });
      if (artist) {
        where.artistId = artist.id;
      } else {
        // No artist profile, return empty
        return res.json({
          success: true,
          data: {
            bookings: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              pages: 0
            }
          }
        });
      }
    } else if (req.user!.role === 'HOTEL') {
      // Get hotel ID from user
      const hotel = await prisma.hotel.findUnique({
        where: { userId: req.user!.id }
      });
      if (hotel) {
        where.hotelId = hotel.id;
      } else {
        // No hotel profile, return empty
        return res.json({
          success: true,
          data: {
            bookings: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              pages: 0
            }
          }
        });
      }
    } else if (req.user!.role === 'ADMIN') {
      // Admin can filter by artistId or hotelId if provided
      if (artistId) {
        where.artistId = artistId as string;
      }
      if (hotelId) {
        where.hotelId = hotelId as string;
      }
    } else {
      throw new CustomError('Unauthorized', 403);
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          artist: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          hotel: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.booking.count({ where }).catch(() => 0)
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
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    throw new CustomError('Failed to fetch bookings', 500);
  }
}));

// Get booking by ID
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      artist: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      hotel: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!booking) {
    throw new CustomError('Booking not found', 404);
  }

  // Check authorization - artist can only see their bookings, hotel can only see their bookings
  if (req.user!.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: req.user!.id }
    });
    if (!artist || booking.artistId !== artist.id) {
      throw new CustomError('Unauthorized', 403);
    }
  } else if (req.user!.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({
      where: { userId: req.user!.id }
    });
    if (!hotel || booking.hotelId !== hotel.id) {
      throw new CustomError('Unauthorized', 403);
    }
  } else if (req.user!.role !== 'ADMIN') {
    throw new CustomError('Unauthorized', 403);
  }

  res.json({
    success: true,
    data: booking
  });
}));

// Create booking (hotels only)
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user!.role !== 'HOTEL') {
    throw new CustomError('Only hotels can create bookings', 403);
  }

  const bookingData = createBookingSchema.parse(req.body);

  const start = new Date(bookingData.startDate);
  const end = new Date(bookingData.endDate);
  const now = new Date();

  // Basic date validation for MVP
  if (start < now) {
    throw new CustomError('Start date must be in the future', 400);
  }

  if (end <= start) {
    throw new CustomError('End date must be after start date', 400);
  }

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findUnique({
    where: { userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel profile not found', 404);
  }

  if (bookingData.hotelId !== hotel.id) {
    throw new CustomError('Hotel ID mismatch', 400);
  }

  // Verify artist exists
  const artist = await prisma.artist.findUnique({
    where: { id: bookingData.artistId }
  });

  if (!artist) {
    throw new CustomError('Artist not found', 404);
  }

  // Check hotel has enough credits
  const credit = await prisma.credit.findUnique({
    where: { hotelId: hotel.id }
  });

  const availableCredits = (credit?.totalCredits || 0) - (credit?.usedCredits || 0);
  if (availableCredits < bookingData.creditsUsed) {
    throw new CustomError('Insufficient credits', 400);
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      hotelId: bookingData.hotelId,
      artistId: bookingData.artistId,
      startDate: start,
      endDate: end,
      status: 'PENDING',
      creditsUsed: bookingData.creditsUsed
    },
    include: {
      artist: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      hotel: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  // Update credits (reserve them, don't use yet - will be used when confirmed)
  if (credit) {
    await prisma.credit.update({
      where: { hotelId: hotel.id },
      data: {
        usedCredits: { increment: bookingData.creditsUsed }
      }
    });
  }

  res.status(201).json({
    success: true,
    data: booking
  });
}));

// Update booking status
router.patch('/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = updateStatusSchema.parse(req.body);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: true,
      artist: true
    }
  });

  if (!booking) {
    throw new CustomError('Booking not found', 404);
  }

  // Check authorization
  if (req.user!.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: req.user!.id }
    });
    if (!artist || booking.artistId !== artist.id) {
      throw new CustomError('Unauthorized', 403);
    }
    // Artists can only confirm or reject
    if (status !== 'CONFIRMED' && status !== 'REJECTED') {
      throw new CustomError('Artists can only confirm or reject bookings', 400);
    }
  } else if (req.user!.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({
      where: { userId: req.user!.id }
    });
    if (!hotel || booking.hotelId !== hotel.id) {
      throw new CustomError('Unauthorized', 403);
    }
    // Hotels can cancel
    if (status !== 'CANCELLED') {
      throw new CustomError('Hotels can only cancel bookings', 400);
    }
  } else if (req.user!.role !== 'ADMIN') {
    throw new CustomError('Unauthorized', 403);
  }

  // Update booking
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      artist: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      hotel: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  // If booking is rejected or cancelled, refund credits
  if ((status === 'REJECTED' || status === 'CANCELLED') && booking.status === 'PENDING') {
    const credit = await prisma.credit.findUnique({
      where: { hotelId: booking.hotelId }
    });
    if (credit) {
      await prisma.credit.update({
        where: { hotelId: booking.hotelId },
        data: {
          usedCredits: { decrement: booking.creditsUsed }
        }
      });
    }
  }

  res.json({
    success: true,
    data: updatedBooking
  });
}));

// Create rating
router.post('/ratings', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const ratingData = ratingSchema.parse(req.body);

  // Verify booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: ratingData.bookingId }
  });

  if (!booking) {
    throw new CustomError('Booking not found', 404);
  }

  // Check authorization - only hotels can rate artists
  if (req.user!.role !== 'HOTEL') {
    throw new CustomError('Only hotels can rate artists', 403);
  }

  const hotel = await prisma.hotel.findUnique({
    where: { userId: req.user!.id }
  });

  if (!hotel || booking.hotelId !== hotel.id) {
    throw new CustomError('Unauthorized', 403);
  }

  // Check if rating already exists
  const existingRating = await prisma.rating.findFirst({
    where: {
      bookingId: ratingData.bookingId,
      hotelId: ratingData.hotelId,
      artistId: ratingData.artistId
    }
  });

  if (existingRating) {
    throw new CustomError('Rating already exists for this booking', 400);
  }

  // Create rating
  const rating = await prisma.rating.create({
    data: {
      bookingId: ratingData.bookingId,
      hotelId: ratingData.hotelId,
      artistId: ratingData.artistId,
      stars: ratingData.stars,
      textReview: ratingData.textReview,
      isVisibleToArtist: ratingData.isVisibleToArtist || false
    },
    include: {
      artist: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      hotel: {
        include: {
          user: {
            select: {
              id: true,
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
    data: rating
  });
}));

export { router as bookingRoutes };

