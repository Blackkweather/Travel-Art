/**
 * The client's October changes: social links, collaboration terms, transport
 * paid in full or not at all, and artists shown to hotels by category.
 */
import { api, auth, bookingBody, makeAdmin, makeArtist, makeHotel, prismaAdmin, resetDb } from './helpers';
import { hotelProgrammeSchema, bookingCreateSchema, fieldErrors } from '../shared/validation';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('collaboration terms', () => {
  it('caps performances at 6 a week and the stay at 7 to 28 days', () => {
    expect(hotelProgrammeSchema.safeParse({ perWeek: 6, desiredStayDays: 7 }).success).toBe(true);
    expect(hotelProgrammeSchema.safeParse({ perWeek: '6', desiredStayDays: '28' }).success).toBe(true);
    const tooMany = hotelProgrammeSchema.safeParse({ perWeek: 7 });
    expect(tooMany.success).toBe(false);
    expect(fieldErrors((tooMany as any).error).perWeek).toMatch(/jour de repos/);
    expect(hotelProgrammeSchema.safeParse({ desiredStayDays: 6 }).success).toBe(false);
    expect(hotelProgrammeSchema.safeParse({ desiredStayDays: 29 }).success).toBe(false);
  });

  it('no longer takes the monthly count or the duration type', () => {
    expect(hotelProgrammeSchema.safeParse({ perMonth: 8 }).success).toBe(false);
    expect(hotelProgrammeSchema.safeParse({ durationType: 'Résidence' }).success).toBe(false);
  });

  it('saves the new terms from the hotel profile', async () => {
    const hotel = await makeHotel();
    const res = await api()
      .put('/api/hotels/me')
      .set(auth(hotel.token))
      .send({
        tiktokUrl: 'https://www.tiktok.com/@riadtest',
        programme: { collaborationTypes: ['Rémunération'], perWeek: 5, desiredStayDays: 14, offersTransport: true, facilities: 'Piscine, spa' },
      });
    expect(res.status).toBe(200);
    const row = await prismaAdmin.hotel.findUnique({ where: { id: hotel.hotelId }, include: { programme: true } });
    expect(row!.tiktokUrl).toBe('https://www.tiktok.com/@riadtest');
    expect(row!.programme).toMatchObject({ collaborationTypes: ['Rémunération'], perWeek: 5, desiredStayDays: 14, offersTransport: true, facilities: 'Piscine, spa' });
  });
});

describe('transport', () => {
  it('can be paid in full by the hotel or not at all, never shared', () => {
    const base = { ...bookingBody('h', 'a'), transportTerms: 'SHARED' };
    expect(bookingCreateSchema.safeParse(base).success).toBe(false);
    expect(bookingCreateSchema.safeParse({ ...base, transportTerms: 'HOTEL_PAYS' }).success).toBe(true);
    expect(bookingCreateSchema.safeParse({ ...base, transportTerms: 'ARTIST_PAYS' }).success).toBe(true);
  });
});

describe('social links', () => {
  it('an artist saves Instagram and TikTok, refused when the link is on the wrong network', async () => {
    const artist = await makeArtist();
    const bad = await api().put('/api/artists/me').set(auth(artist.token)).send({ tiktokUrl: 'https://instagram.com/me' });
    expect(bad.status).toBe(400);
    const ok = await api()
      .put('/api/artists/me')
      .set(auth(artist.token))
      .send({ instagramUrl: 'https://www.instagram.com/salma.yoga', tiktokUrl: 'https://www.tiktok.com/@salma.yoga' });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ instagramUrl: 'https://www.instagram.com/salma.yoga', tiktokUrl: 'https://www.tiktok.com/@salma.yoga' });

    // And they show on the profile other people open.
    const hotel = await makeHotel();
    const seen = await api().get(`/api/artists/${artist.artistId}`).set(auth(hotel.token));
    expect(seen.body.data.instagramUrl).toBe('https://www.instagram.com/salma.yoga');
  });
});

describe('artists as hotels see them', () => {
  it('carries the category, not the stage name or real name', async () => {
    const artist = await makeArtist({ stageName: 'Salma Secret' });
    const hotel = await makeHotel();

    const list = await api().get('/api/artists').set(auth(hotel.token));
    const card = list.body.data.artists.find((a: any) => a.id === artist.artistId);
    expect(card.stageName).toBeNull();
    expect(card.user.name).toBeNull();
    expect(card.headline).toBe('Bien-être - Yoga');
    expect(JSON.stringify(card)).not.toContain('Salma Secret');

    const detail = await api().get(`/api/artists/${artist.artistId}`).set(auth(hotel.token));
    expect(detail.body.data.stageName).toBeNull();

    // Searching by the hidden name finds nothing.
    const search = await api().get('/api/artists?search=Salma%20Secret').set(auth(hotel.token));
    expect(search.body.data.artists).toHaveLength(0);

    // An admin still sees the names; nothing was removed.
    const admin = await makeAdmin();
    const asAdmin = await api().get(`/api/artists/${artist.artistId}`).set(auth(admin.token));
    expect(asAdmin.body.data.stageName).toBe('Salma Secret');
  });

  it('the hotel learns the name through its booking, as before', async () => {
    const artist = await makeArtist({ stageName: 'Salma Booked' });
    const hotel = await makeHotel();
    const created = await api().post('/api/bookings').set(auth(hotel.token)).send(bookingBody(hotel.hotelId, artist.artistId));
    expect(created.status).toBe(201);
    expect(created.body.data.artist.stageName).toBe('Salma Booked');
  });
});
