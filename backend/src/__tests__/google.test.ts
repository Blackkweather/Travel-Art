import { api, artistRegistration, makeArtist, prismaAdmin, resetDb, tokens } from './helpers';

// Google's signature check is Google's to test; what is ours is what happens
// with the mockIdentity it vouches for.
const mockIdentity = { sub: 'google-123', email: '', name: 'Nora Benali', givenName: 'Nora', familyName: 'Benali' };
jest.mock('../services/google', () => ({
  verifyGoogleCredential: jest.fn(async () => mockIdentity),
}));

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

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

  it('sends a new address to registration, which needs no password and no confirmation e-mail', async () => {
    mockIdentity.email = 'nora.benali@gmail.com';

    const first = await api().post('/api/auth/google').send({ credential: 'x' });
    expect(first.body.data).toMatchObject({ status: 'NEEDS_REGISTRATION', email: mockIdentity.email, firstName: 'Nora' });
    expect(await prismaAdmin.user.count()).toBe(0);

    const body = artistRegistration({ email: mockIdentity.email, password: undefined, googleToken: first.body.data.signupToken });
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);

    const user = await prismaAdmin.user.findUnique({ where: { email: mockIdentity.email } });
    expect(user!.emailVerified).toBe(true);
    expect(user!.approvalStatus).toBe('PENDING');
  });

  it('refuses a Google sign-up registered under another address', async () => {
    mockIdentity.email = 'nora.benali@gmail.com';
    const { signupToken } = (await api().post('/api/auth/google').send({ credential: 'x' })).body.data;

    const res = await api()
      .post('/api/auth/register')
      .send(artistRegistration({ email: 'someone.else@gmail.com', googleToken: signupToken }));
    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toBeDefined();
  });

  it('refuses a forged signup token', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send(artistRegistration({ googleToken: tokens.session.sign({ id: 'x', role: 'ARTIST' }) }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('GOOGLE_EXPIRED');
  });
});
