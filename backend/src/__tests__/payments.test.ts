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

describe('Payments API', () => {
  const hotelEmail = `hotel-payments-${Date.now()}@example.com`;
  const password = 'SecureP@ss123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();

    // Clean test data
    await prisma.transaction.deleteMany().catch(() => undefined);
    await prisma.credit.deleteMany().catch(() => undefined);
    await prisma.hotel.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    // Create hotel user and profile
    const hotelUser = await createUserWithRole('HOTEL', hotelEmail, password);
    await prisma.hotel.create({
      data: {
        userId: hotelUser.id,
        name: 'Test Hotel Payments',
        description: 'A test hotel for payments',
        location: JSON.stringify({ city: 'Paris', country: 'France' }),
      },
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany().catch(() => undefined);
    await prisma.credit.deleteMany().catch(() => undefined);
    await prisma.hotel.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-PAY-001: should get credit packages', async () => {
    const res = await request(app).get('/api/payments/packages');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('credits');
    expect(res.body.data[0]).toHaveProperty('price');
  });

  it('TC-PAY-002: should purchase credits (first purchase with 50% discount)', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    expect(hotel).toBeDefined();
    if (!hotel) throw new Error('Hotel not found');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .post('/api/payments/credits/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hotelId: hotel.id,
        packageId: 'package-1',
        paymentMethod: 'card'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('credits');
    expect(res.body.data).toHaveProperty('transaction');
    expect(res.body.data).toHaveProperty('package');
    expect(res.body.data.isFirstPurchase).toBe(true);
    
    // Verify credits were added
    const credits = await prisma.credit.findUnique({
      where: { hotelId: hotel.id }
    });
    expect(credits).toBeDefined();
    expect(credits?.totalCredits).toBeGreaterThan(0);
  });

  it('TC-PAY-003: should get transactions for hotel', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    expect(hotel).toBeDefined();
    if (!hotel) throw new Error('Hotel not found');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/payments/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('transactions');
    expect(res.body.data).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });

  it('TC-PAY-004: should reject credit purchase without authentication', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    expect(hotel).toBeDefined();
    if (!hotel) throw new Error('Hotel not found');

    const res = await request(app)
      .post('/api/payments/credits/purchase')
      .send({
        hotelId: hotel.id,
        packageId: 'package-1',
        paymentMethod: 'card'
      });

    expect(res.status).toBe(401);
  });

  it('TC-PAY-005: should reject credit purchase with invalid package', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    expect(hotel).toBeDefined();
    if (!hotel) throw new Error('Hotel not found');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/payments/credits/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hotelId: hotel.id,
        packageId: 'invalid-package',
        paymentMethod: 'card'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

