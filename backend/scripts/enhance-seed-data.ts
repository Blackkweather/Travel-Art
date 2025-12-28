import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        hotelId: hotels[0].id, // Hotel Plaza Athénée - Paris
        artistId: artists[0].id, // Sophie Laurent - Pianist
        title: 'Parisian Rooftop Piano Concert',
        description: 'An intimate evening of classical piano music on our rooftop terrace with breathtaking views of the Eiffel Tower. Experience the magic of Paris as Sophie Laurent performs timeless classical pieces under the stars.',
        longDescription: 'Join us for an unforgettable evening of classical music in the heart of Paris. Sophie Laurent, our award-winning pianist, will perform a carefully curated selection of romantic and contemporary classical pieces. The performance takes place on our exclusive rooftop terrace, offering unparalleled views of the Eiffel Tower as it sparkles against the Parisian night sky. This intimate concert is limited to 40 guests, ensuring an exclusive and memorable experience. Light refreshments and champagne will be served during intermission.',
        price: 150.00,
        capacity: 40,
        duration: '2 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Classical', 'Piano', 'Rooftop', 'Luxury', 'Evening']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[1].id, // Hotel Negresco - Nice
        artistId: artists[4].id, // Jean-Michel Dubois - Jazz Saxophonist
        title: 'Mediterranean Sunset Jazz Sessions',
        description: 'Sip cocktails and enjoy live jazz saxophone as the sun sets over the Mediterranean. An unforgettable evening of smooth jazz, breathtaking views, and French Riviera elegance.',
        longDescription: 'Experience the magic of the French Riviera with our exclusive sunset jazz sessions. Jean-Michel Dubois, renowned jazz saxophonist, performs contemporary and classic jazz standards as the sun dips below the Mediterranean horizon. This weekly event has become a cornerstone of Nice cultural scene, attracting jazz enthusiasts and sunset lovers alike. The performance takes place on our legendary rooftop terrace, where guests can enjoy handcrafted cocktails, Mediterranean tapas, and panoramic views. Limited to 30 guests for an intimate atmosphere.',
        price: 85.00,
        capacity: 30,
        duration: '1.5 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
          'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200',
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Jazz', 'Sunset', 'Mediterranean', 'Cocktails', 'Live Music']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[2].id, // La Mamounia - Marrakech
        artistId: artists[6].id, // Ahmed Benali - Oud Player
        title: 'Moroccan Nights: Traditional Oud Performance',
        description: 'Immerse yourself in the enchanting sounds of traditional Moroccan music. Ahmed Benali performs on the oud under the stars with the Atlas Mountains as your backdrop.',
        longDescription: 'Transport yourself to ancient Marrakech with an evening of authentic Moroccan music performed by master oud player Ahmed Benali. Set against the stunning backdrop of the Atlas Mountains, this performance celebrates the rich musical heritage of Morocco while incorporating contemporary fusion elements. Guests will enjoy traditional Moroccan mint tea and sweets while seated on luxurious cushions in our candlelit rooftop courtyard. The performance includes explanations of traditional instruments and musical styles, making it both entertaining and educational. A truly magical experience that captures the essence of Moroccan hospitality.',
        price: 95.00,
        capacity: 50,
        duration: '2 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
          'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Traditional', 'Moroccan', 'Oud', 'Cultural', 'Evening']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[4].id, // Nobu Hotel Ibiza
        artistId: artists[1].id, // Marco Silva - DJ
        title: 'Ibiza Sunset Electronic Music Experience',
        description: 'Dance the night away with internationally acclaimed DJ Marco Silva. Experience world-class electronic music with Mediterranean views at our legendary rooftop beach club.',
        longDescription: 'Join us for an electrifying evening as DJ Marco Silva takes over our rooftop beach club for a special sunset-to-stars performance. Known for his deep house and electronic fusion sets, Marco has played at the world top clubs and festivals. This exclusive event combines cutting-edge electronic music with Ibiza legendary party atmosphere, all while enjoying cocktails and Mediterranean cuisine. The rooftop transforms into a dance paradise with state-of-the-art sound and lighting systems. Whether you are a dance music enthusiast or simply looking for an unforgettable night out, this is the ultimate Ibiza experience.',
        price: 120.00,
        capacity: 150,
        duration: '4 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Electronic', 'DJ', 'Dance', 'Nightlife', 'Beach Club']),
        featured: true,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[3].id, // Palácio Belmonte - Lisbon
        artistId: artists[5].id, // Maria Santos - Fado Singer
        title: 'Authentic Fado Night in Lisbon',
        description: 'Experience the soul of Portugal with traditional fado music performed by Maria Santos. An intimate evening of haunting melodies and Portuguese culture in our historic wine cellar.',
        longDescription: 'Discover the deeply emotional art of fado, Portugal traditional music genre, in the intimate setting of our 15th-century wine cellar. Maria Santos, one of Lisbon most acclaimed fado singers, will perform classic and contemporary fado pieces that tell stories of love, loss, and longing. The performance is accompanied by traditional Portuguese guitar and includes a brief history of this UNESCO-recognized cultural treasure. Guests will enjoy a selection of Portuguese wines and traditional petiscos (tapas) throughout the evening. With candlelit tables and stone walls echoing each note, this is an authentic Portuguese experience not to be missed.',
        price: 75.00,
        capacity: 40,
        duration: '1.5 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
          'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200'
        ]),
        category: 'Music',
        tags: JSON.stringify(['Fado', 'Traditional', 'Portuguese', 'Cultural', 'Intimate']),
        featured: false,
        status: 'ACTIVE'
      },
      {
        hotelId: hotels[0].id, // Hotel Plaza Athénée - Paris
        artistId: artists[2].id, // Yoga Master Ananda
        title: 'Sunrise Yoga with Eiffel Tower Views',
        description: 'Start your day with mindfulness and movement. Join Yoga Master Ananda for a transformative rooftop yoga session as Paris awakens beneath you.',
        longDescription: 'Begin your Parisian morning with a rejuvenating yoga session on our exclusive rooftop terrace, featuring unobstructed views of the Eiffel Tower. Yoga Master Ananda leads a gentle yet energizing flow suitable for all levels, combining traditional Hatha yoga with modern mindfulness techniques. As the sun rises over the City of Light, you'll move through carefully sequenced poses designed to awaken the body and calm the mind. The session concludes with a guided meditation and breathing exercises. Light healthy breakfast and herbal teas are served after class. Mats and props provided.',
        price: 65.00,
        capacity: 20,
        duration: '1.5 hours',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200',
          'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200'
        ]),
        category: 'Wellness',
        tags: JSON.stringify(['Yoga', 'Wellness', 'Sunrise', 'Mindfulness', 'Morning']),
        featured: false,
        status: 'ACTIVE'
      }
    ];

    console.log('Creating experiences...');
    const createdTrips = [];
    for (const exp of experiences) {
      const trip = await prisma.trip.upsert({
        where: {
          hotelId_artistId_title: {
            hotelId: exp.hotelId,
            artistId: exp.artistId,
            title: exp.title
          }
        },
        update: {},
        create: exp
      });
      createdTrips.push(trip);
      console.log(`✅ Created: ${trip.title}`);
    }

    // Add more ratings to artists for realistic reviews
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

    // Create bookings for these ratings
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

    // Update artist profile data to include registration info
    console.log('Updating artist profiles with registration data...');
    
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
      },
      {
        artistId: artists[2].id,
        stageName: 'Master Ananda',
        phone: '+91 98765 43210',
        birthDate: '10/03/1980',
        artisticProfile: JSON.stringify({
          mainCategory: 'Wellness',
          secondaryCategory: 'Yoga',
          specificCategory: 'Hatha Yoga',
          domain: 'Mind & Body',
          categoryType: 'Group Classes',
          languages: ['Hindi', 'English', 'French'],
          audienceType: ['All Ages', 'Wellness Seekers', 'Beginners Welcome']
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

    console.log('✅ Artist profiles updated with registration data');

    console.log('\n🎉 Enhancement complete!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdTrips.length} experiences created`);
    console.log(`   - ${additionalRatings.length} new ratings added`);
    console.log(`   - ${artistProfiles.length} artist profiles enhanced`);
    console.log('\n🌐 You can now see real experiences on the homepage!');
    
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

