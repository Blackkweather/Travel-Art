import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Users, Clock, Phone, Mail, ArrowLeft } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import ScrollAnimationWrapper from '../components/ScrollAnimationWrapper'
import HotelContactButtons from '../components/HotelContactButtons'
import { hotelsApi, bookingsApi, artistsApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [hotel, setHotel] = useState<any>(null)
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false)

  useEffect(() => {
    if (id) {
      fetchHotelDetails(id)
    }
  }, [id])

  // Check for confirmed booking between artist and hotel
  useEffect(() => {
    const checkConfirmedBooking = async () => {
      if (!user || user.role !== 'ARTIST' || !hotel?.id) {
        setHasConfirmedBooking(false)
        return
      }

      try {
        // Get artist profile to get artist ID
        const artistRes = await artistsApi.getMyProfile()
        const artist = artistRes.data?.data
        if (!artist?.id) {
          setHasConfirmedBooking(false)
          return
        }

        // Check for confirmed bookings between this artist and hotel
        const bookingsRes = await bookingsApi.list({ 
          status: 'CONFIRMED'
        })
        
        const bookingsData = bookingsRes.data?.data
        const bookings = Array.isArray(bookingsData) 
          ? bookingsData 
          : (bookingsData?.bookings || [])
        
        // Check if there's at least one confirmed booking between this artist and hotel
        const hasConfirmed = bookings.some((booking: any) => 
          booking.status === 'CONFIRMED' && 
          booking.hotelId === hotel.id &&
          booking.artistId === artist.id
        )
        
        setHasConfirmedBooking(hasConfirmed)
      } catch (error) {
        console.error('Error checking confirmed booking:', error)
        setHasConfirmedBooking(false)
      }
    }

    if (hotel && user) {
      checkConfirmedBooking()
    }
  }, [hotel, user])

  const fetchHotelDetails = async (hotelId: string) => {
    try {
      setLoading(true)
      const response = await hotelsApi.getById(hotelId)
      setHotel(response.data?.data)
    } catch (error: any) {
      console.error('Error fetching hotel details:', error)
      if (error.response?.status === 404) {
        toast.error(t('Hôtel introuvable'))
      } else {
        toast.error(t('Impossible de charger la fiche hôtel'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-control h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-content-secondary">{t('Chargement de la fiche hôtel…')}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-content mb-4">{t('Hôtel introuvable')}</h1>
          <p className="text-content-secondary mb-8">{t('L’hôtel demandé n’existe pas.')}</p>
          <Link to="/top-hotels" className="btn-primary">
            {t('Retour aux hôtels')}
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
    } catch {
      location = {}
    }
  }
  
  if (hotel.images) {
    try {
      images = Array.isArray(hotel.images) 
        ? hotel.images 
        : (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : [])
    } catch {
      images = []
    }
  }
  
  if (hotel.performanceSpots) {
    try {
      performanceSpots = Array.isArray(hotel.performanceSpots) 
        ? hotel.performanceSpots 
        : (typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : [])
    } catch {
      performanceSpots = []
    }
  }
  const locationString = location.city && location.country 
    ? `${location.city}, ${location.country}`
    : location.country || hotel.user?.country || 'Location not specified'

  // Calculate rating (if available from bookings/ratings)
  const rating = hotel.rating || 0

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={hotel ? `${hotel.name} — Travel Art` : t('Hôtel — Travel Art')}
        description={
          hotel
            ? `${hotel.name} accueille des artistes en résidence. ${(hotel.description ?? '').slice(0, 120)}`
            : t('Un hôtel d’exception qui accueille des artistes en résidence.')
        }
      />
      <SimpleNavbar overMedia />

      {/* The hotel's own photograph is the hero, so the type on it stays white
          regardless of the page theme. The back link sat at top-6, directly
          under the fixed 72px navigation bar; it is now clear of it. */}
      <header className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <img loading="lazy" decoding="async"
          src={images[0] || '/placeholder-hotel.jpg'}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-hotel.jpg'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/40 to-navy/30"></div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="shell pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-white max-w-[18ch]">
                {hotel.name}
              </h1>
              <p className="mt-4 text-lg text-white/85 flex items-center gap-2">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                {locationString}
              </p>
            </motion.div>
          </div>
        </div>

        <Link
          to="/top-hotels"
          className="absolute top-[88px] left-5 sm:left-8 lg:left-12 bg-black/35 backdrop-blur-sm text-white px-4 py-2.5 rounded-control hover:bg-black/55 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('Retour aux hôtels')}
        </Link>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <ScrollAnimationWrapper animation="fade-up">
              <div className="panel p-6 mb-8">
              <h2 className="text-3xl font-serif font-bold text-content mb-4 gold-underline">
                About {hotel.name}
              </h2>
              <p className="text-content-secondary text-lg leading-relaxed mb-6">
                {hotel.description || 'No description available.'}
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                {rating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center">
                      <Star className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-content-secondary">{t('Note')}</p>
                      <p className="text-xl font-bold text-content">{rating.toFixed(1)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary">{t('Réservations')}</p>
                    <p className="text-xl font-bold text-content">{hotel.totalBookings || 0}</p>
                  </div>
                </div>
              </div>

              {/* Performance Spots */}
              {performanceSpots.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-serif font-semibold text-content mb-3">{t('Espaces de représentation')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {performanceSpots.map((spot: any, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gold/20 text-gold rounded-control text-sm font-medium"
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
                <div className="panel p-6">
                <h2 className="text-3xl font-serif font-bold text-content mb-6 gold-underline">
                  {t('Lieux de représentation')}
                </h2>
                <div className="space-y-6">
                  {performanceSpots.map((spot: any, index: number) => {
                    const spotData = typeof spot === 'string' ? { name: spot } : spot
                    return (
                      <div
                        key={index}
                        className="border-l-4 border-gold pl-6 py-4 bg-gold/5 rounded-r-card"
                      >
                        <h3 className="text-xl font-serif font-semibold text-content mb-2">
                          {spotData.name || spotData.title || 'Performance Venue'}
                        </h3>
                        {spotData.description && (
                          <p className="text-content-secondary mb-4">{spotData.description}</p>
                        )}
                        {(spotData.time || spotData.capacity) && (
                          <div className="flex flex-wrap gap-4 text-sm text-content-secondary">
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
              <div className="panel p-6 sticky top-6">
              <h3 className="text-2xl font-serif font-bold text-content mb-6">{t('Coordonnées')}</h3>
              
              <div className="space-y-4 mb-6">
                {locationString && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                    <p className="text-content-secondary">{locationString}</p>
                  </div>
                )}
                {/* Only show phone/email if there's a confirmed booking */}
                {hasConfirmedBooking && hotel.contactPhone && !hotel.responsiblePhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                    <a href={`tel:${hotel.contactPhone}`} className="text-content-secondary hover:text-gold">
                      {hotel.contactPhone}
                    </a>
                  </div>
                )}
                {hasConfirmedBooking && hotel.user?.email && !hotel.responsibleEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                    <a href={`mailto:${hotel.user.email}`} className="text-content-secondary hover:text-gold">
                      {hotel.user.email}
                    </a>
                  </div>
                )}
                {!hasConfirmedBooking && user?.role === 'ARTIST' && (
                  <div className="text-sm text-content-secondary italic">
                    {t('Les coordonnées seront communiquées après confirmation de la réservation.')}
                  </div>
                )}
              </div>

              {/* Contact Hotel Buttons - Only show if confirmed booking */}
              {hasConfirmedBooking && (
                <div className="border-t border-line pt-6 mb-6">
                  <HotelContactButtons
                    phoneNumber={hotel.responsiblePhone || hotel.contactPhone}
                    email={hotel.responsibleEmail || hotel.user?.email}
                    responsibleName={hotel.responsibleName || hotel.repName}
                    hotelName={hotel.name}
                  />
                </div>
              )}

              {/* Performance Spots Summary */}
              {performanceSpots.length > 0 && (
                <div className="border-t border-line pt-6">
                  <h4 className="text-lg font-serif font-semibold text-content mb-4">{t('Espaces disponibles')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {performanceSpots.map((spot: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[var(--surface-warm)] text-content-secondary rounded-control text-sm"
                      >
                        {typeof spot === 'string' ? spot : spot.name || spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons for Artists */}
              {user && user.role === 'ARTIST' && (
                <div className="border-t border-line pt-6 mt-6 space-y-3">
                  {/* Only show contact button if there's a confirmed booking */}
                  {hasConfirmedBooking ? (
                    <a
                      href={`mailto:${hotel.responsibleEmail || hotel.user?.email || ''}?subject=${encodeURIComponent(`Demande de renseignements — ${hotel.name}`)}&body=${encodeURIComponent(hotel.responsibleName ? `Bonjour ${hotel.responsibleName},\n\nJe souhaiterais échanger au sujet d’une représentation au sein de ${hotel.name}.\n\nBien cordialement,` : `Madame, Monsieur,\n\nJe souhaiterais échanger au sujet d’une représentation au sein de ${hotel.name}.\n\nBien cordialement,`)}`}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      {t('Contacter l’hôtel')}
                    </a>
                  ) : (
                    <div className="w-full p-4 bg-[var(--surface-warm)] rounded-card border border-line text-center">
                      <p className="text-sm text-content-secondary">
                        {t('Les coordonnées seront communiquées après confirmation de la réservation.')}
                      </p>
                    </div>
                  )}
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
