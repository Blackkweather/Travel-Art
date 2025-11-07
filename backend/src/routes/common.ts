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
    // Get top artists by booking count and ratings
    const topArtists = await prisma.artist.findMany({
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
          bookingCount: artist.bookings.length,
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



