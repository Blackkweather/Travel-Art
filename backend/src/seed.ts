import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env files (same as config.ts)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get database URL from environment
const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('file:')) {
    return envUrl;
  }
  return 'file:./prisma/dev.db';
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Password123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@travelart.test' },
    update: {},
    create: {
      role: 'ADMIN',
      email: 'admin@travelart.test',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      country: 'France',
      language: 'en'
    }
  });

  console.log('✅ Admin user created');

  // Create hotel users
  const hotels = [
    {
      email: 'hotel1@example.com',
      name: 'Hotel Plaza Athénée',
      country: 'France',
      city: 'Paris',
      description: 'Luxury hotel in the heart of Paris with stunning views of the Eiffel Tower.',
      contactPhone: '+33 1 53 67 66 65',
      repName: 'Marie Dubois',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'
      ]),
      performanceSpots: JSON.stringify([
        { name: 'Grand Ballroom', type: 'ballroom', capacity: 200, description: 'Elegant ballroom perfect for classical concerts and formal performances' },
        { name: 'Rooftop Terrace', type: 'lounge', capacity: 50, description: 'Stunning rooftop with Eiffel Tower views - ideal for intimate acoustic sets' }
      ]),
      rooms: JSON.stringify([
        { id: 'room1', name: 'Deluxe Suite', capacity: 2 },
        { id: 'room2', name: 'Presidential Suite', capacity: 4 }
      ])
    },
    {
      email: 'hotel2@example.com',
      name: 'Hotel Negresco',
      country: 'France',
      city: 'Nice',
      description: 'Historic luxury hotel on the French Riviera with Mediterranean views and legendary rooftop performances.',
      contactPhone: '+33 4 93 16 64 00',
      repName: 'Jean-Pierre Martin',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop'
      ]),
      performanceSpots: JSON.stringify([
        { name: 'Rooftop Jazz Lounge', type: 'lounge', capacity: 30, description: 'Intimate rooftop setting overlooking the Mediterranean - perfect for jazz ensembles' },
        { name: 'Garden Terrace', type: 'resto', capacity: 80, description: 'Elegant garden space ideal for acoustic performances and dinner shows' }
      ]),
      rooms: JSON.stringify([
        { id: 'room1', name: 'Sea View Room', capacity: 2 },
        { id: 'room2', name: 'Penthouse Suite', capacity: 6 }
      ])
    },
    {
      email: 'hotel3@example.com',
      name: 'La Mamounia',
      country: 'Morocco',
      city: 'Marrakech',
      description: 'Iconic palace hotel with traditional Moroccan architecture and magical rooftop performances under the stars.',
      contactPhone: '+212 5243 888 00',
      repName: 'Fatima Alami',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop'
      ]),
      performanceSpots: JSON.stringify([
        { name: 'Atlas Rooftop Bar', type: 'lounge', capacity: 40, description: 'Breathtaking rooftop with Atlas Mountain views - perfect for traditional music and modern fusion' },
        { name: 'Pool Deck Stage', type: 'pool', capacity: 100, description: 'Stunning poolside venue ideal for bands and DJ sets under the Moroccan sky' }
      ]),
      rooms: JSON.stringify([
        { id: 'room1', name: 'Riad Suite', capacity: 2 },
        { id: 'room2', name: 'Royal Suite', capacity: 4 }
      ])
    },
    {
      email: 'hotel4@example.com',
      name: 'Palácio Belmonte',
      country: 'Portugal',
      city: 'Lisbon',
      description: 'Boutique palace hotel with panoramic views of Lisbon and intimate rooftop concerts.',
      contactPhone: '+351 21 881 66 00',
      repName: 'Carlos Silva',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'
      ]),
      performanceSpots: JSON.stringify([
        { name: 'Terrace Bar', type: 'lounge', capacity: 25, description: 'Intimate terrace overlooking Lisbon - perfect for fado singers and acoustic guitarists' },
        { name: 'Wine Cellar', type: 'resto', capacity: 60, description: 'Historic wine cellar ideal for classical music and intimate performances' }
      ]),
      rooms: JSON.stringify([
        { id: 'room1', name: 'Palace Room', capacity: 2 },
        { id: 'room2', name: 'Tower Suite', capacity: 3 }
      ])
    },
    {
      email: 'hotel5@example.com',
      name: 'Nobu Hotel Ibiza',
      country: 'Spain',
      city: 'Ibiza',
      description: 'Luxury beachfront hotel with world-class dining and legendary rooftop DJ performances.',
      contactPhone: '+34 971 19 22 22',
      repName: 'Sofia Rodriguez',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'
      ]),
      performanceSpots: JSON.stringify([
        { name: 'Rooftop Beach Club', type: 'pool', capacity: 150, description: 'Epic rooftop venue with Mediterranean views - perfect for DJs and electronic music' },
        { name: 'Sunset Lounge', type: 'lounge', capacity: 60, description: 'Intimate sunset setting ideal for acoustic performances and live bands' }
      ]),
      rooms: JSON.stringify([
        { id: 'room1', name: 'Ocean View Suite', capacity: 2 },
        { id: 'room2', name: 'Villa Suite', capacity: 4 }
      ])
    }
  ];

  const createdHotels = [];
  for (const hotelData of hotels) {
    const passwordHash = await bcrypt.hash('password123', 12);
    const location = JSON.stringify({
      city: hotelData.city,
      country: hotelData.country,
      coords: { lat: 0, lng: 0 } // Placeholder coordinates
    });

    const user = await prisma.user.upsert({
      where: { email: hotelData.email },
      update: {},
      create: {
        role: 'HOTEL',
        email: hotelData.email,
        passwordHash,
        name: hotelData.name,
        country: hotelData.country,
        language: 'en'
      }
    });

    const hotel = await prisma.hotel.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: hotelData.name,
        description: hotelData.description,
        location,
        contactPhone: hotelData.contactPhone,
        images: hotelData.images,
        performanceSpots: hotelData.performanceSpots,
        rooms: hotelData.rooms,
        repName: hotelData.repName
      }
    });

    // Create credits for hotels
    await prisma.credit.upsert({
      where: { hotelId: hotel.id },
      update: {},
      create: {
        hotelId: hotel.id,
        totalCredits: Math.floor(Math.random() * 10) + 1, // 1-10 credits
        usedCredits: 0
      }
    });

    createdHotels.push(hotel);
  }

  console.log('✅ Hotels created');

  // Create artist users
  const artists = [
    {
      email: 'artist1@example.com',
      name: 'Sophie Laurent',
      country: 'France',
      discipline: 'Classical Pianist',
      bio: 'Award-winning classical pianist with 15 years of experience performing in prestigious venues across Europe. Specializes in intimate rooftop performances and grand ballroom concerts.',
      priceRange: '€500-1000',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=example1',
        'https://www.youtube.com/watch?v=example2'
      ])
    },
    {
      email: 'artist2@example.com',
      name: 'Marco Silva',
      country: 'Portugal',
      discipline: 'DJ',
      bio: 'International DJ specializing in deep house and electronic music. Resident DJ at top clubs in Lisbon and Ibiza. Creates unforgettable rooftop experiences with stunning sunset sets.',
      priceRange: '€300-800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=example3',
        'https://www.youtube.com/watch?v=example4'
      ])
    },
    {
      email: 'artist3@example.com',
      name: 'Yoga Master Ananda',
      country: 'India',
      discipline: 'Yoga Instructor',
      bio: 'Certified yoga instructor with 20 years of experience. Specializes in sunrise rooftop sessions and meditation workshops in luxury hotel settings.',
      priceRange: '€200-500',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=example5',
        'https://www.youtube.com/watch?v=example6'
      ])
    },
    {
      email: 'artist4@example.com',
      name: 'Isabella Garcia',
      country: 'Spain',
      discipline: 'Flamenco Dancer',
      bio: 'Professional flamenco dancer and choreographer. Performs traditional and contemporary flamenco shows on hotel rooftops and intimate venues.',
      priceRange: '€400-700',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=example7',
        'https://www.youtube.com/watch?v=example8'
      ])
    },
    {
      email: 'artist5@example.com',
      name: 'Jean-Michel Dubois',
      country: 'France',
      discipline: 'Jazz Saxophonist',
      bio: 'Professional jazz saxophonist with a passion for bebop and contemporary jazz. Creates magical moments on hotel rooftops with intimate jazz ensembles.',
      priceRange: '€350-600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=example9',
        'https://www.youtube.com/watch?v=example10'
      ])
    },
    {
      email: 'artist6@example.com',
      name: 'Maria Santos',
      country: 'Portugal',
      discipline: 'Fado Singer',
      bio: 'Traditional Portuguese fado singer with a hauntingly beautiful voice. Performs authentic fado music.',
      priceRange: '€250-450',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist7@example.com',
      name: 'Ahmed Benali',
      country: 'Morocco',
      discipline: 'Oud Player',
      bio: 'Master of the traditional Arabic oud instrument. Performs classical Arabic music and contemporary fusion.',
      priceRange: '€300-550',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist8@example.com',
      name: 'Elena Popov',
      country: 'Russia',
      discipline: 'Ballet Dancer',
      bio: 'Former principal dancer with the Bolshoi Ballet. Now performs contemporary ballet and teaches masterclasses.',
      priceRange: '€600-1200',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist9@example.com',
      name: 'Luca Romano',
      country: 'Italy',
      discipline: 'Opera Singer',
      bio: 'Professional opera singer specializing in Italian opera. Performed in major opera houses across Europe.',
      priceRange: '€800-1500',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist10@example.com',
      name: 'Sarah Johnson',
      country: 'United States',
      discipline: 'DIY Workshop Leader',
      bio: 'Creative workshop leader specializing in sustainable crafts and DIY projects. Makes learning fun and engaging.',
      priceRange: '€150-300',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    }
  ];

  const createdArtists = [];
  for (const artistData of artists) {
    const passwordHash = await bcrypt.hash('password123', 12);

    const user = await prisma.user.upsert({
      where: { email: artistData.email },
      update: {},
      create: {
        role: 'ARTIST',
        email: artistData.email,
        passwordHash,
        name: artistData.name,
        country: artistData.country,
        language: 'en'
      }
    });

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      update: {},
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

    await prisma.artistAvailability.create({
      data: {
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
      creditsUsed: 1
    },
    {
      hotelId: createdHotels[1].id,
      artistId: createdArtists[1].id,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
      status: 'COMPLETED',
      creditsUsed: 1
    },
    {
      hotelId: createdHotels[2].id,
      artistId: createdArtists[2].id,
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
      status: 'PENDING',
      creditsUsed: 1
    }
  ];

  const createdBookings = [];
  for (const bookingData of bookings) {
    const booking = await prisma.booking.create({
      data: bookingData
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
      textReview: 'Absolutely fantastic performance! The DJ set was incredible and our guests loved every minute.',
      isVisibleToArtist: false
    }
  ];

  for (const ratingData of ratings) {
    await prisma.rating.create({
      data: ratingData
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

  for (const transactionData of transactions) {
    await prisma.transaction.create({
      data: transactionData
    });
  }

  console.log('✅ Transactions created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample login credentials:');
  console.log('Admin: admin@travelart.test / Password123!');
  console.log('Hotel: hotel1@example.com / password123');
  console.log('Artist: artist1@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
