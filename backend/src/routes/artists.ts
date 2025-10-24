import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const artistProfileSchema = z.object({
  bio: z.string().min(10).max(1000),
  discipline: z.string().min(2).max(50),
  priceRange: z.string().min(1).max(20),
  images: z.string().optional(), // JSON string
  videos: z.string().optional(), // JSON string
  mediaUrls: z.string().optional() // JSON string
});

const availabilitySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime()
});

const searchSchema = z.object({
  discipline: z.string().optional(),
  location: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10')
});

// Get public artist profile
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artist = await prisma.artist.findUnique({
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
      availability: {
        where: {
          dateFrom: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      }
    }
  });

  if (!artist) {
    throw new CustomError('Artist not found.', 404);
  }

  // Calculate aggregated rating badge (not numeric rating)
  const ratings = await prisma.rating.findMany({
    where: { artistId: id },
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

  res.json({
    success: true,
    data: {
      ...artist,
      ratingBadge,
      // Parse JSON strings
      images: artist.images ? JSON.parse(artist.images) : [],
      videos: artist.videos ? JSON.parse(artist.videos) : [],
      mediaUrls: artist.mediaUrls ? JSON.parse(artist.mediaUrls) : []
    }
  });
}));

// Create or update artist profile
router.post('/', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = artistProfileSchema.parse(req.body);

  const artist = await prisma.artist.upsert({
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
    data: artist
  });
}));

// Set artist availability
router.post('/:id/availability', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { dateFrom, dateTo } = availabilitySchema.parse(req.body);

  // Verify artist belongs to user
  const artist = await prisma.artist.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist not found or access denied.', 404);
  }

  const availability = await prisma.artistAvailability.create({
    data: {
      artistId: id,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo)
    }
  });

  res.status(201).json({
    success: true,
    data: availability
  });
}));

// Search and filter artists
router.get('/', asyncHandler(async (req, res) => {
  const { discipline, location, dateFrom, dateTo, page, limit } = searchSchema.parse(req.query);

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (discipline) {
    where.discipline = { contains: discipline, mode: 'insensitive' };
  }

  if (location) {
    where.user = {
      country: { contains: location, mode: 'insensitive' }
    };
  }

  if (dateFrom && dateTo) {
    where.availability = {
      some: {
        dateFrom: { lte: new Date(dateTo) },
        dateTo: { gte: new Date(dateFrom) }
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

export { router as artistRoutes };


