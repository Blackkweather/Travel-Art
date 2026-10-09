import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import {
  artistCardSelect,
  listableArtistWhere,
  ownArtistSelect,
  summariseRatings,
  toArtistCard,
  toOwnArtist,
} from '../views/artist';
import { mediaSelect, toMediaDTO } from '../views/media';
import { artistProfileUpdateSchema, availabilitySchema, nameKey, normalizePhone, videoUrlSchema } from '../shared/validation';
import { categoryErrors, disciplineLabel } from '../shared/categories';
import { parseVideoUrl } from '../shared/media';
import { conflictFromUniqueError, findIdentityConflicts } from '../services/identity';
import { removeStoredFile } from '../services/storage';
import { ensureVerificationCode, verifyArtistVideo } from '../services/videoVerification';

const router = Router();

export const MAX_VIDEOS = 10;
export const MAX_AVAILABILITY_WINDOWS = 50;

const pageParams = (query: any, defaultLimit = 12) => {
  const page = Math.max(parseInt(String(query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(query.limit ?? defaultLimit), 10) || defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

/** Average and count per artist, in one query for the whole page. */
async function ratingsFor(artistIds: string[]) {
  const rows = artistIds.length
    ? await prisma.rating.findMany({ where: { artistId: { in: artistIds } }, select: { artistId: true, stars: true } })
    : [];
  const byArtist = new Map<string, number[]>();
  for (const row of rows) byArtist.set(row.artistId, [...(byArtist.get(row.artistId) ?? []), row.stars]);
  return (id: string) => summariseRatings(byArtist.get(id) ?? []);
}

async function myArtistId(userId: string): Promise<string> {
  const artist = await prisma.artist.findUnique({ where: { userId }, select: { id: true } });
  if (!artist) throw new CustomError('Profil artiste introuvable.', 404);
  return artist.id;
}

// ------------------------------------------------------------------ browse

/** Signed in only: the roster is not public browsing. */
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const q = req.query as Record<string, string | undefined>;

  const where: any = { ...listableArtistWhere, AND: [] as any[] };
  if (q.discipline) where.AND.push({ discipline: { contains: q.discipline, mode: 'insensitive' } });
  if (q.category) where.AND.push({ mainCategory: q.category });
  if (q.location) where.AND.push({ user: { country: { contains: q.location, mode: 'insensitive' } } });
  if (q.search) {
    where.AND.push({
      OR: [
        { stageName: { contains: q.search, mode: 'insensitive' } },
        { discipline: { contains: q.search, mode: 'insensitive' } },
        { tributeTo: { contains: q.search, mode: 'insensitive' } },
      ],
    });
  }
  // An artist is a match when their declared period overlaps the week asked for.
  if (q.dateFrom && q.dateTo && !isNaN(Date.parse(q.dateFrom)) && !isNaN(Date.parse(q.dateTo))) {
    where.AND.push({
      availability: { some: { dateFrom: { lte: new Date(q.dateTo) }, dateTo: { gte: new Date(q.dateFrom) } } },
    });
  }

  const [rows, total] = await Promise.all([
    prisma.artist.findMany({ where, select: artistCardSelect(), skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.artist.count({ where }),
  ]);
  const ratings = await ratingsFor(rows.map((r) => r.id));

  res.json({
    success: true,
    data: {
      artists: rows.map((row) => toArtistCard(row, { ratings: ratings(row.id), viewerRole: req.user!.role })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

// ------------------------------------------------------------- own profile

router.get('/me', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const row = await prisma.artist.findUnique({ where: { userId: req.user!.id }, select: ownArtistSelect() });
  if (!row) throw new CustomError('Profil artiste introuvable.', 404);
  const ratings = await ratingsFor([row.id]);
  res.json({ success: true, data: toOwnArtist(row, ratings(row.id)) });
}));

router.put('/me', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const input = artistProfileUpdateSchema.parse(req.body);
  const userId = req.user!.id;

  const current = await prisma.artist.findUnique({
    where: { userId },
    select: {
      id: true,
      stageName: true,
      mainCategory: true,
      categoryType: true,
      specificCategory: true,
      tributeTo: true,
      user: { select: { country: true, phone: true } },
    },
  });
  if (!current) throw new CustomError('Profil artiste introuvable.', 404);

  const artistData: Record<string, unknown> = {};
  const userData: Record<string, unknown> = {};

  if (input.bio !== undefined) artistData.bio = input.bio || null;
  if (input.audienceTypes !== undefined) artistData.audienceTypes = input.audienceTypes;
  if (input.languages !== undefined) artistData.languages = input.languages;
  if (input.otherLanguages !== undefined) artistData.otherLanguages = input.otherLanguages;
  if (input.secondaryCategory !== undefined) artistData.secondaryCategory = input.secondaryCategory || null;

  // Category: validate the selection as a whole, against what is stored.
  const touchesCategory = ['mainCategory', 'categoryType', 'specificCategory', 'tributeTo'].some((k) => (input as any)[k] !== undefined);
  if (touchesCategory) {
    const selection = {
      mainCategory: input.mainCategory ?? current.mainCategory ?? '',
      categoryType: input.categoryType ?? current.categoryType ?? '',
      specificCategory: input.specificCategory !== undefined ? input.specificCategory : current.specificCategory,
      tributeTo: input.tributeTo !== undefined ? input.tributeTo : current.tributeTo,
    };
    const errors = categoryErrors(selection);
    if (Object.keys(errors).length > 0) {
      throw new CustomError(Object.values(errors)[0], 400, { fields: errors });
    }
    Object.assign(artistData, {
      mainCategory: selection.mainCategory,
      categoryType: selection.categoryType,
      specificCategory: selection.specificCategory || null,
      tributeTo: selection.tributeTo || null,
      discipline: disciplineLabel(selection),
    });
  }

  const probe: Parameters<typeof findIdentityConflicts>[0] = { excludeUserId: userId };

  if (input.stageName !== undefined && input.stageName !== current.stageName) {
    artistData.stageName = input.stageName;
    artistData.stageNameKey = nameKey(input.stageName);
    probe.stageName = input.stageName;
  }

  const country = input.country ?? current.user.country;
  if (input.country !== undefined) userData.country = input.country;
  if (input.phone !== undefined || input.country !== undefined) {
    const phone = input.phone ?? current.user.phone ?? '';
    if (phone) {
      const e164 = normalizePhone(phone, country);
      if (!e164) {
        throw new CustomError('Numéro de téléphone invalide pour ce pays', 400, {
          fields: { phone: 'Numéro de téléphone invalide pour ce pays' },
        });
      }
      userData.phone = phone;
      userData.phoneE164 = e164;
      probe.phoneE164 = e164;
    }
  }

  const conflicts = await findIdentityConflicts(probe);
  if (Object.keys(conflicts).length > 0) {
    throw new CustomError(Object.values(conflicts)[0], 409, { fields: conflicts });
  }

  try {
    await prisma.$transaction([
      prisma.artist.update({ where: { id: current.id }, data: artistData }),
      ...(Object.keys(userData).length ? [prisma.user.update({ where: { id: userId }, data: userData })] : []),
    ]);
  } catch (error) {
    const fields = conflictFromUniqueError(error);
    if (fields) throw new CustomError(Object.values(fields)[0], 409, { fields });
    throw error;
  }

  const row = await prisma.artist.findUnique({ where: { id: current.id }, select: ownArtistSelect() });
  const ratings = await ratingsFor([current.id]);
  res.json({ success: true, data: toOwnArtist(row!, ratings(current.id)) });
}));

// ------------------------------------------------------------------- media

/** Add a performance video by link. Photos arrive through POST /api/upload/media. */
router.post('/me/videos', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { url, title } = z
    .object({ url: videoUrlSchema, title: z.string().trim().max(120).optional() })
    .parse(req.body);
  const video = parseVideoUrl(url)!;
  const artistId = await myArtistId(req.user!.id);

  const existing = await prisma.media.findMany({ where: { artistId, kind: 'VIDEO' }, select: { url: true } });
  if (existing.some((m) => m.url === video.url)) {
    throw new CustomError('Cette vidéo est déjà sur votre profil.', 409, { fields: { url: 'Cette vidéo est déjà sur votre profil.' } });
  }
  if (existing.length >= MAX_VIDEOS) {
    throw new CustomError(`${MAX_VIDEOS} vidéos maximum. Retirez-en une pour en ajouter une autre.`, 400, {
      fields: { url: `${MAX_VIDEOS} vidéos maximum.` },
    });
  }

  const media = await prisma.media.create({
    data: {
      artistId,
      kind: 'VIDEO',
      provider: video.provider,
      url: video.url,
      externalId: video.externalId,
      title: title || null,
      position: existing.length,
    },
    select: { id: true },
  });

  // Does it exist, whose channel is it, is that channel already proven?
  const outcome = await verifyArtistVideo(media.id, artistId).catch(() => null);
  if (outcome?.status === 'UNVERIFIED' && outcome.reason === 'NOT_FOUND') {
    await prisma.media.delete({ where: { id: media.id } });
    throw new CustomError('Cette vidéo est introuvable ou privée. Vérifiez le lien et sa visibilité (publique ou non répertoriée).', 400, {
      fields: { url: 'Vidéo introuvable ou privée.' },
    });
  }
  const row = await prisma.media.findUnique({ where: { id: media.id }, select: mediaSelect });
  res.status(201).json({ success: true, data: toMediaDTO(row!) });
}));

/** My personal code, to write in a video description to prove the channel is mine. */
router.get('/me/verification', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const artistId = await myArtistId(req.user!.id);
  const code = await ensureVerificationCode(artistId);
  res.json({ success: true, data: { code } });
}));

/** Check one of my videos for the code now. */
router.post('/me/videos/:mediaId/verify', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const artistId = await myArtistId(req.user!.id);
  const owned = await prisma.media.findFirst({ where: { id: req.params.mediaId, artistId, kind: 'VIDEO' }, select: { id: true } });
  if (!owned) throw new CustomError('Vidéo introuvable.', 404);

  const outcome = await verifyArtistVideo(owned.id, artistId);
  const messages: Record<string, string> = {
    CODE_IN_DESCRIPTION: 'Vidéo vérifiée : votre code est bien dans la description. Vos autres vidéos de la même chaîne le sont aussi.',
    SAME_CHANNEL: 'Vidéo vérifiée : elle vient d’une chaîne déjà vérifiée.',
    CODE_NOT_FOUND: 'Votre code n’apparaît pas encore dans la description. Ajoutez-le, enregistrez la vidéo sur la plateforme, puis réessayez dans une minute.',
    UNREACHABLE: 'La plateforme vidéo ne répond pas pour le moment. Réessayez dans quelques minutes.',
    NOT_FOUND: 'Cette vidéo est introuvable ou privée.',
    MANUAL_ONLY: 'Ce type de vidéo est vérifié par notre équipe lors de l’examen de votre profil.',
  };
  const key = outcome.status === 'VERIFIED' ? outcome.method : outcome.reason;
  const row = await prisma.media.findUnique({ where: { id: owned.id }, select: mediaSelect });
  res.json({ success: true, data: { media: toMediaDTO(row!), verified: outcome.status === 'VERIFIED', outcome: key, message: messages[key] } });
}));

