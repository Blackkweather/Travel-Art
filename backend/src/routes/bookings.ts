import { Router } from 'express';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { config } from '../config';
import { notify, bookingPayload } from '../services/notifications';
import {
  formatStay,
  bookingRequestedEmail,
  bookingConfirmedEmail,
  bookingRejectedEmail,
  bookingCancelledEmail,
  bookingCancelledByArtistEmail,
  conventionToSignEmail,
  cancellationFeeDueEmail,
  transportClaimInviteEmail,
  adminAlertEmail,
} from '../services/email';
import { openCancellationClaim } from './claims';
import { formatDay, formatMoney } from '../services/convention';
import { bookingSelect, toBookingDTO } from '../views/booking';
import { listableArtistWhere } from '../views/artist';
import { bookingCreateSchema, bookingStatusUpdateSchema, ratingCreateSchema } from '../shared/validation';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUSES, RELEASES_CREDITS, canTransition, type Actor, type BookingStatusValue } from '../shared/status';
import { background } from '../services/background';

const router = Router();

/** The caller's own artist or hotel id, which scopes everything they may see. */
async function partyScope(user: { id: string; role: string }) {
  if (user.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
    return artist ? { artistId: artist.id } : null;
  }
  if (user.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({ where: { userId: user.id }, select: { id: true } });
    return hotel ? { hotelId: hotel.id } : null;
  }
  return {};
}

// -------------------------------------------------------------------- list

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
  const role = req.user!.role;

  const scope = await partyScope(req.user!);
  if (scope === null) {
    return res.json({ success: true, data: { bookings: [], pagination: { page, limit, total: 0, pages: 0 } } });
  }

  const where: any = { ...scope };
  if (role === 'ADMIN') {
    if (typeof req.query.artistId === 'string') where.artistId = req.query.artistId;
    if (typeof req.query.hotelId === 'string') where.hotelId = req.query.hotelId;
  }
  const status = String(req.query.status ?? '').toUpperCase();
  if (status) {
    if (!BOOKING_STATUSES.includes(status as BookingStatusValue)) throw new CustomError('Statut inconnu.', 400);
    where.status = status;
  }

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({ where, select: bookingSelect, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      bookings: rows.map((row) => toBookingDTO(row, role)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const scope = await partyScope(req.user!);
  // Not found and not yours answer the same, so ids cannot be probed.
  const row = scope ? await prisma.booking.findFirst({ where: { id: req.params.id, ...scope }, select: bookingSelect }) : null;
  if (!row) throw new CustomError('Réservation introuvable.', 404);
  res.json({ success: true, data: toBookingDTO(row, req.user!.role) });
}));

// ------------------------------------------------------------------ create

