import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building, Star, MapPin, Users, Calendar, Award } from 'lucide-react'
import Footer from '../components/Footer'
import SimpleNavbar from '@/components/SimpleNavbar'
import { commonApi } from '@/utils/api'

const PartnersPage: React.FC = () => {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // The two useTransform values that used to sit here interpolated between
  // identical endpoints - 'rgba(11, 31, 63, 0.1)' to itself, and 'white' to
  // itself - so they were a scroll subscription that recomputed a constant on
  // every frame. They fed only the inline navigation bar, which is gone.

  // Fetch hotels from database
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const res = await commonApi.getTopHotels()
        
        console.log('Hotels API Response:', res.data)
        
        // The API returns { success: true, data: [...] }
        let hotels: any[] = []
        if (res.data?.success && res.data.data) {
          hotels = Array.isArray(res.data.data) ? res.data.data : []
        } else if (Array.isArray(res.data)) {
          hotels = res.data
        } else if (Array.isArray(res.data?.data)) {
          hotels = res.data.data
        }
        
        console.log('Parsed hotels:', hotels.length)
        
        if (hotels.length > 0) {
          const formattedPartners = hotels.map((hotel: any) => {
            // Location is already parsed by backend
            const location = hotel.location || {}
            const images = hotel.images || []
            
            // Parse performance spots
            let performanceSpots: any[] = []
            if (hotel.performanceSpots) {
              try {
                performanceSpots = Array.isArray(hotel.performanceSpots) 
                  ? hotel.performanceSpots 
                  : (typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : [])
              } catch {
                performanceSpots = []
              }
            }
            
            const locationStr = location.city 
              ? `${location.city}, ${location.country || ''}`.trim()
              : (location.country || hotel.user?.country || 'Unknown')
            
            return {
              id: hotel.id,
              name: hotel.name,
              location: locationStr,
              category: 'Luxury Hotel',
              rating: hotel.averageRating || 4.5,
              bookings: hotel.bookingCount || 0,
              image: images && images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=70',
              description: hotel.description || 'Luxury hotel offering exceptional artistic experiences.',
              specialties: performanceSpots.slice(0, 3).map((spot: any) => spot.name || spot),
              performanceSpots: performanceSpots.map((spot: any) => spot.name || spot)
            }
          })
          
          setPartners(formattedPartners)
        }
      } catch (error) {
        console.error('Failed to fetch hotels:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHotels()
  }, [])

  const [stats, setStats] = useState({
    partnerHotels: 0,
    performanceVenues: 0,
    successfulEvents: 0,
    averageRating: 0
  })
  const [testimonials, setTestimonials] = useState<any[]>([])

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await commonApi.getStats()
        if (statsRes.data?.success) {
          const statsData = statsRes.data.data
          setStats({
            partnerHotels: statsData.totalHotels || 0,
            performanceVenues: statsData.totalVenues || 0,
            successfulEvents: statsData.completedBookings || statsData.totalBookings || 0,
            averageRating: statsData.averageRating || 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    
    fetchStats()
  }, [])

  // Fetch testimonials from ratings/reviews
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const testimonialsRes = await commonApi.getTestimonials({ limit: 6 })
        if (testimonialsRes.data?.success) {
          setTestimonials(testimonialsRes.data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error)
        setTestimonials([])
      }
    }
    
    fetchTestimonials()
  }, [])

  const benefits = [
    {
      icon: <Building className="w-8 h-8 text-gold" />,
      title: 'Accès exclusif',
      description: 'Partner with the world\'s most prestigious hotels and luxury venues'
    },
    {
      icon: <Star className="w-8 h-8 text-gold" />,
      title: 'Une exigence de qualité',
      description: 'Travaillez avec des artistes vérifiés dont la prestation est à la hauteur du lieu'
    },
    {
      icon: <Users className="w-8 h-8 text-gold" />,
      title: 'Un accompagnement dédié',
      description: 'Un interlocuteur attitré et une assistance disponible à tout moment'
    },
    {
      icon: <Award className="w-8 h-8 text-gold" />,
      title: 'Le rayonnement de votre maison',
      description: 'Enhance your hotel\'s reputation with curated artistic experiences'
    }
  ]

  const statsData = [
    { label: 'Hôtels partenaires', value: stats.partnerHotels.toString(), icon: Building },
    { label: 'Lieux de représentation', value: stats.performanceVenues.toString(), icon: MapPin },
    { label: 'Événements réussis', value: stats.successfulEvents.toString(), icon: Calendar },
    { label: 'Note moyenne', value: stats.averageRating.toFixed(1), icon: Star }
  ]

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* This page carried its own navigation bar: a fourth implementation
          beside Header, SimpleNavbar and the one the landing page used to
          have. It had a different link list from all of them, a 150px logo
          forced inside a 55px bar, hardcoded `padding: 10px 80px` that pushed
          content off-screen on a phone, and `hidden md:flex` with no fallback,
          so mobile visitors got no navigation at all. */}
      <SimpleNavbar overMedia />

      <header className="relative min-h-[62vh] flex items-end pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img decoding="async"
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=70"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* A gradient scrim rather than a flat 70% wash: a flat wash greys the
              whole photograph in order to lift type that only sits in its
              lower third. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-navy/25"></div>
        </div>

        <div className="shell relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow text-white/80">Nos partenaires</p>
            <h1 className="mt-5 max-w-[14ch] text-white">
              Nos hôtels
              <span className="block text-gold">partenaires</span>
            </h1>
            <p className="mt-7 text-lg text-white/80 max-w-[54ch] leading-relaxed">
              Découvrez les hôtels les plus prestigieux, leurs toits-terrasses et leurs espaces intimistes, pour des rencontres artistiques inoubliables.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bg-[var(--surface-warm)] py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {statsData.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-content" />
                  </div>
                  <h3 className="text-3xl font-bold text-content mb-2">{stat.value}</h3>
                  <p className="text-content-secondary">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
            Partenaires à l’honneur
          </h2>
          <p className="text-xl text-content-secondary max-w-3xl mx-auto">
            Les plus belles adresses du monde, leurs toits-terrasses et leurs scènes intimistes
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-control h-12 w-12 border-b-2 border-gold mb-4"></div>
            <p className="text-content-secondary text-lg">Chargement des partenaires…</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-content-secondary text-lg mb-4">Aucun hôtel partenaire pour le moment.</p>
            <p className="text-content-secondary">Revenez bientôt pour découvrir nos hôtels partenaires.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id || partner.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury overflow-hidden"
            >
              <div className="relative">
                <img decoding="async" loading="lazy"
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/600x400/0B1F3F/C9A63C?text=' + encodeURIComponent(partner.name)
                  }}
                />
                <div className="absolute top-4 right-4 bg-surface-raised/90 backdrop-blur-sm px-3 py-1 rounded-control text-sm font-semibold text-content flex items-center space-x-1">
                  <span className="text-gold font-bold">◆</span>
                  <span>{partner.rating}</span>
                </div>
                <div className="absolute bottom-4 left-4 bg-navy text-white px-3 py-1 rounded-control text-sm font-medium">
                  {partner.category}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-serif font-semibold text-content mb-2">
                  {partner.name}
                </h3>
                <p className="text-content-secondary text-sm mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {partner.location}
                </p>
                
                <p className="text-content-secondary text-sm mb-4">
                  {partner.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-content mb-2">Spécialités :</h4>
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-control"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-content mb-2">Espaces de représentation :</h4>
                  <div className="flex flex-wrap gap-2">
                    {partner.performanceSpots.map((spot, spotIndex) => (
                      <span
                        key={spotIndex}
                        className="px-2 py-1 bg-[var(--surface-warm)] text-content-secondary text-xs rounded-control"
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-content-secondary mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {partner.bookings} bookings
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {partner.rating} rating
                  </span>
                </div>

                <button 
                  onClick={() => navigate(`/hotel/${partner.id}`)}
                  className="w-full btn-primary"
                >
                  Voir les espaces
                </button>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="bg-[var(--surface-warm)] py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
              Les avantages du partenariat
            </h2>
            <p className="text-xl text-content-secondary max-w-3xl mx-auto">
              Pourquoi les hôtels d’exception choisissent Travel Art
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-serif font-semibold text-content mb-4">
                  {benefit.title}
                </h3>
                <p className="text-content-secondary">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-6 py-20 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
            La parole à nos partenaires
          </h2>
        </div>

        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-secondary text-lg">Aucun témoignage pour le moment.</p>
            <p className="text-content-secondary text-sm mt-2">Les témoignages apparaîtront ici à mesure que les hôtels partagent leur expérience.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
          <motion.div
                key={testimonial.id || index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
            className="card-luxury"
          >
            <div className="flex items-center mb-4">
              <div className="flex text-gold">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-content-secondary mb-4">
                  &laquo;&nbsp;{testimonial.comment}&nbsp;&raquo;
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gold/15 rounded-control flex items-center justify-center mr-4">
                <Building className="w-6 h-6 text-content" />
              </div>
              <div>
                    <h4 className="font-semibold text-content">{testimonial.hotelName}</h4>
                    <p className="text-sm text-content-secondary">{testimonial.location}</p>
              </div>
            </div>
          </motion.div>
                ))}
              </div>
        )}
      </div>

      {/* .btn-primary is a navy fill and this band is navy, so the old button
          could only be read by its label. Gold is the fill on inverse. */}
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
              Rejoignez notre réseau d’hôtels d’exception et offrez à vos clients des moments artistiques dont ils se souviendront.
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

export default PartnersPage
