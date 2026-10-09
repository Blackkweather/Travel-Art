import { api, auth, bookingBody, makeArtist, makeHotel, prismaAdmin, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

async function completedBooking() {
  const artist = await makeArtist();
  const hotel = await makeHotel();
  const booking = await prismaAdmin.booking.create({
    data: {
      hotelId: hotel.hotelId,
      artistId: artist.artistId,
      startDate: new Date(Date.now() - 10 * 86400000),
      endDate: new Date(Date.now() - 5 * 86400000),
      status: 'COMPLETED',
    },
  });
  return { artist, hotel, booking };
}

describe('security #2 - a rating is about the booking it names', () => {
  it('takes the artist from the booking, whatever the request says', async () => {
    const { artist, hotel, booking } = await completedBooking();
    const victim = await makeArtist();

    const res = await api()
      .post('/api/bookings/ratings')
      .set(auth(hotel.token))
      .send({ bookingId: booking.id, artistId: victim.artistId, hotelId: 'anything', stars: 1, textReview: 'Une note forgée contre quelqu’un d’autre.' });
    expect(res.status).toBe(201);
    expect(res.body.data.artistId).toBe(artist.artistId);
    expect(await prismaAdmin.rating.count({ where: { artistId: victim.artistId } })).toBe(0);
  });

  it('allows one rating per booking, and only on your own completed booking', async () => {
    const { hotel, booking } = await completedBooking();
    const body = { bookingId: booking.id, stars: 5, textReview: 'Une résidence remarquable du début à la fin.' };
    expect((await api().post('/api/bookings/ratings').set(auth(hotel.token)).send(body)).status).toBe(201);
    expect((await api().post('/api/bookings/ratings').set(auth(hotel.token)).send(body)).status).toBe(409);

    const other = await makeHotel();
    expect((await api().post('/api/bookings/ratings').set(auth(other.token)).send(body)).status).toBe(404);
  });
});

describe('security #3 - booking statuses follow the rules', () => {
  it('stops an artist confirming a booking the hotel cancelled', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel({ credits: 20 });
    const created = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    expect((await api().patch(`/api/bookings/${id}/status`).set(auth(hotel.token)).send({ status: 'CANCELLED' })).status).toBe(200);
    const credits = await prismaAdmin.credit.findUnique({ where: { hotelId: hotel.hotelId } });
    expect(credits!.usedCredits).toBe(0);

    const revive = await api().patch(`/api/bookings/${id}/status`).set(auth(artist.token)).send({ status: 'CONFIRMED' });
    expect(revive.status).toBe(409);
    expect(revive.body.error.code).toBe('INVALID_TRANSITION');
    expect((await prismaAdmin.booking.findUnique({ where: { id } }))!.status).toBe('CANCELLED');
  });

  it('stops each party making the other party’s moves', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel();
    const { body } = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    const id = body.data.id;
    expect((await api().patch(`/api/bookings/${id}/status`).set(auth(hotel.token)).send({ status: 'CONFIRMED' })).status).toBe(409);
    expect((await api().patch(`/api/bookings/${id}/status`).set(auth(artist.token)).send({ status: 'COMPLETED' })).status).toBe(409);
  });
});

describe('security #4 - nobody deletes what is not theirs', () => {
  it('refuses another artist’s media id and refuses arbitrary URLs in the profile', async () => {
    const owner = await makeArtist();
    const attacker = await makeArtist();
    const media = await prismaAdmin.media.create({
      data: { artistId: owner.artistId, kind: 'IMAGE', provider: 'UPLOAD', url: 'https://x.public.blob.vercel-storage.com/media/a.jpg', storageKey: 'media/a.jpg' },
    });

    expect((await api().delete(`/api/artists/me/media/${media.id}`).set(auth(attacker.token))).status).toBe(404);
    expect(await prismaAdmin.media.count({ where: { id: media.id } })).toBe(1);

    // The profile no longer takes media or picture URLs at all.
    const smuggle = await api().put('/api/artists/me').set(auth(attacker.token)).send({ mediaUrls: JSON.stringify([media.url]) });
    expect(smuggle.status).toBe(400);
    const picture = await api().put('/api/artists/me').set(auth(attacker.token)).send({ profilePicture: media.url });
    expect(picture.status).toBe(400);

    expect((await api().delete(`/api/artists/me/media/${media.id}`).set(auth(owner.token))).status).toBe(200);
  });
});

