import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { Dataset, ExportFormat, sendExport } from '../utils/exporter';
import { approvedEmail, rejectedEmail, verificationEmail } from '../services/email';
import { config } from '../config';
import { adminUserSelect } from '../views/user';
import { bookingSelect, toBookingDTO } from '../views/booking';
import { mediaOrder, mediaSelect, splitMedia, toMediaDTO } from '../views/media';
import { fetchVideoFacts, verifyOtherVideosFromChannel } from '../services/videoVerification';
import { notify } from '../services/notifications';
import { verifyLinkFor } from './auth';
import { BOARD_LABELS, TRANSPORT_LABELS } from '../shared/validation';
import { BOOKING_STATUSES } from '../shared/status';

const router = Router();

// Validation schemas
const suspendUserSchema = z.object({
  reason: z.string().min(5).max(200)
});

// Get admin dashboard data
router.get('/dashboard', authenticate, authorize('ADMIN'), asyncHandler(async (_req: AuthRequest, res) => {
  const [totalUsers, totalArtists, totalHotels, activeBookings, pendingAdmissions, revenue, recent, topArtists, topHotels] =
    await Promise.all([
      prisma.user.count(),
      prisma.artist.count(),
      prisma.hotel.count(),
      prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.user.count({ where: { approvalStatus: 'PENDING', role: { in: ['ARTIST', 'HOTEL'] } } }),
      // Real money only: what Stripe confirmed.
      prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amountCents: true } }),
      prisma.booking.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: bookingSelect }),
      prisma.artist.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, stageName: true, discipline: true, profilePicture: true, createdAt: true,
          user: { select: { name: true, email: true } },
          media: { select: mediaSelect, orderBy: mediaOrder },
        },
      }),
      prisma.hotel.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, city: true, country: true, profilePicture: true, createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { spaces: true } },
        },
      }),
    ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalArtists,
        totalHotels,
        activeBookings,
        pendingAdmissions,
        totalRevenue: (revenue._sum.amountCents ?? 0) / 100,
      },
      recentBookings: recent.map((b) => toBookingDTO(b, 'ADMIN')),
      topArtists: topArtists.map(({ media, ...a }) => ({ ...a, ...splitMedia(media) })),
      topHotels: topHotels.map(({ _count, ...h }) => ({ ...h, location: { city: h.city, country: h.country }, spaceCount: _count.spaces })),
    },
  });
}));

// Suspend user
router.post('/users/:id/suspend', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = suspendUserSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  if (user.role === 'ADMIN') {
    throw new CustomError('Cannot suspend admin users.', 403);
  }

  // Update user status. approvalNote already carries "why this account can't
  // sign in" for a rejected application (see auth.ts /login); reusing it here
  // means a suspension reason is shown to the user the same way instead of
  // being validated and then thrown away, which is what happened before -
  // `reason` was required on the request and never written anywhere.
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: false, sessionsValidFrom: new Date(), approvalNote: reason },
    select: adminUserSelect,
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      action: 'SUSPEND_USER',
      actorUserId: req.user!.id,
      targetId: id
    }
  });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Activate user
router.post('/users/:id/activate', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  // Update user status. Clears any suspension note left by a previous
  // suspend, so a reactivated account doesn't still report the old reason if
  // it's ever suspended again without one.
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: true, approvalNote: null },
    select: adminUserSelect,
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      action: 'ACTIVATE_USER',
      actorUserId: req.user!.id,
      targetId: id
    }
  });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Export data
/**
 * Applications awaiting review, oldest first.
 *
 * Oldest-first is the point: newest-first quietly buries anyone who applied
 * during a busy week under everyone who applied after them.
 */
