import React from 'react'
import { motion } from 'framer-motion'
import { Star, MapPin, Building, Music, Users, Calendar } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const TopHotelsPage: React.FC = () => {
  const topHotels = [
    {
      id: '1',
      name: 'Hotel Plaza Athénée',
      location: 'Paris, France',
      rating: 4.9,
      bookings: 45,
      performanceSpots: ['Rooftop Terrace', 'Grand Ballroom'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      description: 'Luxury hotel in the heart of Paris with stunning views of the Eiffel Tower. Perfect for intimate acoustic sets and grand performances.',
      specialties: ['Eiffel Tower Views', 'Intimate Concerts', 'Classical Music'],
      recentArtists: ['Sophie Laurent', 'Jean-Michel Dubois', 'Maria Santos']
    },
    {
      id: '2',
      name: 'Hotel Negresco',
      location: 'Nice, France',
      rating: 4.8,
      bookings: 38,
      performanceSpots: ['Rooftop Jazz Lounge', 'Garden Terrace'],
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
      description: 'Historic luxury hotel on the French Riviera with Mediterranean views and legendary rooftop performances.',
      specialties: ['Mediterranean Views', 'Jazz Performances', 'Sunset Sets'],
      recentArtists: ['Marco Silva', 'Jean-Michel Dubois', 'Isabella Garcia']
    },
    {
      id: '3',
      name: 'La Mamounia',
      location: 'Marrakech, Morocco',
      rating: 4.9,
      bookings: 32,
      performanceSpots: ['Atlas Rooftop Bar', 'Pool Deck Stage'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop',
      description: 'Iconic palace hotel with traditional Moroccan architecture and magical rooftop performances under the stars.',
      specialties: ['Atlas Mountain Views', 'Traditional Music', 'Cultural Performances'],
      recentArtists: ['Yoga Master Ananda', 'Isabella Garcia', 'Sophie Laurent']
    },
    {
      id: '4',
      name: 'Palácio Belmonte',
      location: 'Lisbon, Portugal',
      rating: 4.7,
      bookings: 28,
      performanceSpots: ['Terrace Bar', 'Wine Cellar'],
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
      description: 'Boutique palace hotel with panoramic views of Lisbon and intimate rooftop concerts.',
      specialties: ['Lisbon Views', 'Fado Music', 'Intimate Venues'],
      recentArtists: ['Maria Santos', 'Marco Silva', 'Sophie Laurent']
    },
    {
      id: '5',
      name: 'Nobu Hotel Ibiza',
      location: 'Ibiza, Spain',
      rating: 4.8,
      bookings: 25,
      performanceSpots: ['Rooftop Beach Club', 'Sunset Lounge'],
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
      description: 'Luxury beachfront hotel with world-class dining and legendary rooftop DJ performances.',
      specialties: ['Beach Views', 'Electronic Music', 'DJ Sets'],
      recentArtists: ['Marco Silva', 'Isabella Garcia', 'Jean-Michel Dubois']
    },
    {
      id: '6',
      name: 'The Ritz-Carlton',
      location: 'Barcelona, Spain',
      rating: 4.6,
      bookings: 22,
      performanceSpots: ['Sky Terrace', 'Elegant Lounge'],
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop',
      description: 'Elegant hotel in Barcelona with stunning city views and sophisticated performance spaces.',
      specialties: ['City Views', 'Sophisticated Venues', 'Cultural Events'],
      recentArtists: ['Sophie Laurent', 'Yoga Master Ananda', 'Maria Santos']
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Luxury hotel rooftop" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-navy/70"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              Luxury Hotel
              <span className="block text-gold">Partners</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover the world's most prestigious hotels offering stunning rooftop venues and intimate performance spaces.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">23</h3>
              <p className="text-gray-600">Luxury Hotels</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">67</h3>
              <p className="text-gray-600">Performance Venues</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">4.8</h3>
              <p className="text-gray-600">Average Rating</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">342</h3>
              <p className="text-gray-600">Successful Events</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            Featured Hotels
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the world's most luxurious hotels with stunning rooftop venues and intimate performance spaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topHotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury overflow-hidden"
            >
              <div className="relative">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                  {hotel.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {hotel.location}
                </p>
                
                <p className="text-gray-600 text-sm mb-4">
                  {hotel.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Performance Spots:</h4>
                  <div className="flex flex-wrap gap-2">
                    {hotel.performanceSpots.map((spot, spotIndex) => (
                      <span
                        key={spotIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {hotel.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Recent Artists:</h4>
                  <div className="text-sm text-gray-600">
                    {hotel.recentArtists.join(' • ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {hotel.bookings} bookings
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {hotel.rating} rating
                  </span>
                </div>

                <button className="w-full btn-primary">
                  View Venues
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Venue Types Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
              Venue Types
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From intimate rooftop terraces to grand ballrooms, our hotels offer diverse performance spaces
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-navy" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Rooftop Terraces
              </h3>
              <p className="text-gray-600">
                Intimate outdoor spaces with stunning city views, perfect for acoustic performances and sunset sets.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-navy" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Jazz Lounges
              </h3>
              <p className="text-gray-600">
                Sophisticated indoor venues with perfect acoustics for jazz ensembles and intimate concerts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-navy" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Grand Ballrooms
              </h3>
              <p className="text-gray-600">
                Elegant large spaces ideal for classical concerts, formal performances, and special events.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-navy" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Beach Clubs
              </h3>
              <p className="text-gray-600">
                Open-air venues by the sea, perfect for DJ sets, electronic music, and sunset performances.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-navy text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-6">
              Ready to Partner?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our network of luxury hotels and start offering unforgettable artistic experiences to your guests.
            </p>
            <a href="/register" className="btn-primary text-lg px-8 py-4">
              Join as Hotel
            </a>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default TopHotelsPage
