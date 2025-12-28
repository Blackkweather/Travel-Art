import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const artistProfileSchema = z.object({
  bio: z.string().min(10).max(1000).optional(),
  discipline: z.string().min(2).max(50).optional(),
  priceRange: z.string().min(1).max(20).optional(),
  images: z.string().optional(), // JSON string
  videos: z.string().optional(), // JSON string
  mediaUrls: z.string().optional(), // JSON string
  stageName: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
  artisticProfile: z.string().optional() // JSON string
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

// Search and filter artists (must come before /:id route)
router.get('/', asyncHandler(async (req, res) => {
  try {
    const query = req.query;
    const { discipline, location, dateFrom, dateTo, page, limit } = {
      discipline: query.discipline as string | undefined,
      location: query.location as string | undefined,
      dateFrom: query.dateFrom as string | undefined,
      dateTo: query.dateTo as string | undefined,
      page: query.page as string || '1',
      limit: query.limit as string || '10'
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Simple where clause - avoid nested queries for SQLite compatibility
    const where: any = {};

    // Only add discipline filter if provided (simple contains works in SQLite)
    if (discipline) {
      where.discipline = { contains: discipline };
    }

    // Fetch artists with user info
    const [allArtists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
        orderBy: { createdAt: 'desc' } as any
      }).catch(() => []),
      prisma.artist.count({ where }).catch(() => 0)
    ]);

    // Apply location filter in memory if needed (SQLite-friendly)
    let artists = allArtists;
    if (location) {
      artists = allArtists.filter(a => 
        a.user?.country?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply date filter in memory if needed
    if (dateFrom && dateTo) {
      const dateFromFilter = new Date(dateFrom);
      const dateToFilter = new Date(dateTo);
      artists = artists.filter(a => 
        a.availability.some(av => 
          av.dateFrom <= dateToFilter && av.dateTo >= dateFromFilter
        )
      );
    }

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

      let images = [];
      let videos = [];
      let mediaUrls = [];
      
      if (artist.images) {
        try {
          images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
        } catch (e) {
          images = [];
        }
      }
      
      if (artist.videos) {
        try {
          videos = typeof artist.videos === 'string' ? JSON.parse(artist.videos) : artist.videos;
        } catch (e) {
          videos = [];
        }
      }
      
      if (artist.mediaUrls) {
        try {
          mediaUrls = typeof artist.mediaUrls === 'string' ? JSON.parse(artist.mediaUrls) : artist.mediaUrls;
        } catch (e) {
          mediaUrls = [];
        }
      }

      return {
        ...artist,
        ratingBadge,
        images: images,
        videos: videos,
        mediaUrls: mediaUrls
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
  } catch (error: unknown) {
    console.error('Error fetching artists:', error);
    throw new CustomError('Failed to fetch artists', 500);
  }
}));

// Get current user's artist profile (must come before /:id route)
router.get('/me', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const artist = await prisma.artist.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          createdAt: true
        }
      },
      availability: {
        where: {
          dateFrom: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      },
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          hotel: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      },
      ratings: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!artist) {
    // Return a response indicating no profile exists yet, instead of throwing an error
    // This allows the frontend to handle it gracefully
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Artist profile not found. Please create your profile first.'
    });
  }

  // Calculate average rating
  const ratings = await prisma.rating.findMany({
    where: { artistId: artist.id },
    select: { stars: true }
  });

  let avgRating = 0;
  if (ratings.length > 0) {
    avgRating = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
  }

  // Parse JSON strings
  let images = [];
  let videos = [];
  let mediaUrls = [];
  
  if (artist.images) {
    try {
      images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
    } catch (e) {
      images = [];
    }
  }
  
  if (artist.videos) {
    try {
      videos = typeof artist.videos === 'string' ? JSON.parse(artist.videos) : artist.videos;
    } catch (e) {
      videos = [];
    }
  }
  
  if (artist.mediaUrls) {
    try {
      mediaUrls = typeof artist.mediaUrls === 'string' ? JSON.parse(artist.mediaUrls) : artist.mediaUrls;
    } catch (e) {
      mediaUrls = [];
    }
  }

  res.json({
    success: true,
    data: {
      ...artist,
      avgRating,
      totalRatings: ratings.length,
      images,
      videos,
      mediaUrls
    }
  });
}));

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

  let images = [];
  let videos = [];
  let mediaUrls = [];
  
  if (artist.images) {
    try {
      images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
    } catch (e) {
      images = [];
    }
  }
  
  if (artist.videos) {
    try {
      videos = typeof artist.videos === 'string' ? JSON.parse(artist.videos) : artist.videos;
    } catch (e) {
      videos = [];
    }
  }
  
  if (artist.mediaUrls) {
    try {
      mediaUrls = typeof artist.mediaUrls === 'string' ? JSON.parse(artist.mediaUrls) : artist.mediaUrls;
    } catch (e) {
      mediaUrls = [];
    }
  }

  res.json({
    success: true,
    data: {
      ...artist,
      ratingBadge,
      images: images,
      videos: videos,
      mediaUrls: mediaUrls
    }
  });
}));

// Update artist profile (own profile)
router.put('/me', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = artistProfileSchema.parse(req.body);

  const artist = await prisma.artist.findUnique({
    where: { userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist profile not found', 404);
  }

  const updatedArtist = await prisma.artist.update({
    where: { id: artist.id },
    data: profileData,
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
    data: updatedArtist
  });
}));

// Create or update artist profile (legacy endpoint for backward compatibility)
router.post('/', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = artistProfileSchema.parse(req.body);

  const artist = await prisma.artist.upsert({
    where: { userId: req.user!.id },
    update: profileData,
    create: {
      userId: req.user!.id,
      ...profileData
    } as any,
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

// Delete artist profile
router.delete('/:id', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const artist = await prisma.artist.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist not found or access denied.', 404);
  }

  await prisma.artist.delete({ where: { id } });

  res.json({
    success: true,
    data: { id }
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


export { router as artistRoutes };

