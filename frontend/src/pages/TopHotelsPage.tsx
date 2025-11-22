import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Building, Music, Users, Calendar, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { commonApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface TopHotel {
  id: string
  name: string
  location?: { city?: string; country?: string } | string
  bookingCount?: number
  images?: string[]
  description?: string
  performanceSpots?: string
  user?: {
    name: string
    country?: string
  }
}

const TopHotelsPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topHotels, setTopHotels] = useState<TopHotel[]>([])
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalVenues: 0,
    averageRating: 4.8,
    totalEvents: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [hotelsResponse, statsResponse] = await Promise.all([
          commonApi.getTopHotels(),
          commonApi.getStats()
        ])

        if (hotelsResponse.data.success) {
          setTopHotels(hotelsResponse.data.data || [])
        }

        if (statsResponse.data.success) {
          const statsData = statsResponse.data.data
          setStats({
            totalHotels: statsData.totalHotels || 0,
            totalVenues: (statsData.totalHotels || 0) * 3, // Estimate
            averageRating: 4.8,
            totalEvents: statsData.totalBookings || 0
          })
        }
      } catch (err: any) {
        console.error('Error fetching top hotels:', err)
        setError(err.response?.data?.error?.message || 'Failed to load hotels')
        toast.error('Failed to load top hotels. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatLocation = (location?: { city?: string; country?: string } | string): string => {
    if (!location) return 'Location TBA'
    if (typeof location === 'string') {
      try {
        const parsed = JSON.parse(location)
        const parts = [parsed.city, parsed.country].filter(Boolean)
        return parts.length ? parts.join(', ') : 'Location TBA'
      } catch {
        return location
      }
    }
    const parts = [location.city, location.country].filter(Boolean)
    return parts.length ? parts.join(', ') : 'Location TBA'
  }

  const getImageUrl = (images?: string[]): string => {
    if (images && images.length > 0 && images[0]) {
      return images[0]
    }
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop'
  }

  const parsePerformanceSpots = (spots?: string): string[] => {
    if (!spots) return []
    try {
      const parsed = typeof spots === 'string' ? JSON.parse(spots) : spots
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

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
              <h3 className="text-3xl font-bold text-navy mb-2">{stats.totalHotels || 0}</h3>
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
              <h3 className="text-3xl font-bold text-navy mb-2">{stats.totalVenues || 0}</h3>
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
              <h3 className="text-3xl font-bold text-navy mb-2">{stats.averageRating.toFixed(1)}</h3>
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
              <h3 className="text-3xl font-bold text-navy mb-2">{stats.totalEvents || 0}</h3>
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

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-navy mb-2">Failed to Load Hotels</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : topHotels.length === 0 ? (
          <div className="text-center py-20">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-navy mb-2">No Hotels Found</h3>
            <p className="text-gray-600 mb-6">
              Check back soon to discover our luxury hotel partners.
            </p>
            <Link to="/register" className="btn-primary">
              Become a Hotel Partner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topHotels.map((hotel, index) => {
              const performanceSpots = parsePerformanceSpots(hotel.performanceSpots)
              const bookings = hotel.bookingCount || 0
              const location = formatLocation(hotel.location)
              
              return (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card-luxury overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(hotel.images)}
                      alt={hotel.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/600x400/0B1F3F/C9A63C?text=' + encodeURIComponent(hotel.name.substring(0, 2).toUpperCase())
                      }}
                    />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                      {hotel.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {location}
                    </p>
                    
                    {hotel.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {hotel.description}
                      </p>
                    )}

                    {performanceSpots.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-navy mb-2">Performance Spots:</h4>
                        <div className="flex flex-wrap gap-2">
                          {performanceSpots.slice(0, 3).map((spot, spotIndex) => (
                            <span
                              key={spotIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {spot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {bookings} {bookings === 1 ? 'booking' : 'bookings'}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {stats.averageRating.toFixed(1)} rating
                      </span>
                    </div>

                    <Link 
                      to={`/hotel/${hotel.id}`}
                      className="w-full btn-primary text-center block"
                    >
                      View Venues
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
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