/** Remove one of my photos or videos. Only rows I own; only files we stored are deleted from storage. */
router.delete('/me/media/:mediaId', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const artistId = await myArtistId(req.user!.id);
  const media = await prisma.media.findFirst({
    where: { id: req.params.mediaId, artistId },
    select: { id: true, provider: true, storageKey: true, url: true },
  });
  if (!media) throw new CustomError('Média introuvable.', 404);

  await prisma.media.delete({ where: { id: media.id } });
  if (media.provider === 'UPLOAD' && media.storageKey) {
    await removeStoredFile(media.url, media.storageKey);
  }
  res.json({ success: true, data: { id: media.id } });
}));

/** Reorder: the ids in display order. Ids that are not mine are refused, not ignored. */
router.put('/me/media/order', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { ids } = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) }).parse(req.body);
  const artistId = await myArtistId(req.user!.id);
  const owned = await prisma.media.count({ where: { id: { in: ids }, artistId } });
  if (owned !== new Set(ids).size) throw new CustomError('Média introuvable.', 404);
  await prisma.$transaction(ids.map((id, position) => prisma.media.update({ where: { id }, data: { position } })));
  res.json({ success: true, data: { ids } });
}));

// ------------------------------------------------------------ availability

async function assertOwnArtist(req: AuthRequest, artistId: string) {
  const artist = await prisma.artist.findFirst({ where: { id: artistId, userId: req.user!.id }, select: { id: true } });
  if (!artist) throw new CustomError('Profil artiste introuvable.', 404);
}

