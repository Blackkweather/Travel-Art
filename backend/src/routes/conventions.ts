import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma, prismaAdmin } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { config } from '../config';
import { hashIp, clientIp } from '../config/legal';
import {
  buildConvention,
  conventionBookingSelect,
  coordinatorIdentity,
  hotelIdentityOf,
  participantIdentityOf,
  termsHash,
  type ConventionInput,
  type PartyKey,
  type SignatureInput,
} from '../services/convention';
import { renderConventionPdf } from '../services/conventionPdf';
import { notify } from '../services/notifications';
import { conventionSignedAdminEmail, conventionSignedEmail, formatStay } from '../services/email';
import { hotelSignatureSchema, participantSignatureSchema } from '../shared/validation';

/**
 * The convention of a booking: read it, sign it, download it.
 *
 * A convention exists from the moment the artist accepts (CONFIRMED). Each of
 * the two parties signs from its own space, filling in the identity the
 * document prints for it. When both have signed the same terms, the
 * coordinator's signature is added, the PDF is rendered once and stored as
 * the record, and everyone receives it. That moment is the "validation
 * définitive" article 14 counts from.
 */

const router = Router();

type ConventionRow = Prisma.BookingGetPayload<{ select: typeof conventionBookingSelect }>;

const SIGNABLE = new Set(['CONFIRMED']);
const VIEWABLE = new Set(['CONFIRMED', 'COMPLETED', 'CANCELLED']);

/** The booking, if the caller is one of its parties or an admin; and which party they are. */
async function loadForCaller(bookingId: string, user: { id: string; role: string }): Promise<{ row: ConventionRow; party: PartyKey | null }> {
  // Read through the request-scoped client: row-level security already
  // limits bookings to their hotel, their artist and admins.
  const row = await prisma.booking.findUnique({ where: { id: bookingId }, select: conventionBookingSelect });
  if (!row) throw new CustomError('Réservation introuvable.', 404);
  if (user.role === 'ADMIN') return { row, party: null };
  if (user.role === 'HOTEL' && row.hotel.user.id === user.id) return { row, party: 'HOTEL' };
  if (user.role === 'ARTIST' && row.artist.user.id === user.id) return { row, party: 'PARTICIPANT' };
  throw new CustomError('Réservation introuvable.', 404);
}

const signaturesOf = (row: ConventionRow): SignatureInput[] =>
  row.signatures.map((s) => ({ party: s.party as PartyKey, signerName: s.signerName, signerTitle: s.signerTitle, identity: s.identity, signedAt: s.signedAt }));

function prefillFor(row: ConventionRow, party: PartyKey | null) {
  if (party === 'HOTEL') {
    const id = hotelIdentityOf(row as unknown as ConventionInput);
    return { ...id, legalName: row.hotel.legalName ?? '' };
  }
  if (party === 'PARTICIPANT') {
    const id = participantIdentityOf(row as unknown as ConventionInput);
    return { fullName: id.fullName, address: '', idDocument: '' };
  }
  return null;
}

function statusOf(row: ConventionRow): 'TO_SIGN' | 'SIGNED' | 'UNAVAILABLE' {
  if (row.conventionFinalizedAt) return 'SIGNED';
  if (SIGNABLE.has(row.status)) return 'TO_SIGN';
  return 'UNAVAILABLE';
}

// --------------------------------------------------------------------- read

router.get('/:id/convention', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { row, party } = await loadForCaller(req.params.id, req.user!);
  if (!VIEWABLE.has(row.status)) {
    throw new CustomError('La convention sera disponible quand l’artiste aura accepté la résidence.', 409, { code: 'CONVENTION_NOT_READY' });
  }
  const signatures = signaturesOf(row);
  const doc = buildConvention(row as unknown as ConventionInput, signatures, row.conventionFinalizedAt);
  const mine = party ? signatures.find((s) => s.party === party) : undefined;

  res.json({
    success: true,
    data: {
      reference: doc.reference,
      termsHash: doc.termsHash,
      blocks: doc.blocks,
      status: statusOf(row),
      finalizedAt: row.conventionFinalizedAt,
      signatures: signatures.map((s) => ({ party: s.party, signerName: s.signerName, signedAt: s.signedAt })),
      party,
      canSign: Boolean(party) && !mine && SIGNABLE.has(row.status) && !row.conventionFinalizedAt,
      prefill: mine ? null : prefillFor(row, party),
    },
  });
}));