describe('security #5 - private data stays private', () => {
  it('never sends an artist’s phone, birth date or referral code to other users', async () => {
    const artist = await makeArtist({ phone: '+212699999999' });
    const hotel = await makeHotel();
    const otherArtist = await makeArtist();

    for (const viewer of [hotel.token, otherArtist.token]) {
      const list = await api().get('/api/artists').set(auth(viewer));
      const one = await api().get(`/api/artists/${artist.artistId}`).set(auth(viewer));
      for (const body of [JSON.stringify(list.body), JSON.stringify(one.body)]) {
        expect(body).not.toContain('+212699999999');
        expect(body).not.toContain('birthDate');
        expect(body).not.toContain('referralCode');
        expect(body).not.toContain('loyaltyPoints');
      }
    }
  });

  it('shows the credit price to hotels, not to other artists', async () => {
    const artist = await makeArtist();
    const hotel = await makeHotel();
    const peer = await makeArtist();
    expect((await api().get(`/api/artists/${artist.artistId}`).set(auth(hotel.token))).body.data.bookingCreditCost).toBe(5);
    expect((await api().get(`/api/artists/${artist.artistId}`).set(auth(peer.token))).body.data.bookingCreditCost).toBeUndefined();
  });

  it('hides hotel contacts from browsing and shares both sides’ contacts only once confirmed', async () => {
    const artist = await makeArtist({ phone: '+212688888888' });
    const hotel = await makeHotel();

    const profile = await api().get(`/api/hotels/${hotel.hotelId}`).set(auth(artist.token));
    expect(JSON.stringify(profile.body)).not.toContain('+212524000000');

    const created = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    const id = created.body.data.id;
    const asHotel = await api().get(`/api/bookings/${id}`).set(auth(hotel.token));
    expect(asHotel.body.data.artist.contact).toBeNull();
    expect(JSON.stringify(asHotel.body)).not.toContain('+212688888888');

    await api().patch(`/api/bookings/${id}/status`).set(auth(artist.token)).send({ status: 'CONFIRMED' });
    const confirmed = await api().get(`/api/bookings/${id}`).set(auth(hotel.token));
    expect(confirmed.body.data.artist.contact.phone).toBe('+212688888888');
    const asArtist = await api().get(`/api/bookings/${id}`).set(auth(artist.token));
    expect(asArtist.body.data.hotel.contact.phone).toBe('+212524000000');
  });

  it('never returns password hashes from the session routes', async () => {
    const { token } = await makeArtist();
    const me = await api().get('/api/auth/me').set(auth(token));
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
});

describe('security #6 - only admitted accounts can be found or booked', () => {
  it('keeps pending artists out of browse, profiles and bookings', async () => {
    const pending = await makeArtist({ approved: false });
    const hotel = await makeHotel();

    const list = await api().get('/api/artists').set(auth(hotel.token));
    expect(list.body.data.artists.map((a: any) => a.id)).not.toContain(pending.artistId);
    expect((await api().get(`/api/artists/${pending.artistId}`).set(auth(hotel.token))).status).toBe(404);
    expect((await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, pending.artistId))).status).toBe(404);
  });

  it('cuts off a suspended account at once', async () => {
    const artist = await makeArtist();
    await prismaAdmin.user.update({ where: { id: artist.user.id }, data: { isActive: false } });
    const res = await api().get('/api/auth/me').set(auth(artist.token));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});

describe('route hygiene', () => {
  it('caps page sizes and refuses unknown statuses', async () => {
    const { token } = await makeHotel();
    const big = await api().get('/api/artists?limit=100000').set(auth(token));
    expect(big.body.data.pagination.limit).toBe(50);
    expect((await api().get('/api/bookings?status=WHATEVER').set(auth(token))).status).toBe(400);
  });

  it('keeps removed legacy endpoints gone', async () => {
    const { token } = await makeHotel();
    expect((await api().post('/api/hotels').set(auth(token)).send({})).status).toBe(404);
    expect((await api().get('/api/hotels/user/x').set(auth(token))).status).toBe(404);
  });
});