router.post('/:id/availability', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnArtist(req, req.params.id);
  const { dateFrom, dateTo } = availabilitySchema.parse(req.body);
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  if (to < startOfToday) {
    throw new CustomError('Cette période est déjà passée.', 400, { fields: { dateTo: 'Cette période est déjà passée.' } });
  }
  if (to.getTime() - from.getTime() > 2 * 366 * 24 * 3600 * 1000) {
    throw new CustomError('Une période ne peut pas dépasser deux ans.', 400, { fields: { dateTo: 'Deux ans maximum.' } });
  }
  const count = await prisma.artistAvailability.count({ where: { artistId: req.params.id, dateTo: { gte: startOfToday } } });
  if (count >= MAX_AVAILABILITY_WINDOWS) {
    throw new CustomError(`${MAX_AVAILABILITY_WINDOWS} périodes maximum.`, 400);
  }

  const availability = await prisma.artistAvailability.create({
    data: { artistId: req.params.id, dateFrom: from, dateTo: to },
    select: { id: true, artistId: true, dateFrom: true, dateTo: true },
  });
  res.status(201).json({ success: true, data: availability });
}));

router.delete('/:id/availability/:availabilityId', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  await assertOwnArtist(req, req.params.id);
  // Scoped to this artist, so nobody deletes another artist's period by guessing its id.
  const deleted = await prisma.artistAvailability.deleteMany({
    where: { id: req.params.availabilityId, artistId: req.params.id },
  });
  if (deleted.count === 0) throw new CustomError('Période introuvable.', 404);
  res.json({ success: true, data: { id: req.params.availabilityId } });
}));

// ----------------------------------------------------------- public profile

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const viewer = req.user!;
  const row = await prisma.artist.findFirst({
    where: {
      id: req.params.id,
      // An artist not yet admitted is visible to themself and to admins only.
      ...(viewer.role === 'ADMIN' ? {} : { OR: [listableArtistWhere, { userId: viewer.id }] }),
    },
    select: artistCardSelect(),
  });
  if (!row) throw new CustomError('Artiste introuvable.', 404);

  const ratings = await ratingsFor([row.id]);
  // A count only - never a booking row - read across tenants on purpose.
  const bookingCount = await prismaAdmin.booking.count({ where: { artistId: row.id, status: { in: ['CONFIRMED', 'COMPLETED'] } } });

  res.json({
    success: true,
    data: toArtistCard(row, { ratings: ratings(row.id), bookingCount, viewerRole: viewer.role }),
  });
}));

export { router as artistRoutes };