router.post('/', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const input = bookingCreateSchema.parse(req.body);
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  const hotel = await prisma.hotel.findUnique({ where: { userId: req.user!.id }, select: { id: true, name: true } });
  if (!hotel) throw new CustomError('Profil hôtel introuvable.', 404);
  if (input.hotelId !== hotel.id) throw new CustomError('Hôtel introuvable.', 404);

  // Only an admitted, active artist can be booked.
  const artist = await prisma.artist.findFirst({
    where: { id: input.artistId, ...listableArtistWhere },
    select: { id: true, bookingCreditCost: true },
  });
  if (!artist) throw new CustomError('Artiste introuvable.', 404);

  // The whole stay must sit inside a period the artist declared free.
  const window = await prisma.artistAvailability.findFirst({
    where: { artistId: artist.id, dateFrom: { lte: start }, dateTo: { gte: end } },
    select: { id: true },
  });
  if (!window) {
    throw new CustomError('L’artiste n’est pas disponible sur toutes ces dates.', 400, {
      fields: { startDate: 'L’artiste n’est pas disponible sur toutes ces dates.' },
    });
  }

  // Nor may it overlap another residency the artist already has or is asked
  // for. Read across hotels on purpose: the clash is with someone else's
  // booking, which this hotel cannot see. Only yes/no leaves this check.
  const clash = await prismaAdmin.booking.findFirst({
    where: {
      artistId: artist.id,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      startDate: { lt: end },
      endDate: { gt: start },
    },
    select: { id: true },
  });
  if (clash) {
    throw new CustomError('L’artiste a déjà une résidence sur ces dates.', 409, {
      fields: { startDate: 'L’artiste a déjà une résidence sur ces dates.' },
    });
  }

  /* Claim the credits first, by compare-and-swap: the update matches only if
     usedCredits is still what was just read, so concurrent requests cannot
     both spend the same balance. (Credit is RLS-protected; a raw conditional
     UPDATE would arrive without the caller's identity and be refused.) */
  const creditCost = artist.bookingCreditCost;
  let claimed = false;
  if (creditCost > 0) {
    for (let attempt = 0; attempt < 5 && !claimed; attempt += 1) {
      const account = await prisma.credit.findUnique({ where: { hotelId: hotel.id } });
      const available = (account?.totalCredits ?? 0) - (account?.usedCredits ?? 0);
      if (!account || available < creditCost) {
        throw new CustomError(`Cette résidence coûte ${creditCost} crédits et il vous en reste ${available}. Rechargez avant de réserver.`, 400, {
          code: 'INSUFFICIENT_CREDITS',
        });
      }
      const claim = await prisma.credit.updateMany({
        where: { hotelId: hotel.id, usedCredits: account.usedCredits },
        data: { usedCredits: account.usedCredits + creditCost },
      });
      claimed = claim.count === 1;
    }
    if (!claimed) throw new CustomError('Trop de réservations simultanées sur ce compte. Réessayez dans un instant.', 409);
  }

  let row;
  try {
    row = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: start,
        endDate: end,
        status: 'PENDING',
        creditCost,
        notes: input.notes,
        companionName: input.companionName,
        boardType: input.boardType,
        transportTerms: input.transportTerms,
        transportNotes: input.transportNotes,
        performanceDescription: input.performanceDescription,
        performanceSchedule: input.performanceSchedule,
        stayValueCents: input.stayValue,
        performanceValueCents: input.performanceValue,
        roomType: input.roomType,
        includedServices: input.includedServices,
        performanceLocation: input.performanceLocation,
        performanceDuration: input.performanceDuration,
        technicalConditions: input.technicalConditions,
        socialContent: input.socialContent,
      },
      select: bookingSelect,
    });
  } catch (error) {
    if (claimed) {
      await prisma.credit
        .update({ where: { hotelId: hotel.id }, data: { usedCredits: { decrement: creditCost } } })
        .catch((e) => console.error('credit claim not released for hotel', hotel.id, e));
    }
    throw error;
  }

  if (creditCost > 0) {
    await prisma.creditLedger
      .create({ data: { hotelId: hotel.id, delta: -creditCost, reason: 'BOOKING_SPEND', bookingId: row.id, note: `Booking ${row.id}` } })
      .catch((e) => console.error('ledger entry missing for booking', row.id, e));
  }

  // Not awaited: a booking that was made stays made if the mail provider is down.
  background(notify({
    userId: row.artist.user.id,
    type: 'BOOKING_REQUESTED',
    payload: bookingPayload(row),
    email: () =>
      bookingRequestedEmail(
        row.artist.user.email,
        row.artist.stageName || row.artist.user.name || 'Bonjour',
        row.hotel.name,
        formatStay(row.startDate, row.endDate),
        `${config.frontendUrl}/dashboard/bookings`
      ),
  }), 'notify');

  res.status(201).json({ success: true, data: toBookingDTO(row, 'HOTEL') });
}));

// ------------------------------------------------------------ status change

