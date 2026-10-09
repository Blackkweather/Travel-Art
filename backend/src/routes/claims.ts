import { Router } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { prisma, prismaAdmin } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { config } from '../config';
import { stripe, isStripeConfigured } from '../stripe';
import { detectProofType, looksLikeMarkup } from '../services/fileType';
import { storeFile } from '../services/storage';
import { notify } from '../services/notifications';
import { formatMoney, formatDay } from '../services/convention';
import { adminAlertEmail, transportClaimSettledEmail, transportClaimSubmittedEmail } from '../services/email';
import { feeSettleSchema, transportClaimSchema, transportSettleSchema } from '../shared/validation';
import { background } from '../services/background';

/**
 * What follows a hotel cancelling a signed convention (article 14).
 *
 * Two debts, tracked separately because they have different creditors:
 *   - the coordinator's flat 89 € fee, which the hotel pays here by card, or
 *     an admin records as paid by transfer, or waives (force majeure);
 *   - the participant's justified, non-refundable transport costs, which the
 *     participant claims with proofs and the hotel repays directly. The hotel
 *     marks it repaid; an admin can rule either way.
 *
 * cancellation_claims is not under row-level security; every route here
 * decides who the caller is from the booking before touching it.
 */

const router = Router();

const DAY = 86400000;
const PAYMENT_DELAY_DAYS = 15;

const claimSelect = {
  id: true,
  bookingId: true,
  feeCents: true,
  feeStatus: true,
  feeDueAt: true,
  feeSettledAt: true,
  feeNote: true,
  transportEligible: true,
  transportStatus: true,
  transportAmountCents: true,
  transportNote: true,
  transportProofUrls: true,
  transportSubmittedAt: true,
  transportDueAt: true,
  transportSettledAt: true,
  transportSettleNote: true,
  createdAt: true,
  booking: {
    select: {
      id: true,
      startDate: true,
      endDate: true,
      currency: true,
      cancelledAt: true,
      cancellationReason: true,
      hotel: { select: { id: true, name: true, user: { select: { id: true, email: true } } } },
      artist: { select: { id: true, stageName: true, user: { select: { id: true, name: true, email: true } } } },
    },
  },
} satisfies Prisma.CancellationClaimSelect;

type ClaimRow = Prisma.CancellationClaimGetPayload<{ select: typeof claimSelect }>;

export function toClaimDTO(row: ClaimRow) {
  const now = Date.now();
  return {
    id: row.id,
    bookingId: row.bookingId,
    fee: {
      amount: row.feeCents / 100,
      status: row.feeStatus,
      dueAt: row.feeDueAt,
      overdue: row.feeStatus === 'DUE' && row.feeDueAt.getTime() < now,
      settledAt: row.feeSettledAt,
      note: row.feeNote,
    },
    transport: {
      eligible: row.transportEligible,
      status: row.transportStatus,
      amount: row.transportAmountCents === null ? null : row.transportAmountCents / 100,
      note: row.transportNote,
      proofs: row.transportProofUrls,
      submittedAt: row.transportSubmittedAt,
      dueAt: row.transportDueAt,
      overdue: row.transportStatus === 'SUBMITTED' && !!row.transportDueAt && row.transportDueAt.getTime() < now,
      settledAt: row.transportSettledAt,
      settleNote: row.transportSettleNote,
    },
    booking: {
      id: row.booking.id,
      startDate: row.booking.startDate,
      endDate: row.booking.endDate,
      cancelledAt: row.booking.cancelledAt,
      cancellationReason: row.booking.cancellationReason,
      hotel: { id: row.booking.hotel.id, name: row.booking.hotel.name },
      artist: { id: row.booking.artist.id, stageName: row.booking.artist.stageName, name: row.booking.artist.user.name },
    },
    createdAt: row.createdAt,
  };
}

/** Which claims the caller may see. */
async function scopeFor(user: { id: string; role: string }): Promise<Prisma.CancellationClaimWhereInput | null> {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({ where: { userId: user.id }, select: { id: true } });
    return hotel ? { booking: { hotelId: hotel.id } } : null;
  }
  if (user.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({ where: { userId: user.id }, select: { id: true } });
    return artist ? { booking: { artistId: artist.id } } : null;
  }
  return null;
}

async function loadClaim(id: string, user: { id: string; role: string }): Promise<ClaimRow> {
  const scope = await scopeFor(user);
  const row = scope ? await prismaAdmin.cancellationClaim.findFirst({ where: { id, ...scope }, select: claimSelect }) : null;
  if (!row) throw new CustomError('Dossier introuvable.', 404);
  return row;
}

