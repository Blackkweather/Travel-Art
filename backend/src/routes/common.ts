import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
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
      } catch (e) {
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
router.get('/top', asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (type === 'artists') {
    // Get top artists - prioritize those with bookings, but also include artists with images
    const allArtists = await prisma.artist.findMany({
      include: {
        user: {
          select: {
            name: true,
            country: true
          }
        },
        bookings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
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
          aHasImages = a.images.length > 0;
        }
      }
      
      let bHasImages = false;
      if (b.images) {
        if (typeof b.images === 'string') {
          bHasImages = b.images.trim() !== '' && b.images !== '[]' && b.images !== 'null';
        } else if (Array.isArray(b.images)) {
          bHasImages = b.images.length > 0;
        }
      }
      
      if (aHasBookings && !bHasBookings) return -1;
      if (!aHasBookings && bHasBookings) return 1;
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      return (b.bookings?.length || 0) - (a.bookings?.length || 0);
    });

    const topArtists = sortedArtists.slice(0, 10);

    // Add rating badges
    const artistsWithBadges = await Promise.all(
      topArtists.map(async (artist) => {
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

        let images = [];
        if (artist.images) {
          try {
            images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
          } catch (e) {
            images = [];
          }
        }
        
        return {
          ...artist,
          ratingBadge,
          bookingCount: artist.bookings?.length || 0,
          images: images
        };
      })
    );

    res.json({
      success: true,
      data: artistsWithBadges
    });
  } else if (type === 'hotels') {
    // Get top hotels by booking count
    const topHotels = await prisma.hotel.findMany({
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            country: true
          }
        },
        bookings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
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
        } catch (e) {
          location = null;
        }
      }
      
      if (hotel.images) {
        try {
          images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
        } catch (e) {
          images = [];
        }
      }
      
      return {
        ...hotel,
        bookingCount: hotel.bookings.length,
        location: location,
        images: images
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
    activeBookings
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.hotel.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } })
  ]);

  res.json({
    success: true,
    data: {
      totalArtists,
      totalHotels,
      totalBookings,
      activeBookings
    }
  });
}));

export { router as commonRoutes };



