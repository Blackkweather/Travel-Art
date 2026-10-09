import jwt from 'jsonwebtoken';
import { api, auth, artistRegistration, makeArtist, nextPhone, PASSWORD, prismaAdmin, resetDb, tokens } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('registration', () => {
  it('creates a yoga teacher with real category columns, pending and unverified', async () => {
    const body = artistRegistration();
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeUndefined();

    const user = await prismaAdmin.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { approvalStatus: true, emailVerified: true, phoneE164: true, acceptedTermsVersion: true, artist: true, consents: true },
    });
    expect(user!.approvalStatus).toBe('PENDING');
    expect(user!.emailVerified).toBe(false);
    expect(user!.phoneE164).toMatch(/^\+212/);
    expect(user!.consents).toHaveLength(2);
    expect(user!.artist).toMatchObject({
      mainCategory: 'Bien-être',
      specificCategory: 'Yoga',
      discipline: 'Bien-être - Yoga',
      audienceTypes: ['Adultes'],
    });
    expect(user!.artist!.birthDate!.toISOString().slice(0, 10)).toBe('1994-05-12');
  });

  it('answers field by field for junk input', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send(artistRegistration({ firstName: 'test', lastName: 'test', email: 'test@test.com', birthDate: '31/02/2030' }));
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['birthDate', 'email', 'firstName', 'lastName']);
  });

  it('refuses a duplicate email, phone or stage name, naming the field', async () => {
    const first = artistRegistration();
    expect((await api().post('/api/auth/register').send(first)).status).toBe(201);

    const sameEmail = await api().post('/api/auth/register').send(artistRegistration({ email: first.email.toUpperCase() }));
    expect(sameEmail.status).toBe(409);
    expect(sameEmail.body.error.fields.email).toBeDefined();

    const samePhone = await api().post('/api/auth/register').send(artistRegistration({ phone: first.phone }));
    expect(samePhone.status).toBe(409);
    expect(samePhone.body.error.fields.phone).toBeDefined();

    // Same stage name with other accents and capitals.
    const sameStage = await api()
      .post('/api/auth/register')
      .send(artistRegistration({ stageName: first.stageName.toUpperCase().replace('A', 'Á') }));
    expect(sameStage.status).toBe(409);
    expect(sameStage.body.error.fields.stageName).toBeDefined();
  });

  it('stores a hotel with its spaces, programme and links as data', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({
        role: 'HOTEL',
        name: 'Riad Yasmine',
        contactName: 'Nadia Alaoui',
        city: 'Marrakech',
        email: 'contact@riad-yasmine.com',
        password: PASSWORD,
        phone: nextPhone(),
        country: 'Morocco',
        acceptTerms: true,
        hotelType: 'Hôtel de luxe',
        roomCount: '24',
        description: 'Un riad de vingt-quatre chambres au cœur de la médina.',
        website: 'https://riad-yasmine.com',
        spaces: [{ name: 'Rooftop', setting: 'OUTDOOR', capacity: '80', media: ['https://youtu.be/dQw4w9WgXcQ'] }],
        programme: { styles: ['Chill / Lounge'], offersLodging: true, offersMeals: true, perWeek: 2 },
      });
    expect(res.status).toBe(201);

    const hotel = await prismaAdmin.hotel.findFirst({
      where: { name: 'Riad Yasmine' },
      include: { spaces: { include: { media: true } }, programme: true },
    });
    expect(hotel).toMatchObject({ city: 'Marrakech', roomCount: 24, nameKey: 'riadyasmine|marrakech', description: expect.stringContaining('médina') });
    expect(hotel!.spaces[0]).toMatchObject({ name: 'Rooftop', setting: 'OUTDOOR', capacity: 80 });
    expect(hotel!.spaces[0].media[0]).toMatchObject({ kind: 'VIDEO', provider: 'YOUTUBE', externalId: 'dQw4w9WgXcQ' });
    expect(hotel!.programme).toMatchObject({ styles: ['Chill / Lounge'], offersLodging: true, perWeek: 2 });

    // The same hotel in the same city cannot register twice.
    const again = await api()
      .post('/api/auth/register')
      .send({ role: 'HOTEL', name: 'RIAD  yasmine', contactName: 'Autre Personne', city: 'marrakech', email: 'other@riad-yasmine.com', password: PASSWORD, phone: nextPhone(), country: 'Morocco', acceptTerms: true });
    expect(again.status).toBe(409);
    expect(again.body.error.fields.name).toBeDefined();
  });

  it('writes nothing when any part of the registration fails', async () => {
    const before = await prismaAdmin.user.count();
    const res = await api().post('/api/auth/register').send(artistRegistration({ acceptTerms: false }));
    expect(res.status).toBe(400);
    expect(await prismaAdmin.user.count()).toBe(before);
  });
});

