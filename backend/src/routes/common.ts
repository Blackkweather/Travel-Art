import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const referralSchema = z.object({
  inviteeEmail: z.string().email(),
  inviteeName: z.string().min(2).max(100)
});

// Create referral
router.post('/referrals', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { inviteeEmail, inviteeName } = referralSchema.parse(req.body);

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

  // Create referral record (invitee will be created when they register)
  const referral = await prisma.referral.create({
    data: {
      inviterUserId: req.user!.id,
      inviteeUserId: '', // Will be updated when invitee registers
      rewardPoints: 100
    }
  });

  // TODO: Send email invitation
  console.log(`Referral invitation sent to ${inviteeEmail} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    data: referral
  });
}));

// Get top artists/hotels
router.get('/top', asyncHandler(async (req, res) => {
  const { type, period = 'month' } = req.query;

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

        return {
          ...artist,
          ratingBadge,
          bookingCount: artist.bookings.length,
          images: artist.images ? JSON.parse(artist.images) : []
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

    const hotelsWithStats = topHotels.map(hotel => ({
      ...hotel,
      bookingCount: hotel.bookings.length,
      location: hotel.location ? JSON.parse(hotel.location) : null,
      images: hotel.images ? JSON.parse(hotel.images) : []
    }));

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