/**
 * Opened by the booking route when a hotel cancels a signed convention.
 * Idempotent on bookingId.
 */
export async function openCancellationClaim(booking: { id: string; transportTerms: string | null }, now = new Date()) {
  const transportEligible = booking.transportTerms === 'ARTIST_PAYS' || booking.transportTerms === 'SHARED';
  return prismaAdmin.cancellationClaim.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      feeCents: config.hotelCancellationFeeCents,
      feeDueAt: new Date(now.getTime() + PAYMENT_DELAY_DAYS * DAY),
      transportEligible,
    },
    update: {},
    select: claimSelect,
  });
}

// --------------------------------------------------------------------- list

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const scope = await scopeFor(req.user!);
  if (!scope) return res.json({ success: true, data: { claims: [] } });
  const where: Prisma.CancellationClaimWhereInput = { ...scope };
  if (req.user!.role === 'ADMIN' && req.query.open === '1') {
    where.OR = [{ feeStatus: 'DUE' }, { transportStatus: 'SUBMITTED' }];
  }
  const rows = await prismaAdmin.cancellationClaim.findMany({ where, select: claimSelect, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ success: true, data: { claims: rows.map(toClaimDTO) } });
}));

// --------------------------------------------------------------------- fee

/** The hotel pays the coordinator's fee by card. */
router.post('/:id/fee/checkout', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const claim = await loadClaim(req.params.id, req.user!);
  if (claim.feeStatus !== 'DUE') throw new CustomError('Ces frais sont déjà réglés.', 409);
  if (!isStripeConfigured() || !stripe) {
    throw new CustomError('Le paiement en ligne n’est pas encore ouvert. Répondez à l’e-mail reçu pour régler ces frais par virement.', 503, { code: 'PAYMENTS_UNAVAILABLE' });
  }

  const payment = await prisma.payment.create({
    data: { actorUserId: req.user!.id, amountCents: claim.feeCents, currency: 'EUR', status: 'PENDING', claimId: claim.id },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: payment.id,
    // Echoed back on the webhook, the only place the fee is marked paid.
    metadata: { app: 'travel-art', paymentId: payment.id, claimId: claim.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: claim.feeCents,
          product_data: {
            name: 'Frais de traitement de dossier',
            description: `Annulation de la résidence du ${formatDay(claim.booking.startDate)} (convention, article 14)`,
          },
        },
      },
    ],
    success_url: `${config.frontendUrl}/dashboard/bookings?fee=paid`,
    cancel_url: `${config.frontendUrl}/dashboard/bookings?fee=cancelled`,
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });
  res.json({ success: true, data: { checkoutUrl: session.url } });
}));

/** An admin records a transfer, or waives the fee (force majeure, goodwill). */
router.post('/:id/fee/settle', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const input = feeSettleSchema.parse(req.body);
  const claim = await loadClaim(req.params.id, req.user!);
  const moved = await prismaAdmin.cancellationClaim.updateMany({
    where: { id: claim.id, feeStatus: 'DUE' },
    data: { feeStatus: input.status, feeSettledAt: new Date(), feeNote: input.note },
  });
  if (moved.count === 0) throw new CustomError('Ces frais sont déjà réglés.', 409);
  await prismaAdmin.adminLog.create({ data: { action: `CLAIM_FEE_${input.status}`, actorUserId: req.user!.id, targetId: claim.id } }).catch(() => undefined);
  const row = await prismaAdmin.cancellationClaim.findUnique({ where: { id: claim.id }, select: claimSelect });
  res.json({ success: true, data: toClaimDTO(row!) });
}));

// --------------------------------------------------------------- transport

const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROOF_BYTES, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new CustomError('Justificatifs acceptés : PDF, JPEG, PNG, WebP.', 400));
  },
});

const handleProofError = (err: any, _req: any, _res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Justificatif trop lourd : 8 Mo maximum.' : err.code === 'LIMIT_FILE_COUNT' ? '5 justificatifs maximum.' : 'Envoi impossible.';
    return next(new CustomError(message, 400));
  }
  next(err);
};