router.get('/:id/convention.pdf', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { row } = await loadForCaller(req.params.id, req.user!);
  if (!VIEWABLE.has(row.status)) throw new CustomError('La convention n’est pas encore disponible.', 409);

  let pdf: Buffer;
  if (row.conventionFinalizedAt) {
    // The signed record, exactly as it was sent.
    const stored = await prismaAdmin.booking.findUnique({ where: { id: row.id }, select: { conventionPdf: true } });
    pdf = stored?.conventionPdf ? Buffer.from(stored.conventionPdf) : await renderConventionPdf(buildConvention(row as unknown as ConventionInput, signaturesOf(row), row.conventionFinalizedAt), { draft: false });
  } else {
    pdf = await renderConventionPdf(buildConvention(row as unknown as ConventionInput, signaturesOf(row), null), { draft: true });
  }

  const name = `convention-TA-${row.id.slice(-8).toUpperCase()}${row.conventionFinalizedAt ? '' : '-projet'}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(pdf);
}));

// --------------------------------------------------------------------- sign

router.post('/:id/convention/sign', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { row, party } = await loadForCaller(req.params.id, req.user!);
  if (!party) throw new CustomError('Seuls l’hôtel et l’artiste signent la convention.', 403);
  if (!SIGNABLE.has(row.status) || row.conventionFinalizedAt) {
    throw new CustomError('Cette convention ne peut plus être signée.', 409, { code: 'CONVENTION_CLOSED' });
  }

  const current = termsHash(row as unknown as ConventionInput);
  const meta = { ipHash: hashIp(clientIp(req)), userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) || null };

  let signerName: string;
  let signerTitle: string | null = null;
  let identity: Record<string, string>;

  if (party === 'HOTEL') {
    const input = hotelSignatureSchema.parse(req.body);
    if (input.termsHash !== current) throw new CustomError('La convention a changé depuis que vous l’avez ouverte. Relisez-la avant de signer.', 409, { code: 'TERMS_CHANGED' });
    signerName = input.signatoryName;
    signerTitle = input.signatoryTitle;
    identity = {
      legalName: input.legalName,
      legalForm: input.legalForm ?? '',
      address: input.address,
      registrationNumber: input.registrationNumber ?? '',
      taxId: input.taxId ?? '',
      signatoryName: input.signatoryName,
      signatoryTitle: input.signatoryTitle,
    };
    // Kept on the profile for the next convention. The hotel's own row,
    // which its own session may write.
    await prisma.hotel.update({
      where: { id: row.hotel.id },
      data: {
        legalName: input.legalName,
        legalForm: input.legalForm,
        address: input.address,
        registrationNumber: input.registrationNumber,
        taxId: input.taxId,
        signatoryName: input.signatoryName,
        signatoryTitle: input.signatoryTitle,
      },
    });
  } else {
    const input = participantSignatureSchema.parse(req.body);
    if (input.termsHash !== current) throw new CustomError('La convention a changé depuis que vous l’avez ouverte. Relisez-la avant de signer.', 409, { code: 'TERMS_CHANGED' });
    signerName = input.fullName;
    identity = { fullName: input.fullName, address: input.address, idDocument: input.idDocument.toUpperCase() };
  }

  // A signature left by the other party on terms that have since moved no
  // longer agrees with anything; it is withdrawn and they sign again.
  const stale = row.signatures.filter((s) => s.party !== party && s.documentHash !== current);
  if (stale.length) {
    await prismaAdmin.conventionSignature.deleteMany({ where: { bookingId: row.id, party: { in: stale.map((s) => s.party) } } });
  }

  try {
    await prismaAdmin.conventionSignature.create({
      data: {
        bookingId: row.id,
        party,
        userId: req.user!.id,
        signerName,
        signerTitle,
        identity,
        documentHash: current,
        ...meta,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') throw new CustomError('Vous avez déjà signé cette convention.', 409, { code: 'ALREADY_SIGNED' });
    throw error;
  }

  const finalized = await finalizeIfComplete(row.id);

  if (!finalized) {
    // Tell the other party it is their turn.
    const other = party === 'HOTEL' ? row.artist.user : row.hotel.user;
    void notify({
      userId: other.id,
      type: 'CONVENTION_TO_SIGN',
      payload: {
        bookingId: row.id,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        hotelName: party === 'HOTEL' ? row.hotel.name : null,
        artistName: party === 'PARTICIPANT' ? row.artist.stageName || row.artist.user.name : null,
      },
    });
  }

  res.json({ success: true, data: { finalized } });
}));

/**
 * When the hotel and the participant have both signed the current terms: the
 * coordinator signs, the PDF is rendered and stored, and all three receive it.
 * Conditional on conventionFinalizedAt still being null, so two signatures
 * landing at once finalise exactly once.
 */
export async function finalizeIfComplete(bookingId: string): Promise<boolean> {
  const row = await prismaAdmin.booking.findUnique({ where: { id: bookingId }, select: conventionBookingSelect });
  if (!row || row.conventionFinalizedAt) return false;
  const current = termsHash(row as unknown as ConventionInput);
  const hotel = row.signatures.find((s) => s.party === 'HOTEL' && s.documentHash === current);
  const participant = row.signatures.find((s) => s.party === 'PARTICIPANT' && s.documentHash === current);
  if (!hotel || !participant) return false;

  const now = new Date();
  const coordinator = coordinatorIdentity();
  await prismaAdmin.conventionSignature.upsert({
    where: { bookingId_party: { bookingId, party: 'COORDINATOR' } },
    create: {
      bookingId,
      party: 'COORDINATOR',
      signerName: coordinator.representative || coordinator.name,
      signerTitle: coordinator.representative ? `pour ${coordinator.name}` : null,
      identity: { ...coordinator },
      documentHash: current,
      signedAt: now,
    },
    update: { documentHash: current, signedAt: now },
  });

  const signed = await prismaAdmin.booking.findUnique({ where: { id: bookingId }, select: conventionBookingSelect });
  const signatures = signaturesOf(signed!);
  const doc = buildConvention(signed as unknown as ConventionInput, signatures, now);
  const pdf = await renderConventionPdf(doc, { draft: false });

  const claimed = await prismaAdmin.booking.updateMany({
    where: { id: bookingId, conventionFinalizedAt: null },
    data: { conventionFinalizedAt: now, conventionHash: current, conventionPdf: pdf },
  });
  if (claimed.count === 0) return false;

  const stay = formatStay(row.startDate, row.endDate);
  const artistName = row.artist.stageName || row.artist.user.name;
  const link = `${config.frontendUrl}/dashboard/bookings`;
  const base = { bookingId, startDate: row.startDate.toISOString(), endDate: row.endDate.toISOString() };

  // Awaited, not fire-and-forget: this is the email that carries the contract.
  await Promise.all([
    notify({
      userId: row.hotel.user.id,
      type: 'CONVENTION_SIGNED',
      payload: { ...base, hotelName: null, artistName },
      email: () => conventionSignedEmail(row.hotel.user.email, row.hotel.name, row.hotel.name, artistName, stay, link, pdf, doc.reference),
    }),
    notify({
      userId: row.artist.user.id,
      type: 'CONVENTION_SIGNED',
      payload: { ...base, hotelName: row.hotel.name, artistName: null },
      email: () => conventionSignedEmail(row.artist.user.email, artistName, row.hotel.name, artistName, stay, link, pdf, doc.reference),
    }),
    conventionSignedAdminEmail(row.hotel.name, artistName, stay, `${config.frontendUrl}/dashboard/bookings`, pdf, doc.reference).catch(() => undefined),
  ]);

  return true;
}

export { router as conventionRoutes };
