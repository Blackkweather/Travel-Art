import { api, auth, artistRegistration, makeAdmin, makeArtist, prismaAdmin, resetDb } from './helpers';

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
