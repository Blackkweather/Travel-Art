/**
 * The convention from acceptance to signature, and what a cancellation after
 * signature leaves owing (articles 13 and 14).
 */
import { api, auth, bookingBody, makeAdmin, makeArtist, makeHotel, prismaAdmin, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

async function confirmedBooking(overrides: Record<string, unknown> = {}) {
  const hotel = await makeHotel();
  const artist = await makeArtist();
  const created = await api().post('/api/bookings').set(auth(hotel.token)).send({ ...bookingBody(hotel.hotelId, artist.artistId), ...overrides });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  const accepted = await api().patch(`/api/bookings/${id}/status`).set(auth(artist.token)).send({ status: 'CONFIRMED' });
  expect(accepted.status).toBe(200);
  return { hotel, artist, id };
}

const hotelSignature = (termsHash: string, extra: Record<string, unknown> = {}) => ({
  legalName: 'Riad Test SARL',
  legalForm: 'SARL',
  address: '12 derb Test, Marrakech',
  registrationNumber: 'RC 123',
  taxId: 'ICE 456',
  signatoryName: 'Karim Test',
  signatoryTitle: 'Gérant',
  accept: true,
  typedName: 'karim test',
  termsHash,
  ...extra,
});

const participantSignature = (termsHash: string, extra: Record<string, unknown> = {}) => ({
  fullName: 'Salma Bennani',
  address: '4 rue Exemple, 75011 Paris',
  idDocument: 'ab123456',
  accept: true,
  typedName: 'Salma Bennani',
  termsHash,
  ...extra,
});

async function signBoth(ctx: Awaited<ReturnType<typeof confirmedBooking>>) {
  const view = await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(ctx.hotel.token));
  const hash = view.body.data.termsHash;
  expect((await api().post(`/api/bookings/${ctx.id}/convention/sign`).set(auth(ctx.hotel.token)).send(hotelSignature(hash))).status).toBe(200);
  const last = await api().post(`/api/bookings/${ctx.id}/convention/sign`).set(auth(ctx.artist.token)).send(participantSignature(hash));
  expect(last.status).toBe(200);
  return last;
}

