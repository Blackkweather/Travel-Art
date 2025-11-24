import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

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
      // Parse images JSON string to array
      let images = [];
      try {
        images = typeof t.images === 'string' ? JSON.parse(t.images) : (t.images || []);
      } catch (e) {
        images = [];
      }

      // Parse location
      let location = null;
      try {
        location = typeof t.location === 'string' ? JSON.parse(t.location) : t.location;
      } catch (e) {
        location = { city: 'Unknown', country: '' };
      }

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
        artist: t.artist?.user?.name || null,
        hotel: t.hotel?.name || null,
      };
    });

    res.json(safeTrips);
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
    let images = [];
    try {
      images = typeof trip.images === 'string' ? JSON.parse(trip.images) : (trip.images || []);
    } catch (e) {
      images = [];
    }

    let location = null;
    try {
      location = typeof trip.location === 'string' ? JSON.parse(trip.location) : trip.location;
    } catch (e) {
      location = { city: 'Unknown', country: '' };
    }

    let schedule = [];
    try {
      schedule = trip.schedule ? (typeof trip.schedule === 'string' ? JSON.parse(trip.schedule) : trip.schedule) : [];
    } catch (e) {
      schedule = [];
    }

    let includes = [];
    try {
      includes = trip.includes ? (typeof trip.includes === 'string' ? JSON.parse(trip.includes) : trip.includes) : [];
    } catch (e) {
      includes = [];
    }

    let reviews = [];
    try {
      reviews = trip.reviews ? (typeof trip.reviews === 'string' ? JSON.parse(trip.reviews) : trip.reviews) : [];
    } catch (e) {
      reviews = [];
    }

    res.json({
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
        name: trip.artist.user?.name || 'Artist',
        bio: trip.artist.bio || null
      } : null,
      hotel: trip.hotel ? {
        id: trip.hotel.id,
        name: trip.hotel.name || 'Hotel',
        description: trip.hotel.description || null
      } : null,
    });
  }),
);

export { router as tripRoutes };




