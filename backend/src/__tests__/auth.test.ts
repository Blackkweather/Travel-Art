import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

describe('Auth API (basic smoke tests)', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const password = 'SecureP@ss123';

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-AUTH-003: should reject too-short password on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        role: 'ARTIST',
        name: 'Weak Password User',
        email: `weak-${Date.now()}@example.com`,
        password: 'short', // less than 8 chars
        phone: '+33000000002',
        locale: 'en',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-001: should register a new ARTIST user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        role: 'ARTIST',
        name: 'Test Artist',
        email: testEmail,
        password,
        phone: '+33000000000',
        locale: 'en',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      email: testEmail,
      name: 'Test Artist',
      role: 'ARTIST',
    });
    expect(res.body.data.token).toBeDefined();

    const decoded: any = jwt.verify(
      res.body.data.token,
      process.env.JWT_SECRET || 'test-secret-key',
    );
    expect(decoded.userId).toBeDefined();
    expect(decoded.role).toBe('ARTIST');
  });

  it('TC-AUTH-002: should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        role: 'ARTIST',
        name: 'Duplicate User',
        email: testEmail,
        password,
        phone: '+33000000001',
        locale: 'en',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-005: should login and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    const decoded: any = jwt.verify(
      res.body.data.token,
      process.env.JWT_SECRET || 'test-secret-key',
    );
    expect(decoded.userId).toBeDefined();
    expect(decoded.role).toBe('ARTIST');
  });

  it('TC-AUTH-006: should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-010: should block non-admin from /api/admin routes', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toBeDefined();
    expect(loginRes.body.data.token).toBeDefined();
    
    const token = loginRes.body.data.token;
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-012: should require auth for protected route /api/admin/dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});


