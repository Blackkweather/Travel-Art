import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const referralSchema = z.object({
  inviteeEmail: z.string().email(),
  inviteeName: z.string().min(2).max(100)
});

// Get current user's referrals
router.get('/referrals', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const referrals = await prisma.referral.findMany({
    where: {
      inviterUserId: req.user!.id
    },
    include: {
      invitee: {
        include: {
          artist: {
            select: {
              id: true,
              discipline: true,
              membershipStatus: true,
              images: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get artist profile for referral code
  const artist = await prisma.artist.findUnique({
    where: {
      userId: req.user!.id
    },
    select: {
      referralCode: true,
      loyaltyPoints: true
    }
  });

  // Calculate stats
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => 
    r.invitee.artist?.membershipStatus === 'ACTIVE'
  ).length;
  const totalCreditsEarned = referrals.reduce((sum, r) => sum + r.rewardPoints, 0);
  const pendingReferrals = referrals.filter(r => 
    !r.invitee.artist || r.invitee.artist.membershipStatus !== 'ACTIVE'
  ).length;

  // Format referrals data
  const formattedReferrals = referrals.map(r => {
    let images = [];
    if (r.invitee.artist?.images) {
      try {
        images = typeof r.invitee.artist.images === 'string' 
          ? JSON.parse(r.invitee.artist.images) 
          : r.invitee.artist.images;
      } catch {
        images = [];
      }
    }

    return {
      id: r.id,
      name: r.invitee.name,
      email: r.invitee.email,
      discipline: r.invitee.artist?.discipline || 'Not set',
      joinedDate: r.invitee.createdAt,
      status: r.invitee.artist?.membershipStatus === 'ACTIVE' ? 'active' : 'pending',
      creditsEarned: r.rewardPoints,
      image: images[0] || null
    };
  });

  res.json({
    success: true,
    data: {
      referralCode: artist?.referralCode || null,
      loyaltyPoints: artist?.loyaltyPoints || 0,
      stats: {
        totalReferrals,
        activeReferrals,
        totalCreditsEarned,
        pendingReferrals
      },
      referrals: formattedReferrals
    }
  });
}));

// Create referral
router.post('/referrals', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { inviteeEmail } = referralSchema.parse(req.body);

  // Check if invitee already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: inviteeEmail }
  });

  if (existingUser) {
    throw new CustomError('User with this email already exists.', 400);
  }

  // Check if referral already exists
  const existingReferral = await prisma.referral.findFirst({
    where: {
      inviterUserId: req.user!.id,
      invitee: { email: inviteeEmail }
    }
  });

  if (existingReferral) {
    throw new CustomError('Referral already sent to this email.', 400);
  }

  // Note: Referral can only be created when invitee registers
  // For now, we'll store the referral intent in a notification or separate table
  // Since Prisma schema requires inviteeUserId to reference an existing user,
  // we cannot create a referral until the invitee registers
  
  // TODO: Implement referral invitation system that creates referral on registration
  // For now, return success but don't create referral record yet
  res.status(201).json({
    success: true,
    data: {
      message: 'Referral invitation will be processed when invitee registers',
      inviteeEmail: inviteeEmail
    }
  });

  // TODO: Send email invitation
  // Referral invitation sent successfully
}));

// Get top artists/hotels
/**
 * Newsletter signup, from the footer form on every page.
 *
 * The client had this path commented out behind a one-second timer that
 * reported success, so every address a visitor gave was thrown away while they
 * were told they had subscribed.
 *
 * Subscribing twice is success, not a conflict: the caller is unauthenticated,
 * so a 409 would say whether an address is already on the list.
 */
router.post('/newsletter/subscribe', asyncHandler(async (req, res) => {
  const { email, locale, source } = z
    .object({
      email: z.string().email('Adresse e-mail invalide').max(254),
      locale: z.enum(['fr', 'en']).optional(),
      source: z.string().max(60).optional(),
    })
    .parse(req.body);

  const normalised = email.trim().toLowerCase();

  await prismaAdmin.newsletterSubscriber.upsert({
    where: { email: normalised },
    create: { email: normalised, locale: locale ?? 'fr', source: source ?? null },
    // Re-subscribing after unsubscribing puts them back on the list.
    update: { unsubscribedAt: null, locale: locale ?? 'fr' },
  });

  res.status(201).json({ success: true, data: { subscribed: true } });
}));

