import request from 'supertest';
import { app } from '../index';
import { prisma, initializeDatabase } from '../db';

describe('Trips API (public)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    await initializeDatabase();
  });

  beforeEach(async () => {
    // Scoped to this suite's fixtures. An unfiltered deleteMany() here
    // emptied the whole experiences catalogue.
    await prisma.trip.deleteMany({
      where: { slug: { startsWith: 'suite-' } },
    }).catch(() => undefined);
  });

  afterAll(async () => {
    // Scoped to this suite's fixtures. An unfiltered deleteMany() here
    // emptied the whole experiences catalogue.
    await prisma.trip.deleteMany({
      where: { slug: { startsWith: 'suite-' } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it('TC-TRIP-001: should return only published trips', async () => {
    await prisma.trip.createMany({
      data: [
        {
          title: 'Italy Experience',
          slug: 'suite-italy-experience',
          description: 'Art in Italy',
          priceFrom: 2000,
          priceTo: 4000,
          location: JSON.stringify({ city: 'Rome', country: 'Italy' }),
          images: JSON.stringify(['italy1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'France Experience',
          slug: 'suite-france-experience',
          description: 'Art in France',
          priceFrom: 2500,
          priceTo: 4500,
          location: JSON.stringify({ city: 'Paris', country: 'France' }),
          images: JSON.stringify(['france1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'Spain Draft',
          slug: 'suite-spain-draft',
          description: 'Draft trip',
          priceFrom: 1500,
          priceTo: 3000,
          location: JSON.stringify({ city: 'Madrid', country: 'Spain' }),
          images: JSON.stringify(['spain1.jpg']),
          status: 'DRAFT',
        },
        {
          title: 'Japan Archived',
          slug: 'suite-japan-archived',
          description: 'Archived trip',
          priceFrom: 3000,
          priceTo: 6000,
          location: JSON.stringify({ city: 'Tokyo', country: 'Japan' }),
          images: JSON.stringify(['japan1.jpg']),
          status: 'ARCHIVED',
        },
      ],
    });

    const res = await request(app).get('/api/trips');

    expect(res.status).toBe(200);
    // The catalogue holds seeded experiences as well, so assert on this
    // suite's own fixtures rather than the total row count.
    const slugs = res.body.map((t: any) => t.slug);
    expect(slugs).toContain('suite-italy-experience');
    expect(slugs).toContain('suite-france-experience');
    expect(slugs).not.toContain('suite-spain-draft');
    expect(slugs).not.toContain('suite-japan-archived');
    expect(res.body.every((t: any) => t.status === 'PUBLISHED')).toBe(true);

    const trip = res.body.find((t: any) => t.slug === 'suite-italy-experience');
    expect(trip).toBeDefined();
    expect(trip).not.toHaveProperty('createdAt');
    expect(trip).not.toHaveProperty('updatedAt');
  });

  it('TC-TRIP-002: should filter trips by destination', async () => {
    await prisma.trip.createMany({
      data: [
        {
          title: 'Florence Art Tour',
          slug: 'suite-florence-art',
          description: 'Florence trip',
          priceFrom: 2500,
          priceTo: 5000,
          location: JSON.stringify({ city: 'Florence', country: 'Italy' }),
          images: JSON.stringify(['florence1.jpg']),
          status: 'PUBLISHED',
        },
        {
          title: 'Paris Art Tour',
          slug: 'suite-paris-art',
          description: 'Paris trip',
          priceFrom: 2200,
          priceTo: 4200,
          location: JSON.stringify({ city: 'Paris', country: 'France' }),
          images: JSON.stringify(['paris1.jpg']),
          status: 'PUBLISHED',
        },
      ],
    });

    const res = await request(app).get('/api/trips?destination=Italy');

    expect(res.status).toBe(200);
    const suiteTrips = res.body.filter((t: any) => t.slug.startsWith('suite-'));
    expect(suiteTrips).toHaveLength(1);
    expect(suiteTrips[0].slug).toBe('suite-florence-art');
    expect(suiteTrips[0].location.country).toBe('Italy');
  });

  it('TC-TRIP-004: should return complete trip details', async () => {
    const trip = await prisma.trip.create({
      data: {
        title: 'Florence Art Experience',
        slug: 'suite-florence-art-experience',
        description: 'Immerse yourself in Renaissance masterpieces',
        priceFrom: 2500,
        priceTo: 5000,
        location: JSON.stringify({ city: 'Florence', country: 'Italy' }),
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
        slug: 'suite-secret-draft-trip',
        description: 'Not yet published',
        priceFrom: 1000,
        priceTo: 2000,
        location: JSON.stringify({ city: 'Unknown', country: '' }),
        images: JSON.stringify(['draft.jpg']),
        status: 'DRAFT',
      },
    });

    const res = await request(app).get(`/api/trips/${draft.id}`);

    expect(res.status).toBe(404);
  });
});




