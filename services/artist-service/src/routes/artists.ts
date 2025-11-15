import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@travel-art/shared/utils/errors';
import { authenticateToken, requireArtist, requireArtistOrAdmin } from '@travel-art/shared/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createArtistProfileSchema = z.object({
  userId: z.string(),
  bio: z.string().optional(),
  discipline: z.string(),
  priceRange: z.string()
});

const updateArtistProfileSchema = z.object({
  bio: z.string().optional(),
  discipline: z.string().optional(),
  priceRange: z.string().optional(),
  images: z.string().optional(),
  videos: z.string().optional(),
  mediaUrls: z.string().optional()
});

const availabilitySchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string()
});

// Get all artists (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      discipline, 
      priceRange, 
      rank,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      membershipStatus: 'ACTIVE'
    };

    if (discipline) where.discipline = discipline;
    if (priceRange) where.priceRange = priceRange;
    if (rank) where.rank = rank;

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { rank: 'desc' },
          { averageRating: 'desc' },
          { totalBookings: 'desc' }
        ]
      }),
      prisma.artist.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        artists,
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

// Get artist by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        availability: {
          where: {
            dateFrom: { gte: new Date() },
            isBooked: false
          }
        }
      }
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// Get artist by user ID
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const artist = await prisma.artist.findUnique({
      where: { userId },
      include: {
        availability: true
      }
    });

    if (!artist) {
      throw new NotFoundError('Artist profile not found');
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// Create artist profile
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createArtistProfileSchema.parse(req.body);

    // Check if profile already exists
    const existing = await prisma.artist.findUnique({
      where: { userId: data.userId }
    });

    if (existing) {
      throw new ValidationError('Artist profile already exists');
    }

    const artist = await prisma.artist.create({
      data: {
        userId: data.userId,
        bio: data.bio,
        discipline: data.discipline,
        priceRange: data.priceRange
      }
    });

    res.status(201).json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// Update artist profile
router.put('/:id', authenticateToken, requireArtistOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateArtistProfileSchema.parse(req.body);

    const artist = await prisma.artist.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// Add availability
router.post('/:id/availability', authenticateToken, requireArtistOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = availabilitySchema.parse(req.body);

    const availability = await prisma.artistAvailability.create({
      data: {
        artistId: id,
        dateFrom: new Date(data.dateFrom),
        dateTo: new Date(data.dateTo)
      }
    });

    res.status(201).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
});

// Get artist availability
router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const availability = await prisma.artistAvailability.findMany({
      where: {
        artistId: id,
        dateFrom: { gte: new Date() },
        isBooked: false
      },
      orderBy: { dateFrom: 'asc' }
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
});

// Update artist rank (admin only)
router.patch('/:id/rank', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rank } = req.body;

    if (!['STANDARD', 'PROFESSIONAL', 'DIAMOND', 'SUPERSTAR'].includes(rank)) {
      throw new ValidationError('Invalid rank');
    }

    const artist = await prisma.artist.update({
      where: { id },
      data: { rank }
    });

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

// Update artist statistics (internal service call)
router.patch('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { totalBookings, totalEarnings, averageRating } = req.body;

    const updateData: any = {};
    if (totalBookings !== undefined) updateData.totalBookings = totalBookings;
    if (totalEarnings !== undefined) updateData.totalEarnings = totalEarnings;
    if (averageRating !== undefined) updateData.averageRating = averageRating;

    const artist = await prisma.artist.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    next(error);
  }
});

export default router;