router.get('/admissions', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const status = String(req.query.status ?? 'PENDING').toUpperCase();
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    throw new CustomError('Statut invalide.', 400);
  }

  const rows = await prisma.user.findMany({
    where: { approvalStatus: status as 'PENDING' | 'APPROVED' | 'REJECTED', role: { in: ['ARTIST', 'HOTEL'] } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, email: true, role: true, country: true, phone: true, createdAt: true,
      emailVerified: true, approvalStatus: true, approvalNote: true, reviewedAt: true,
      artist: {
        select: {
          stageName: true, discipline: true, bio: true, birthDate: true, mainCategory: true, categoryType: true,
          specificCategory: true, tributeTo: true, languages: true, audienceTypes: true, profilePicture: true,
          media: { select: mediaSelect, orderBy: mediaOrder },
        },
      },
      hotel: {
        select: {
          name: true, city: true, country: true, address: true, description: true, hotelType: true, roomCount: true,
          website: true, instagramUrl: true, profilePicture: true,
          spaces: { select: { name: true, capacity: true, setting: true }, orderBy: { position: 'asc' } },
        },
      },
      referralsReceived: { select: { inviter: { select: { name: true } } }, take: 1 },
    },
  });

  // Everything an admin needs to decide: who, what they do, and their work.
  const applications = rows.map(({ artist, hotel, referralsReceived, ...user }) => ({
    ...user,
    referredBy: referralsReceived[0]?.inviter.name ?? null,
    artist: artist ? { ...artist, ...splitMedia(artist.media) } : null,
    hotel: hotel ? { ...hotel, location: { city: hotel.city, country: hotel.country } } : null,
  }));

  const pendingCount = await prisma.user.count({
    where: { approvalStatus: 'PENDING', role: { in: ['ARTIST', 'HOTEL'] } }
  });

  res.json({ success: true, data: { applications, pendingCount } });
}));

/**
 * Admit an application. Idempotent. Refused until the applicant has confirmed
 * their e-mail: an account admitted on an address nobody controls is how
 * test@test.com became a member.
 *
 * Referral points are credited here, on admission, not at sign-up - so a
 * referral code cannot be farmed with accounts that are never admitted.
 */
router.post('/admissions/:id/approve', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, role: true, email: true, name: true, emailVerified: true },
  });
  if (!user) throw new CustomError('Utilisateur introuvable.', 404);
  if (user.role === 'ADMIN') throw new CustomError('Un administrateur n’a pas à être admis.', 400);
  if (!user.emailVerified) {
    throw new CustomError(
      'Ce candidat n’a pas encore confirmé son adresse e-mail. Renvoyez-lui le lien de confirmation, puis admettez-le une fois l’adresse confirmée.',
      409,
      { code: 'EMAIL_NOT_VERIFIED' }
    );
  }

  await prismaAdmin.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { approvalStatus: 'APPROVED', approvalNote: null, reviewedAt: new Date(), reviewedById: req.user!.id, isActive: true },
    });

    const referral = await tx.referral.findFirst({
      where: { inviteeUserId: user.id, rewardedAt: null },
      select: { id: true, inviterUserId: true, rewardPoints: true },
    });
    if (referral) {
      await tx.referral.update({ where: { id: referral.id }, data: { rewardedAt: new Date() } });
      await tx.artist.updateMany({ where: { userId: referral.inviterUserId }, data: { loyaltyPoints: { increment: referral.rewardPoints } } });
      await tx.artist.updateMany({ where: { userId: user.id }, data: { loyaltyPoints: { increment: referral.rewardPoints } } });
    }

    await tx.adminLog.create({ data: { actorUserId: req.user!.id, action: 'USER_APPROVED', targetId: user.id } });
  });

  void approvedEmail(user.email, user.name, `${config.frontendUrl}/login`).catch((err) =>
    console.error('approval email failed for user', user.id, err)
  );

  res.json({ success: true, data: { id: user.id, approvalStatus: 'APPROVED' } });
}));

/** Send the applicant a fresh confirmation link. */
router.post('/admissions/:id/resend-verification', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user) throw new CustomError('Utilisateur introuvable.', 404);
  if (user.emailVerified) throw new CustomError('Cette adresse est déjà confirmée.', 409);
  const result = await verificationEmail(user.email, user.name, verifyLinkFor(user));
  res.json({ success: true, data: { sent: result.sent } });
}));

/**
 * Rule on a video's ownership by hand: Instagram links and uploaded files
 * cannot be checked automatically, and a reviewer may know better than the
 * check. A video verified here also proves its channel for the artist's
 * other videos (see services/videoVerification.ts).
 */
