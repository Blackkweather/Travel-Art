import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { randomInt } from 'crypto';

// Seed passwords used to be the literals 'Password123!' and 'password123',
// printed at the end of the run. This repository is public, so those were
// published credentials for whatever database the seed had last been run
// against - which included production. They are now taken from the environment,
// or generated per run when it is not set, and the generated values are printed
// once so a local developer can still log in.
const generateSeedPassword = () => {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@$!%*?&#';
  return Array.from({ length: 20 }, () => alphabet[randomInt(alphabet.length)]).join('');
};

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || generateSeedPassword();
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || generateSeedPassword();
const passwordsWereGenerated = !process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_DEMO_PASSWORD;

// Load .env files (same as config.ts)
// Try multiple paths to find .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), 'backend/.env')
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file!');
  console.error('Please set DATABASE_URL in your .env file with a PostgreSQL connection string.');
  console.error('Example: DATABASE_URL="postgresql://user:password@host:port/database"');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://');
  console.error(`Current value starts with: ${process.env.DATABASE_URL.substring(0, 20)}...`);
  process.exit(1);
}

// Prisma Client - uses DATABASE_URL from environment
import { RESORTS, ENVIRONMENT_IMAGES } from './seedResorts';

// The seed creates rows across every hotel and artist, with no session to
// attribute them to, so it uses the owner connection directly rather than the
// request-scoped client. DATABASE_URL stays pointed at the owner for exactly
// this reason; APP_DATABASE_URL is what the running server uses.
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Log database connection info (mask password)
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`📊 Database: ${maskedUrl.substring(0, 50)}...`);

  // ---- Retire the previous seed's rows -----------------------------------
  // Matched on literal identifiers the old seed wrote, so this can only ever
  // remove those exact rows. Anything a user created is untouched, and a
  // database that never held them reports zero.
  const RETIRED_HOTEL_EMAILS = [
    'ritz.paris@example.com',
    'aman.tokyo@example.com',
    'plaza.newyork@example.com',
    'ushuaia.ibiza@example.com'
  ];

  // Read off the previous seed file, not guessed.
  const RETIRED_TRIP_SLUGS = [
    'art-gallery-exhibitions',
    'culinary-arts',
    'live-performances',
    'rooftop-jazz-sessions',
    'sunset-photography',
    'wellness-sessions'
  ];

  const prunedTrips = await prisma.trip.deleteMany({
    where: { slug: { in: RETIRED_TRIP_SLUGS } }
  });

  // Deleting the user cascades to the hotel row (onDelete: Cascade on
  // Hotel.user), so this does not leave an orphaned hotel behind.
  const prunedHotels = await prisma.user.deleteMany({
    where: { email: { in: RETIRED_HOTEL_EMAILS } }
  });

  if (prunedTrips.count || prunedHotels.count) {
    console.log(
      `🧹 Retired ${prunedHotels.count} legacy hotel account(s) and ${prunedTrips.count} legacy trip(s)`
    );
  }

  // Create admin user
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@travelart.test' },
    // Rotating is the whole point of a freshly generated password: without the
    // hash here, a re-seed printed a new one and left the old one working.
    update: { passwordHash: adminPasswordHash, language: 'fr' },
    create: {
      role: 'ADMIN',
      email: 'admin@travelart.test',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      country: 'France',
      language: 'fr'
    }
  });

  console.log('✅ Admin user created');

  // Create hotel users
  const hotels = RESORTS;
  const createdHotels = [];

  for (const hotelData of hotels) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // Real coordinates. These used to be hardcoded to 0,0 for every property,
    // which put all of them on Null Island and made the map look broken.
    const location = JSON.stringify({
      city: hotelData.city,
      country: hotelData.country,
      coords: { lat: hotelData.lat, lng: hotelData.lng },
      lat: hotelData.lat,
      lng: hotelData.lng
    });

    const images = JSON.stringify(ENVIRONMENT_IMAGES[hotelData.environment]);
    const performanceSpots = JSON.stringify(hotelData.spots);
    const rooms = JSON.stringify([
      { id: 'room1', name: 'Chambre double', capacity: 2 },
      { id: 'room2', name: 'Suite', capacity: 4 }
    ]);

    const user = await prisma.user.upsert({
      where: { email: hotelData.email },
      update: { name: hotelData.name, country: hotelData.country, passwordHash },
      create: {
        role: 'HOTEL',
        email: hotelData.email,
        passwordHash,
        name: hotelData.name,
        country: hotelData.country,
        language: 'fr'
      }
    });

    // `update` carries the real fields rather than `{}`. With an empty update
    // a re-seed silently kept whatever was already stored, so the coordinate
    // fix would never have reached a database that had been seeded before.
    const hotel = await prisma.hotel.upsert({
      where: { userId: user.id },
      update: {
        name: hotelData.name,
        description: hotelData.description,
        location,
        // Mirrored from the same source as `location`, in the same write, so
        // the JSON and the queryable columns cannot disagree.
        latitude: hotelData.lat,
        longitude: hotelData.lng,
        contactPhone: hotelData.contactPhone,
        images,
        performanceSpots,
        rooms,
        repName: hotelData.repName
      },
      create: {
        userId: user.id,
        name: hotelData.name,
        description: hotelData.description,
        location,
        latitude: hotelData.lat,
        longitude: hotelData.lng,
        contactPhone: hotelData.contactPhone,
        images,
        performanceSpots,
        rooms,
        repName: hotelData.repName
      }
    });

    await prisma.credit.upsert({
      where: { hotelId: hotel.id },
      update: { totalCredits: 60, usedCredits: 0 },
      create: {
        hotelId: hotel.id,
        totalCredits: 60,
        usedCredits: 0
      }
    });

    createdHotels.push(hotel);
  }

  console.log(`✅ ${createdHotels.length} resorts created`);

  // Create artist users
  const artists = [
    {
      email: 'artist1@example.com',
      name: 'Sophie Laurent',
      country: 'France',
      discipline: 'Piano classique',
      bio: 'Pianiste classique primée, quinze ans de scène dans les plus grandes salles européennes. Joue aussi bien en formation intime sur les toits que dans les grands salons.',
      priceRange: '€500-1000',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist2@example.com',
      name: 'Marco Silva',
      country: 'Portugal',
      discipline: 'DJ',
      bio: 'DJ international, deep house et musiques électroniques. Résident des clubs de Lisbonne et d’Ibiza. Compose ses sets pour l’heure du coucher de soleil.',
      priceRange: '€300-800',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist3@example.com',
      name: 'Yoga Master Ananda',
      country: 'Inde',
      discipline: 'Yoga',
      bio: 'Professeure de yoga certifiée, vingt ans de pratique. Séances au lever du jour sur les toits et ateliers de méditation en hôtellerie.',
      priceRange: '€200-500',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist4@example.com',
      name: 'Isabella Garcia',
      country: 'Espagne',
      discipline: 'Danse flamenco',
      bio: 'Danseuse et chorégraphe de flamenco. Spectacles traditionnels et contemporains, sur les toits comme dans les petites salles.',
      priceRange: '€400-700',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist5@example.com',
      name: 'Jean-Michel Dubois',
      country: 'France',
      discipline: 'Saxophone jazz',
      bio: 'Saxophoniste de jazz, du bebop au répertoire contemporain. Joue en petite formation, souvent en fin de soirée sur les terrasses.',
      priceRange: '€350-600',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist6@example.com',
      name: 'Maria Santos',
      country: 'Portugal',
      discipline: 'Chant fado',
      bio: 'Chanteuse de fado portugais, d’une voix qui ne s’oublie pas. Répertoire traditionnel.',
      priceRange: '€250-450',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist7@example.com',
      name: 'Ahmed Benali',
      country: 'Maroc',
      discipline: 'Oud',
      bio: 'Maître du oud. Musique arabe classique et fusions contemporaines.',
      priceRange: '€300-550',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist8@example.com',
      name: 'Elena Popov',
      country: 'Russie',
      discipline: 'Danse classique',
      bio: 'Ancienne danseuse étoile du Bolchoi. Interprète aujourd’hui le répertoire contemporain et donne des masterclasses.',
      priceRange: '€600-1200',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist9@example.com',
      name: 'Luca Romano',
      country: 'Italie',
      discipline: 'Chant lyrique',
      bio: 'Chanteuse lyrique, répertoire italien. A chanté sur les grandes scènes d’opéra européennes.',
      priceRange: '€800-1500',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist10@example.com',
      name: 'Sarah Johnson',
      country: 'États-Unis',
      discipline: 'Atelier artisanal',
      bio: 'Animatrice d’ateliers créatifs autour de l’artisanat durable. Transmet en faisant faire.',
      priceRange: '€150-300',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    }
  ];

  const createdArtists = [];
  for (const artistData of artists) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await prisma.user.upsert({
      where: { email: artistData.email },
      // Reconciles rather than no-ops, so the translated country reaches rows
      // that already exist. With `{}` the seed silently keeps the old value.
      update: { name: artistData.name, country: artistData.country, passwordHash },
      create: {
        role: 'ARTIST',
        email: artistData.email,
        passwordHash,
        name: artistData.name,
        country: artistData.country,
        language: 'fr'
      }
    });

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      // A real update block, so re-seeding reconciles an existing artist. With
      // `{}` here the discipline translations above would never have reached a
      // database that had already been seeded.
      update: {
        bio: artistData.bio,
        discipline: artistData.discipline,
      },
      create: {
        userId: user.id,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
        membershipStatus: 'ACTIVE',
        membershipRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        images: artistData.images,
        videos: artistData.videos,
        mediaUrls: JSON.stringify([]),
        loyaltyPoints: Math.floor(Math.random() * 500) + 100
      }
    });

    // Create availability for next 6 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    // Deterministic id: one seeded availability window per artist, replaced
    // rather than duplicated on a re-run.
    await prisma.artistAvailability.upsert({
      where: { id: `seed-avail-${artist.id}` },
      update: { dateFrom: startDate, dateTo: endDate },
      create: {
        id: `seed-avail-${artist.id}`,
        artistId: artist.id,
        dateFrom: startDate,
        dateTo: endDate
      }
    });

    createdArtists.push(artist);
  }

  console.log('✅ Artists created');

  // Create sample bookings
  const bookings = [
    {
      hotelId: createdHotels[0].id,
      artistId: createdArtists[0].id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'CONFIRMED',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PAID'
    },
    {
      hotelId: createdHotels[1].id,
      artistId: createdArtists[1].id,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
      status: 'COMPLETED',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PAID'
    },
    {
      hotelId: createdHotels[2].id,
      artistId: createdArtists[2].id,
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
      status: 'PENDING',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PENDING'
    }
  ];

  const createdBookings = [];
  for (const [index, bookingData] of bookings.entries()) {
    const id = `seed-booking-${index}`;
    const booking = await prisma.booking.upsert({
      where: { id },
      update: bookingData,
      create: { id, ...bookingData }
    });
    createdBookings.push(booking);
  }

  console.log('✅ Bookings created');

  // Create sample ratings for completed bookings
  const ratings = [
    {
      bookingId: createdBookings[1].id,
      hotelId: createdBookings[1].hotelId,
      artistId: createdBookings[1].artistId,
      stars: 5,
      textReview: 'Prestation remarquable. Le set a tenu la salle du début à la fin, nos clients en parlent encore.',
      isVisibleToArtist: false
    }
  ];

  for (const [index, ratingData] of ratings.entries()) {
    const id = `seed-rating-${index}`;
    await prisma.rating.upsert({
      where: { id },
      update: ratingData,
      create: { id, ...ratingData }
    });
  }

  console.log('✅ Ratings created');

  // Create sample transactions
  const transactions = [
    {
      hotelId: createdHotels[0].id,
      type: 'CREDIT_PURCHASE',
      amount: 500.00
    },
    {
      hotelId: createdHotels[1].id,
      type: 'CREDIT_PURCHASE',
      amount: 300.00
    },
    {
      artistId: createdArtists[0].id,
      type: 'MEMBERSHIP',
      amount: 200.00
    }
  ];

  for (const [index, transactionData] of transactions.entries()) {
    const id = `seed-transaction-${index}`;
    await prisma.transaction.upsert({
      where: { id },
      update: transactionData,
      create: { id, ...transactionData }
    });
  }

  console.log('✅ Transactions created');

  // Add featured artists from static data
  const featuredArtists = [
    {
      email: 'elena.rodriguez@example.com',
      name: 'Elena Rodriguez',
      country: 'France',
      city: 'Paris',
      discipline: 'Saxophone jazz',
      bio: 'Saxophoniste de jazz reconnu, habitué des toits parisiens. Sessions intimistes, à la nuit tombée.',
      priceRange: '€500-1000',
      stageName: 'Elena Rodriguez',
      artisticProfile: JSON.stringify({
        mainCategory: 'Music',
        secondaryCategory: 'Jazz',
        audienceType: ['Adults', 'Couples'],
        languages: ['French', 'English', 'Spanish'],
        categoryType: 'Instrumental',
        specificCategory: 'Saxophone',
        domain: 'Concert'
      })
    },
    {
      email: 'marcus.chen@example.com',
      name: 'Marcus Chen',
      country: 'Japon',
      city: 'Tokyo',
      discipline: 'Arts visuels',
      bio: 'Artiste plasticien contemporain. Transforme les espaces d’un hôtel en parcours d’exposition immersif.',
      priceRange: '€600-1200',
      stageName: 'Marcus Chen',
      artisticProfile: JSON.stringify({
        mainCategory: 'Visual Arts',
        secondaryCategory: 'Contemporary',
        audienceType: ['Adults', 'Families'],
        languages: ['Japanese', 'English', 'Mandarin'],
        categoryType: 'Visual',
        specificCategory: 'Painting',
        domain: 'Exhibition'
      })
    },
    {
      email: 'sophie.laurent@example.com',
      name: 'Sophie Laurent',
      country: 'États-Unis',
      city: 'New York',
      discipline: 'Photographie',
      bio: 'Photographe primée, ateliers autour de la lumière du soir. Travaille les lieux autant que les visages.',
      priceRange: '€400-800',
      stageName: 'Sophie Laurent',
      artisticProfile: JSON.stringify({
        mainCategory: 'Photography',
        secondaryCategory: 'Portrait',
        audienceType: ['Adults', 'Couples'],
        languages: ['English', 'French'],
        categoryType: 'Photography',
        specificCategory: 'Portrait Photography',
        domain: 'Workshop'
      })
    },
    {
      email: 'david.kim@example.com',
      name: 'David Kim',
      country: 'Espagne',
      city: 'Ibiza',
      discipline: 'DJ et production',
      bio: 'DJ et producteur international. Résident de clubs réputés, spécialiste de la deep house.',
      priceRange: '€800-1500',
      stageName: 'David Kim',
      artisticProfile: JSON.stringify({
        mainCategory: 'Music',
        secondaryCategory: 'Electronic',
        audienceType: ['Adults', 'Young Adults'],
        languages: ['English', 'Spanish', 'Korean'],
        categoryType: 'DJ',
        specificCategory: 'Electronic Music',
        domain: 'Concert'
      })
    }
  ];

  for (const artistData of featuredArtists) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await prisma.user.upsert({
      where: { email: artistData.email },
      // Reconciles rather than no-ops, so the translated country reaches rows
      // that already exist. With `{}` the seed silently keeps the old value.
      update: { name: artistData.name, country: artistData.country, passwordHash },
      create: {
        role: 'ARTIST',
        email: artistData.email,
        passwordHash,
        name: artistData.name,
        country: artistData.country,
        language: 'fr'
      }
    });

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      // The last upsert still passing `{}`. Its source carried the translated
      // disciplines all along; they simply never reached an existing row.
      update: {
        stageName: artistData.stageName,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
      },
      create: {
        userId: user.id,
        stageName: artistData.stageName,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
        membershipStatus: 'ACTIVE',
        membershipRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
        videos: JSON.stringify([]),
        mediaUrls: JSON.stringify([]),
        artisticProfile: artistData.artisticProfile,
        loyaltyPoints: Math.floor(Math.random() * 500) + 100
      }
    });

    // Create availability if it doesn't exist
    const existingAvailability = await prisma.artistAvailability.findFirst({
      where: { artistId: artist.id }
    });

    if (!existingAvailability) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      await prisma.artistAvailability.upsert({
        where: { id: `seed-avail-${artist.id}` },
        update: { dateFrom: startDate, dateTo: endDate },
        create: {
          id: `seed-avail-${artist.id}`,
          artistId: artist.id,
          dateFrom: startDate,
          dateTo: endDate
        }
      });
    }
  }

  console.log('✅ Featured artists created');


  // Add immersive experiences (Trips)
  // One residency per resort, built from the resort record itself. The map on
  // the experiences page plots trips, so this is what actually puts thirty-five
  // pins on it - previously there were eight trips across four cities, and the
  // hotels they belonged to were all sitting at 0,0 anyway.
  const RESIDENCY_TYPES = ['residency', 'intimate', 'rooftop', 'workshop'] as const;

  const slugify = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const experiences = RESORTS.map((resort, index) => {
    // Spread the residencies across the coming year so the experiences page
    // has a real calendar to sort and filter rather than one shared date.
    const start = new Date();
    start.setDate(start.getDate() + 14 + index * 9);

    const headline = resort.spots[0];
    const artist = createdArtists.length
      ? createdArtists[index % createdArtists.length]
      : null;
    const hotel = createdHotels[index] ?? null;

    return {
      title: `Résidence — ${resort.city}`,
      slug: `residence-${slugify(resort.city)}-${slugify(resort.name)}`.slice(0, 80),
      description:
        `${resort.description} La résidence occupe ${headline.name} : ${headline.description.toLowerCase()}`,
      priceFrom: 0,
      priceTo: 0,
      location: JSON.stringify({
        city: resort.city,
        country: resort.country,
        lat: resort.lat,
        lng: resort.lng
      }),
      latitude: resort.lat,
      longitude: resort.lng,
      images: JSON.stringify(ENVIRONMENT_IMAGES[resort.environment]),
      status: 'PUBLISHED',
      type: RESIDENCY_TYPES[index % RESIDENCY_TYPES.length],
      rating: Number((4.3 + ((index * 7) % 7) / 10).toFixed(1)),
      date: start,
      duration: '7 nuits',
      capacity: `${headline.capacity} personnes`,
      artistId: artist ? artist.id : null,
      hotelId: hotel ? hotel.id : null
    };
  });

  for (const experienceData of experiences) {
    // A real `update` block, so re-seeding reconciles an existing row instead
    // of leaving whatever was written the first time.
    const payload = {
      title: experienceData.title,
      description: experienceData.description,
      priceFrom: experienceData.priceFrom,
      priceTo: experienceData.priceTo,
      location: experienceData.location,
      latitude: experienceData.latitude,
      longitude: experienceData.longitude,
      images: experienceData.images,
      status: experienceData.status,
      type: experienceData.type,
      rating: experienceData.rating,
      date: experienceData.date,
      duration: experienceData.duration,
      capacity: experienceData.capacity,
      artistId: experienceData.artistId,
      hotelId: experienceData.hotelId
    };

    await prisma.trip.upsert({
      where: { slug: experienceData.slug },
      update: payload,
      create: { slug: experienceData.slug, ...payload }
    });
  }

  console.log(`✅ ${experiences.length} residencies created`);

  // Credit packages. These existed only as rows somebody inserted by hand: no
  // migration and no seed created them, so a fresh database served an empty
  // purchase page. Keyed by slug, which is what the checkout route looks up.
  const CREDIT_PACKAGES = [
    { slug: 'starter', name: 'Formule Découverte', credits: 10, bonusCredits: 0, priceCents: 150000, sortOrder: 1 },
    { slug: 'professional', name: 'Formule Saison', credits: 25, bonusCredits: 4, priceCents: 350000, sortOrder: 2 },
    { slug: 'enterprise', name: 'Formule Année', credits: 50, bonusCredits: 10, priceCents: 650000, sortOrder: 3 },
  ];

  for (const pack of CREDIT_PACKAGES) {
    await prisma.creditPackage.upsert({
      where: { slug: pack.slug },
      update: {
        name: pack.name,
        credits: pack.credits,
        bonusCredits: pack.bonusCredits,
        priceCents: pack.priceCents,
        sortOrder: pack.sortOrder,
        currency: 'EUR',
        active: true,
      },
      create: { ...pack, currency: 'EUR', active: true },
    });
  }
  console.log(`✅ ${CREDIT_PACKAGES.length} credit packages reconciled`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Accounts created:');
  console.log('  admin@travelart.test  (ADMIN)');
  console.log('  hotel1-5@example.com, ritz.paris@, aman.tokyo@, plaza.newyork@, ushuaia.ibiza@  (HOTEL)');
  console.log('  artist1-10@example.com, elena.rodriguez@, marcus.chen@, sophie.laurent@, david.kim@  (ARTIST)');

  if (passwordsWereGenerated) {
    // Printed once, to this terminal only. Never commit these.
    console.log('\n🔑 Generated passwords for this run:');
    console.log(`  admin:  ${ADMIN_PASSWORD}`);
    console.log(`  demo:   ${DEMO_PASSWORD}`);
    console.log('\n  Set SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD to choose your own.');
  } else {
    console.log('\n🔑 Passwords taken from SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
