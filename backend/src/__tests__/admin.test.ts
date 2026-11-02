import { api, auth, artistRegistration, makeAdmin, makeArtist, makeHotel, prismaAdmin, resetDb } from './helpers';
import { tokens } from '../services/tokens';
import { listableArtistWhere } from '../views/artist';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('admissions', () => {
  it('refuses to admit an unconfirmed address, then admits it once confirmed', async () => {
    const admin = await makeAdmin();
    const body = artistRegistration();
    await api().post('/api/auth/register').send(body);
    const user = await prismaAdmin.user.findUnique({ where: { email: body.email.toLowerCase() } });

    const early = await api().post(`/api/admin/admissions/${user!.id}/approve`).set(auth(admin.token));
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    await prismaAdmin.user.update({ where: { id: user!.id }, data: { emailVerified: true } });
    expect((await api().post(`/api/admin/admissions/${user!.id}/approve`).set(auth(admin.token))).status).toBe(200);
    expect((await prismaAdmin.user.findUnique({ where: { id: user!.id } }))!.approvalStatus).toBe('APPROVED');
  });

  it('credits referral points on admission, not on sign-up', async () => {
    const admin = await makeAdmin();
    const inviter = await makeArtist();
    const body = artistRegistration({ referralCode: inviter.user.artist!.referralCode });
    await api().post('/api/auth/register').send(body);

    const points = async () => (await prismaAdmin.artist.findUnique({ where: { id: inviter.artistId } }))!.loyaltyPoints;
    expect(await points()).toBe(0);

    const user = await prismaAdmin.user.update({ where: { email: body.email.toLowerCase() }, data: { emailVerified: true } });
    await api().post(`/api/admin/admissions/${user.id}/approve`).set(auth(admin.token));
    expect(await points()).toBe(100);
    // Re-approving does not pay twice.
    await api().post(`/api/admin/admissions/${user.id}/approve`).set(auth(admin.token));
    expect(await points()).toBe(100);
  });

  it('shows the applicant’s category and videos for review', async () => {
    const admin = await makeAdmin();
    const pending = await makeArtist({ approved: false });
    await prismaAdmin.media.create({
      data: { artistId: pending.artistId, kind: 'VIDEO', provider: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', externalId: 'dQw4w9WgXcQ' },
    });
    const res = await api().get('/api/admin/admissions').set(auth(admin.token));
    const app = res.body.data.applications.find((a: any) => a.id === pending.user.id);
    expect(app.artist).toMatchObject({ specificCategory: 'Yoga', videos: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'] });
    expect(app.emailVerified).toBe(false);
  });

  it('never returns password hashes when suspending or activating', async () => {
    const admin = await makeAdmin();
    const artist = await makeArtist();
    const res = await api().post(`/api/admin/users/${artist.user.id}/suspend`).set(auth(admin.token)).send({ reason: 'Comportement inapproprié' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('is closed to everyone but admins', async () => {
    const artist = await makeArtist();
    expect((await api().get('/api/admin/admissions').set(auth(artist.token))).status).toBe(403);
    expect((await api().get('/api/admin/admissions')).status).toBe(401);
  });
});

describe('administrator rights', () => {
  const grant = (id: string, token: string) => api().post(`/api/admin/users/${id}/grant-admin`).set(auth(token));
  const revoke = (id: string, token: string) => api().post(`/api/admin/users/${id}/revoke-admin`).set(auth(token));

  it('makes a confirmed account an administrator, whose profile leaves the listings', async () => {
    const admin = await makeAdmin();
    const partner = await makeArtist();
    const listed = () => prismaAdmin.artist.count({ where: { id: partner.artistId, ...listableArtistWhere } });
    expect(await listed()).toBe(1);

    const res = await grant(partner.user.id, admin.token);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ role: 'ADMIN', approvalStatus: 'APPROVED' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(await listed()).toBe(0);

    // Signed in again, the partner reaches the admin pages; the change is on record.
    const session = tokens.session.sign({ id: partner.user.id, role: 'ADMIN' });
    expect((await api().get('/api/admin/users').set(auth(session))).status).toBe(200);
    expect(await prismaAdmin.adminLog.count({ where: { action: 'GRANT_ADMIN', actorUserId: admin.user.id, targetId: partner.user.id } })).toBe(1);
  });

  it('refuses an unconfirmed address, a suspended account and one with bookings', async () => {
    const admin = await makeAdmin();

    const unconfirmed = await makeArtist({ approved: false, verified: false });
    expect((await grant(unconfirmed.user.id, admin.token)).body.error.code).toBe('EMAIL_NOT_VERIFIED');

    const suspended = await makeArtist();
    await prismaAdmin.user.update({ where: { id: suspended.user.id }, data: { isActive: false } });
    expect((await grant(suspended.user.id, admin.token)).body.error.code).toBe('ACCOUNT_SUSPENDED');

    const booked = await makeArtist();
    const hotel = await makeHotel();
    await prismaAdmin.booking.create({
      data: {
        hotelId: hotel.hotelId,
        artistId: booked.artistId,
        startDate: new Date(Date.now() + 10 * 86400000),
        endDate: new Date(Date.now() + 15 * 86400000),
        status: 'CONFIRMED',
      },
    });
    const res = await grant(booked.user.id, admin.token);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('HAS_BOOKINGS');

    for (const id of [unconfirmed.user.id, suspended.user.id, booked.user.id]) {
      expect((await prismaAdmin.user.findUnique({ where: { id } }))!.role).toBe('ARTIST');
    }
  });

  it('takes the rights back at once, never your own, and sends the profile back to admission', async () => {
    const admin = await makeAdmin();
    const partner = await makeArtist();
    await grant(partner.user.id, admin.token);

    const self = await revoke(admin.user.id, admin.token);
    expect(self.status).toBe(409);
    expect(self.body.error.code).toBe('SELF');

    const res = await revoke(partner.user.id, admin.token);
    expect(res.status).toBe(200);
    // Listed again only once an administrator admits the profile anew.
    expect(res.body.data).toMatchObject({ role: 'ARTIST', approvalStatus: 'PENDING' });
    expect(await prismaAdmin.adminLog.count({ where: { action: 'REVOKE_ADMIN', targetId: partner.user.id } })).toBe(1);
    expect((await revoke(partner.user.id, admin.token)).body.error.code).toBe('NOT_ADMIN');

    // An administrator with no profile can only go back to filling one in,
    // and the session it already holds stops opening the admin pages.
    const other = await makeAdmin();
    const bare = await revoke(other.user.id, admin.token);
    expect(bare.body.data).toMatchObject({ role: 'ARTIST', approvalStatus: 'INCOMPLETE' });
    expect((await api().get('/api/admin/users').set(auth(other.token))).status).toBe(401);
  });

  it('is not a way for anyone else to become an administrator', async () => {
    const artist = await makeArtist();
    expect((await grant(artist.user.id, artist.token)).status).toBe(403);
    expect((await api().post(`/api/admin/users/${artist.user.id}/grant-admin`)).status).toBe(401);
    expect((await prismaAdmin.user.findUnique({ where: { id: artist.user.id } }))!.role).toBe('ARTIST');
  });
});
