import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { artistsApi } from '@/utils/api'
import toast from 'react-hot-toast'

const PublicArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchArtistProfile(id)
    }
  }, [id])

  const fetchArtistProfile = async (artistId: string) => {
    try {
      setLoading(true)
      const response = await artistsApi.getById(artistId)
      setArtist(response.data?.data)
    } catch (error: any) {
      console.error('Error fetching artist profile:', error)
      if (error.response?.status === 404) {
        toast.error('Artist profile not found')
      } else {
        toast.error('Failed to load artist profile')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading artist profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">Artist Not Found</h2>
            <p className="text-gray-600 mb-6">The artist profile you're looking for doesn't exist.</p>
            <Link to="/top-artists" className="btn-primary">
              Browse Artists
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Parse images and videos
  const images = artist.images || []
  const videos = artist.videos || []

  return (
    <div className="min-h-screen bg-cream" data-testid="artist-profile">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          to="/top-artists" 
          className="inline-flex items-center text-navy hover:text-gold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Artists
        </Link>

        {/* Artist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-luxury mb-8"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src={images[0] || '/placeholder-artist.jpg'}
                alt={artist.user?.name || 'Artist'}
                className="w-48 h-48 rounded-xl object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-artist.jpg'
                }}
              />
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
                {artist.user?.name || 'Artist'}
              </h1>
              <p className="text-xl text-gold font-medium mb-4">{artist.discipline || 'Artist'}</p>
              
              {artist.user?.country && (
                <p className="text-gray-600 flex items-center mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  {artist.user.country}
                </p>
              )}

              {artist.bio && (
                <p className="text-gray-600 leading-relaxed mb-6">{artist.bio}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-gold mr-1" />
                    <span className="text-lg font-bold text-navy">
                      {artist.avgRating ? artist.avgRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-gold mr-1" />
                    <span className="text-lg font-bold text-navy">{artist.bookings?.length || 0}</span>
                  </div>
                  <p className="text-sm text-gray-600">Bookings</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Music className="w-5 h-5 text-gold mr-1" />
                    <span className="text-lg font-bold text-navy">
                      {artist.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Images */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury mb-8"
          >
            <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
              Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {images.map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-artist.jpg'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Price Range */}
        {artist.priceRange && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury mb-8"
          >
            <h2 className="text-xl font-serif font-semibold text-navy mb-4 gold-underline">
              Pricing
            </h2>
            <p className="text-2xl font-bold text-gold">{artist.priceRange}</p>
          </motion.div>
        )}

        {/* Rating Badge */}
        {artist.ratingBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-luxury mb-8 bg-gold/10 border-2 border-gold"
          >
            <div className="text-center">
              <p className="text-lg font-serif font-semibold text-navy">
                {artist.ratingBadge}
              </p>
            </div>
          </motion.div>
        )}

        {/* Availability */}
        {artist.availability && artist.availability.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-luxury"
          >
            <h2 className="text-xl font-serif font-semibold text-navy mb-4 gold-underline">
              Availability
            </h2>
            <div className="space-y-2">
              {artist.availability.map((avail: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {new Date(avail.dateFrom).toLocaleDateString()} - {new Date(avail.dateTo).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}

export default PublicArtistProfile


