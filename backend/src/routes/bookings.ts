import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { config } from '../config';
import { notify, bookingPayload } from '../services/notifications';
import {
  formatStay,
  bookingRequestedEmail,
  bookingConfirmedEmail,
  bookingRejectedEmail,
  bookingCancelledEmail,
} from '../services/email';

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
      /* `include` on artist and hotel pulled every column of both for every
         booking - bio, images, videos, mediaUrls, artisticProfile,
         performanceSpots, rooms, the lot - which is why sixteen bookings came
         back as 34KB and the request took over seven seconds against a
         database in us-east-1. These are the only fields the three booking
         screens actually read. Named fields also mean a column added to
         Artist or Hotel later cannot quietly start appearing in this
         response: the other side of a booking is a different person. */
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          artistId: true,
          hotelId: true,
          startDate: true,
          endDate: true,
          status: true,
          numberOfWeeks: true,
          creditCost: true,
          totalPaymentAmount: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
          artist: {
            select: {
              id: true,
              stageName: true,
              discipline: true,
              phone: true,
              profilePicture: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          hotel: {
            select: {
              id: true,
              name: true,
              location: true,
              profilePicture: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
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

  /* The credits are claimed here, atomically, before anything else exists.

     This used to read the balance, compare it in JavaScript, and write the
     spend in a separate transaction further down. Nothing held a lock across
     that gap and a round trip to the database is ~300ms, so two requests in
     flight at once both read the same balance and both passed the check.
     Demonstrated against the running app: a house holding 60 credits, with
     residencies costing 5, had twenty accepted at once - 100 credits spent
     against a budget of 60, leaving usedCredits 40 higher than totalCredits.
     Every one of those is a real commitment to an artist that nobody paid for.

     A single conditional UPDATE closes it. The row is matched only if it can
     still afford the cost, and the database applies that test and the
     increment as one indivisible operation, so concurrent callers queue behind
     each other on the row rather than racing past it. No lock to hold, no
     isolation level to configure, and it is the same statement whether one
     request arrives or fifty. */
  let creditsClaimed = false;

  if (creditCost > 0) {
    /* Compare-and-swap, because the read and the write have to be one
       decision.

       This used to read the balance, compare it in JavaScript, and write the
       spend in a separate transaction further down. Nothing held a lock across
       that gap and a round trip to the database is ~300ms, so requests in
       flight together all read the same balance and all passed the check.
       Demonstrated against the running app: a house holding 60 credits, with
       residencies costing 5, had twenty accepted at once - 100 credits spent
       against a budget of 60, leaving usedCredits 40 higher than totalCredits.
       Every one of those was a real commitment to an artist nobody paid for.

       The update below matches the row only if `usedCredits` is still exactly
       what was just read, and sets it to the value derived from that same
       read. A concurrent claim moves it, our WHERE stops matching, the update
       touches nothing and we go round again with fresh numbers. One of the two
       wins and the other re-checks affordability honestly.

       Deliberately not a raw conditional UPDATE, which would be one statement
       instead of two: Credit is an RLS-protected model and the extension that
       stamps the caller's identity only wraps model operations, so raw SQL
       arrives without it and the policy refuses the write. Measured - every
       request came back "you have 60 credits" while holding 60. */
    for (let attempt = 0; attempt < 5 && !creditsClaimed; attempt += 1) {
      const account = await prisma.credit.findUnique({
        where: { hotelId: hotel.id }
      });

      const availableCredits =
        (account?.totalCredits ?? 0) - (account?.usedCredits ?? 0);

      if (!account || availableCredits < creditCost) {
        throw new CustomError(
          `This booking costs ${creditCost} credits and you have ${availableCredits}. Please top up before booking.`,
          400
        );
      }

      const claim = await prisma.credit.updateMany({
        where: { hotelId: hotel.id, usedCredits: account.usedCredits },
        data: { usedCredits: account.usedCredits + creditCost }
      });

      if (claim.count === 1) {
        creditsClaimed = true;
      }
    }

    if (!creditsClaimed) {
      // Five losses in a row means genuine contention on this hotel, not a
      // shortfall. Saying "no credits" here would be a lie.
      throw new CustomError(
        'Trop de réservations simultanées sur ce compte. Réessayez dans un instant.',
        409
      );
    }
  }

  /* From here on the credits are already spent, so any failure has to give
     them back - otherwise a house is charged for a residency that does not
     exist. */
  const releaseClaim = async () => {
    if (!creditsClaimed) return;
    await prisma.credit.update({
      where: { hotelId: hotel.id },
      data: { usedCredits: { decrement: creditCost } },
    }).catch((error) => console.error('Credit claim not released for hotel', hotel.id, error));
  };

  // Create booking with weekly payment
  let booking;
  try {
    booking = await prisma.booking.create({
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
  } catch (error) {
    // The residency could not be written, so the credits go back.
    await releaseClaim();
    throw error;
  }

  /* The ledger entry that explains the claim made above. The running total is
     deliberately NOT touched here: it was already moved by the conditional
     UPDATE, and incrementing it again would charge the house twice for one
     residency. The ledger is what answers a dispute, so it still has to be
     written - if this fails the balance is right and the trail is missing,
     which is recoverable; the reverse would not be. */
  if (creditCost > 0) {
    await prisma.creditLedger.create({
      data: {
        hotelId: hotel.id,
        delta: -creditCost,
        reason: 'BOOKING_SPEND',
        bookingId: booking.id,
        note: `Booking ${booking.id}`
      }
    }).catch((error) => console.error('Ledger entry missing for booking', booking.id, error));
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

  /* Tell the artist. This is the notification the whole marketplace turns on:
     before it existed a house could ask for a week and the artist would only
     learn of it by opening the dashboard unprompted. Not awaited - a booking
     that was made stays made even if the mail provider is down, and the row
     in notifications is written on the same best-effort basis. */
  const stay = formatStay(booking.startDate, booking.endDate);
  void notify({
    userId: booking.artist.user.id,
    type: 'BOOKING_REQUESTED',
    payload: bookingPayload(booking),
    email: () =>
      bookingRequestedEmail(
        booking.artist.user.email,
        booking.artist.stageName || booking.artist.user.name || 'Bonjour',
        booking.hotel.name,
        stay,
        `${config.frontendUrl}/dashboard/bookings`
      ),
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

  /* Whether this change also releases the money, decided before the write so
     it can travel with it. It used to be a second UPDATE on the same row a
     few lines below - another full round trip to a database in us-east-1, on
     a request that already makes several and took 7-9 seconds end to end
     against a 10 second client timeout. */
  const releasesPayment =
    (status === 'REJECTED' || status === 'CANCELLED') && booking.status === 'PENDING';

  // Update booking
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: releasesPayment ? { status, paymentStatus: 'REFUNDED' } : { status },
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

  // If booking is rejected or cancelled, return the credits it reserved.
  if (releasesPayment) {
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

  /* Tell whoever did not perform the action. An accepted residency that the
     house never hears about is the same as no residency; a cancelled one that
     the artist never hears about is worse, because they may be about to buy a
     flight. Each is best-effort and never awaited, for the same reason as the
     request notification above. */
  const stay = formatStay(updatedBooking.startDate, updatedBooking.endDate);
  const artistLabel =
    updatedBooking.artist.stageName || updatedBooking.artist.user.name || 'L’artiste';
  const hotelLabel = updatedBooking.hotel.name;
  const payload = bookingPayload(updatedBooking);

  if (status === 'CONFIRMED') {
    void notify({
      userId: updatedBooking.hotel.user.id,
      type: 'BOOKING_CONFIRMED',
      payload,
      email: () =>
        bookingConfirmedEmail(
          updatedBooking.hotel.user.email,
          hotelLabel,
          artistLabel,
          stay,
          `${config.frontendUrl}/dashboard/bookings`
        ),
    });
  } else if (status === 'REJECTED') {
    void notify({
      userId: updatedBooking.hotel.user.id,
      type: 'BOOKING_REJECTED',
      payload,
      email: () =>
        bookingRejectedEmail(
          updatedBooking.hotel.user.email,
          hotelLabel,
          artistLabel,
          stay,
          `${config.frontendUrl}/dashboard/artists`
        ),
    });
  } else if (status === 'CANCELLED') {
    void notify({
      userId: updatedBooking.artist.user.id,
      type: 'BOOKING_CANCELLED',
      payload,
      email: () =>
        bookingCancelledEmail(
          updatedBooking.artist.user.email,
          artistLabel,
          hotelLabel,
          stay,
          `${config.frontendUrl}/dashboard/bookings`
        ),
    });
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

  /* A rating is a record of a residency that happened. Nothing stopped a house
     rating an artist whose booking was still PENDING - before a date had even
     been agreed, let alone played - which would have put reviews of
     performances that never occurred on the artist's public profile and in the
     testimonials on the landing page. */
  if (booking.status !== 'COMPLETED') {
    throw new CustomError(
      'Une résidence ne peut être évaluée qu’une fois terminée',
      400
    );
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

  /* The last link in the chain. A rating is the only thing on this platform
     that an artist earns rather than buys, and the Artiste confirmé tier sells
     "distinctions et évaluations" outright - so the artist hears about it. */
  if (rating.isVisibleToArtist) {
    void notify({
      userId: rating.artist.user.id,
      type: 'RATING_RECEIVED',
      payload: {
        bookingId: rating.bookingId,
        hotelName: rating.hotel.name,
        stars: rating.stars,
      },
    });
  }

  res.status(201).json({
    success: true,
    data: rating
  });
}));

export { router as bookingRoutes };