router.get('/top', asyncHandler(async (req, res) => {
  const { type } = req.query;

  // Callers may ask for more than the default ten; 50 is the ceiling so this
  // endpoint can never be made to serialise the entire table.
  const requested = parseInt(req.query.limit as string, 10);
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), 50)
    : 10;

  if (type === 'artists') {
    // Ranking is a platform-wide question - "who is most booked" cannot be
    // answered from one tenant's slice - so the booking counts behind the sort
    // come from the privileged client. Only the ordering leaves this function;
    // no booking row is ever returned to the caller.
    const allArtists = await prismaAdmin.artist.findMany({
      select: {
        id: true,
        discipline: true,
        images: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            country: true
          }
        },
        // Only the count is used below; the comment above promised no
        // booking row would leave this function, but the old `...artist`
        // spread in the response handed the full rows (hotelId, dates,
        // notes, payment amounts) to anyone hitting this public,
        // unauthenticated endpoint. Selecting just `id` here makes that
        // impossible to regress into.
        bookings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: { id: true }
        }
      }
    });

    // Sort: artists with bookings first, then artists with images, then others
    const sortedArtists = allArtists.sort((a, b) => {
      const aHasBookings = a.bookings && a.bookings.length > 0;
      const bHasBookings = b.bookings && b.bookings.length > 0;
      
      // Check if artist has images (handle both string and array formats)
      let aHasImages = false;
      if (a.images) {
        if (typeof a.images === 'string') {
          aHasImages = a.images.trim() !== '' && a.images !== '[]' && a.images !== 'null';
        } else if (Array.isArray(a.images)) {
          aHasImages = (a.images as any[]).length > 0;
        }
      }
      
      let bHasImages = false;
      if (b.images) {
        if (typeof b.images === 'string') {
          bHasImages = b.images.trim() !== '' && b.images !== '[]' && b.images !== 'null';
        } else if (Array.isArray(b.images)) {
          bHasImages = (b.images as any[]).length > 0;
        }
      }
      
      if (aHasBookings && !bHasBookings) return -1;
      if (!aHasBookings && bHasBookings) return 1;
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      return (b.bookings?.length || 0) - (a.bookings?.length || 0);
    });

    const topArtists = sortedArtists.slice(0, limit);

    // Fetch all ratings for top artists in a single query (more efficient)
    const artistIds = topArtists.map(a => a.id);
    const allRatings = await prisma.rating.findMany({
      where: { artistId: { in: artistIds } },
      select: { artistId: true, stars: true }
    });

    // Group ratings by artistId
    const ratingsByArtist = allRatings.reduce((acc, rating) => {
      if (!acc[rating.artistId]) {
        acc[rating.artistId] = [];
      }
      acc[rating.artistId].push(rating.stars);
      return acc;
    }, {} as Record<string, number[]>);

    // Add rating badges (no additional queries needed)
    const artistsWithBadges = topArtists.map((artist) => {
      const ratings = ratingsByArtist[artist.id] || [];
      let ratingBadge = null;
      // Returned alongside the badge. It was computed here, used to pick the
      // badge and then dropped, so the client tried to read the number back
      // out of the badge text - and got it wrong for every artist.
      let averageRating: number | null = null;
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        averageRating = Math.round(avgRating * 10) / 10;
        if (avgRating >= 4.5) {
          ratingBadge = 'Top 10 % des artistes';
        } else if (avgRating >= 4.0) {
          ratingBadge = 'Artiste confirmé';
        } else if (avgRating >= 3.5) {
          ratingBadge = 'Artiste recommandé';
        }
      }

      let images = [];
      if (artist.images) {
        try {
          images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
        } catch {
          images = [];
        }
      }
      
      // Named fields only - never spread the Prisma row here. This is a
      // public, unauthenticated endpoint; the full row carries referralCode,
      // loyaltyPoints, bookingCreditCost and phone, none of which belong on
      // a landing-page ranking.
      return {
        id: artist.id,
        discipline: artist.discipline,
        images,
        createdAt: artist.createdAt,
        user: artist.user,
        ratingBadge,
        averageRating,
        ratingCount: ratings.length,
        bookingCount: artist.bookings?.length || 0
      };
    });

    res.json({
      success: true,
      data: artistsWithBadges
    });
  } else if (type === 'hotels') {
    // Get top hotels by booking count
    const topHotels = await prisma.hotel.findMany({
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        images: true,
        performanceSpots: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            country: true
          }
        },
        // Only the count is used below; see the equivalent note on the
        // artists branch above about why this must stay `select: { id }`
        // rather than the full row.
        bookings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: { id: true }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      }
    });

    const hotelsWithStats = topHotels.map(hotel => {
      let location = null;
      let images = [];
      
      if (hotel.location) {
        try {
          location = typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location;
        } catch {
          location = null;
        }
      }
      
      if (hotel.images) {
        try {
          images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
        } catch {
          images = [];
        }
      }
      
      // Named fields only - never spread the Prisma row here. This is a
      // public, unauthenticated endpoint; the full row carries
      // responsibleEmail, responsiblePhone and contactPhone.
      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        performanceSpots: hotel.performanceSpots,
        createdAt: hotel.createdAt,
        user: hotel.user,
        bookingCount: hotel.bookings.length,
        location,
        images
      };
    });

    res.json({
      success: true,
      data: hotelsWithStats
    });
  } else {
    throw new CustomError('Invalid type. Use "artists" or "hotels".', 400);
  }
}));