describe('the convention', () => {
  it('does not exist before the artist accepts', async () => {
    const hotel = await makeHotel();
    const artist = await makeArtist();
    const created = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    const res = await api().get(`/api/bookings/${created.body.data.id}/convention`).set(auth(hotel.token));
    expect(res.status).toBe(409);
  });

  it('is the owner’s text, filled in from the booking, readable by both parties only', async () => {
    const ctx = await confirmedBooking({ roomType: 'Suite Atlas', performanceLocation: 'Rooftop' });
    const res = await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(ctx.hotel.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('TO_SIGN');
    expect(res.body.data.canSign).toBe(true);
    expect(res.body.data.termsHash).toMatch(/^[a-f0-9]{64}$/);
    const text = JSON.stringify(res.body.data.blocks);
    expect(text).toContain('ARTICLE 22 — DROIT APPLICABLE');
    expect(text).toContain('droit marocain');
    expect(text).toContain('89 €');
    expect(text).toContain('15 jours calendaires');
    expect(text).toContain('Suite Atlas');
    expect(text).toContain('Rooftop');

    const asArtist = await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(ctx.artist.token));
    expect(asArtist.status).toBe(200);
    expect(asArtist.body.data.party).toBe('PARTICIPANT');

    const stranger = await makeHotel();
    expect((await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(stranger.token))).status).toBe(404);
    const otherArtist = await makeArtist();
    expect((await api().get(`/api/bookings/${ctx.id}/convention.pdf`).set(auth(otherArtist.token))).status).toBe(404);
  });

  it('refuses a signature with the wrong name, on stale terms, or twice', async () => {
    const ctx = await confirmedBooking();
    const { termsHash } = (await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(ctx.hotel.token))).body.data;
    const sign = (body: object) => api().post(`/api/bookings/${ctx.id}/convention/sign`).set(auth(ctx.hotel.token)).send(body);

    const wrongName = await sign(hotelSignature(termsHash, { typedName: 'Quelqu’un d’autre' }));
    expect(wrongName.status).toBe(400);
    expect(wrongName.body.error.fields.typedName).toBeDefined();

    expect((await sign(hotelSignature('0'.repeat(64)))).status).toBe(409);
    expect((await sign(hotelSignature(termsHash, { accept: false }))).status).toBe(400);

    const ok = await sign(hotelSignature(termsHash));
    expect(ok.status).toBe(200);
    expect(ok.body.data.finalized).toBe(false);
    expect((await sign(hotelSignature(termsHash))).status).toBe(409);
  });

  it('is final once both have signed: coordinator added, PDF stored and downloadable', async () => {
    const ctx = await confirmedBooking();
    const last = await signBoth(ctx);
    expect(last.body.data.finalized).toBe(true);

    const signatures = await prismaAdmin.conventionSignature.findMany({ where: { bookingId: ctx.id } });
    expect(signatures.map((s) => s.party).sort()).toEqual(['COORDINATOR', 'HOTEL', 'PARTICIPANT']);
    const participant = signatures.find((s) => s.party === 'PARTICIPANT')!;
    expect((participant.identity as any).idDocument).toBe('AB123456');

    const booking = await prismaAdmin.booking.findUnique({ where: { id: ctx.id }, select: { conventionFinalizedAt: true, conventionPdf: true, conventionHash: true } });
    expect(booking!.conventionFinalizedAt).not.toBeNull();
    expect(Buffer.from(booking!.conventionPdf!).subarray(0, 5).toString()).toBe('%PDF-');

    const hotelRow = await prismaAdmin.hotel.findUnique({ where: { id: ctx.hotel.hotelId }, select: { legalName: true, signatoryName: true } });
    expect(hotelRow).toEqual({ legalName: 'Riad Test SARL', signatoryName: 'Karim Test' });

    const pdf = await api().get(`/api/bookings/${ctx.id}/convention.pdf`).set(auth(ctx.artist.token)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');

    const list = await api().get('/api/bookings').set(auth(ctx.hotel.token));
    const card = list.body.data.bookings.find((b: any) => b.id === ctx.id);
    expect(card.signing.finalizedAt).not.toBeNull();
    expect(card.signing.signedBy).toHaveLength(3);

    const view = await api().get(`/api/bookings/${ctx.id}/convention`).set(auth(ctx.hotel.token));
    expect(view.body.data.status).toBe('SIGNED');
    expect(view.body.data.canSign).toBe(false);
  });
});

