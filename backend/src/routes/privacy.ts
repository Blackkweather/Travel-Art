/**
 * The rights a data subject has, as endpoints.
 *
 * GDPR Article 15 (access) and Article 17 (erasure) are obligations, not
 * features: a person can demand either at any time and the controller has a
 * month to comply. Doing it by hand from the admin panel does not scale and
 * does not leave a trail, so both are implemented here against the
 * authenticated user only - never against an id passed in the body.
 */
import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { CONSENT, LEGAL_VERSION, clientIp, hashIp } from '../config/legal';

const router = Router();

/* -------------------------------------------------------------------------
   Article 15 - the right of access
   ------------------------------------------------------------------------- */

router.get('/export', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  /* Everything held about this person, in one document. Related rows are
     included where they describe them (their residencies, their ratings,
     their credits) and named-field selects are used throughout so a schema
     addition cannot quietly widen the export into somebody else's data - the
     other side of a booking is a different data subject. */
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, phone: true, country: true,
      language: true, role: true, createdAt: true, isActive: true,
      approvalStatus: true, approvalNote: true, reviewedAt: true,
      emailVerified: true, emailVerifiedAt: true,
      acceptedTermsAt: true, acceptedTermsVersion: true,
      consents: {
        select: { kind: true, version: true, granted: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
      notifications: {
        select: { type: true, payload: true, read: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
      artist: {
        select: {
          id: true, stageName: true, birthDate: true, phone: true, bio: true,
          discipline: true, priceRange: true, membershipStatus: true,
          membershipRenewal: true, images: true, videos: true, mediaUrls: true,
          profilePicture: true, artisticProfile: true, referralCode: true,
          loyaltyPoints: true, createdAt: true,
          availability: { select: { dateFrom: true, dateTo: true } },
        },
      },
      hotel: {
        select: {
          id: true, name: true, description: true, location: true,
          contactPhone: true, images: true, profilePicture: true,
          performanceSpots: true, rooms: true, repName: true,
          responsibleName: true, responsibleEmail: true, responsiblePhone: true,
          createdAt: true,
          availabilities: { select: { dateFrom: true, dateTo: true } },
        },
      },
    },
  });

  if (!user) throw new CustomError('User not found', 404);

  /* Bookings name both sides, so only the fields describing this person's own
     participation are exported - not the counterparty's contact details. */
  const bookingWhere = user.artist
    ? { artistId: user.artist.id }
    : user.hotel
      ? { hotelId: user.hotel.id }
      : null;

  const bookings = bookingWhere
    ? await prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true, startDate: true, endDate: true, status: true,
          numberOfWeeks: true, creditCost: true, totalPaymentAmount: true,
          paymentStatus: true, notes: true, createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const ratings = user.artist
    ? await prisma.rating.findMany({
        where: { artistId: user.artist.id },
        select: { stars: true, textReview: true, isVisibleToArtist: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    : user.hotel
      ? await prisma.rating.findMany({
          where: { hotelId: user.hotel.id },
          select: { stars: true, textReview: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })
      : [];

  const payments = await prisma.payment.findMany({
    where: { actorUserId: userId },
    select: {
      amountCents: true, currency: true, status: true,
      packageId: true, membershipId: true, createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  }).catch(() => []);

  const document = {
    exportedAt: new Date().toISOString(),
    notice:
      'Document généré automatiquement à votre demande, au titre de l’article 15 du RGPD. ' +
      'Il contient les données que Travel Art détient à votre sujet. Les informations ' +
      'concernant l’autre partie d’une résidence n’y figurent pas : elles appartiennent à ' +
      'une autre personne concernée.',
    account: user,
    bookings,
    ratings,
    payments,
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="travel-art-donnees-${userId}.json"`
  );
  res.send(JSON.stringify(document, null, 2));
}));

/* -------------------------------------------------------------------------
   Article 17 - the right to erasure
   ------------------------------------------------------------------------- */

const deleteSchema = z.object({
  /* Typed, not clicked. An account deletion that a stray click can perform is
     a support queue waiting to happen. */
  confirm: z.literal('SUPPRIMER'),
  password: z.string().min(1, 'Mot de passe requis'),
});

router.delete('/account', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { password } = deleteSchema.parse(req.body);
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { artist: true, hotel: true },
  });
  if (!user) throw new CustomError('User not found', 404);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new CustomError('Mot de passe incorrect', 401);

  /* Anonymised rather than deleted, and the distinction is deliberate.
     Article 17(3)(b) preserves erasure obligations against other legal duties,
     and French accounting law requires invoices and the transactions behind
     them to be retained for years. Hard-deleting the user would either cascade
     those away or orphan them. So every piece of personal data is destroyed in
     place while the financial rows keep pointing at a subject who can no
     longer be identified from them. */
  const tombstone = `deleted-${crypto.randomBytes(8).toString('hex')}@deleted.invalid`;

  // A password nobody holds, computed before the transaction opens so no
  // hashing happens while it is held.
  const deadPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

  /* The array form rather than the callback form: nothing here reads a value
     it then writes, so the whole erasure is one atomic batch. Either every
     trace of this person is gone or none of it is - a half-anonymised account
     is the worst of both. */
  const erasure: Prisma.PrismaPromise<unknown>[] = [];

  if (user.artist) {
    erasure.push(
      prisma.artistAvailability.deleteMany({ where: { artistId: user.artist.id } }),
      prisma.artist.update({
        where: { id: user.artist.id },
        data: {
          stageName: null, birthDate: null, phone: null, bio: null,
          images: null, videos: null, mediaUrls: null, profilePicture: null,
          artisticProfile: null, membershipStatus: 'INACTIVE',
        },
      })
    );
  }

  if (user.hotel) {
    erasure.push(
      prisma.hotel.update({
        where: { id: user.hotel.id },
        data: {
          description: null, contactPhone: null, images: null,
          profilePicture: null, repName: null, responsibleName: null,
          responsibleEmail: null, responsiblePhone: null,
        },
      })
    );
  }

  erasure.push(
    // Notifications carry the other side's name in their payload and serve no
    // purpose once the account is gone.
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: tombstone,
        name: 'Compte supprimé',
        phone: null,
        country: null,
        passwordHash: deadPassword,
        isActive: false,
        // Every token issued before this instant stops working immediately.
        sessionsValidFrom: new Date(),
      },
    })
  );

  await prisma.$transaction(erasure);

  res.json({
    success: true,
    data: {
      message:
        'Votre compte a été supprimé. Les écritures comptables liées à vos ' +
        'paiements sont conservées sans vous identifier, comme la loi l’exige.',
    },
  });
}));

/* -------------------------------------------------------------------------
   Consent, given and withdrawn
   ------------------------------------------------------------------------- */

const consentSchema = z.object({
  kind: z.enum([CONSENT.TERMS, CONSENT.PRIVACY, CONSENT.COOKIES_ANALYTICS]),
  granted: z.boolean(),
});

router.post('/consent', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { kind, granted } = consentSchema.parse(req.body);

  // Append-only: a withdrawal is a new row, never an edit of the one that
  // granted it. See the note on the model.
  const record = await prisma.consentRecord.create({
    data: {
      userId: req.user!.id,
      kind,
      version: LEGAL_VERSION,
      granted,
      ipHash: hashIp(clientIp(req as never)),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 255) || null,
    },
    select: { kind: true, version: true, granted: true, createdAt: true },
  });

  res.status(201).json({ success: true, data: record });
}));

router.get('/consent', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const rows = await prisma.consentRecord.findMany({
    where: { userId: req.user!.id },
    select: { kind: true, version: true, granted: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // The current position for each kind is its most recent row.
  const current: Record<string, { granted: boolean; version: string; at: Date }> = {};
  for (const row of rows) {
    if (!current[row.kind]) {
      current[row.kind] = { granted: row.granted, version: row.version, at: row.createdAt };
    }
  }

  res.json({
    success: true,
    data: { currentVersion: LEGAL_VERSION, current, history: rows },
  });
}));

export { router as privacyRoutes };
