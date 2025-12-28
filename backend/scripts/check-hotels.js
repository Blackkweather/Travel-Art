const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function checkHotels() {
  try {
    const hotels = await prisma.hotel.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            country: true
          }
        }
      },
    });
    
    console.log(`\n✅ Found ${hotels.length} hotels in database:\n`);
    hotels.forEach((h, i) => {
      const spots = h.performanceSpots ? (typeof h.performanceSpots === 'string' ? JSON.parse(h.performanceSpots) : h.performanceSpots) : [];
      console.log(`${i + 1}. ${h.name}`);
      console.log(`   Email: ${h.user?.email}`);
      console.log(`   Country: ${h.user?.country || 'N/A'}`);
      console.log(`   Performance Spots: ${Array.isArray(spots) ? spots.length : 0}`);
      console.log(`   ID: ${h.id}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkHotels();

