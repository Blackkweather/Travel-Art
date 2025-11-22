import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

async function createUserWithRole(role: 'HOTEL' | 'ARTIST' | 'ADMIN', email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: `${role} User`,
      passwordHash,
      role,
      isActive: true,
    },
  });
  
  const verifyUser = await prisma.user.findUnique({ where: { email } });
  if (!verifyUser) {
    throw new Error(`Failed to create user: ${email}`);
  }
  
  return user;
}

describe('Common API', () => {
  const artistEmail = `artist-common-${Date.now()}@example.com`;
  const password = 'SecureP@ss123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();

    // Clean test data
    await prisma.referral.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    // Create artist user and profile
    const artistUser = await createUserWithRole('ARTIST', artistEmail, password);
    await prisma.artist.create({
      data: {
        userId: artistUser.id,
        bio: 'Test Artist',
        discipline: 'Music',
        priceRange: '$$',
        membershipStatus: 'ACTIVE',
        referralCode: 'TESTREF',
      },
    });
  });

  afterAll(async () => {
    await prisma.referral.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-COMMON-001: should get top artists', async () => {
    const res = await request(app).get('/api/top?type=artists');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('TC-COMMON-002: should get top hotels', async () => {
    const res = await request(app).get('/api/top?type=hotels');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('TC-COMMON-003: should reject invalid type for top', async () => {
    const res = await request(app).get('/api/top?type=invalid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('TC-COMMON-004: should get public stats', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalArtists');
    expect(res.body.data).toHaveProperty('totalHotels');
    expect(res.body.data).toHaveProperty('totalBookings');
    expect(res.body.data).toHaveProperty('activeBookings');
  });

  it('TC-COMMON-005: should get referrals for authenticated artist', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('referralCode');
    expect(res.body.data).toHaveProperty('stats');
    expect(res.body.data).toHaveProperty('referrals');
  });

  it('TC-COMMON-006: should require authentication for referrals', async () => {
    const res = await request(app).get('/api/referrals');

    expect(res.status).toBe(401);
  });
});

