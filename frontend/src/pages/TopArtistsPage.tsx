import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Users, AlertCircle } from 'lucide-react'
import Footer from '../components/Footer'
import SimpleNavbar from '@/components/SimpleNavbar'
import { ArtistRank, getQuickRank, RANK_CONFIG } from '@/components/ArtistRank'
import { commonApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface TopArtist {
  id: string
  discipline?: string
  images?: string[]
  bookingCount?: number
  ratingBadge?: string | null
  user: {
    name: string
    country?: string
  }
}

const TopArtistsPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [stats, setStats] = useState({
    totalArtists: 0,
    averageRating: 4.8,
    totalBookings: 0,
    totalHotels: 0
  })
  
  // Scroll-based animations for header

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [artistsResponse, statsResponse] = await Promise.all([
          commonApi.getTopArtists(),
          commonApi.getStats()
        ])

        if (artistsResponse.data.success) {
          setTopArtists(artistsResponse.data.data || [])
        }

        if (statsResponse.data.success) {
          const statsData = statsResponse.data.data
          setStats({
            totalArtists: statsData.totalArtists || 0,
            averageRating: 4.8, // Calculate from ratings if available
            totalBookings: statsData.totalBookings || 0,
            totalHotels: statsData.totalHotels || 0
          })
        }
      } catch (err: any) {
        console.error('Error fetching top artists:', err)
        setError(err.response?.data?.error?.message || 'Failed to load artists')
        toast.error('Failed to load top artists. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatLocation = (country?: string): string => {
    if (!country) return 'Location TBA'
    return country
  }

  const getImageUrl = (images?: string[]): string => {
    if (images && images.length > 0 && images[0]) {
      return images[0]
    }
    // Return SVG placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E'
  }


  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />

      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-navy via-navy/90 to-gold/20">
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
            <p className="text-xl text-white/65 mb-8 max-w-3xl mx-auto">
              Discover the world's most talented artists who create magical moments on hotel rooftops and luxury venues.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#0C1526] py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.totalArtists || 0}</h3>
              <p className="text-white/60">Verified Artists</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.averageRating.toFixed(1)}</h3>
              <p className="text-white/60">Average Rating</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.totalBookings || 0}</h3>
              <p className="text-white/60">Successful Bookings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.totalHotels || 0}</h3>
              <p className="text-white/60">Luxury Hotels</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-white mb-6 gold-underline">
            Featured Artists
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Meet our top-performing artists who specialize in creating unforgettable rooftop experiences
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Failed to Load Artists</h3>
            <p className="text-white/60 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : topArtists.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Artists Found</h3>
            <p className="text-white/60 mb-6">
              Check back soon to discover our top-performing artists.
            </p>
            <Link to="/register" className="btn-primary">
              Become an Artist
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="artists-grid">
            {topArtists.map((artist, index) => {
              const rating = artist.ratingBadge ? 
                (artist.ratingBadge.includes('Top 10%') ? 4.9 : 
                 artist.ratingBadge.includes('Excellent') ? 4.5 : 4.0) : 4.0
              const bookings = artist.bookingCount || 0
              
              return (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  // flex column so the body below can fill the grid row and pin
                  // its button to the bottom. Only artists with a ratingBadge
                  // render the badge line, so without this the "View Profile"
                  // buttons sat at different heights across one row.
                  className="card-luxury overflow-hidden flex flex-col h-full"
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(artist.images)}
                      alt={artist.user.name}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E'
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-[var(--surface-raised)]/90 backdrop-blur-sm px-3 py-2 rounded-control flex items-center space-x-2">
                      <ArtistRank tier={getQuickRank(rating, bookings)} size="sm" />
                      <span className="text-sm font-semibold text-white">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-serif font-semibold text-white">
                        {artist.user.name}
                      </h3>
                      {artist.ratingBadge && (
                        <ArtistRank 
                          tier={getQuickRank(rating, bookings)} 
                          size="md"
                          showLabel={false}
                        />
                      )}
                    </div>
                    {artist.discipline && (
                      <p className="text-gold font-medium mb-1">{artist.discipline}</p>
                    )}
                    {artist.ratingBadge && (
                      <p className="text-xs text-white/45 mb-3">
                        {artist.ratingBadge}
                      </p>
                    )}
                    <p className="text-white/60 text-sm mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {formatLocation(artist.user.country)}
                    </p>

                    <div className="flex items-center justify-between text-sm text-white/45 mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {bookings} {bookings === 1 ? 'booking' : 'bookings'}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {rating.toFixed(1)} rating
                      </span>
                    </div>

                    <Link
                      to={`/artist/${artist.id}`}
                      className="w-full btn-primary block text-center mt-auto"
                    >
                      View Profile
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
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
            <p className="text-xl text-white/65 mb-8 max-w-2xl mx-auto">
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
