import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Star, MapPin, Calendar, Users } from 'lucide-react'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'

const TopArtistsPage: React.FC = () => {
  const { scrollY } = useScroll()
  
  // Scroll-based animations for header
  const headerBackground = useTransform(scrollY, [0, 100], ['rgba(11, 31, 63, 0.1)', 'rgba(11, 31, 63, 0.1)'])
  const textColor = useTransform(scrollY, [0, 100], ['white', 'white'])
  const topArtists = [
    {
      id: '1',
      name: 'Sophie Laurent',
      discipline: 'Classical Pianist',
      location: 'Paris, France',
      rating: 4.9,
      bookings: 24,
      specialties: ['Rooftop Piano', 'Intimate Concerts', 'Classical Music'],
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Traditional fado singer bringing Portuguese soul to luxury hotel terraces and intimate venues.',
      recentVenues: ['Palácio Belmonte', 'Hotel Negresco', 'Hotel Plaza Athénée']
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10"
        style={{
          background: headerBackground,
          padding: '10px 80px',
          height: '55px',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity -ml-4">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              style={{
                height: '150px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div style={{ color: textColor }}>
              <Link to="/how-it-works" className="hover:text-gold transition-colors font-medium text-sm">
                How it Works
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/partners" className="hover:text-gold transition-colors font-medium text-sm">
                Partners
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/pricing" className="hover:text-gold transition-colors font-medium text-sm">
                Pricing
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-artists" className="hover:text-gold transition-colors font-medium text-sm">
                Top Artists
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-hotels" className="hover:text-gold transition-colors font-medium text-sm">
                Top Hotels
              </Link>
            </motion.div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.div style={{ color: textColor }}>
              <Link to="/login" className="hover:text-gold transition-colors font-medium text-sm px-4 py-2">
                Sign In
              </Link>
            </motion.div>
            <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-sm shadow-lg">
              Join
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Artist performance" 
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
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x400/0B1F3F/C9A63C?text=' + encodeURIComponent(artist.name)
                  }}
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
      
      <Footer />
    </div>
  )
}

export default TopArtistsPage
