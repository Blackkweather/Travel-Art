import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, Users, Globe, Clock, ArrowLeft } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import { tripsApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import { experienceTypeLabel } from '@/utils/i18n'
import LoadingSpinner from '@/components/LoadingSpinner'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const ExperienceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* Only a hotel can open a booking - `POST /bookings` returns 403 for every
     other role - so the call to action leads each visitor to the step that is
     actually available to them rather than to a form that would be rejected. */
  const reserveLabel = !user
    ? t('Demander cette résidence')
    : user.role === 'HOTEL'
      ? t('Réserver cet artiste')
      : t('Voir mes résidences')

  const reserveHint = !user
    ? t('Créez un compte hôtel pour ouvrir une réservation, ou un compte artiste pour candidater au programme.')
    : user.role === 'HOTEL'
      ? t('Vous serez dirigé vers la fiche de l’artiste pour choisir vos dates.')
      : t('Les réservations sont ouvertes par les hôtels. Vos dates apparaissent dans votre tableau de bord.')

  const handleReserve = () => {
    if (!user) {
      navigate('/register', { state: { from: `/experience/${id}` } })
      return
    }
    if (user.role === 'HOTEL') {
      navigate('/dashboard/artists', {
        state: {
          prefillArtistId: experience?.artistId ?? null,
          prefillArtistName: experience?.artist ?? null
        }
      })
      return
    }
    navigate('/dashboard/bookings')
  }

  // Fetch experience from API
  useEffect(() => {
    const fetchExperience = async () => {
      if (!id) {
        setError(t('Identifiant d’expérience manquant'))
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
        // The endpoint now returns { success, data } like the rest of the API,
        // so the two shape-detection branches that used to sit here are gone.
        const trip: any = res.data?.data ?? res.data
        
        if (!trip || !trip.id) {
          console.error('ExperienceDetailsPage - Invalid trip data:', trip)
          setError(t('Expérience introuvable'))
          setLoading(false)
          return
        }
        
        // Parse location (can be string or object)
        let location: any = { city: 'Lieu inconnu', country: '', lat: 0, lng: 0 }
        if (trip.location) {
          try {
            location = typeof trip.location === 'string' ? JSON.parse(trip.location) : trip.location
          } catch {
            // If location is a plain string, try to extract city/country
            if (typeof trip.location === 'string') {
              const parts = trip.location.split(',').map(s => s.trim())
              location = {
                city: parts[0] || 'Lieu inconnu',
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
            city: location.city || 'Lieu inconnu',
            country: location.country || '',
            lat: location.lat || 0,
            lng: location.lng || 0
          },
          artistId: trip.artistId ?? trip.artist?.id ?? null,
          // /trips/:id returns { id, name, bio }; the list route returns a
          // plain string. Neither is `user.name`, which is what this used to
          // read - so it always showed the placeholder.
          artist:
            typeof trip.artist === 'string'
              ? trip.artist
              : trip.artist?.name || trip.artist?.user?.name || trip.artistName || 'Artiste en résidence',
          hotelId: trip.hotelId ?? trip.hotel?.id ?? null,
          hotel:
            typeof trip.hotel === 'string'
              ? trip.hotel
              : trip.hotel?.name || trip.hotelName || 'Lieu à confirmer',
          date: trip.startDate || trip.date || new Date().toISOString().split('T')[0],
          image: images && images.length > 0 
            ? images[0] 
            : '/images/headers/experiences.webp',
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
        setError(t('Impossible de charger l’expérience. Réessayez plus tard.'))
      } finally {
        setLoading(false)
      }
    }

    fetchExperience()
  }, [id])


  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-content-secondary">{t('Chargement de l’expérience…')}</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-content mb-4">{t('Expérience introuvable')}</h1>
          <p className="text-content-secondary mb-8">{t('L’expérience demandée n’existe pas.')}</p>
          <Link to="/experiences" className="btn-primary">
            {t('Retour aux expériences')}
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={
          experience
            ? `${experience.title} — Travel Art`
            : t('Expérience — Travel Art')
        }
        description={
          experience
            ? `${experience.title} : une résidence d’artiste à ${experience.location?.city ?? t('l’hôtel')}. ${(experience.description ?? '').slice(0, 110)}`
            : t('Une résidence d’artiste dans un hôtel d’exception.')
        }
        ogImage={experience?.image}
      />
      <SimpleNavbar overMedia />

      {/* The experience photograph is the hero, so type on it stays white. The
          back link sat at top-6, underneath the fixed 72px navigation bar. */}
      <header className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <img loading="lazy" decoding="async"
          src={experience.image}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/40 to-navy/30"></div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="shell pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-3.5 py-1.5 bg-gold text-off-black rounded-control text-xs font-semibold uppercase tracking-wider">
                {experienceTypeLabel(experience.type)}
              </span>
              <h1 className="mt-5 text-white max-w-[18ch]">
                {experience.title}
              </h1>
              <p className="mt-4 text-lg text-white/85 flex items-center gap-2">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                {experience.location.city}, {experience.location.country}
              </p>
            </motion.div>
          </div>
        </div>

        <Link
          to="/experiences"
          className="absolute top-[88px] left-5 sm:left-8 lg:left-12 bg-black/35 backdrop-blur-sm text-white px-4 py-2.5 rounded-control hover:bg-black/55 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('Retour aux expériences')}
        </Link>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="panel p-6"
            >
              <h2 className="text-3xl font-serif font-bold text-content mb-4 gold-underline">
                {t('À propos de cette expérience')}
              </h2>
              <p className="text-content-secondary text-lg leading-relaxed mb-6">
                {experience.fullDescription}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-line">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-content-secondary">Note</p>
                  <p className="text-xl font-bold text-content">{experience.rating}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-content-secondary">{t('Durée')}</p>
                  <p className="text-sm font-bold text-content">{experience.duration}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-content-secondary">{t('Capacité')}</p>
                  <p className="text-sm font-bold text-content">{experience.capacity}</p>
                </div>
              </div>
            </motion.div>

            {/* Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="panel p-6"
            >
              <h2 className="text-3xl font-serif font-bold text-content mb-6 gold-underline">
                Programme
              </h2>
              <div className="space-y-4">
                {experience.schedule.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-line last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-24 text-gold font-semibold">
                      {item.time}
                    </div>
                    <div className="flex-1 text-content-secondary">
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
              className="panel p-6"
            >
              <h2 className="text-3xl font-serif font-bold text-content mb-6 gold-underline">
                {t('Ce qui est compris')}
              </h2>
              <ul className="space-y-3">
                {experience.includes.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/20 rounded-control flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gold rounded-control"></div>
                    </div>
                    <span className="text-content-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Artist Bio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="panel p-6"
            >
              <h2 className="text-3xl font-serif font-bold text-content mb-4 gold-underline">
                {t('À propos de l’artiste')}
              </h2>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gold/20 rounded-control flex items-center justify-center flex-shrink-0">
                  <Music className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-semibold text-content mb-2">
                    {experience.artist}
                  </h3>
                  <p className="text-content-secondary">{experience.artistBio}</p>
                </div>
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="panel p-6"
            >
              <h2 className="text-3xl font-serif font-bold text-content mb-6 gold-underline">
                {t('Avis des clients')}
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
                              i < review.rating ? 'text-gold fill-current' : 'text-content-secondary'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-content">{review.author}</span>
                    </div>
                    <p className="text-content-secondary">{review.comment}</p>
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
              className="panel p-6 sticky top-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gold/20 rounded-control flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gold" />
                </div>
                <div className="text-2xl font-bold text-content mb-2">
                  {new Date(experience.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-content-secondary mb-6">
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
                  <p className="text-sm text-content-secondary mb-1">{t('Durée')}</p>
                  <p className="font-semibold text-content">{experience.duration}</p>
                </div>
                <div className="p-4 bg-gold/10 rounded-card">
                  <p className="text-sm text-content-secondary mb-1">{t('Capacité')}</p>
                  <p className="font-semibold text-content">{experience.capacity}</p>
                </div>
              </div>

              <button onClick={handleReserve} className="w-full btn-primary text-lg py-4">
                {reserveLabel}
              </button>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-content-secondary">
                {reserveHint}
              </p>

              <div className="mt-6 pt-6 border-t border-line">
                <h4 className="font-semibold text-content mb-3">{t('Le lieu')}</h4>
                <div className="flex items-start gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                  <p className="text-sm text-content-secondary">{experience.hotel}</p>
                </div>
                <p className="text-sm text-content-secondary">{experience.venueDetails}</p>
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

