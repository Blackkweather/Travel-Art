import React from 'react'
import { motion } from 'framer-motion'
import { Star, MapPin, Music, Calendar, Users } from 'lucide-react'

const TopArtistsPage: React.FC = () => {
  const topArtists = [
    {
      id: '1',
      name: 'Sophie Laurent',
      discipline: 'Classical Pianist',
      location: 'Paris, France',
      rating: 4.9,
      bookings: 24,
      specialties: ['Rooftop Piano', 'Intimate Concerts', 'Classical Music'],
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      description: 'Award-winning classical pianist specializing in intimate rooftop performances with stunning city views.',
      recentVenues: ['Hotel Plaza Athénée', 'La Mamounia', 'Palácio Belmonte']
    },
    {
      id: '2',
      name: 'Marco Silva',
      discipline: 'DJ',
      location: 'Lisbon, Portugal',
      rating: 4.8,
      bookings: 18,
      specialties: ['Sunset DJ Sets', 'Deep House', 'Electronic Music'],
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
      description: 'International DJ creating unforgettable rooftop experiences with stunning sunset sets.',
      recentVenues: ['Hotel Negresco', 'Nobu Hotel Ibiza', 'La Mamounia']
    },
    {
      id: '3',
      name: 'Jean-Michel Dubois',
      discipline: 'Jazz Saxophonist',
      location: 'Nice, France',
      rating: 4.9,
      bookings: 15,
      specialties: ['Jazz Ensembles', 'Bebop', 'Contemporary Jazz'],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      description: 'Professional jazz saxophonist creating magical moments on hotel rooftops with intimate jazz ensembles.',
      recentVenues: ['Hotel Plaza Athénée', 'Hotel Negresco', 'Palácio Belmonte']
    },
    {
      id: '4',
      name: 'Isabella Garcia',
      discipline: 'Flamenco Dancer',
      location: 'Seville, Spain',
      rating: 4.7,
      bookings: 12,
      specialties: ['Flamenco Shows', 'Traditional Dance', 'Cultural Performances'],
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop',
      description: 'Professional flamenco dancer performing traditional and contemporary shows on hotel rooftops.',
      recentVenues: ['La Mamounia', 'Nobu Hotel Ibiza', 'Hotel Negresco']
    },
    {
      id: '5',
      name: 'Yoga Master Ananda',
      discipline: 'Yoga Instructor',
      location: 'Marrakech, Morocco',
      rating: 4.8,
      bookings: 20,
      specialties: ['Sunrise Sessions', 'Meditation', 'Wellness'],
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      description: 'Certified yoga instructor specializing in sunrise rooftop sessions and meditation workshops.',
      recentVenues: ['La Mamounia', 'Hotel Plaza Athénée', 'Palácio Belmonte']
    },
    {
      id: '6',
      name: 'Maria Santos',
      discipline: 'Fado Singer',
      location: 'Lisbon, Portugal',
      rating: 4.6,
      bookings: 10,
      specialties: ['Fado Music', 'Portuguese Culture', 'Intimate Performances'],
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      description: 'Traditional fado singer bringing Portuguese soul to luxury hotel terraces and intimate venues.',
      recentVenues: ['Palácio Belmonte', 'Hotel Negresco', 'Hotel Plaza Athénée']
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <div className="bg-navy text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              Top Performing
              <span className="block text-gold">Artists</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover the world's most talented artists who create magical moments on hotel rooftops and luxury venues.
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
                <Users className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">89</h3>
              <p className="text-gray-600">Verified Artists</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
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
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">342</h3>
              <p className="text-gray-600">Successful Bookings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-3xl font-bold text-navy mb-2">23</h3>
              <p className="text-gray-600">Luxury Hotels</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            Featured Artists
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet our top-performing artists who specialize in creating unforgettable rooftop experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury overflow-hidden"
            >
              <div className="relative">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 right-4 bg-gold text-navy px-3 py-1 rounded-full text-sm font-medium">
                  ⭐ {artist.rating}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                  {artist.name}
                </h3>
                <p className="text-gold font-medium mb-3">{artist.discipline}</p>
                <p className="text-gray-600 text-sm mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {artist.location}
                </p>
                
                <p className="text-gray-600 text-sm mb-4">
                  {artist.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Recent Venues:</h4>
                  <div className="text-sm text-gray-600">
                    {artist.recentVenues.join(' • ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {artist.bookings} bookings
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {artist.rating} rating
                  </span>
                </div>

                <button className="w-full btn-primary">
                  View Profile
                </button>
              </div>
            </motion.div>
          ))}
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
              Ready to Perform?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our community of talented artists and start performing at the world's most luxurious hotels.
            </p>
            <a href="/register" className="btn-primary text-lg px-8 py-4">
              Join as Artist
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default TopArtistsPage
