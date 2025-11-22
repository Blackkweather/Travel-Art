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

describe('Artists API', () => {
  const artistEmail = `artist-test-${Date.now()}@example.com`;
  const password = 'SecureP@ss123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();

    // Clean test data
    await prisma.artistAvailability.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    // Create artist user and profile
    const artistUser = await createUserWithRole('ARTIST', artistEmail, password);
    await prisma.artist.create({
      data: {
        userId: artistUser.id,
        bio: 'Test Artist Bio',
        discipline: 'Music',
        priceRange: '$$',
        membershipStatus: 'ACTIVE',
        referralCode: 'TEST123',
      },
    });
  });

  afterAll(async () => {
    await prisma.artistAvailability.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-ART-001: should get artists list', async () => {
    const res = await request(app).get('/api/artists');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('artists');
    expect(res.body.data).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data.artists)).toBe(true);
  });

  it('TC-ART-002: should get artist profile by ID', async () => {
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    expect(artist).toBeDefined();
    if (!artist) throw new Error('Artist not found');

    const res = await request(app).get(`/api/artists/${artist.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', artist.id);
    expect(res.body.data).toHaveProperty('discipline');
  });

  it('TC-ART-003: should get current artist profile (authenticated)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/artists/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('TC-ART-004: should create/update artist profile', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Updated bio with more than 10 characters',
        discipline: 'Jazz',
        priceRange: '$$$',
        images: JSON.stringify(['image1.jpg']),
        videos: JSON.stringify(['video1.mp4']),
        mediaUrls: JSON.stringify(['media1.jpg'])
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('discipline', 'Jazz');
  });

  it('TC-ART-005: should set artist availability', async () => {
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    expect(artist).toBeDefined();
    if (!artist) throw new Error('Artist not found');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const res = await request(app)
      .post(`/api/artists/${artist.id}/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('artistId', artist.id);
  });

  it('TC-ART-006: should require authentication for /me endpoint', async () => {
    const res = await request(app).get('/api/artists/me');

    expect(res.status).toBe(401);
  });

  it('TC-ART-007: should require ARTIST role for profile update', async () => {
    // Create hotel user
    const hotelEmail = `hotel-${Date.now()}@example.com`;
    const hotelUser = await createUserWithRole('HOTEL', hotelEmail, password);
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/artists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Test bio',
        discipline: 'Music',
        priceRange: '$$'
      });

    expect(res.status).toBe(403);
  });
});

