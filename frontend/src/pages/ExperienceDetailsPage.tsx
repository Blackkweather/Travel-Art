import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, Users, Globe, Clock, ArrowLeft, Award, Camera } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import { tripsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'

const ExperienceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch experience from API
  useEffect(() => {
    const fetchExperience = async () => {
      if (!id) {
        setError('Identifiant d’expérience manquant')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await tripsApi.getById(id)
        
        // The trips API returns data directly (not wrapped in success/data)
        // axios response structure: res.data is the actual response body
        // Backend returns: { id, title, slug, description, location, images, status }
        let trip: any = res.data
        
        // Handle case where backend might wrap it (though trips API doesn't)
        if (trip && typeof trip === 'object' && 'data' in trip && trip.data) {
          trip = trip.data
        }
        
        // Also handle ApiResponse structure (though trips doesn't use it)
        if (trip && typeof trip === 'object' && 'success' in trip && trip.success && trip.data) {
          trip = trip.data
        }
        
        if (!trip || !trip.id) {
          console.error('ExperienceDetailsPage - Invalid trip data:', trip)
          setError('Expérience introuvable')
          setLoading(false)
          return
        }
        
        // Parse location (can be string or object)
        let location: any = { city: 'Unknown', country: '', lat: 0, lng: 0 }
        if (trip.location) {
          try {
            location = typeof trip.location === 'string' ? JSON.parse(trip.location) : trip.location
          } catch {
            // If location is a plain string, try to extract city/country
            if (typeof trip.location === 'string') {
              const parts = trip.location.split(',').map(s => s.trim())
              location = {
                city: parts[0] || 'Unknown',
                country: parts[1] || '',
                lat: 0,
                lng: 0
              }
            }
          }
        }
        
        // Parse images
        let images: string[] = []
        try {
          images = Array.isArray(trip.images) ? trip.images : 
            (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
        } catch {
          images = []
        }
        
        setExperience({
          id: trip.id,
          title: trip.title || 'Experience',
          location: {
            city: location.city || 'Unknown',
            country: location.country || '',
            lat: location.lat || 0,
            lng: location.lng || 0
          },
          artist: trip.artist?.user?.name || trip.artistName || 'Featured Artist',
          hotel: trip.hotel?.name || trip.hotelName || 'Luxury Hotel',
          date: trip.startDate || trip.date || new Date().toISOString().split('T')[0],
          image: images && images.length > 0 
            ? images[0] 
            : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop',
          type: trip.type || 'intimate',
          rating: trip.averageRating || trip.rating || 4.5,
          description: trip.description || 'An amazing experience awaits.',
          fullDescription: trip.description || 'An amazing experience awaits.',
          duration: trip.duration || '2 hours',
          capacity: trip.capacity || '50 guests',
          includes: trip.includes || [
            'Accueil et cocktail',
            'Représentation',
            'Rafraîchissements',
            'Accès au lieu'
          ],
          schedule: trip.schedule || [],
          artistBio: trip.artist?.bio || trip.artistBio || 'Talented artist with years of experience.',
          venueDetails: trip.venueDetails || trip.hotel?.description || 'Beautiful venue setting.',
          reviews: trip.reviews || []
        })
      } catch (err: any) {
        console.error('Error fetching experience:', err)
        setError('Impossible de charger l’expérience. Réessayez plus tard.')
      } finally {
        setLoading(false)
      }
    }

    fetchExperience()
  }, [id])


  if (loading) {
    return (
      <div className="min-h-screen bg-[#08101D]">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-white/60">Chargement de l’expérience…</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-[#08101D]">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Expérience introuvable</h1>
          <p className="text-white/60 mb-8">L’expérience demandée n’existe pas.</p>
          <Link to="/experiences" className="btn-primary">
            Retour aux expériences
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />
      
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={experience.image}
          alt={experience.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/60"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <span className="inline-block px-4 py-2 bg-gold/20 backdrop-blur-sm rounded-control text-sm font-semibold mb-4 capitalize">
              {experience.type}
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              {experience.title}
            </h1>
            <p className="text-xl flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              {experience.location.city}, {experience.location.country}
            </p>
          </motion.div>
        </div>
        <Link
          to="/experiences"
          className="absolute top-6 left-6 bg-[var(--surface-raised)]/20 backdrop-blur-sm text-white px-4 py-2 rounded-card hover:bg-[var(--surface-raised)]/30 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux expériences
        </Link>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-4 gold-underline">
                À propos de cette expérience
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                {experience.fullDescription}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-white/45">Note</p>
                  <p className="text-xl font-bold text-white">{experience.rating}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-white/45">Durée</p>
                  <p className="text-sm font-bold text-white">{experience.duration}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-white/45">Capacité</p>
                  <p className="text-sm font-bold text-white">{experience.capacity}</p>
                </div>
              </div>
            </motion.div>

            {/* Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-6 gold-underline">
                Programme
              </h2>
              <div className="space-y-4">
                {experience.schedule.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-24 text-gold font-semibold">
                      {item.time}
                    </div>
                    <div className="flex-1 text-white/60">
                      {item.activity}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What's Included */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-6 gold-underline">
                Ce qui est compris
              </h2>
              <ul className="space-y-3">
                {experience.includes.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/20 rounded-control flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gold rounded-control"></div>
                    </div>
                    <span className="text-white/60">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Artist Bio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-4 gold-underline">
                À propos de l’artiste
              </h2>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gold/20 rounded-control flex items-center justify-center flex-shrink-0">
                  <Music className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-semibold text-white mb-2">
                    {experience.artist}
                  </h3>
                  <p className="text-white/60">{experience.artistBio}</p>
                </div>
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-6 gold-underline">
                Avis des clients
              </h2>
              <div className="space-y-6">
                {experience.reviews.map((review: any, index: number) => (
                  <div key={index} className="border-l-4 border-gold pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-gold fill-current' : 'text-white/65'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-white">{review.author}</span>
                    </div>
                    <p className="text-white/60">{review.comment}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-luxury sticky top-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gold" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {new Date(experience.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-white/60 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    {experience.location.city}, {experience.location.country}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Music className="w-4 h-4" />
                    {experience.artist}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gold/10 rounded-card">
                  <p className="text-sm text-white/60 mb-1">Durée</p>
                  <p className="font-semibold text-white">{experience.duration}</p>
                </div>
                <div className="p-4 bg-gold/10 rounded-card">
                  <p className="text-sm text-white/60 mb-1">Capacité</p>
                  <p className="font-semibold text-white">{experience.capacity}</p>
                </div>
              </div>

              <button className="w-full btn-primary text-lg py-4">
                Réserver cette expérience
              </button>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-semibold text-white mb-3">Le lieu</h4>
                <div className="flex items-start gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                  <p className="text-sm text-white/60">{experience.hotel}</p>
                </div>
                <p className="text-sm text-white/60">{experience.venueDetails}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ExperienceDetailsPage

