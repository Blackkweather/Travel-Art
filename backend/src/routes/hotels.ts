import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { listableHotelWhere, ownHotelSelect, publicHotelSelect, toOwnHotel, toPublicHotel } from '../views/hotel';
import { listableArtistWhere } from '../views/artist';
import { hotelProfileUpdateSchema, normalizePhone } from '../shared/validation';
import { parseVideoUrl } from '../shared/media';
import { conflictFromUniqueError, findIdentityConflicts, hotelKey } from '../services/identity';
import { removeStoredFile } from '../services/storage';

const router = Router();

async function myHotel(userId: string) {
  const hotel = await prisma.hotel.findUnique({ where: { userId }, select: { id: true, name: true, city: true, country: true } });
  if (!hotel) throw new CustomError('Profil hôtel introuvable.', 404);
  return hotel;
}

/** Own-hotel routes take the id in the path for the client's convenience; it must be the caller's. */
async function assertOwnHotel(req: AuthRequest, hotelId: string) {
  const hotel = await prisma.hotel.findFirst({ where: { id: hotelId, userId: req.user!.id }, select: { id: true } });
  // 404 rather than 403, so the route cannot be used to learn which ids exist.
  if (!hotel) throw new CustomError('Hôtel introuvable.', 404);
}

const programmeSelect = {
  audiences: true, styles: true, eventTypes: true, appreciated: true, disliked: true,
  hasStage: true, stageDimensions: true, hasSound: true, soundDetails: true, lighting: true,
  hasScreens: true, hasCrew: true, collaborationTypes: true, conditions: true, durationType: true,
  residenceDuration: true, openDates: true, offersLodging: true, offersMeals: true, offersTransport: true,
  facilities: true, freedomLevel: true, expectations: true, possibilities: true, otherDetails: true,
  artistTypesNeeded: true, flowDescription: true, perWeek: true, perMonth: true, responseDelay: true,
  validationProcess: true, decisionMaker: true,
} as const;

async function loadOwnHotel(userId: string) {
  const row = await prisma.hotel.findUnique({
    where: { userId },
    select: { ...ownHotelSelect(), programme: { select: programmeSelect } },
  });
  if (!row) throw new CustomError('Profil hôtel introuvable.', 404);
  return { ...toOwnHotel(row), programme: row.programme };
}

// ------------------------------------------------------------- admin list

router.get('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
  const [rows, total] = await Promise.all([
    prisma.hotel.findMany({
      select: { id: true, userId: true, name: true, city: true, country: true, user: { select: { id: true, name: true, email: true, country: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hotel.count(),
  ]);
  res.json({
    success: true,
    data: rows.map((h) => ({ ...h, location: { city: h.city, country: h.country } })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}));

// ------------------------------------------------------------- own profile

router.get('/me', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  res.json({ success: true, data: await loadOwnHotel(req.user!.id) });
}));

router.put('/me', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const input = hotelProfileUpdateSchema.parse(req.body);
  const userId = req.user!.id;
  const current = await myHotel(userId);

  const { spaces, programme, country, ...fields } = input;
  const data: Record<string, unknown> = { ...fields };
  if (country !== undefined) data.country = country;

  // Renaming or moving the hotel re-checks that no other account holds the pair.
  const name = input.name ?? current.name;
  const city = input.city ?? current.city;
  if (input.name !== undefined || input.city !== undefined) {
    data.nameKey = hotelKey(name, city);
    const conflicts = await findIdentityConflicts({ hotelName: name, hotelCity: city, excludeUserId: userId });
    if (conflicts.name) throw new CustomError(conflicts.name, 409, { fields: { name: conflicts.name } });
  }

  for (const key of ['contactPhone', 'responsiblePhone'] as const) {
    const value = input[key];
    if (value && !normalizePhone(value, country ?? current.country)) {
      throw new CustomError('Numéro de téléphone invalide pour ce pays', 400, {
        fields: { [key]: 'Numéro de téléphone invalide pour ce pays' },
      });
    }
  }

  try {
    // Ownership was established by myHotel() above; hotels are not RLS-scoped.
    await prismaAdmin.$transaction(async (tx) => {
      await tx.hotel.update({ where: { id: current.id }, data });

      if (programme) {
        await tx.hotelProgramme.upsert({
          where: { hotelId: current.id },
          create: { hotelId: current.id, ...programme },
          update: programme,
        });
      }

      // Spaces are edited as a list and saved as a list: the submitted one
      // replaces what was there. Their media are links, never uploads, so
      // nothing in storage is orphaned by the replacement.
      if (spaces) {
        await tx.hotelSpace.deleteMany({ where: { hotelId: current.id } });
        for (const [index, space] of spaces.entries()) {
          await tx.hotelSpace.create({
            data: {
              hotelId: current.id,
              name: space.name,
              type: space.type,
              setting: space.setting,
              capacity: space.capacity,
              description: space.description,
              hours: space.hours,
              noiseLevel: space.noiseLevel,
              position: index,
              media: {
                create: space.media.map((url, i) => {
                  const video = parseVideoUrl(url);
                  return video
                    ? { kind: 'VIDEO' as const, provider: video.provider, url: video.url, externalId: video.externalId, position: i }
                    : { kind: 'IMAGE' as const, provider: 'LINK' as const, url, position: i };
                }),
              },
            },
          });
        }
      }
    });
  } catch (error) {
    const conflict = conflictFromUniqueError(error);
    if (conflict) throw new CustomError(Object.values(conflict)[0], 409, { fields: conflict });
    throw error;
  }

  res.json({ success: true, data: await loadOwnHotel(userId) });
}));

/** Remove one of my gallery photos. Only rows I own; only files we stored leave storage. */
router.delete('/me/media/:mediaId', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const hotel = await myHotel(req.user!.id);
  const media = await prisma.media.findFirst({
    where: { id: req.params.mediaId, hotelId: hotel.id },
    select: { id: true, provider: true, storageKey: true, url: true },
  });
  if (!media) throw new CustomError('Média introuvable.', 404);
  await prisma.media.delete({ where: { id: media.id } });
  if (media.provider === 'UPLOAD' && media.storageKey) await removeStoredFile(media.url, media.storageKey);
  res.json({ success: true, data: { id: media.id } });
}));

