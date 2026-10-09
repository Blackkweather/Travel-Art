// Lowered before the app loads, so these limiters are built with small budgets.
process.env.REGISTER_LIMIT = '2';
process.env.AUTH_FAILURE_LIMIT = '3';

// A require, not an import: imports are hoisted above the lines setting the limits.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { api, artistRegistration, prismaAdmin, resetDb } = require('./helpers') as typeof import('./helpers');

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('rate limits live in the database', () => {
  it('counts successful registrations too, so a script cannot create accounts at will', async () => {
    expect((await api().post('/api/auth/register').send(artistRegistration())).status).toBe(201);
    expect((await api().post('/api/auth/register').send(artistRegistration())).status).toBe(201);
    const third = await api().post('/api/auth/register').send(artistRegistration());
    expect(third.status).toBe(429);
    expect(third.body.error.message).toMatch(/inscriptions/);

    // The count is a row in Postgres, shared by every server instance.
    const bucket = await prismaAdmin.rateLimitBucket.findFirst({ where: { key: { startsWith: 'register:' } } });
    expect(bucket!.hits).toBe(3);
  });

  it('caps reset e-mails per address, not per connection', async () => {
    const reset = (email: string) => api().post('/api/auth/forgot-password').send({ email });
    for (let i = 0; i < 3; i++) expect((await reset('someone@gmail.com')).status).toBe(200);
    const fourth = await reset('someone@gmail.com');
    expect(fourth.status).toBe(429);
    expect(fourth.body.error.message).toMatch(/courriers indésirables/);
    // Another person on the same connection is not blocked by it.
    expect((await reset('colleague@gmail.com')).status).toBe(200);
  });

  it('locks one account after repeated wrong passwords', async () => {
    const attempt = () => api().post('/api/auth/login').send({ email: 'target@gmail.com', password: 'Wrong-pass1!' });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});