/** The participant claims their tickets, with proofs. */
router.post(
  '/:id/transport',
  authenticate,
  authorize('ARTIST'),
  proofUpload.array('proofs', 5),
  handleProofError,
  asyncHandler(async (req: AuthRequest, res) => {
    const input = transportClaimSchema.parse({ amount: req.body.amount, note: req.body.note });
    const claim = await loadClaim(req.params.id, req.user!);
    if (!claim.transportEligible) throw new CustomError('Le transport n’était pas à votre charge dans cette convention.', 400);
    if (claim.transportStatus === 'SUBMITTED' || claim.transportStatus === 'PAID') throw new CustomError('Votre demande est déjà enregistrée.', 409);

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw new CustomError('Joignez au moins un justificatif (billet, facture).', 400, { fields: { proofs: 'Joignez au moins un justificatif (billet, facture).' } });
    }
    const types = files.map((file) => {
      const type = detectProofType(file.buffer);
      if (!type) throw new CustomError('Un des fichiers n’est ni un PDF ni une image.', 400);
      if (looksLikeMarkup(file.buffer)) throw new CustomError('Un des fichiers a été refusé pour des raisons de sécurité.', 400);
      return type;
    });
    const stored = [];
    for (let i = 0; i < files.length; i += 1) stored.push(await storeFile(files[i].buffer, types[i], 'claims'));

    const now = new Date();
    const due = new Date(now.getTime() + PAYMENT_DELAY_DAYS * DAY);
    const moved = await prismaAdmin.cancellationClaim.updateMany({
      where: { id: claim.id, OR: [{ transportStatus: null }, { transportStatus: 'REJECTED' }] },
      data: {
        transportStatus: 'SUBMITTED',
        transportAmountCents: input.amount!,
        transportNote: input.note,
        transportProofUrls: stored.map((s) => s.url),
        transportProofKeys: stored.map((s) => s.storageKey),
        transportSubmittedAt: now,
        transportDueAt: due,
        transportSettledAt: null,
        transportSettleNote: null,
      },
    });
    if (moved.count === 0) throw new CustomError('Votre demande est déjà enregistrée.', 409);

    const amount = formatMoney(input.amount!, 'EUR');
    const artistName = claim.booking.artist.stageName || claim.booking.artist.user.name;
    background(notify({
      userId: claim.booking.hotel.user.id,
      type: 'TRANSPORT_CLAIM_SUBMITTED',
      payload: { bookingId: claim.bookingId, startDate: claim.booking.startDate.toISOString(), endDate: claim.booking.endDate.toISOString(), hotelName: null, artistName },
      email: () => transportClaimSubmittedEmail(claim.booking.hotel.user.email, claim.booking.hotel.name, artistName, amount, formatDay(due), `${config.frontendUrl}/dashboard/bookings`),
    }), 'notify');
    background(adminAlertEmail(`Demande de transport : ${artistName} → ${claim.booking.hotel.name}`, [`Montant : ${amount}`, `À rembourser avant le ${formatDay(due)}.`], `${config.frontendUrl}/dashboard/claims`), 'adminAlertEmail');

    const row = await prismaAdmin.cancellationClaim.findUnique({ where: { id: claim.id }, select: claimSelect });
    res.status(201).json({ success: true, data: toClaimDTO(row!) });
  })
);

/** The hotel says it repaid; an admin may also reject a claim that is not justified. */
router.post('/:id/transport/settle', authenticate, authorize('HOTEL', 'ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const input = transportSettleSchema.parse(req.body);
  if (input.status === 'REJECTED' && req.user!.role !== 'ADMIN') {
    throw new CustomError('Seule notre équipe peut écarter une demande. Écrivez-nous si elle vous semble injustifiée.', 403);
  }
  const claim = await loadClaim(req.params.id, req.user!);
  const moved = await prismaAdmin.cancellationClaim.updateMany({
    where: { id: claim.id, transportStatus: 'SUBMITTED' },
    data: { transportStatus: input.status, transportSettledAt: new Date(), transportSettleNote: input.note },
  });
  if (moved.count === 0) throw new CustomError('Aucune demande en attente sur ce dossier.', 409);
  if (req.user!.role === 'ADMIN') {
    await prismaAdmin.adminLog.create({ data: { action: `CLAIM_TRANSPORT_${input.status}`, actorUserId: req.user!.id, targetId: claim.id } }).catch(() => undefined);
  }

  const artistName = claim.booking.artist.stageName || claim.booking.artist.user.name;
  background(notify({
    userId: claim.booking.artist.user.id,
    type: 'TRANSPORT_CLAIM_SETTLED',
    payload: { bookingId: claim.bookingId, hotelName: claim.booking.hotel.name, artistName: null },
    email: () => transportClaimSettledEmail(claim.booking.artist.user.email, artistName, claim.booking.hotel.name, input.status === 'PAID', input.note, `${config.frontendUrl}/dashboard/bookings`),
  }), 'notify');

  const row = await prismaAdmin.cancellationClaim.findUnique({ where: { id: claim.id }, select: claimSelect });
  res.json({ success: true, data: toClaimDTO(row!) });
}));

export { router as claimRoutes };