// Get public stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalArtists,
    totalHotels,
    totalBookings,
    activeBookings,
    completedBookings,
    allHotels
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.hotel.count(),
    // Platform totals, not tenant data. An anonymous caller has no RLS identity,
    // so the request-scoped client would count only rows it can see - none - and
    // report 0 bookings on a table holding 12. These return counts, never rows.
    prismaAdmin.booking.count(),
    prismaAdmin.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prismaAdmin.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.hotel.findMany({
      select: {
        performanceSpots: true
      }
    })
  ]);

  // Calculate total performance venues from all hotels
  let totalVenues = 0
  allHotels.forEach(hotel => {
    if (hotel.performanceSpots) {
      try {
        const spots = typeof hotel.performanceSpots === 'string' 
          ? JSON.parse(hotel.performanceSpots) 
          : hotel.performanceSpots
        totalVenues += Array.isArray(spots) ? spots.length : 0
      } catch {
        // Ignore parse errors
      }
    }
  })

  // Calculate average rating from all ratings
  const ratings = await prisma.rating.findMany({
    select: { stars: true }
  })
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0

  res.json({
    success: true,
    data: {
      totalArtists,
      totalHotels,
      totalBookings,
      activeBookings,
      completedBookings,
      totalVenues,
      averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
    }
  });
}));

// Get testimonials from ratings
router.get('/testimonials', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 6
  
  // Get ratings with hotel and artist information
  const allRatings = await prisma.rating.findMany({
    take: limit * 2, // Get more to filter out empty reviews
    include: {
      hotel: {
        include: {
          user: {
            select: {
              name: true,
              country: true
            }
          }
        }
      },
      artist: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter out ratings without text reviews
  const ratings = allRatings.filter(r => r.textReview && r.textReview.trim().length > 0).slice(0, limit)

  const testimonials = ratings.map(rating => {
    let location = null
    if (rating.hotel?.location) {
      try {
        location = typeof rating.hotel.location === 'string' 
          ? JSON.parse(rating.hotel.location) 
          : rating.hotel.location
      } catch {
        location = null
      }
    }

    return {
      id: rating.id,
      rating: rating.stars,
      comment: rating.textReview,
      hotelName: rating.hotel?.user?.name || 'Hotel Partner',
      location: location 
        ? `${location.city || ''}, ${location.country || ''}`.trim()
        : rating.hotel?.user?.country || '',
      createdAt: rating.createdAt
    }
  })

  res.json({
    success: true,
    data: testimonials
  })
}));

export { router as commonRoutes };