router.post('/media/:id/verification', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { status, note } = z
    .object({ status: z.enum(['VERIFIED', 'REJECTED', 'UNVERIFIED']), note: z.string().trim().max(300).optional() })
    .parse(req.body);
  const media = await prisma.media.findFirst({
    where: { id: req.params.id, kind: 'VIDEO', artistId: { not: null } },
    select: { id: true, artistId: true, provider: true, externalId: true, url: true, authorUrl: true, artist: { select: { userId: true } } },
  });
  if (!media) throw new CustomError('Vidéo introuvable.', 404);

  // Record the channel too, so a manual ruling extends to its other videos.
  let authorUrl = media.authorUrl;
  if (status === 'VERIFIED' && !authorUrl) {
    const facts = await fetchVideoFacts(media.provider, media.externalId, media.url);
    if (facts?.exists) {
      authorUrl = facts.authorUrl;
      await prisma.media.update({ where: { id: media.id }, data: { authorName: facts.authorName, authorUrl } });
    }
  }

  const row = await prisma.media.update({
    where: { id: media.id },
    data: {
      verification: status,
      verificationMethod: status === 'UNVERIFIED' ? null : 'ADMIN',
      verificationNote: note || null,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
    },
    select: mediaSelect,
  });
  await prisma.adminLog.create({ data: { action: `VIDEO_${status}`, actorUserId: req.user!.id, targetId: media.id } }).catch(() => undefined);

  if (status === 'VERIFIED' && media.artistId) await verifyOtherVideosFromChannel(media.artistId, authorUrl);
  if (status === 'VERIFIED' && media.artist) {
    void notify({ userId: media.artist.userId, type: 'VIDEO_VERIFIED', payload: { mediaId: media.id } });
  }
  res.json({ success: true, data: toMediaDTO(row) });
}));

/** Decline an application, with a reason the applicant is actually told. */
router.post('/admissions/:id/reject', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length > 500) throw new CustomError('Motif trop long (500 caractères maximum).', 400);

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new CustomError('Utilisateur introuvable.', 404);
  if (user.role === 'ADMIN') throw new CustomError('Un administrateur ne peut pas être refusé.', 400);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      approvalStatus: 'REJECTED',
      approvalNote: reason || null,
      reviewedAt: new Date(),
      reviewedById: req.user!.id,
      // A rejected account loses any session it already holds.
      sessionsValidFrom: new Date()
    }
  });

  await rejectedEmail(updated.email, updated.name, reason || undefined);

  await prisma.adminLog.create({
    data: {
      actorUserId: req.user!.id,
      action: 'USER_REJECTED',
      targetId: user.id
    }
  }).catch(() => undefined);

  res.json({ success: true, data: { id: updated.id, approvalStatus: updated.approvalStatus } });
}));

const EXPORT_TYPES = ['bookings', 'users', 'logs'] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

/**
 * Builds the requested dataset. Each one selects named fields rather than
 * including whole models: an export is the easiest place to leak a column
 * somebody added later without thinking about who reads the file.
 */
