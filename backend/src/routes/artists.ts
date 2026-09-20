import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { parseJsonField } from '../utils/parseJsonField';

const router = Router();

// Validation schemas
const artistProfileSchema = z.object({
  bio: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(10).max(1000).optional()
  ),
  discipline: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2).max(50).optional()
  ),
  priceRange: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(1).max(20).optional()
  ),
  images: z.string().nullable().optional(), // JSON string
  videos: z.string().nullable().optional(), // JSON string
  mediaUrls: z.string().nullable().optional(), // JSON string
  stageName: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  artisticProfile: z.string().nullable().optional() // JSON string
});

const availabilitySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime()
});

// Search and filter artists (must come before /:id route)
// Signed in only: the roster is not public browsing, the way clubmedlive.fr
// keeps its resort/artist roster behind an account.
router.get('/', authenticate, asyncHandler(async (req, res) => {
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

    const now = new Date();

    /* Every filter belongs in the query.
       Location and dates used to be applied in memory, to the one page that
       had already come back from the database - so a search for India found
       nothing at all while the only Indian artist sat on page 2, and the
       pagination still reported 15 results across 2 pages because the count
       never saw the filters. A house looking for the one artist it wants was
       shown an empty shelf. */
    const where: any = {};

    // Postgres `contains` is case-sensitive: `dj` found nobody while `DJ`
    // found two, and disciplines here are free text an artist typed.
    if (discipline) {
      where.discipline = { contains: discipline, mode: 'insensitive' };
    }

    if (location) {
      where.user = { country: { contains: location, mode: 'insensitive' } };
    }

    /* A house books a week; the question is whether the artist's declared
       period *overlaps* that week. Asking instead for periods that begin
       after it - which is what the in-memory filter did, over a single row -
       could only ever match an artist who had not started yet. */
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
          // No email here. The route requires a token now, but the narrow
          // selection stays: a browse list has no business carrying it. The
          // single-artist route below and the hotel-scoped browse endpoint
          // already withhold it; this one used to hand out every artist's
          // address to anyone who paginated through it.
          user: {
            select: {
              id: true,
              name: true,
              country: true
            }
          },
          /* Periods that have not *ended*. This used to ask for periods that
             had not *begun*, which hid every artist whose season was already
             open - on the day this was found that was all fourteen of them,
             each free from that morning until March, and each invisible to
             every date search on the platform. */
          availability: {
            where: {
              dateTo: { gte: now }
            },
            orderBy: { dateFrom: 'asc' }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.artist.count({ where })
    ]);

    /* One query for the page, not one per artist. The errors these two used
       to swallow are worth keeping too: a database that times out should say
       so, not report a marketplace with no artists in it. */
    const artistIds = artists.map(a => a.id);
    const ratingRows = artistIds.length
      ? await prisma.rating.findMany({
          where: { artistId: { in: artistIds } },
          select: { artistId: true, stars: true }
        })
      : [];
    const starsByArtist = new Map<string, number[]>();
    for (const row of ratingRows) {
      const stars = starsByArtist.get(row.artistId) || [];
      stars.push(row.stars);
      starsByArtist.set(row.artistId, stars);
    }

    const artistsWithBadges = artists.map((artist) => {
      const ratings = (starsByArtist.get(artist.id) || []).map(stars => ({ stars }));

      let ratingBadge = null;
      // The average is returned alongside the badge. It used to be computed
      // here and then dropped, which left the client trying to read a number
      // back out of the badge text - and reading it wrong, since it tested for
      // 'Top 10%' against a string that says 'Top 10 % des artistes'.
      let averageRating: number | null = null;
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
        averageRating = Math.round(avgRating * 10) / 10;
        if (avgRating >= 4.5) {
          ratingBadge = 'Top 10 % des artistes';
        } else if (avgRating >= 4.0) {
          ratingBadge = 'Artiste confirmé';
        } else if (avgRating >= 3.5) {
          ratingBadge = 'Artiste recommandé';
        }
      }

      const images = parseJsonField<string[]>(artist.images, []);
      const videos = parseJsonField<string[]>(artist.videos, []);
      const mediaUrls = parseJsonField<string[]>(artist.mediaUrls, []);

      return {
        ...artist,
        ratingBadge,
        averageRating,
        ratingCount: ratings.length,
        images: images,
        videos: videos,
        mediaUrls: mediaUrls
      };
    });

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
      // Open now, or still to come. Asking for periods that have not begun
      // told an artist their own declared season did not exist.
      availability: {
        where: {
          dateTo: { gte: new Date() }
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
      },
      // The membership screen needs to know which tier is held, not just that
      // one is active — without it the UI cannot tell an ARTIST member from a
      // PROFESSIONAL one and marked both plans as current.
      memberships: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1
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
  const images = parseJsonField<string[]>(artist.images, []);
  const videos = parseJsonField<string[]>(artist.videos, []);
  const mediaUrls = parseJsonField<string[]>(artist.mediaUrls, []);

  res.json({
    success: true,
    data: {
      ...artist,
      avgRating,
      totalRatings: ratings.length,
      images,
      videos,
      mediaUrls,
      membershipTier: artist.memberships[0]?.tier ?? null
    }
  });
}));

