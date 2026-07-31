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
  notes: z.string().optional()
});

// Helper function to calculate weeks between dates
const calculateWeeks = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7)); // Minimum 1 week
};

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

  // Validate date format
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new CustomError('Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)', 400);
  }

  // Validate dates
  if (start < now) {
    throw new CustomError('Start date must be in the future', 400);
  }

  if (end <= start) {
    throw new CustomError('End date must be after start date', 400);
  }

  // Check if booking duration is reasonable (max 52 weeks = 1 year)
  const maxWeeks = 52;
  const weeks = calculateWeeks(start, end);
  if (weeks > maxWeeks) {
    throw new CustomError(`Booking duration cannot exceed ${maxWeeks} weeks (1 year)`, 400);
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

  // Verify artist exists and check availability
  const artist = await prisma.artist.findUnique({
    where: { id: bookingData.artistId },
    include: {
      availability: {
        where: {
          dateFrom: { lte: end },
          dateTo: { gte: start }
        }
      }
    }
  });

  if (!artist) {
    throw new CustomError('Artist not found', 404);
  }

  // Check if artist is available for the requested dates
  if (!artist.availability || artist.availability.length === 0) {
    throw new CustomError('Artist is not available for the selected dates', 400);
  }

  // Calculate weekly payment
  const numberOfWeeks = calculateWeeks(start, end);
  const weeklyPaymentAmount = 200.0; // Fixed weekly rate
  const totalPaymentAmount = numberOfWeeks * weeklyPaymentAmount;

  // What this booking costs in credits, read from the artist now and frozen
  // onto the booking. Repricing the artist later must not rewrite the cost of
  // bookings already made.
  const creditCost = artist.bookingCreditCost;

  // The hotel must be able to afford it before anything is written. Balance is
  // derived from the ledger, which is the authoritative record; the Credit row
  // is the running total kept in step with it.
  const creditAccount = await prisma.credit.findUnique({
    where: { hotelId: hotel.id }
  });

  const availableCredits =
    (creditAccount?.totalCredits ?? 0) - (creditAccount?.usedCredits ?? 0);

  if (availableCredits < creditCost) {
    throw new CustomError(
      `This booking costs ${creditCost} credits and you have ${availableCredits}. Please top up before booking.`,
      400
    );
  }

  // Create booking with weekly payment
  const booking = await prisma.booking.create({
    data: {
      hotelId: bookingData.hotelId,
      artistId: bookingData.artistId,
      startDate: start,
      endDate: end,
      status: 'PENDING',
      creditsUsed: 0, // Deprecated - kept for backward compatibility
      creditCost,
      weeklyPaymentAmount,
      numberOfWeeks,
      totalPaymentAmount,
      paymentStatus: 'PENDING',
      notes: bookingData.notes
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

  // Spend the credits. The ledger entry and the running total move together
  // so the two can never disagree; the ledger is what answers a dispute.
  if (creditCost > 0) {
    await prisma.$transaction([
      prisma.creditLedger.create({
        data: {
          hotelId: hotel.id,
          delta: -creditCost,
          reason: 'BOOKING_SPEND',
          bookingId: booking.id,
          note: `Booking ${booking.id}`
        }
      }),
      prisma.credit.update({
        where: { hotelId: hotel.id },
        data: { usedCredits: { increment: creditCost } }
      })
    ]);
  }

  // Create pending transaction for the booking payment
  await prisma.transaction.create({
      data: {
      hotelId: hotel.id,
      artistId: bookingData.artistId,
      type: 'BOOKING_FEE',
      amount: totalPaymentAmount,
      status: 'PENDING'
      }
    });

  res.status(201).json({
    success: true,
    data: {
      ...booking,
      weeklyPaymentAmount,
      numberOfWeeks,
      totalPaymentAmount
    }
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

  // If booking is rejected or cancelled, update payment status and create refund transaction
  if ((status === 'REJECTED' || status === 'CANCELLED') && booking.status === 'PENDING') {
    await prisma.booking.update({
      where: { id },
      data: { paymentStatus: 'REFUNDED' }
    });

    // Return the credits the booking reserved. Without this the hotel paid for
    // a booking the artist declined: the spend was recorded on creation and
    // nothing ever gave it back. Guarded so a repeated status change cannot
    // refund the same booking twice.
    if (booking.creditCost > 0) {
      const alreadyRefunded = await prisma.creditLedger.findFirst({
        where: { bookingId: booking.id, reason: 'BOOKING_REFUND' }
      });

      if (!alreadyRefunded) {
        await prisma.$transaction([
          prisma.creditLedger.create({
            data: {
              hotelId: booking.hotelId,
              delta: booking.creditCost,
              reason: 'BOOKING_REFUND',
              bookingId: booking.id,
              note: `Booking ${booking.id} ${status.toLowerCase()}`
            }
          }),
          prisma.credit.update({
            where: { hotelId: booking.hotelId },
            data: { usedCredits: { decrement: booking.creditCost } }
          })
        ]);
      }
    }

    // Create refund transaction if payment was already made
    if (booking.paymentStatus === 'PAID') {
      await prisma.transaction.create({
        data: {
          hotelId: booking.hotelId,
          artistId: booking.artistId,
          type: 'REFUND',
          amount: -booking.totalPaymentAmount,
          status: 'COMPLETED'
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