router.patch('/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { status: to, reason } = bookingStatusUpdateSchema.parse(req.body);
  const actor = req.user!.role as Actor;

  const scope = await partyScope(req.user!);
  const booking = scope
    ? await prisma.booking.findFirst({
        where: { id: req.params.id, ...scope },
        select: { id: true, status: true, hotelId: true, creditCost: true, conventionFinalizedAt: true, transportTerms: true },
      })
    : null;
  if (!booking) throw new CustomError('Réservation introuvable.', 404);

  const from = booking.status as BookingStatusValue;
  // An artist withdrawing from a confirmed residency owes the hotel a reason.
  if (actor === 'ARTIST' && from === 'CONFIRMED' && to === 'CANCELLED' && !reason) {
    throw new CustomError('Indiquez le motif de votre empêchement : l’hôtel le recevra.', 400, {
      fields: { reason: 'Indiquez le motif de votre empêchement.' },
    });
  }
  if (!canTransition(from, to, actor)) {
    throw new CustomError(
      from === to ? 'La réservation est déjà dans cet état.' : 'Cette action n’est pas possible sur cette réservation.',
      409,
      { code: 'INVALID_TRANSITION' }
    );
  }

  const now = new Date();
  /* The status in the WHERE makes the change conditional on nobody having
     moved it since we read it: if the hotel cancels while the artist is
     accepting, exactly one of them wins and the other is told. */
  const moved = await prisma.booking.updateMany({
    where: { id: booking.id, status: from },
    data: {
      status: to,
      ...(to === 'CONFIRMED' || to === 'REJECTED' ? { respondedAt: now } : {}),
      ...(to === 'CANCELLED' ? { cancelledAt: now, cancelledByRole: actor === 'SYSTEM' ? 'ADMIN' : actor, cancellationReason: reason } : {}),
      ...(to === 'REJECTED' && reason ? { cancellationReason: reason } : {}),
    },
  });
  if (moved.count === 0) {
    throw new CustomError('La réservation vient d’être modifiée. Rechargez la page.', 409, { code: 'STALE' });
  }

  /* Credits go back when the hotel no longer has a residency: rejected or
     cancelled before it was confirmed. A confirmed residency the hotel then
     cancels is not refunded - the convention makes that the hotel's cost.

     On the privileged client because the actor may be the artist, whose
     identity the hotel's credit policy refuses. Authorisation was decided
     above; this is the write it decided on. */
  const refundCredits =
    RELEASES_CREDITS.includes(to) && (from === 'PENDING' || (from === 'CONFIRMED' && actor === 'ARTIST'));
  if (refundCredits && booking.creditCost > 0) {
    const alreadyRefunded = await prismaAdmin.creditLedger.findFirst({
      where: { bookingId: booking.id, reason: 'BOOKING_REFUND' },
      select: { id: true },
    });
    if (!alreadyRefunded) {
      await prismaAdmin.$transaction([
        prismaAdmin.creditLedger.create({
          data: { hotelId: booking.hotelId, delta: booking.creditCost, reason: 'BOOKING_REFUND', bookingId: booking.id, note: `Booking ${booking.id} ${to.toLowerCase()}` },
        }),
        prismaAdmin.credit.update({ where: { hotelId: booking.hotelId }, data: { usedCredits: { decrement: booking.creditCost } } }),
      ]);
    }
  }

  const row = await prisma.booking.findUnique({ where: { id: booking.id }, select: bookingSelect });
  const stay = formatStay(row!.startDate, row!.endDate);
  const artistLabel = row!.artist.stageName || row!.artist.user.name || 'L’artiste';
  const payload = bookingPayload(row!);
  const link = `${config.frontendUrl}/dashboard/bookings`;

  // Tell whoever did not act.
  if (to === 'CONFIRMED') {
    background(notify({
      userId: row!.hotel.user.id,
      type: 'BOOKING_CONFIRMED',
      payload: { ...payload, hotelName: null },
      email: () => bookingConfirmedEmail(row!.hotel.user.email, row!.hotel.name, artistLabel, stay, link),
    }), 'notify');
    // The convention exists from now on; the artist signs it too.
    background(notify({
      userId: row!.artist.user.id,
      type: 'CONVENTION_TO_SIGN',
      payload: { ...payload, artistName: null },
      email: () => conventionToSignEmail(row!.artist.user.email, artistLabel, row!.hotel.name, stay, link),
    }), 'notify');
  } else if (to === 'CANCELLED' && actor === 'ARTIST') {
    background(notify({
      userId: row!.hotel.user.id,
      type: 'BOOKING_CANCELLED',
      payload: { ...payload, hotelName: null },
      email: () => bookingCancelledByArtistEmail(row!.hotel.user.email, row!.hotel.name, artistLabel, stay, reason ?? '', Boolean(booking.conventionFinalizedAt), link),
    }), 'notify');
  } else if (to === 'REJECTED') {
    background(notify({
      userId: row!.hotel.user.id,
      type: 'BOOKING_REJECTED',
      payload,
      email: () => bookingRejectedEmail(row!.hotel.user.email, row!.hotel.name, artistLabel, stay, `${config.frontendUrl}/dashboard/artists`),
    }), 'notify');
  } else if (to === 'CANCELLED') {
    background(notify({
      userId: row!.artist.user.id,
      type: 'BOOKING_CANCELLED',
      payload: { ...payload, artistName: null },
      email: () => bookingCancelledEmail(row!.artist.user.email, artistLabel, row!.hotel.name, stay, link),
    }), 'notify');

    /* Article 14: a hotel cancelling after the convention was signed owes the
       coordinator's fee and, when the artist paid the journey, the artist's
       justified tickets. Before signature there is nothing to owe. */
    if (actor === 'HOTEL' && from === 'CONFIRMED' && booking.conventionFinalizedAt) {
      const claim = await openCancellationClaim({ id: booking.id, transportTerms: booking.transportTerms });
      const fee = formatMoney(claim.feeCents, 'EUR');
      background(notify({
        userId: row!.hotel.user.id,
        type: 'CANCELLATION_FEE_DUE',
        payload: { ...payload, hotelName: null },
        email: () => cancellationFeeDueEmail(row!.hotel.user.email, row!.hotel.name, artistLabel, stay, fee, formatDay(claim.feeDueAt), claim.transportEligible, link),
      }), 'notify');
      if (claim.transportEligible) {
        background(notify({
          userId: row!.artist.user.id,
          type: 'TRANSPORT_CLAIM_OPEN',
          payload: { ...payload, artistName: null },
          email: () => transportClaimInviteEmail(row!.artist.user.email, artistLabel, row!.hotel.name, stay, link),
        }), 'notify');
      }
      background(adminAlertEmail(`Annulation après signature : ${row!.hotel.name}`, [
        `Résidence de ${artistLabel} ${stay}.`,
        `Frais de dossier dus : ${fee}, avant le ${formatDay(claim.feeDueAt)}.`,
        claim.transportEligible ? 'L’artiste peut demander le remboursement de son transport.' : 'Pas de remboursement de transport prévu.',
      ], `${config.frontendUrl}/dashboard/claims`), 'adminAlertEmail');
    }
  }

  // Read again: a cancellation may have opened a claim the card should show.
  const fresh = await prisma.booking.findUnique({ where: { id: booking.id }, select: bookingSelect });
  res.json({ success: true, data: toBookingDTO(fresh ?? row!, req.user!.role) });
}));