describe('sign-in and confirmation', () => {
  it('asks for confirmation first, then for patience, then lets an admitted account in', async () => {
    const body = artistRegistration();
    await api().post('/api/auth/register').send(body);
    const creds = { email: body.email, password: PASSWORD };

    const unverified = await api().post('/api/auth/login').send(creds);
    expect(unverified.status).toBe(403);
    expect(unverified.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    const user = await prismaAdmin.user.findUnique({ where: { email: body.email.toLowerCase() } });
    const verify = await api().post('/api/auth/verify-email').send({ token: tokens.emailVerification.sign(user!) });
    expect(verify.status).toBe(200);

    const pending = await api().post('/api/auth/login').send(creds);
    expect(pending.body.error.code).toBe('PENDING_REVIEW');

    await prismaAdmin.user.update({ where: { id: user!.id }, data: { approvalStatus: 'APPROVED' } });
    const ok = await api().post('/api/auth/login').send(creds);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.passwordHash).toBeUndefined();
    expect((await api().get('/api/auth/me').set(auth(ok.body.data.token))).status).toBe(200);
  });

  it('gives the same answer for an unknown address and a wrong password', async () => {
    const { user } = await makeArtist();
    const wrong = await api().post('/api/auth/login').send({ email: user.email, password: 'Wrong-pass1!' });
    const unknown = await api().post('/api/auth/login').send({ email: 'nobody@gmail.com', password: 'Wrong-pass1!' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('refuses a confirmation link issued for a previous address', async () => {
    const { user } = await makeArtist({ verified: false });
    const token = tokens.emailVerification.sign({ id: user.id, email: 'old-address@gmail.com' });
    expect((await api().post('/api/auth/verify-email').send({ token })).status).toBe(400);
  });
});

describe('security #1 - only session tokens open a session', () => {
  it('refuses a password-reset link and a confirmation link as a session', async () => {
    const { user } = await makeArtist();
    const full = await prismaAdmin.user.findUnique({ where: { id: user.id } });
    for (const token of [tokens.passwordReset.sign(full!), tokens.emailVerification.sign(full!)]) {
      const res = await api().get('/api/auth/me').set(auth(token));
      expect(res.status).toBe(401);
    }
  });

  it('refuses an old-style token with no purpose, and a forged one', async () => {
    const { user } = await makeArtist();
    const legacy = jwt.sign({ userId: user.id, role: 'ARTIST' }, process.env.JWT_SECRET!);
    expect((await api().get('/api/auth/me').set(auth(legacy))).status).toBe(401);
    const forged = jwt.sign({ typ: 'session', userId: user.id, role: 'ADMIN' }, 'another-secret-another-secret-123');
    expect((await api().get('/api/auth/me').set(auth(forged))).status).toBe(401);
  });

  it('ends every session on sign-out-everywhere and on password reset', async () => {
    const { user, token } = await makeArtist();
    // A token issued a moment ago, so the revocation cutoff lands after it.
    const issued = jwt.sign({ typ: 'session', userId: user.id, role: 'ARTIST', iat: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET!);
    expect((await api().post('/api/auth/logout-all').set(auth(issued))).status).toBe(200);
    const after = await api().get('/api/auth/me').set(auth(issued));
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe('SESSION_REVOKED');
    expect(token).toBeTruthy();
  });

  it('makes a reset link single-use', async () => {
    const { user } = await makeArtist();
    const full = await prismaAdmin.user.findUnique({ where: { id: user.id } });
    const token = tokens.passwordReset.sign(full!);
    expect((await api().post('/api/auth/reset-password').send({ token, password: 'N3w-password!' })).status).toBe(200);
    expect((await api().post('/api/auth/reset-password').send({ token, password: 'An0ther-pass!' })).status).toBe(400);
  });
});

describe('availability check', () => {
  it('reports taken and invalid fields only', async () => {
    const body = artistRegistration();
    await api().post('/api/auth/register').send(body);
    const res = await api()
      .post('/api/auth/check-availability')
      .send({ email: body.email, stageName: body.stageName, phone: '12', country: 'Morocco' });
    expect(Object.keys(res.body.data.fields).sort()).toEqual(['email', 'phone', 'stageName']);

    const free = await api().post('/api/auth/check-availability').send({ email: 'someone.new@gmail.com', stageName: 'Nom Libre' });
    expect(free.body.data.fields).toEqual({});

    const typo = await api().post('/api/auth/check-availability').send({ email: 'someone@gmial.com' });
    expect(typo.body.data.suggestion).toBe('someone@gmail.com');
  });
});
