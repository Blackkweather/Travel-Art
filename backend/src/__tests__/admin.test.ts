import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

async function createAdmin(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
}

describe('Admin API - bookings overview', () => {
  const adminEmail = `admin-${Date.now()}@example.com`;
  const password = 'AdminP@ss123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();

    await prisma.booking.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.hotel.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    const admin = await createAdmin(adminEmail, password);

    // Seed hotel + artist + bookings
    const passwordHash = await bcrypt.hash('SecureP@ss123', 10);
    const hotelUser = await prisma.user.create({
      data: {
        email: `hotel-admin-${Date.now()}@example.com`,
        name: 'Hotel Admin',
        passwordHash,
        role: 'HOTEL',
      },
    });
    const artistUser = await prisma.user.create({
      data: {
        email: `artist-admin-${Date.now()}@example.com`,
        name: 'Artist Admin',
        passwordHash,
        role: 'ARTIST',
      },
    });

    const hotel = await prisma.hotel.create({
      data: {
        userId: hotelUser.id,
        name: 'Admin Hotel',
        description: 'Hotel for admin tests',
        location: JSON.stringify({ city: 'Rome', country: 'Italy' }),
      },
    });

    const artist = await prisma.artist.create({
      data: {
        userId: artistUser.id,
        bio: 'Admin Artist',
        discipline: 'Dance',
        priceRange: '$$',
        membershipStatus: 'ACTIVE',
      },
    });

    await prisma.booking.createMany({
      data: [
        {
          hotelId: hotel.id,
          artistId: artist.id,
          startDate: new Date(),
          endDate: new Date(),
          status: 'PENDING',
          creditsUsed: 1,
        },
        {
          hotelId: hotel.id,
          artistId: artist.id,
          startDate: new Date(),
          endDate: new Date(),
          status: 'CONFIRMED',
          creditsUsed: 1,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.hotel.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-ADM-001: should return all bookings for admin', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(2);
  });

  it('TC-ADM-001 (filter): should filter bookings by status', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/admin/bookings?status=CONFIRMED')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const bookings = res.body.data.bookings;
    expect(bookings.length).toBeGreaterThanOrEqual(1);
    expect(bookings.every((b: any) => b.status === 'CONFIRMED')).toBe(true);
  });
});




