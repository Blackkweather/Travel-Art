import { Router } from 'express';
import { z } from 'zod';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { config } from '../config';
import { referralInviteEmail } from '../services/email';
import { createReferralLink } from '../utils/referralCode';
import { artistCardSelect, listableArtistWhere, summariseRatings, toArtistCard } from '../views/artist';
import { listableHotelWhere, publicHotelSelect, toPublicHotel } from '../views/hotel';
import { checkEmail, personNameSchema } from '../shared/validation';

const router = Router();

const clampLimit = (raw: unknown, fallback: number, max: number) => {
  const n = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : fallback;
};

// --------------------------------------------------------------- referrals

router.get('/referrals', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const [referrals, artist] = await Promise.all([
    prisma.referral.findMany({
      where: { inviterUserId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rewardPoints: true,
        rewardedAt: true,
        createdAt: true,
        invitee: {
          select: {
            name: true,
            createdAt: true,
            approvalStatus: true,
            artist: { select: { discipline: true, profilePicture: true } },
          },
        },
      },
    }),
    prisma.artist.findUnique({ where: { userId: req.user!.id }, select: { referralCode: true, loyaltyPoints: true } }),
  ]);

  const rewarded = referrals.filter((r) => r.rewardedAt);
  res.json({
    success: true,
    data: {
      referralCode: artist?.referralCode ?? null,
      referralLink: artist ? createReferralLink(artist.referralCode, config.frontendUrl) : null,
      loyaltyPoints: artist?.loyaltyPoints ?? 0,
      stats: {
        totalReferrals: referrals.length,
        activeReferrals: rewarded.length,
        totalCreditsEarned: rewarded.reduce((sum, r) => sum + r.rewardPoints, 0),
        pendingReferrals: referrals.length - rewarded.length,
      },
      // The invitee's e-mail is theirs, not the inviter's: name and status only.
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.invitee.name,
        discipline: r.invitee.artist?.discipline || null,
        joinedDate: r.invitee.createdAt,
        status: r.rewardedAt ? 'active' : 'pending',
        creditsEarned: r.rewardedAt ? r.rewardPoints : 0,
        image: r.invitee.artist?.profilePicture ?? null,
      })),
    },
  });
}));

/**
 * Send someone an invitation with my referral link. It used to answer
 * "sent" and send nothing. The points are credited later, when the person
 * who used the link is admitted.
 */
router.post('/referrals/invite', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { inviteeEmail, inviteeName } = z
    .object({ inviteeEmail: z.string().max(254), inviteeName: personNameSchema('nom') })
    .parse(req.body);

  const verdict = checkEmail(inviteeEmail);
  if (!verdict.ok) throw new CustomError(verdict.message!, 400, { fields: { inviteeEmail: verdict.message! } });

  const [artist, existing] = await Promise.all([
    prisma.artist.findUnique({
      where: { userId: req.user!.id },
      select: { referralCode: true, stageName: true, user: { select: { name: true, email: true } } },
    }),
    prismaAdmin.user.findUnique({ where: { email: verdict.email }, select: { id: true } }),
  ]);
  if (!artist) throw new CustomError('Profil artiste introuvable.', 404);
  if (verdict.email === artist.user.email) {
    throw new CustomError('Vous ne pouvez pas vous inviter vous-même.', 400, { fields: { inviteeEmail: 'Vous ne pouvez pas vous inviter vous-même.' } });
  }
  if (existing) {
    throw new CustomError('Cette personne a déjà un compte Travel Art.', 409, { fields: { inviteeEmail: 'Cette personne a déjà un compte Travel Art.' } });
  }

  const link = `${config.frontendUrl}/register?role=artist&ref=${encodeURIComponent(artist.referralCode)}`;
  const result = await referralInviteEmail(verdict.email, inviteeName, artist.stageName || artist.user.name, link);
  if (!result.sent && !result.skipped) {
    throw new CustomError('L’invitation n’a pas pu être envoyée. Réessayez plus tard.', 502);
  }

  res.status(201).json({ success: true, data: { inviteeEmail: verdict.email, sent: result.sent } });
}));

// -------------------------------------------------------------- newsletter

