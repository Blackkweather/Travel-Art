import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { tripSelect, toTripDTO } from '../views/trip';

const router = Router();

// GET /api/trips - published experiences, optionally filtered by place.
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const where: any = { status: 'PUBLISHED' };
  const destination = typeof req.query.destination === 'string' ? req.query.destination.trim() : '';
  if (destination) {
    where.OR = [
      { city: { contains: destination, mode: 'insensitive' } },
      { country: { contains: destination, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.trip.findMany({ where, select: tripSelect, orderBy: { createdAt: 'desc' }, take: 200 });

  // The listing card needs the short form; the detail route returns everything.
  const trips = rows.map((row) => {
    const t = toTripDTO(row);
    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      description: t.description,
      priceFrom: t.priceFrom,
      priceTo: t.priceTo,
      location: t.location,
      images: t.images,
      status: t.status,
      type: t.type,
      rating: t.rating,
      date: t.date,
      duration: t.duration,
      artist: row.artist?.stageName || row.artist?.user?.name || null,
      hotel: row.hotel?.name || null,
    };
  });

  res.json({ success: true, data: { trips } });
}));

// GET /api/trips/:id - one published experience. Drafts answer 404.
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const row = await prisma.trip.findFirst({ where: { id: req.params.id, status: 'PUBLISHED' }, select: tripSelect });
  if (!row) throw new CustomError('Expérience introuvable.', 404);
  res.json({ success: true, data: toTripDTO(row) });
}));

export { router as tripRoutes };