async function buildExportDataset(type: ExportType): Promise<Dataset> {
  if (type === 'bookings') {
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        creditCost: true,
        boardType: true,
        transportTerms: true,
        createdAt: true,
        artist: { select: { stageName: true, discipline: true, user: { select: { name: true, email: true } } } },
        hotel: { select: { name: true, user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      name: 'residences',
      columns: [
        { header: 'Référence', key: 'id', width: 28 },
        { header: 'Maison', key: 'hotel' },
        { header: 'Contact maison', key: 'hotelEmail', width: 28 },
        { header: 'Artiste', key: 'artist' },
        { header: 'Discipline', key: 'discipline' },
        { header: 'Contact artiste', key: 'artistEmail', width: 28 },
        { header: 'Arrivée', key: 'startDate' },
        { header: 'Départ', key: 'endDate' },
        { header: 'Statut', key: 'status' },
        { header: 'Crédits', key: 'credits' },
        { header: 'Formule', key: 'board' },
        { header: 'Transport', key: 'transport' },
        { header: 'Créée le', key: 'createdAt' },
      ],
      rows: bookings.map((b) => ({
        id: b.id,
        hotel: b.hotel?.name || b.hotel?.user?.name || '',
        hotelEmail: b.hotel?.user?.email || '',
        artist: b.artist?.stageName || b.artist?.user?.name || '',
        discipline: b.artist?.discipline || '',
        artistEmail: b.artist?.user?.email || '',
        startDate: b.startDate.toISOString().slice(0, 10),
        endDate: b.endDate.toISOString().slice(0, 10),
        status: b.status,
        credits: b.creditCost ?? 0,
        board: b.boardType ? BOARD_LABELS[b.boardType] : '',
        transport: b.transportTerms ? TRANSPORT_LABELS[b.transportTerms] : '',
        createdAt: b.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      })),
    };
  }

  if (type === 'users') {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, country: true,
        language: true, isActive: true, approvalStatus: true,
        emailVerified: true, acceptedTermsAt: true, acceptedTermsVersion: true,
        createdAt: true,
        artist: { select: { discipline: true, membershipStatus: true } },
        hotel: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      name: 'comptes',
      columns: [
        { header: 'Référence', key: 'id', width: 28 },
        { header: 'Nom', key: 'name' },
        { header: 'E-mail', key: 'email', width: 30 },
        { header: 'Rôle', key: 'role' },
        { header: 'Établissement', key: 'hotel' },
        { header: 'Discipline', key: 'discipline' },
        { header: 'Adhésion', key: 'membership' },
        { header: 'Pays', key: 'country' },
        { header: 'Langue', key: 'language' },
        { header: 'Actif', key: 'isActive' },
        { header: 'Admission', key: 'approvalStatus' },
        { header: 'E-mail vérifié', key: 'emailVerified' },
        { header: 'CGU acceptées le', key: 'acceptedTermsAt', width: 20 },
        { header: 'Version CGU', key: 'acceptedTermsVersion' },
        { header: 'Inscrit le', key: 'createdAt' },
      ],
      rows: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        hotel: u.hotel?.name || '',
        discipline: u.artist?.discipline || '',
        membership: u.artist?.membershipStatus || '',
        country: u.country || '',
        language: u.language,
        isActive: u.isActive ? 'oui' : 'non',
        approvalStatus: u.approvalStatus,
        emailVerified: u.emailVerified ? 'oui' : 'non',
        // Blank means the account predates the consent gate, which is a real
        // and actionable state - not something to paper over with a date.
        acceptedTermsAt: u.acceptedTermsAt ? u.acceptedTermsAt.toISOString().slice(0, 16).replace('T', ' ') : '',
        acceptedTermsVersion: u.acceptedTermsVersion || '',
        createdAt: u.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      })),
    };
  }

  // logs
  const logs = await prisma.adminLog.findMany({
    select: {
      id: true, action: true, targetId: true, createdAt: true,
      actor: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  return {
    name: 'journal',
    columns: [
      { header: 'Référence', key: 'id', width: 28 },
      { header: 'Date', key: 'createdAt', width: 20 },
      { header: 'Action', key: 'action', width: 30 },
      { header: 'Auteur', key: 'actor' },
      { header: 'E-mail auteur', key: 'actorEmail', width: 30 },
      { header: 'Rôle', key: 'actorRole' },
      { header: 'Cible', key: 'targetId', width: 28 },
    ],
    rows: logs.map((l) => ({
      id: l.id,
      createdAt: l.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      action: l.action,
      actor: l.actor?.name || '',
      actorEmail: l.actor?.email || '',
      actorRole: l.actor?.role || '',
      targetId: l.targetId || '',
    })),
  };
}

router.get('/export', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const type = String(req.query.type || '') as ExportType;
  const format = String(req.query.format || 'csv').toLowerCase() as ExportFormat;

  if (!EXPORT_TYPES.includes(type)) {
    throw new CustomError(
      `Type d'export inconnu. Valeurs acceptées : ${EXPORT_TYPES.join(', ')}.`,
      400
    );
  }
  if (format !== 'csv' && format !== 'xlsx') {
    throw new CustomError('Format inconnu. Utilisez csv ou xlsx.', 400);
  }

  const dataset = await buildExportDataset(type);

  /* Who exported what, and when. An export is the single largest disclosure
     this system can make - the whole user list in one file - so it belongs in
     the audit trail alongside suspensions and admissions. */
  await prisma.adminLog.create({
    data: {
      action: `EXPORT_${type.toUpperCase()}_${format.toUpperCase()}_${dataset.rows.length}_ROWS`,
      actorUserId: req.user!.id,
    },
  }).catch((error) => console.error('Export not logged', error));

  await sendExport(res, dataset, format);
}));

