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

      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        priceFrom: Number(t.priceFrom),
        priceTo: Number(t.priceTo),
        location: t.location,
        images: images,
        status: t.status,
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
    });

    if (!trip || trip.status !== 'PUBLISHED') {
      // Pretend it doesn't exist for drafts/archived (security)
      throw new CustomError('Trip not found', 404);
    }

    // Parse images JSON string to array
    let images = [];
    try {
      images = typeof trip.images === 'string' ? JSON.parse(trip.images) : (trip.images || []);
    } catch (e) {
      images = [];
    }

    res.json({
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      description: trip.description,
      priceFrom: Number(trip.priceFrom),
      priceTo: Number(trip.priceTo),
      location: trip.location,
      images: images,
      status: trip.status,
    });
  }),
);

export { router as tripRoutes };




