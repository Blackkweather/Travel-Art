import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Star, MapPin, Calendar, Music, Users, Building, Clock, Phone, Mail, Globe, ArrowLeft, MessageCircle, Heart } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import ScrollAnimationWrapper from '../components/ScrollAnimationWrapper'
import { hotelsApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [hotel, setHotel] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (id) {
      fetchHotelDetails(id)
    }
  }, [id])

  const fetchHotelDetails = async (hotelId: string) => {
    try {
      setLoading(true)
      const response = await hotelsApi.getById(hotelId)
      setHotel(response.data?.data)
    } catch (error: any) {
      console.error('Error fetching hotel details:', error)
      if (error.response?.status === 404) {
        toast.error('Hotel not found')
      } else {
        toast.error('Failed to load hotel details')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotel details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-cream">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-navy mb-4">Hotel Not Found</h1>
          <p className="text-gray-600 mb-8">The hotel you're looking for doesn't exist.</p>
          <Link to="/top-hotels" className="btn-primary">
            Back to Hotels
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Parse location, images, performance spots (handle both array/object and JSON string)
  let location: any = {}
  let images: string[] = []
  let performanceSpots: any[] = []
  
  if (hotel.location) {
    try {
      location = typeof hotel.location === 'string' 
        ? JSON.parse(hotel.location) 
        : hotel.location
    } catch (e) {
      location = {}
    }
  }
  
  if (hotel.images) {
    try {
      images = Array.isArray(hotel.images) 
        ? hotel.images 
        : (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : [])
    } catch (e) {
      images = []
    }
  }
  
  if (hotel.performanceSpots) {
    try {
      performanceSpots = Array.isArray(hotel.performanceSpots) 
        ? hotel.performanceSpots 
        : (typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : [])
    } catch (e) {
      performanceSpots = []
    }
  }
  const locationString = location.city && location.country 
    ? `${location.city}, ${location.country}`
    : location.country || hotel.user?.country || 'Location not specified'

  // Calculate rating (if available from bookings/ratings)
  const rating = hotel.rating || 0

  return (
    <div className="min-h-screen bg-cream">
      <SimpleNavbar />
      
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={images[0] || '/placeholder-hotel.jpg'}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg'
          }}
        />
        <div className="absolute inset-0 bg-navy/60"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              {hotel.name}
            </h1>
            <p className="text-xl flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              {locationString}
            </p>
          </motion.div>
        </div>
        <Link
          to="/top-hotels"
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotels
        </Link>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <ScrollAnimationWrapper animation="fade-up">
              <div className="card-luxury mb-8">
              <h2 className="text-3xl font-serif font-bold text-navy mb-4 gold-underline">
                About {hotel.name}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {hotel.description || 'No description available.'}
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                {rating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="text-xl font-bold text-navy">{rating.toFixed(1)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-xl font-bold text-navy">{hotel.totalBookings || 0}</p>
                  </div>
                </div>
              </div>

              {/* Performance Spots */}
              {performanceSpots.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-serif font-semibold text-navy mb-3">Performance Spots</h3>
                  <div className="flex flex-wrap gap-2">
                    {performanceSpots.map((spot: any, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium"
                      >
                        {typeof spot === 'string' ? spot : spot.name || spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </ScrollAnimationWrapper>

            {/* Performance Activities Section */}
            {performanceSpots.length > 0 && (
              <ScrollAnimationWrapper animation="fade-up" delay={0.1}>
                <div className="card-luxury">
                <h2 className="text-3xl font-serif font-bold text-navy mb-6 gold-underline">
                  Performance Venues
                </h2>
                <div className="space-y-6">
                  {performanceSpots.map((spot: any, index: number) => {
                    const spotData = typeof spot === 'string' ? { name: spot } : spot
                    return (
                      <div
                        key={index}
                        className="border-l-4 border-gold pl-6 py-4 bg-gold/5 rounded-r-lg"
                      >
                        <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                          {spotData.name || spotData.title || 'Performance Venue'}
                        </h3>
                        {spotData.description && (
                          <p className="text-gray-600 mb-4">{spotData.description}</p>
                        )}
                        {(spotData.time || spotData.capacity) && (
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            {spotData.time && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {spotData.time}
                              </div>
                            )}
                            {spotData.capacity && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Capacity: {spotData.capacity}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              </ScrollAnimationWrapper>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ScrollAnimationWrapper animation="slide-left" delay={0.2}>
              <div className="card-luxury sticky top-6">
              <h3 className="text-2xl font-serif font-bold text-navy mb-6">Contact Information</h3>
              
              <div className="space-y-4 mb-6">
                {locationString && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                    <p className="text-gray-600">{locationString}</p>
                  </div>
                )}
                {hotel.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                    <a href={`tel:${hotel.contactPhone}`} className="text-gray-600 hover:text-gold">
                      {hotel.contactPhone}
                    </a>
                  </div>
                )}
                {hotel.user?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                    <a href={`mailto:${hotel.user.email}`} className="text-gray-600 hover:text-gold">
                      {hotel.user.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Performance Spots Summary */}
              {performanceSpots.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-serif font-semibold text-navy mb-4">Available Venues</h4>
                  <div className="flex flex-wrap gap-2">
                    {performanceSpots.map((spot: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {typeof spot === 'string' ? spot : spot.name || spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons for Artists */}
              {user && user.role === 'ARTIST' && (
                <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                  <button
                    onClick={() => {
                      toast.success('Contact request sent to hotel!')
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact Hotel
                  </button>
                  <button
                    onClick={() => {
                      setIsFavorite(!isFavorite)
                      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites!')
                    }}
                    className={`w-full btn-secondary flex items-center justify-center gap-2 ${
                      isFavorite ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100' : ''
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Saved' : 'Save to Favorites'}
                  </button>
                </div>
              )}
            </div>
            </ScrollAnimationWrapper>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default HotelDetailsPage
