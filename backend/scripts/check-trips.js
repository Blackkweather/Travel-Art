const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function checkTrips() {
  try {
    const trips = await prisma.trip.findMany({
      where: { status: 'PUBLISHED' }
    });
    
    console.log(`\n✅ Found ${trips.length} published trips:\n`);
    trips.forEach((t, i) => {
      console.log(`${i + 1}. ${t.title}`);
      console.log(`   Slug: ${t.slug}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Type: ${t.type || 'N/A'}`);
      console.log(`   Location: ${t.location ? (typeof t.location === 'string' ? t.location.substring(0, 50) : JSON.stringify(t.location).substring(0, 50)) : 'N/A'}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTrips();

