const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceSeedData() {
  console.log('🚀 Enhancing database with real content...');

  try {
    // Get existing hotels and artists
    const hotels = await prisma.hotel.findMany({ include: { user: true } });
    const artists = await prisma.artist.findMany({ include: { user: true } });

    if (hotels.length === 0 || artists.length === 0) {
      console.log('❌ Please run the main seed script first!');
      return;
    }

    console.log(`Found ${hotels.length} hotels and ${artists.length} artists`);

    // Create real Trips (Experiences)
    const experiences = [
      {
        hotelId: hotels[0].id,
        artistId: artists[0].id,
        title: 'Parisian Rooftop Piano Concert',
        description: 'An intimate evening of classical piano music on our rooftop terrace with breathtaking views of the Eiffel Tower.',
        price: 150.00,
        capacity: 40,
        duration: '2 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Classical', 'Piano', 'Rooftop']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[1].id,
        artistId: artists[4].id,
        title: 'Mediterranean Sunset Jazz Sessions',
        description: 'Sip cocktails and enjoy live jazz saxophone as the sun sets over the Mediterranean.',
        price: 85.00,
        capacity: 30,
        duration: '1.5 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
          'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Jazz', 'Sunset', 'Mediterranean']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[2].id,
        artistId: artists[6].id,
        title: 'Moroccan Nights: Traditional Oud Performance',
        description: 'Immerse yourself in the enchanting sounds of traditional Moroccan music.',
        price: 95.00,
        capacity: 50,
        duration: '2 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
          'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Traditional', 'Moroccan', 'Oud']),
        featured: true,
        status: 'ACTIVE'
      }
    ];

    console.log('Creating experiences...');
    for (const exp of experiences) {
      const trip = await prisma.trip.create({
        data: exp
      });
      console.log(`✅ Created: ${trip.title}`);
    }

    // Add more ratings to artists
    const additionalRatings = [
      { artistId: artists[0].id, stars: 5 },
      { artistId: artists[0].id, stars: 5 },
      { artistId: artists[1].id, stars: 4 },
      { artistId: artists[1].id, stars: 5 },
      { artistId: artists[2].id, stars: 5 },
      { artistId: artists[3].id, stars: 4 },
      { artistId: artists[4].id, stars: 5 },
      { artistId: artists[4].id, stars: 5 },
    ];

    console.log('Creating additional bookings and ratings...');
    for (let i = 0; i < additionalRatings.length; i++) {
      const ratingData = additionalRatings[i];
      const hotelIndex = i % hotels.length;
      
      const booking = await prisma.booking.create({
        data: {
          hotelId: hotels[hotelIndex].id,
          artistId: ratingData.artistId,
          startDate: new Date(Date.now() - (i + 30) * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - (i + 27) * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
          creditsUsed: 1
        }
      });

      await prisma.rating.create({
        data: {
          bookingId: booking.id,
          hotelId: hotels[hotelIndex].id,
          artistId: ratingData.artistId,
          stars: ratingData.stars,
          textReview: 'Excellent performance! Highly recommended.',
          isVisibleToArtist: false
        }
      });
    }

    console.log('✅ Additional ratings created');

    // Update artist profiles with registration data
    console.log('Updating artist profiles...');
    
    const artistProfiles = [
      {
        artistId: artists[0].id,
        stageName: 'Sophie Laurent',
        phone: '+33 6 12 34 56 78',
        birthDate: '15/05/1985',
        artisticProfile: JSON.stringify({
          mainCategory: 'Music',
          secondaryCategory: 'Classical',
          specificCategory: 'Piano',
          domain: 'Classical Music',
          categoryType: 'Solo Performance',
          languages: ['French', 'English', 'Italian'],
          audienceType: ['Adults', 'Couples', 'Corporate Events']
        })
      },
      {
        artistId: artists[1].id,
        stageName: 'DJ Marco',
        phone: '+351 91 234 5678',
        birthDate: '22/08/1990',
        artisticProfile: JSON.stringify({
          mainCategory: 'Music',
          secondaryCategory: 'Electronic',
          specificCategory: 'Deep House DJ',
          domain: 'Electronic Dance Music',
          categoryType: 'DJ Performance',
          languages: ['Portuguese', 'English', 'Spanish'],
          audienceType: ['Young Adults', 'Party Crowd', 'Club Scene']
        })
      }
    ];

    for (const profile of artistProfiles) {
      await prisma.artist.update({
        where: { id: profile.artistId },
        data: {
          stageName: profile.stageName,
          phone: profile.phone,
          birthDate: profile.birthDate,
          artisticProfile: profile.artisticProfile
        }
      });
    }

    console.log('✅ Artist profiles updated');

    console.log('\n🎉 Enhancement complete!');
    console.log('📊 Summary:');
    console.log(`   - ${experiences.length} experiences created`);
    console.log(`   - ${additionalRatings.length} new ratings added`);
    console.log(`   - ${artistProfiles.length} artist profiles enhanced`);
    console.log('\n🌐 Real data now available!');
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    throw error;
  }
}

enhanceSeedData()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