/** Subscribing twice is success: the caller is anonymous, a 409 would reveal membership. */
router.post('/newsletter/subscribe', asyncHandler(async (req, res) => {
  const { email, locale, source } = z
    .object({ email: z.string().max(254), locale: z.enum(['fr', 'en']).optional(), source: z.string().max(60).optional() })
    .parse(req.body);
  const verdict = checkEmail(email);
  if (!verdict.ok) throw new CustomError(verdict.message!, 400, { fields: { email: verdict.message! } });

  await prismaAdmin.newsletterSubscriber.upsert({
    where: { email: verdict.email },
    create: { email: verdict.email, locale: locale ?? 'fr', source: source ?? null },
    update: { unsubscribedAt: null, locale: locale ?? 'fr' },
  });
  res.status(201).json({ success: true, data: { subscribed: true } });
}));

// --------------------------------------------------------------------- top

/**
 * The most-booked admitted artists and hotels. Ordered by the database, not
 * by loading every row and sorting in memory.
 *
 * On the privileged client because the order is a platform-wide count of
 * bookings, which no single tenant can see under row-level security. Only the
 * counts leave; no booking row does.
 */
router.get('/top', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const limit = clampLimit(req.query.limit, 10, 50);

  if (req.query.type === 'artists') {
    const rows = await prismaAdmin.artist.findMany({
      where: listableArtistWhere,
      select: { ...artistCardSelect(), _count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } } } } },
      orderBy: [{ bookings: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: limit,
    });
    const stars = await prisma.rating.findMany({ where: { artistId: { in: rows.map((r) => r.id) } }, select: { artistId: true, stars: true } });
    return res.json({
      success: true,
      data: rows.map((row) =>
        toArtistCard(row, {
          ratings: summariseRatings(stars.filter((s) => s.artistId === row.id).map((s) => s.stars)),
          bookingCount: row._count.bookings,
          viewerRole: req.user!.role,
        })
      ),
    });
  }

  if (req.query.type === 'hotels') {
    const rows = await prismaAdmin.hotel.findMany({
      where: listableHotelWhere,
      select: { ...publicHotelSelect(), _count: { select: { bookings: true } } },
      orderBy: [{ bookings: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: limit,
    });
    const stars = await prisma.rating.findMany({ where: { hotelId: { in: rows.map((r) => r.id) } }, select: { hotelId: true, stars: true } });
    return res.json({
      success: true,
      data: rows.map((row) => {
        const summary = summariseRatings(stars.filter((s) => s.hotelId === row.id).map((s) => s.stars));
        return toPublicHotel(row, { averageRating: summary.average, ratingCount: summary.count, bookingCount: row._count.bookings });
      }),
    });
  }

  throw new CustomError('Type inconnu : utilisez "artists" ou "hotels".', 400);
}));

// ------------------------------------------------------------------- stats

router.get('/stats', asyncHandler(async (_req, res) => {
  const [totalArtists, totalHotels, totalBookings, activeBookings, completedBookings, totalVenues, ratings] = await Promise.all([
    prismaAdmin.artist.count({ where: listableArtistWhere }),
    prismaAdmin.hotel.count({ where: listableHotelWhere }),
    prismaAdmin.booking.count(),
    prismaAdmin.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prismaAdmin.booking.count({ where: { status: 'COMPLETED' } }),
    prismaAdmin.hotelSpace.count({ where: { hotel: listableHotelWhere } }),
    prismaAdmin.rating.aggregate({ _avg: { stars: true } }),
  ]);

  res.json({
    success: true,
    data: {
      totalArtists,
      totalHotels,
      totalBookings,
      activeBookings,
      completedBookings,
      totalVenues,
      averageRating: Math.round((ratings._avg.stars ?? 0) * 10) / 10,
    },
  });
}));

// ------------------------------------------------------------ testimonials

/**
 * Reviews for the home page. Only the ones the hotel chose to share with the
 * artist: a rating kept private is the hotel's note to itself, and it was
 * being quoted on the landing page.
 */
router.get('/testimonials', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const limit = clampLimit(req.query.limit, 6, 20);
  const rows = await prismaAdmin.rating.findMany({
    where: { isVisibleToArtist: true, hotel: listableHotelWhere, artist: listableArtistWhere },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      stars: true,
      textReview: true,
      createdAt: true,
      hotel: { select: { name: true, city: true, country: true } },
    },
  });

  // Signed out, the quote keeps its words and its stars but the hotel is
  // reduced to a country: social proof, not a partner list.
  const signedIn = Boolean(req.user);
  res.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      rating: r.stars,
      comment: r.textReview,
      hotelName: signedIn ? r.hotel.name : 'Un hôtel partenaire',
      location: signedIn ? [r.hotel.city, r.hotel.country].filter(Boolean).join(', ') : r.hotel.country,
      createdAt: r.createdAt,
    })),
  });
}));

export { router as commonRoutes };