// --------------------------------------------------------------- shortlist

router.get('/:id/favorites', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnHotel(req, req.params.id);
  const favorites = await prisma.hotelFavorite.findMany({
    where: { hotelId: req.params.id, artist: listableArtistWhere },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      hotelId: true,
      artistId: true,
      createdAt: true,
      artist: { select: { id: true, stageName: true, discipline: true, profilePicture: true, user: { select: { name: true } } } },
    },
  });
  res.json({ success: true, data: favorites });
}));

router.post('/:id/favorites', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnHotel(req, req.params.id);
  const { artistId } = z.object({ artistId: z.string().min(1) }).parse(req.body);
  const artist = await prisma.artist.findFirst({ where: { id: artistId, ...listableArtistWhere }, select: { id: true } });
  if (!artist) throw new CustomError('Artiste introuvable.', 404);
  // Shortlisting twice is the same intent as once: success, not a conflict.
  const favorite = await prisma.hotelFavorite.upsert({
    where: { hotelId_artistId: { hotelId: req.params.id, artistId } },
    create: { hotelId: req.params.id, artistId },
    update: {},
  });
  res.status(201).json({ success: true, data: favorite });
}));

router.delete('/:id/favorites/:artistId', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnHotel(req, req.params.id);
  await prisma.hotelFavorite.deleteMany({ where: { hotelId: req.params.id, artistId: req.params.artistId } });
  res.json({ success: true, data: { hotelId: req.params.id, artistId: req.params.artistId, removed: true } });
}));

router.get('/:id/credits', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnHotel(req, req.params.id);
  const credits = await prisma.credit.findUnique({ where: { hotelId: req.params.id } });
  res.json({
    success: true,
    data: {
      availableCredits: credits ? credits.totalCredits - credits.usedCredits : 0,
      totalCredits: credits?.totalCredits ?? 0,
      usedCredits: credits?.usedCredits ?? 0,
    },
  });
}));

// ----------------------------------------------------------- public profile

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const viewer = req.user!;
  const row = await prisma.hotel.findFirst({
    where: {
      id: req.params.id,
      ...(viewer.role === 'ADMIN' ? {} : { OR: [listableHotelWhere, { userId: viewer.id }] }),
    },
    select: publicHotelSelect(),
  });
  if (!row) throw new CustomError('Hôtel introuvable.', 404);

  const stars = await prisma.rating.findMany({ where: { hotelId: row.id }, select: { stars: true } });
  const averageRating = stars.length ? Math.round((stars.reduce((s, r) => s + r.stars, 0) / stars.length) * 10) / 10 : null;

  res.json({ success: true, data: toPublicHotel(row, { averageRating, ratingCount: stars.length }) });
}));

export { router as hotelRoutes };
