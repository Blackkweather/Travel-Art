import { api, auth, bookingBody, makeArtist, makeHotel, prismaAdmin, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('booking with the convention terms', () => {
  it('records the terms, spends the credits and shows the artist exactly what is offered', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel({ credits: 20 });

    const res = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    expect(res.status).toBe(201);
    expect(res.body.data.convention).toMatchObject({
      boardType: 'FULL_BOARD',
      transportTerms: 'HOTEL_PAYS',
      companionName: 'Sam Dupont',
      stayValue: 1200,
      performanceValue: 900,
    });
    // No money for the artist anywhere in the booking.
    expect(JSON.stringify(res.body)).not.toMatch(/weeklyPayment|totalPaymentAmount|paymentStatus/);

    const credits = await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } });
    expect(credits!.usedCredits).toBe(5);

    const mine = await api().get('/api/bookings').set(auth(artist.token));
    expect(mine.body.data.bookings[0].convention.performanceDescription).toMatch(/yoga/);
  });

  it('refuses dates outside the artist’s availability and double bookings', async () => {
    const artist = await makeArtist({ availableDays: 20 });
    const hotelA = await makeHotel();
    const hotelB = await makeHotel();

    const outside = await api().post('/api/bookings').set(auth(hotelA.token)).send(bookingBody(hotelA.hotelId, artist.artistId, 15, 30));
    expect(outside.status).toBe(400);
    expect(outside.body.error.fields.startDate).toBeDefined();

    expect((await api().post('/api/bookings').set(auth(hotelA.token)).send(bookingBody(hotelA.hotelId, artist.artistId, 5, 10))).status).toBe(201);
    const clash = await api().post('/api/bookings').set(auth(hotelB.token)).send(bookingBody(hotelB.hotelId, artist.artistId, 8, 12));
    expect(clash.status).toBe(409);
  });

  it('refuses a booking the hotel cannot afford, without spending anything', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel({ credits: 3 });
    const res = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    expect((await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } }))!.usedCredits).toBe(0);
  });

  it('cannot spend the same credits twice under concurrency', async () => {
    const hotel = await makeHotel({ credits: 10 });
    const artists = await Promise.all([1, 2, 3, 4].map(() => makeArtist()));
    const results = await Promise.all(
      artists.map((a) => api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, a.artistId)))
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    const credits = await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } });
    expect(credits!.usedCredits).toBe(10);
  });

  it('refunds a rejected request, keeps the credits of a confirmed one the hotel cancels', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel({ credits: 20 });

    const first = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId, 5, 8));
    const rejected = await api().patch(`/api/bookings/${first.body.data.id}/status`).set(auth(artist.token)).send({ status: 'REJECTED', reason: 'Déjà engagé.' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.respondedAt).toBeTruthy();
    expect((await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } }))!.usedCredits).toBe(0);

    const second = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId, 20, 25));
    await api().patch(`/api/bookings/${second.body.data.id}/status`).set(auth(artist.token)).send({ status: 'CONFIRMED' });
    const cancelled = await api().patch(`/api/bookings/${second.body.data.id}/status`).set(auth(hotel.token)).send({ status: 'CANCELLED', reason: 'Travaux' });
    expect(cancelled.body.data).toMatchObject({ status: 'CANCELLED', cancelledByRole: 'HOTEL', cancellationReason: 'Travaux' });
    expect((await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } }))!.usedCredits).toBe(5);
  });

  it('lets only one of two simultaneous answers win', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel();
    const { body } = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    const id = body.data.id;
    const [confirm, cancel] = await Promise.all([
      api().patch(`/api/bookings/${id}/status`).set(auth(artist.token)).send({ status: 'CONFIRMED' }),
      api().patch(`/api/bookings/${id}/status`).set(auth(hotel.token)).send({ status: 'CANCELLED' }),
    ]);
    expect([confirm.status, cancel.status].filter((s) => s === 200).length).toBeGreaterThanOrEqual(1);
    const final = await prismaAdmin.booking.findUnique({ where: { id } });
    // Either outcome is legitimate; a refunded-but-confirmed booking is not.
    const credits = await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } });
    if (final!.status === 'CONFIRMED') expect(credits!.usedCredits).toBe(5);
    else expect(credits!.usedCredits).toBe(0);
  });
});
