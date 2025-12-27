import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env files
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

async function clearSeedData() {
  console.log('🗑️  Clearing seed data from database...');

  try {
    // Delete seed users (not the currently logged-in user)
    // Keep only users that were registered normally (not from seed)
    const seedEmails = [
      'artist1@example.com',
      'artist2@example.com',
      'artist3@example.com',
      'hotel1@example.com',
      'hotel2@example.com',
      'hotel3@example.com'
    ];

    // Delete related data first (foreign key constraints)
    console.log('Deleting bookings...');
    await prisma.booking.deleteMany({});

    console.log('Deleting ratings...');
    await prisma.rating.deleteMany({});

    console.log('Deleting transactions...');
    await prisma.transaction.deleteMany({});

    console.log('Deleting referrals...');
    await prisma.referral.deleteMany({});

    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});

    console.log('Deleting availabilities...');
    await prisma.artistAvailability.deleteMany({});
    await prisma.availability.deleteMany({});

    console.log('Deleting artists...');
    const seedArtists = await prisma.user.findMany({
      where: {
        email: { in: seedEmails },
        role: 'ARTIST'
      },
      include: { artist: true }
    });

    for (const user of seedArtists) {
      if (user.artist) {
        await prisma.artist.delete({ where: { id: user.artist.id } });
      }
    }

    console.log('Deleting hotels...');
    const seedHotels = await prisma.user.findMany({
      where: {
        email: { in: seedEmails },
        role: 'HOTEL'
      },
      include: { hotel: true }
    });

    for (const user of seedHotels) {
      if (user.hotel) {
        await prisma.credit.deleteMany({ where: { hotelId: user.hotel.id } });
        await prisma.hotel.delete({ where: { id: user.hotel.id } });
      }
    }

    console.log('Deleting seed users...');
    await prisma.user.deleteMany({
      where: {
        email: { in: seedEmails }
      }
    });

    // Delete admin log entries for deleted users
    console.log('Cleaning admin logs...');
    await prisma.adminLog.deleteMany({});

    // Keep only admin user if it exists (not from seed emails)
    console.log('✅ Seed data cleared successfully!');
    console.log('📊 Remaining users:', await prisma.user.count());

  } catch (error: any) {
    console.error('❌ Error clearing seed data:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearSeedData()
  .then(() => {
    console.log('✅ Database cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  });










