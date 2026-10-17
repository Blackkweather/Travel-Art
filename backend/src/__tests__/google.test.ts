import { api, artistRegistration, auth, makeAdmin, makeArtist, prismaAdmin, resetDb, tokens } from './helpers';

// Google's signature check is Google's to test; what is ours is what happens
// with the mockIdentity it vouches for.
const mockIdentity = { sub: 'google-123', email: '', name: 'Nora Benali', givenName: 'Nora', familyName: 'Benali' };
jest.mock('../services/google', () => ({
  verifyGoogleCredential: jest.fn(async () => mockIdentity),
}));

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

/** Google sign-in with a new address, then "I am an artist": the INCOMPLETE account and its session. */
async function openWithGoogle(email = 'nora.benali@gmail.com') {
  mockIdentity.email = email;
  const first = await api().post('/api/auth/google').send({ credential: 'x' });
  expect(first.body.data.status).toBe('NEEDS_REGISTRATION');
  const res = await api()
    .post('/api/auth/google/start')
    .send({ signupToken: first.body.data.signupToken, role: 'ARTIST', acceptTerms: true });
  expect(res.status).toBe(201);
  return { user: res.body.data.user, token: res.body.data.token as string };
}

describe('continue with Google', () => {
  it('signs an admitted account straight in', async () => {
    const { user } = await makeArtist();
    mockIdentity.email = user.email;

    const res = await api().post('/api/auth/google').send({ credential: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SIGNED_IN');
    expect(tokens.session.verify(res.body.data.token).userId).toBe(user.id);
  });

  it('confirms the address but still waits for the admin', async () => {
    const { user } = await makeArtist({ approved: false, verified: false });
    mockIdentity.email = user.email;

    const res = await api().post('/api/auth/google').send({ credential: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PENDING_REVIEW');
    const after = await prismaAdmin.user.findUnique({ where: { id: user.id } });
    expect(after!.emailVerified).toBe(true);
  });

  it('opens a new address as an incomplete account, confirmed, with no profile', async () => {
    const { user } = await openWithGoogle();
    expect(user.approvalStatus).toBe('INCOMPLETE');

    const row = await prismaAdmin.user.findUnique({ where: { id: user.id }, include: { artist: true, consents: true } });
    expect(row).toMatchObject({ role: 'ARTIST', name: 'Nora Benali', emailVerified: true, approvalStatus: 'INCOMPLETE', artist: null });
    expect(row!.consents).toHaveLength(2);
  });

  it('lets an incomplete account in only to finish its profile', async () => {
    const { token } = await openWithGoogle();

    expect((await api().get('/api/auth/me').set(auth(token))).status).toBe(200);
    // Everything else is closed: no catalogue, no bookings, nothing to receive.
    expect((await api().get('/api/notifications').set(auth(token))).status).toBe(401);
    expect((await api().get('/api/bookings').set(auth(token))).status).toBe(401);
  });

  it('is never in the review queue and cannot be admitted before the profile is in', async () => {
    const { user } = await openWithGoogle();
    const admin = await makeAdmin();

    const queue = await api().get('/api/admin/admissions').set(auth(admin.token));
    expect(queue.body.data.applications).toHaveLength(0);

    const res = await api().post(`/api/admin/admissions/${user.id}/approve`).set(auth(admin.token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROFILE_INCOMPLETE');
  });

  it('signs an incomplete account back in so it can finish later', async () => {
    await openWithGoogle();
    const res = await api().post('/api/auth/google').send({ credential: 'x' });
    expect(res.body.data.status).toBe('SIGNED_IN');
    expect(res.body.data.user.approvalStatus).toBe('INCOMPLETE');
  });

  it('sends the completed profile to the admin, and the session stops there', async () => {
    const { user, token } = await openWithGoogle();

    // The address in the form is ignored: the account keeps Google's.
    const body = artistRegistration({ email: 'someone.else@gmail.com', password: undefined });
    const res = await api().post('/api/auth/complete-profile').set(auth(token)).send(body);
    expect(res.status).toBe(201);

    const row = await prismaAdmin.user.findUnique({ where: { id: user.id }, include: { artist: true } });
    expect(row).toMatchObject({ email: 'nora.benali@gmail.com', approvalStatus: 'PENDING', name: 'Salma Bennani' });
    expect(row!.artist!.stageName).toBe(body.stageName);

    const admin = await makeAdmin();
    const queue = await api().get('/api/admin/admissions').set(auth(admin.token));
    expect(queue.body.data.applications.map((a: { id: string }) => a.id)).toEqual([user.id]);

    // Pending review now: the same session is refused, like any applicant's.
    expect((await api().get('/api/auth/me').set(auth(token))).status).toBe(401);
  });

  it('refuses an approved account trying to complete a profile again', async () => {
    const { token } = await makeArtist();
    const res = await api().post('/api/auth/complete-profile').set(auth(token)).send(artistRegistration());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROFILE_ALREADY_SENT');
  });

  it('needs the terms accepted and a genuine signup token', async () => {
    mockIdentity.email = 'nora.benali@gmail.com';
    const { signupToken } = (await api().post('/api/auth/google').send({ credential: 'x' })).body.data;

    const noTerms = await api().post('/api/auth/google/start').send({ signupToken, role: 'ARTIST' });
    expect(noTerms.status).toBe(400);

    const forged = await api()
      .post('/api/auth/google/start')
      .send({ signupToken: tokens.session.sign({ id: 'x', role: 'ARTIST' }), role: 'ARTIST', acceptTerms: true });
    expect(forged.status).toBe(400);
    expect(forged.body.error.code).toBe('GOOGLE_EXPIRED');
    expect(await prismaAdmin.user.count()).toBe(0);
  });

  it('will not open a second account on an address already registered', async () => {
    mockIdentity.email = 'nora.benali@gmail.com';
    const { signupToken } = (await api().post('/api/auth/google').send({ credential: 'x' })).body.data;
    await api().post('/api/auth/google/start').send({ signupToken, role: 'ARTIST', acceptTerms: true });

    const again = await api().post('/api/auth/google/start').send({ signupToken, role: 'HOTEL', acceptTerms: true });
    expect(again.status).toBe(409);
  });
});
