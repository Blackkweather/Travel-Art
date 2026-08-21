import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MapPin, Building, Music, Users, Calendar, AlertCircle } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
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
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topHotels, setTopHotels] = useState<TopHotel[]>([])
  const [clickedHotelId, setClickedHotelId] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
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
            totalVenues: statsData.totalVenues || 0,
            averageRating: statsData.averageRating || 0,
            totalEvents: statsData.completedBookings || statsData.totalBookings || 0
          })
        }
      } catch (err: any) {
        console.error('Error fetching top hotels:', err)
        setError(err.response?.data?.error?.message || 'Failed to load hotels')
        toast.error('Impossible de charger les hôtels. Veuillez réessayer.')
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
    // Return SVG placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Crect x="150" y="80" width="100" height="140" rx="5"/%3E%3Crect x="170" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="170" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="175" y="190" width="50" height="30" rx="3"/%3E%3C/g%3E%3C/svg%3E'
  }

  const parsePerformanceSpots = (spots?: string): string[] => {
    if (!spots) return []
    try {
      const parsed = typeof spots === 'string' ? JSON.parse(spots) : spots
      if (!Array.isArray(parsed)) return []
      
      // Convert array items to strings - handle both string and object formats
      return parsed.map((spot: any) => {
        if (typeof spot === 'string') return spot
        if (typeof spot === 'object' && spot !== null) {
          // If it's an object, extract the name property or stringify it
          return spot.name || spot.title || JSON.stringify(spot)
        }
        return String(spot)
      })
    } catch {
      return []
    }
  }

  const handleHotelClick = (hotelId: string) => {
    // Trigger zoom animation
    setClickedHotelId(hotelId)
    setIsTransitioning(true)
    
    // Wait for animation, then navigate
    setTimeout(() => {
      navigate(`/hotel/${hotelId}`)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Loading Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <div className="w-24 h-24 border-4 border-gold border-t-transparent rounded-control animate-spin mx-auto mb-6"></div>
              <p className="text-gold text-xl font-serif">Chargement des hôtels…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
        <SimpleNavbar overMedia />
      
      {/* Hero Section */}
      <header className="relative min-h-[62vh] flex items-end pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=75"
            alt=""
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          {/* The scrim is a gradient rather than a flat 70% wash: a flat wash
              greys the whole photograph to lift type that only occupies the
              lower third of it. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-navy/25"></div>
        </div>

        <div className="shell relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow text-white/80">Le réseau</p>
            <h1 className="mt-5 max-w-[14ch] text-white">
              Des hôtels d’exception
              <span className="block text-gold">partenaires</span>
            </h1>
            <p className="mt-7 text-lg text-white/80 max-w-[52ch] leading-relaxed">
              Découvrez les hôtels les plus prestigieux, leurs toits-terrasses et leurs espaces intimistes.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bg-[var(--surface-warm)] py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalHotels || 0}</h3>
              <p className="text-content-secondary">Hôtels d’exception</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalVenues || 0}</h3>
              <p className="text-content-secondary">Lieux de représentation</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.averageRating.toFixed(1)}</h3>
              <p className="text-content-secondary">Note moyenne</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalEvents || 0}</h3>
              <p className="text-content-secondary">Événements réussis</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
            Hôtels à l’honneur
          </h2>
          <p className="text-xl text-content-secondary max-w-3xl mx-auto">
            Les plus belles adresses du monde, leurs toits-terrasses et leurs scènes intimistes
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-content mb-2">Impossible de charger les hôtels</h3>
            <p className="text-content-secondary mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Réessayer
            </button>
          </div>
        ) : topHotels.length === 0 ? (
          <div className="text-center py-20">
            <Building className="w-16 h-16 text-content-secondary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-content mb-2">Aucun hôtel trouvé</h3>
            <p className="text-content-secondary mb-6">
              Revenez bientôt pour découvrir nos hôtels partenaires.
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
                  animate={{ 
                    opacity: clickedHotelId === hotel.id ? 0 : 1, 
                    y: 0,
                    scale: clickedHotelId === hotel.id ? 1.1 : 1
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: clickedHotelId === hotel.id ? 0 : index * 0.1 
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.03,
                    transition: { duration: 0.3 }
                  }}
                  // flex column so the body can fill the grid row and pin its
                  // button to the bottom. Description and performance spots are
                  // both optional, so without this the "View Venues" buttons sat
                  // at different heights across one row.
                  className="card-luxury overflow-hidden cursor-pointer flex flex-col h-full"
                  onClick={() => handleHotelClick(hotel.id)}
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(hotel.images)}
                      alt={hotel.name}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/600x400/0B1F3F/C9A63C?text=' + encodeURIComponent(hotel.name.substring(0, 2).toUpperCase())
                      }}
                    />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-serif font-semibold text-content mb-2">
                      {hotel.name}
                    </h3>
                    <p className="text-content-secondary text-sm mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {location}
                    </p>
                    
                    {hotel.description && (
                      <p className="text-content-secondary text-sm mb-4">
                        {hotel.description}
                      </p>
                    )}

                    {performanceSpots.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-content mb-2">Espaces de représentation :</h4>
                        <div className="flex flex-wrap gap-2">
                          {performanceSpots.slice(0, 3).map((spot, spotIndex) => (
                            <span
                              key={spotIndex}
                              className="px-2 py-1 bg-[var(--surface-warm)] text-content-secondary text-xs rounded-control"
                            >
                              {spot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-content-secondary mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {bookings} {bookings === 1 ? 'booking' : 'bookings'}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {stats.averageRating.toFixed(1)} rating
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHotelClick(hotel.id)
                      }}
                      className="w-full btn-primary text-center hover:scale-105 transition-transform mt-auto"
                    >
                      Voir les espaces
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Venue Types Section */}
      <div className="bg-[var(--surface-warm)] py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
              Types de lieux
            </h2>
            <p className="text-xl text-content-secondary max-w-3xl mx-auto">
              Du toit-terrasse intimiste à la grande salle de bal, nos hôtels offrent des scènes très différentes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-content" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-content mb-4">
                Toits-terrasses
              </h3>
              <p className="text-content-secondary">
                Des espaces en plein air face à la ville, parfaits pour l’acoustique et les sets au coucher du soleil.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-content" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-content mb-4">
                Salons jazz
              </h3>
              <p className="text-content-secondary">
                Des salles intérieures à l’acoustique soignée, pour les formations jazz et les concerts intimistes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-content" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-content mb-4">
                Salles de bal
              </h3>
              <p className="text-content-secondary">
                De grands volumes élégants, pour les concerts classiques et les événements d’exception.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-content" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-content mb-4">
                Clubs de plage
              </h3>
              <p className="text-content-secondary">
                Des lieux en bord de mer, pour les DJ sets, les musiques électroniques et les fins de journée.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* .btn-primary is a navy fill and this band is navy, so the old button
          was visible only as a floating label. Gold is the fill on inverse. */}
      <section className="band-inverse">
        <div className="shell text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mx-auto max-w-[18ch]">
              Envie de devenir partenaire ?
            </h2>
            <p className="mt-7 text-lg text-content-inverse/70 mb-10 max-w-[52ch] mx-auto leading-relaxed">
              Rejoignez notre réseau d’hôtels d’exception et offrez à vos clients des moments artistiques mémorables.
            </p>
            <Link to="/register?role=hotel" className="btn-gold btn-lg btn-arrow">
              Devenir hôtel partenaire
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}

export default TopHotelsPage