// ----------------------------------------------------------------- ratings

/**
 * A hotel rates the artist of one of its own completed residencies, once.
 * The hotel and the artist are read from the booking - never from the
 * request, which used to let a hotel with one finished residency post
 * ratings on any artist it liked by changing `artistId`.
 */
router.post('/ratings', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const input = ratingCreateSchema.parse(req.body);
  const scope = await partyScope(req.user!);
  const booking = scope
    ? await prisma.booking.findFirst({
        where: { id: input.bookingId, ...scope },
        select: { id: true, status: true, hotelId: true, artistId: true, hotel: { select: { name: true } }, artist: { select: { userId: true } } },
      })
    : null;
  if (!booking) throw new CustomError('Réservation introuvable.', 404);
  if (booking.status !== 'COMPLETED') {
    throw new CustomError('Une résidence ne peut être évaluée qu’une fois terminée.', 400);
  }

  let rating;
  try {
    rating = await prisma.rating.create({
      data: {
        bookingId: booking.id,
        hotelId: booking.hotelId,
        artistId: booking.artistId,
        stars: input.stars,
        textReview: input.textReview,
        isVisibleToArtist: input.isVisibleToArtist,
      },
      select: { id: true, bookingId: true, hotelId: true, artistId: true, stars: true, textReview: true, isVisibleToArtist: true, createdAt: true },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') throw new CustomError('Cette résidence a déjà été évaluée.', 409);
    throw error;
  }

  if (rating.isVisibleToArtist) {
    background(notify({
      userId: booking.artist.userId,
      type: 'RATING_RECEIVED',
      payload: { bookingId: booking.id, hotelName: booking.hotel.name, stars: rating.stars },
    }), 'notify');
  }

  res.status(201).json({ success: true, data: rating });
}));

export { router as bookingRoutes };
