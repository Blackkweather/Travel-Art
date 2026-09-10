import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { parseJsonField } from '../utils/parseJsonField';

const router = Router();

// GET /api/trips - list published trips (optionally filtered)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { destination } = req.query;

    const where: any = { status: 'PUBLISHED' };

    // PostgreSQL supports case-insensitive filtering
    if (destination && typeof destination === 'string') {
      where.location = {
        contains: destination,
        mode: 'insensitive'
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        hotel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Do not expose internal fields like createdAt/updatedAt
    const safeTrips = trips.map((t) => {
      const images = parseJsonField<string[]>(t.images, []);
      const location = parseJsonField(t.location, { city: 'Lieu inconnu', country: '' });

      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        priceFrom: Number(t.priceFrom),
        priceTo: Number(t.priceTo),
        location: location,
        images: images,
        status: t.status,
        type: t.type || null,
        rating: t.rating ? Number(t.rating) : null,
        // Was missing entirely, so every card on /experiences fell back to
        // "today" client-side regardless of the trip's real scheduled date -
        // while the detail page, which does select it, showed the actual
        // date. Same field, same format as the detail route below.
        date: t.date ? t.date.toISOString() : null,
        artist: t.artist?.user?.name || null,
        hotel: t.hotel?.name || null,
      };
    });

    // Same envelope as the rest of the API. This endpoint returned a bare
    // array, which is why every consumer carried shape-detection.
    res.json({ success: true, data: { trips: safeTrips } });
  }),
);

// GET /api/trips/:id - trip details (only if published)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
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
                name: true
              }
            }
          }
        }
      }
    });

    if (!trip || trip.status !== 'PUBLISHED') {
      // Pretend it doesn't exist for drafts/archived (security)
      throw new CustomError('Trip not found', 404);
    }

    // Parse JSON strings
    const images = parseJsonField<string[]>(trip.images, []);
    const location = parseJsonField(trip.location, { city: 'Lieu inconnu', country: '' });
    const schedule = parseJsonField<any[]>(trip.schedule, []);
    const includes = parseJsonField<any[]>(trip.includes, []);
    const reviews = parseJsonField<any[]>(trip.reviews, []);

    res.json({
      success: true,
      data: {
        id: trip.id,
        title: trip.title,
        slug: trip.slug,
        description: trip.description,
        priceFrom: Number(trip.priceFrom),
        priceTo: Number(trip.priceTo),
        location: location,
        images: images,
        status: trip.status,
        // Additional fields from database
        type: trip.type || null,
        rating: trip.rating ? Number(trip.rating) : null,
        date: trip.date ? trip.date.toISOString() : null,
        duration: trip.duration || null,
        capacity: trip.capacity || null,
        schedule: schedule,
        includes: includes,
        artistBio: trip.artistBio || null,
        venueDetails: trip.venueDetails || null,
        reviews: reviews,
        // Related data
        artist: trip.artist ? {
          id: trip.artist.id,
          name: trip.artist.user?.name || 'Artiste',
          bio: trip.artist.bio || null
        } : null,
        hotel: trip.hotel ? {
          id: trip.hotel.id,
          name: trip.hotel.name || 'Hôtel',
          description: trip.hotel.description || null
        } : null,
      },
    });
  }),
);

export { router as tripRoutes };




