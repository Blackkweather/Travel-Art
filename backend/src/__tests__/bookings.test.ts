import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

async function createUserWithRole(role: 'HOTEL' | 'ARTIST' | 'ADMIN', email: string, password: string) {
  // Use same salt rounds as auth route (12) for consistency
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
  
  // Verify user was created and can be retrieved
  const verifyUser = await prisma.user.findUnique({ where: { email } });
  if (!verifyUser) {
    throw new Error(`Failed to create user: ${email}`);
  }
  
  return user;
}

describe('Bookings API', () => {
  const hotelEmail = `hotel-${Date.now()}@example.com`;
  const artistEmail = `artist-${Date.now()}@example.com`;
  const adminEmail = `admin-${Date.now()}@example.com`;
  const password = 'SecureP@ss123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();

    // Clean any leftover test data
    await prisma.booking.deleteMany().catch(() => undefined);
    await prisma.artist.deleteMany().catch(() => undefined);
    await prisma.hotel.deleteMany().catch(() => undefined);
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    }).catch(() => undefined);

    // Create hotel, artist, admin users and profiles
    const hotelUser = await createUserWithRole('HOTEL', hotelEmail, password);
    const artistUser = await createUserWithRole('ARTIST', artistEmail, password);
    await createUserWithRole('ADMIN', adminEmail, password);

    // Verify users were created
    expect(hotelUser).toBeDefined();
    expect(artistUser).toBeDefined();
    expect(hotelUser.email).toBe(hotelEmail);
    expect(artistUser.email).toBe(artistEmail);

    const hotel = await prisma.hotel.create({
      data: {
        userId: hotelUser.id,
        name: 'Test Hotel',
        description: 'A test hotel',
        location: JSON.stringify({ city: 'Paris', country: 'France' }),
      },
    });

    // Create credits for the hotel (required for booking creation)
    await prisma.credit.create({
      data: {
        hotelId: hotel.id,
        totalCredits: 10,
        usedCredits: 0,
      },
    });

    const artist = await prisma.artist.create({
      data: {
        userId: artistUser.id,
        bio: 'Test Artist',
        discipline: 'Music',
        priceRange: '$$',
        membershipStatus: 'ACTIVE',
      },
    });

    // Verify profiles were created
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    
    // Verify users can be retrieved (ensures database is ready)
    const verifyHotelUser = await prisma.user.findUnique({ where: { email: hotelEmail } });
    const verifyArtistUser = await prisma.user.findUnique({ where: { email: artistEmail } });
    expect(verifyHotelUser).toBeDefined();
    expect(verifyArtistUser).toBeDefined();
    expect(verifyHotelUser?.isActive).toBe(true);
    expect(verifyArtistUser?.isActive).toBe(true);
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

  it('TC-BOOK-001: should create booking with valid data (HOTEL role only)', async () => {
    // Verify user exists before attempting login
    const hotelUser = await prisma.user.findUnique({
      where: { email: hotelEmail }
    });
    expect(hotelUser).toBeDefined();
    if (!hotelUser) {
      throw new Error('Test setup failed: hotel user not found');
    }
    expect(hotelUser.isActive).toBe(true);

    // Find hotel and artist - they should exist from beforeAll
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toBeDefined();
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        creditsUsed: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      hotelId: hotel.id,
      artistId: artist.id,
      status: 'PENDING',
    });
  });

  it('TC-BOOK-004: should reject past start dates and invalid ranges', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const past = new Date('2020-01-01');
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const resPast = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: past.toISOString(),
        endDate: future.toISOString(),
        creditsUsed: 1,
      });
    expect(resPast.status).toBe(400);

    const start = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const resRange = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        creditsUsed: 1,
      });
    expect(resRange.status).toBe(400);
  });

  it('TC-BOOK-005: should only return bookings for current hotel', async () => {
    // Create second hotel + user
    const secondHotelUser = await createUserWithRole('HOTEL', `hotel2-${Date.now()}@example.com`, password);
    const secondHotel = await prisma.hotel.create({
      data: {
        userId: secondHotelUser.id,
        name: 'Second Hotel',
        description: 'Another hotel',
        location: JSON.stringify({ city: 'Rome', country: 'Italy' }),
      },
    });

    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    expect(hotel).toBeDefined();
    if (!hotel) {
      throw new Error('Test setup failed: hotel not found');
    }

    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    expect(artist).toBeDefined();
    if (!artist) {
      throw new Error('Test setup failed: artist not found');
    }

    // Seed bookings for both hotels
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
          status: 'PENDING',
          creditsUsed: 1,
        },
        {
          hotelId: secondHotel.id,
          artistId: artist.id,
          startDate: new Date(),
          endDate: new Date(),
          status: 'PENDING',
          creditsUsed: 1,
        },
      ],
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const bookings = res.body.data.bookings;
    expect(bookings.length).toBeGreaterThanOrEqual(2);
    expect(bookings.every((b: any) => b.hotelId === hotel.id)).toBe(true);
  });

  it('TC-BOOK-006: should allow artist to confirm booking', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        creditsUsed: 1,
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('TC-BOOK-007: should allow artist to reject booking', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    // Ensure hotel has credits
    await prisma.credit.upsert({
      where: { hotelId: hotel.id },
      update: { totalCredits: 10, usedCredits: 0 },
      create: { hotelId: hotel.id, totalCredits: 10, usedCredits: 0 },
    });

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        creditsUsed: 1,
      },
    });

    // Mark credits as used (simulating booking creation)
    await prisma.credit.update({
      where: { hotelId: hotel.id },
      data: { usedCredits: { increment: 1 } },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REJECTED');

    // Verify credits were refunded
    const credits = await prisma.credit.findUnique({
      where: { hotelId: hotel.id }
    });
    expect(credits?.usedCredits).toBe(0);
  });

  it('TC-BOOK-008: should allow hotel to cancel booking', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    // Ensure hotel has credits
    await prisma.credit.upsert({
      where: { hotelId: hotel.id },
      update: { totalCredits: 10, usedCredits: 0 },
      create: { hotelId: hotel.id, totalCredits: 10, usedCredits: 0 },
    });

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        creditsUsed: 1,
      },
    });

    // Mark credits as used
    await prisma.credit.update({
      where: { hotelId: hotel.id },
      data: { usedCredits: { increment: 1 } },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify credits were refunded
    const credits = await prisma.credit.findUnique({
      where: { hotelId: hotel.id }
    });
    expect(credits?.usedCredits).toBe(0);
  });

  it('TC-BOOK-009: should reject invalid status updates', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        creditsUsed: 1,
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: artistEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    // Artist cannot cancel (only hotel can)
    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('TC-BOOK-010: should create rating for completed booking', async () => {
    const hotel = await prisma.hotel.findFirst({
      where: { user: { email: hotelEmail } }
    });
    const artist = await prisma.artist.findFirst({
      where: { user: { email: artistEmail } }
    });
    
    expect(hotel).toBeDefined();
    expect(artist).toBeDefined();
    if (!hotel || !artist) {
      throw new Error('Test setup failed: hotel or artist not found');
    }

    // Create a completed booking
    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        artistId: artist.id,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        creditsUsed: 1,
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: hotelEmail, password });
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/bookings/ratings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookingId: booking.id,
        hotelId: hotel.id,
        artistId: artist.id,
        stars: 5,
        textReview: 'Excellent performance, highly recommended!',
        isVisibleToArtist: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stars', 5);
    expect(res.body.data).toHaveProperty('textReview');
  });
});