// Get all users with pagination
router.get('/users', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', role, search } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (role) {
    const wanted = String(role).toUpperCase();
    if (!['ARTIST', 'HOTEL', 'ADMIN'].includes(wanted)) throw new CustomError('Rôle inconnu.', 400);
    where.role = wanted;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Get all bookings with pagination
router.get('/bookings', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
  const where: any = {};
  if (req.query.status) {
    const status = String(req.query.status).toUpperCase();
    if (!BOOKING_STATUSES.includes(status as any)) throw new CustomError('Statut inconnu.', 400);
    where.status = status;
  }

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({ where, select: bookingSelect, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      bookings: rows.map((b) => toBookingDTO(b, 'ADMIN')),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get admin activity logs
router.get('/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { action, actorUserId, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (action) {
    where.action = action;
  }
  if (actorUserId) {
    where.actorUserId = actorUserId;
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.adminLog.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Activity for one hotel or one artist: their bookings and ratings, newest first.
async function partyActivity(kind: 'hotel' | 'artist', id: string, limit: number) {
  const where = kind === 'hotel' ? { hotelId: id } : { artistId: id };
  const [bookings, bookingsTotal, ratings, ratingsTotal] = await Promise.all([
    prisma.booking.findMany({ where, select: bookingSelect, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.booking.count({ where }),
    prisma.rating.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, stars: true, textReview: true, isVisibleToArtist: true, createdAt: true,
        hotel: { select: { name: true } },
        artist: { select: { stageName: true, user: { select: { name: true } } } },
      },
    }),
    prisma.rating.count({ where }),
  ]);

  const activities = [
    ...bookings.map((b) => ({
      type: 'BOOKING',
      id: b.id,
      description: `Résidence ${b.status.toLowerCase()} : ${kind === 'hotel' ? b.artist.stageName || b.artist.user.name : b.hotel.name}`,
      date: b.createdAt,
      data: toBookingDTO(b, 'ADMIN'),
    })),
    ...ratings.map((r) => ({
      type: 'RATING',
      id: r.id,
      description: `Évaluation ${r.stars}/5 : ${r.hotel.name} → ${r.artist.stageName || r.artist.user.name}`,
      date: r.createdAt,
      data: r,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  return { activities, summary: { totalBookings: bookingsTotal, totalTransactions: 0, totalRatings: ratingsTotal } };
}

router.get('/hotels/:id/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
  const hotel = await prisma.hotel.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!hotel) throw new CustomError('Hôtel introuvable.', 404);
  const { activities, summary } = await partyActivity('hotel', hotel.id, limit);
  res.json({ success: true, data: { hotel, activities, summary } });
}));

router.get('/artists/:id/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
  const artist = await prisma.artist.findUnique({
    where: { id: req.params.id },
    select: { id: true, discipline: true, stageName: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!artist) throw new CustomError('Artiste introuvable.', 404);
  const { activities, summary } = await partyActivity('artist', artist.id, limit);
  res.json({ success: true, data: { artist: { ...artist, name: artist.user.name }, activities, summary } });
}));

// Get all platform activities (comprehensive activity log)
router.get('/activities', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { type, page = '1', limit = '100', startDate, endDate } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Five independent reads, each with a nested include - sequential awaits
    // meant five round trips to a serverless Neon connection before anything
    // rendered, which is what pushed this past the client's 10s timeout on a
    // cold connection. None of these depend on each other, so they run
    // together instead.
    const dateWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [users, bookings, ratings, adminLogs] = await Promise.all([
      (!type || type === 'USER_REGISTRATION')
        ? prisma.user.findMany({
            where: dateWhere,
            select: {
              id: true, name: true, email: true, role: true, country: true, createdAt: true,
              artist: { select: { id: true } },
              hotel: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          })
        : Promise.resolve([]),
      (!type || type === 'BOOKING')
        ? prisma.booking.findMany({
            where: dateWhere,
            select: {
              id: true, status: true, startDate: true, endDate: true, createdAt: true,
              artist: { select: { user: { select: { id: true, name: true, email: true } } } },
              hotel: { select: { name: true, user: { select: { id: true, name: true, email: true } } } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
          })
        : Promise.resolve([]),
      (!type || type === 'RATING')
        ? prisma.rating.findMany({
            where: dateWhere,
            select: {
              id: true, stars: true, textReview: true, isVisibleToArtist: true, createdAt: true,
              hotel: { select: { user: { select: { id: true, name: true, email: true } } } },
              artist: { select: { user: { select: { id: true, name: true, email: true } } } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          })
        : Promise.resolve([]),
      (!type || type === 'ADMIN_ACTION')
        ? prisma.adminLog.findMany({
            where: dateWhere,
            include: { actor: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
          })
        : Promise.resolve([])
    ]);

    const activities: any[] = [];

    users.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'USER_REGISTRATION',
        action: `${user.role} registered`,
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        target: null,
        details: {
          role: user.role,
          country: user.country,
          hasArtistProfile: !!user.artist,
          hasHotelProfile: !!user.hotel
        },
        timestamp: user.createdAt
      });
    });

    bookings.forEach(booking => {
      activities.push({
        id: `booking-${booking.id}`,
        type: 'BOOKING',
        action: `Booking ${booking.status.toLowerCase()}`,
        actor: booking.hotel?.user ? {
          id: booking.hotel.user.id,
          name: booking.hotel.user.name,
          email: booking.hotel.user.email,
          role: 'HOTEL'
        } : null,
        target: booking.artist?.user ? {
          id: booking.artist.user.id,
          name: booking.artist.user.name,
          email: booking.artist.user.email,
          role: 'ARTIST'
        } : null,
        details: {
          bookingId: booking.id,
          status: booking.status,
          startDate: booking.startDate,
          endDate: booking.endDate,
          hotelName: booking.hotel?.name,
          artistName: booking.artist?.user?.name
        },
        timestamp: booking.createdAt
      });
    });

    ratings.forEach(rating => {
      activities.push({
        id: `rating-${rating.id}`,
        type: 'RATING',
        action: 'Rating submitted',
        actor: rating.hotel?.user || rating.artist?.user || null,
        target: rating.artist?.user || rating.hotel?.user || null,
        details: {
          ratingId: rating.id,
          stars: rating.stars,
          textReview: rating.textReview,
          isVisibleToArtist: rating.isVisibleToArtist
        },
        timestamp: rating.createdAt
      });
    });

    adminLogs.forEach(log => {
      activities.push({
        id: `admin-${log.id}`,
        type: 'ADMIN_ACTION',
        action: log.action,
        actor: log.actor,
        target: log.targetId ? { id: log.targetId } : null,
        details: {},
        timestamp: log.createdAt
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(skip, skip + limitNum);
    const total = activities.length;

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary: {
          totalActivities: total,
          byType: {
            USER_REGISTRATION: activities.filter(a => a.type === 'USER_REGISTRATION').length,
            BOOKING: activities.filter(a => a.type === 'BOOKING').length,
            RATING: activities.filter(a => a.type === 'RATING').length,
            ADMIN_ACTION: activities.filter(a => a.type === 'ADMIN_ACTION').length
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    throw new CustomError('Failed to fetch activities', 500);
  }
}));

// Get all referrals for admin
router.get('/referrals', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '50', status, search } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  // Filter by status if provided
  if (status) {
    // Status logic: if invitee artist is ACTIVE, referral is COMPLETED
    // We'll handle this in the query result processing
  }

  // Search filter
  if (search) {
    where.OR = [
      {
        inviter: {
          name: { contains: search as string, mode: 'insensitive' }
        }
      },
      {
        invitee: {
          name: { contains: search as string, mode: 'insensitive' }
        }
      }
    ];
  }

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where,
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            artist: {
              select: {
                id: true,
                membershipStatus: true,
                referralCode: true,
                loyaltyPoints: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.referral.count({ where })
  ]);

  // Calculate stats
  const allReferrals = await prisma.referral.findMany({
    include: {
      invitee: {
        include: {
          artist: {
            select: {
              membershipStatus: true
            }
          }
        }
      }
    }
  });

  const totalReferrals = allReferrals.length;
  const completedReferrals = allReferrals.filter(r => 
    r.invitee.artist?.membershipStatus === 'ACTIVE'
  ).length;
  const totalRewards = allReferrals.reduce((sum, r) => sum + r.rewardPoints, 0);
  const uniqueReferrers = new Set(allReferrals.map(r => r.inviterUserId));

  // Format referrals
  const formattedReferrals = referrals.map(r => {
    const isCompleted = r.invitee.artist?.membershipStatus === 'ACTIVE';
    return {
      id: r.id,
      referrerId: r.inviterUserId,
      referrerName: r.inviter.name,
      referrerEmail: r.inviter.email,
      referrerType: r.inviter.role,
      referredId: r.inviteeUserId,
      referredName: r.invitee.name,
      referredEmail: r.invitee.email,
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      createdAt: r.createdAt,
      rewardEarned: r.rewardPoints,
      inviteeMembershipStatus: r.invitee.artist?.membershipStatus || null
    };
  });

  res.json({
    success: true,
    data: {
      referrals: formattedReferrals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        totalReferrals,
        completedReferrals,
        totalRewards,
        activeReferrers: uniqueReferrers.size
      }
    }
  });
}));

export { router as adminRoutes };