// Get artist profile. Signed in only - see the note on GET / above.
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
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
          dateTo: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      }
    }
  });

  if (!artist) {
    throw new CustomError('Artist not found.', 404);
  }

  // Calculate aggregated rating badge and numeric average
  const ratings = await prisma.rating.findMany({
    where: { artistId: id },
    select: { stars: true }
  });

  let ratingBadge = null;
  let avgRating: number | null = null;
  if (ratings.length > 0) {
    avgRating = Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10;
    if (avgRating >= 4.5) {
      ratingBadge = 'Top 10 % des artistes';
    } else if (avgRating >= 4.0) {
      ratingBadge = 'Artiste confirmé';
    } else if (avgRating >= 3.5) {
      ratingBadge = 'Artiste recommandé';
    }
  }

  // This route requires a token, but it is not role-scoped, so the client
  // has no RLS identity and would silently count zero bookings regardless
  // of how many exist - the same gap that made this page disagree with the
  // artist's card on /top-artists (which already reads this count through
  // the privileged client). Only the count crosses this boundary, never a
  // booking row.
  const bookingCount = await prismaAdmin.booking.count({ where: { artistId: id } });

  const images = parseJsonField<string[]>(artist.images, []);
  const videos = parseJsonField<string[]>(artist.videos, []);
  const mediaUrls = parseJsonField<string[]>(artist.mediaUrls, []);

  res.json({
    success: true,
    data: {
      ...artist,
      ratingBadge,
      avgRating,
      bookingCount,
      images: images,
      videos: videos,
      mediaUrls: mediaUrls
    }
  });
}));

// Update artist profile (own profile)
router.put('/me', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = artistProfileSchema.parse(req.body);
  // Country lives on User, not Artist, so it's handled separately below.
  const { country } = req.body;

  const artist = await prisma.artist.findUnique({
    where: { userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist profile not found', 404);
  }

  // Update artist profile
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

  // Update user's country if provided
  if (country !== undefined && country !== null) {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { country: country || null }
    });
    
    // Fetch updated artist with new country
    const artistWithUpdatedCountry = await prisma.artist.findUnique({
      where: { id: artist.id },
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

    return res.json({
      success: true,
      data: artistWithUpdatedCountry
    });
  }

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

// Remove artist availability
router.delete('/:id/availability/:availabilityId', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { id, availabilityId } = req.params;

  // Verify artist belongs to user
  const artist = await prisma.artist.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist not found or access denied.', 404);
  }

  // Scoped to this artist too, not just the row's own id - otherwise any
  // authenticated artist could delete another artist's availability by guessing
  // its id.
  const deleted = await prisma.artistAvailability.deleteMany({
    where: { id: availabilityId, artistId: id }
  });

  if (deleted.count === 0) {
    throw new CustomError('Availability not found.', 404);
  }

  res.json({
    success: true,
    data: { id: availabilityId }
  });
}));


export { router as artistRoutes };