describe('cancellation after signature (article 14)', () => {
  it('opens a claim: the 89 € fee, and the transport refund when the artist paid the journey', async () => {
    const ctx = await confirmedBooking({ transportTerms: 'ARTIST_PAYS' });
    await signBoth(ctx);

    const cancelled = await api().patch(`/api/bookings/${ctx.id}/status`).set(auth(ctx.hotel.token)).send({ status: 'CANCELLED', reason: 'Travaux imprévus' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.claim.fee).toMatchObject({ amount: 89, status: 'DUE' });
    expect(cancelled.body.data.claim.transport.eligible).toBe(true);

    const claims = await api().get('/api/claims').set(auth(ctx.artist.token));
    expect(claims.body.data.claims).toHaveLength(1);
    const claimId = claims.body.data.claims[0].id;

    // Proofs are required.
    const noProof = await api().post(`/api/claims/${claimId}/transport`).set(auth(ctx.artist.token)).field('amount', '240');
    expect(noProof.status).toBe(400);

    const claim = await api()
      .post(`/api/claims/${claimId}/transport`)
      .set(auth(ctx.artist.token))
      .field('amount', '240,50')
      .field('note', 'Vol non remboursable')
      .attach('proofs', Buffer.from('%PDF-1.4\n%test ticket\n'), { filename: 'billet.pdf', contentType: 'application/pdf' });
    expect(claim.status).toBe(201);
    expect(claim.body.data.transport).toMatchObject({ status: 'SUBMITTED', amount: 240.5 });
    expect(claim.body.data.transport.proofs).toHaveLength(1);

    // A hotel cannot dismiss a claim itself; it can say it paid.
    const reject = await api().post(`/api/claims/${claimId}/transport/settle`).set(auth(ctx.hotel.token)).send({ status: 'REJECTED' });
    expect(reject.status).toBe(403);
    const paid = await api().post(`/api/claims/${claimId}/transport/settle`).set(auth(ctx.hotel.token)).send({ status: 'PAID', note: 'Virement du 10/10' });
    expect(paid.status).toBe(200);
    expect(paid.body.data.transport.status).toBe('PAID');

    // No card payments configured here: the hotel is told how else to pay.
    expect((await api().post(`/api/claims/${claimId}/fee/checkout`).set(auth(ctx.hotel.token))).status).toBe(503);
    const admin = await makeAdmin();
    const waived = await api().post(`/api/claims/${claimId}/fee/settle`).set(auth(admin.token)).send({ status: 'WAIVED', note: 'Force majeure établie' });
    expect(waived.status).toBe(200);
    expect(waived.body.data.fee.status).toBe('WAIVED');
    expect((await api().post(`/api/claims/${claimId}/fee/settle`).set(auth(admin.token)).send({ status: 'PAID' })).status).toBe(409);

    // Nobody else sees it.
    const stranger = await makeHotel();
    expect((await api().get('/api/claims').set(auth(stranger.token))).body.data.claims).toHaveLength(0);
  });

  it('owes nothing when the hotel paid the journey, beyond the fee', async () => {
    const ctx = await confirmedBooking({ transportTerms: 'HOTEL_PAYS' });
    await signBoth(ctx);
    const cancelled = await api().patch(`/api/bookings/${ctx.id}/status`).set(auth(ctx.hotel.token)).send({ status: 'CANCELLED' });
    expect(cancelled.body.data.claim.transport.eligible).toBe(false);
    const claimId = cancelled.body.data.claim.id;
    const attempt = await api()
      .post(`/api/claims/${claimId}/transport`)
      .set(auth(ctx.artist.token))
      .field('amount', '100')
      .attach('proofs', Buffer.from('%PDF-1.4\n'), { filename: 'b.pdf', contentType: 'application/pdf' });
    expect(attempt.status).toBe(400);
  });

  it('owes nothing at all before the convention is signed', async () => {
    const ctx = await confirmedBooking({ transportTerms: 'ARTIST_PAYS' });
    const cancelled = await api().patch(`/api/bookings/${ctx.id}/status`).set(auth(ctx.hotel.token)).send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.claim).toBeNull();
    expect(await prismaAdmin.cancellationClaim.count()).toBe(0);
  });
});

describe('the artist withdrawing (article 13)', () => {
  it('needs a reason, and gives the hotel its credits back', async () => {
    const ctx = await confirmedBooking();
    const before = await prismaAdmin.credit.findUnique({ where: { hotelId: ctx.hotel.hotelId } });

    const silent = await api().patch(`/api/bookings/${ctx.id}/status`).set(auth(ctx.artist.token)).send({ status: 'CANCELLED' });
    expect(silent.status).toBe(400);

    const withdrawn = await api().patch(`/api/bookings/${ctx.id}/status`).set(auth(ctx.artist.token)).send({ status: 'CANCELLED', reason: 'Blessure au genou' });
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.data.status).toBe('CANCELLED');
    expect(withdrawn.body.data.cancelledByRole).toBe('ARTIST');

    const after = await prismaAdmin.credit.findUnique({ where: { hotelId: ctx.hotel.hotelId } });
    expect(after!.usedCredits).toBe(before!.usedCredits - 5);
    expect(await prismaAdmin.cancellationClaim.count()).toBe(0);
  });
});
