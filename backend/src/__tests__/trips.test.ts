import request from 'supertest';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

describe('Trips API (public)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();
  });

  beforeEach(async () => {
    await prisma.trip.deleteMany().catch(() => undefined);
  });

  afterAll(async () => {
    await prisma.trip.deleteMany().catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-TRIP-001: should return only published trips', async () => {
    await prisma.trip.createMany({
      data: [
        {
          title: 'Italy Experience',
          slug: 'italy-experience',
          description: 'Art in Italy',
          priceFrom: 2000,
          priceTo: 4000,
          location: 'Italy',
          images: JSON.stringify(['italy1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'France Experience',
          slug: 'france-experience',
          description: 'Art in France',
          priceFrom: 2500,
          priceTo: 4500,
          location: 'France',
          images: JSON.stringify(['france1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'Spain Draft',
          slug: 'spain-draft',
          description: 'Draft trip',
          priceFrom: 1500,
          priceTo: 3000,
          location: 'Spain',
          images: JSON.stringify(['spain1.jpg']),
          status: 'DRAFT',
        },
        {
          title: 'Japan Archived',
          slug: 'japan-archived',
          description: 'Archived trip',
          priceFrom: 3000,
          priceTo: 6000,
          location: 'Japan',
          images: JSON.stringify(['japan1.jpg']),
          status: 'ARCHIVED',
        },
      ],
    });

    const res = await request(app).get('/api/trips');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((t: any) => t.status === 'PUBLISHED')).toBe(true);

    const trip = res.body[0];
    expect(trip).not.toHaveProperty('createdAt');
    expect(trip).not.toHaveProperty('updatedAt');
  });

  it('TC-TRIP-002: should filter trips by destination', async () => {
    await prisma.trip.createMany({
      data: [
        {
          title: 'Florence Art Tour',
          slug: 'florence-art',
          description: 'Florence trip',
          priceFrom: 2500,
          priceTo: 5000,
          location: 'Florence, Italy',
          images: JSON.stringify(['florence1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'Paris Art Tour',
          slug: 'paris-art',
          description: 'Paris trip',
          priceFrom: 2200,
          priceTo: 4200,
          location: 'Paris, France',
          images: JSON.stringify(['paris1.jpg']),
          status: 'PUBLISHED',
        },
      ],
    });

    const res = await request(app).get('/api/trips?destination=Italy');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].location).toContain('Italy');
  });

  it('TC-TRIP-004: should return complete trip details', async () => {
    const trip = await prisma.trip.create({
      data: {
        title: 'Florence Art Experience',
        slug: 'florence-art-experience',
        description: 'Immerse yourself in Renaissance masterpieces',
        priceFrom: 2500,
        priceTo: 5000,
        location: 'Florence, Italy',
        images: JSON.stringify(['florence1.jpg', 'florence2.jpg']),
        status: 'PUBLISHED',
      },
    });

    const res = await request(app).get(`/api/trips/${trip.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      priceFrom: expect.any(Number),
      images: expect.arrayContaining([expect.any(String)]),
    });
  });

  it('TC-TRIP-006: should not expose draft trips', async () => {
    const draft = await prisma.trip.create({
      data: {
        title: 'Secret Draft Trip',
        slug: 'secret-draft-trip',
        description: 'Not yet published',
        priceFrom: 1000,
        priceTo: 2000,
        location: 'Unknown',
        images: JSON.stringify(['draft.jpg']),
        status: 'DRAFT',
      },
    });

    const res = await request(app).get(`/api/trips/${draft.id}`);

    expect(res.status).toBe(404);
  });
});




