import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Users, AlertCircle } from 'lucide-react'
import Footer from '../components/Footer'
import SimpleNavbar from '@/components/SimpleNavbar'
import { ArtistRank, getQuickRank } from '@/components/ArtistRank'
import { commonApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

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
        toast.error(t('Impossible de charger les artistes. Veuillez réessayer.'))
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
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={t('Artistes en résidence — Travel Art')}
        description={t('Musiciens, plasticiens et interprètes accueillis en résidence dans les hôtels du programme Travel Art.')}
      />
      <SimpleNavbar />

      {/* Page header. This was a navy gradient band carrying white type; on a
          light site that put a dark slab immediately under a light navigation
          bar. It is now set on the page surface, with the eyebrow naming the
          section and the rule closing it - the same opening every public page
          uses, so the site reads as one publication. */}
      <header className="relative pt-32 pb-14 md:pb-20">
        <div className="shell">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow">{t('Le répertoire')}</p>
            <h1 className="mt-5 max-w-[14ch]">
              {t('Les artistes')}
              <span className="block text-gold">{t('les plus remarqués')}</span>
            </h1>
            <p className="mt-7 text-lg text-content-secondary max-w-[52ch] leading-relaxed">
              {t('Découvrez les artistes qui font vivre les toits-terrasses et les plus belles adresses du monde.')}
            </p>
          </motion.div>
        </div>
        <div className="shell mt-12"><span className="rule-reveal" /></div>
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
                <Users className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalArtists || 0}</h3>
              <p className="text-content-secondary">{t('Artistes vérifiés')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
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
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalBookings || 0}</h3>
              <p className="text-content-secondary">{t('Réservations abouties')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gold/15 rounded-control flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-content" />
              </div>
              <h3 className="text-3xl font-bold text-content mb-2">{stats.totalHotels || 0}</h3>
              <p className="text-content-secondary">{t('Hôtels d’exception')}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-content mb-6 gold-underline">
            {t('Artistes à l’honneur')}
          </h2>
          <p className="text-xl text-content-secondary max-w-3xl mx-auto">
            {t('Rencontrez les artistes qui font des toits-terrasses des scènes mémorables')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-[var(--state-critical)] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-content mb-2">{t('Impossible de charger les artistes')}</h3>
            <p className="text-content-secondary mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('Réessayer')}
            </button>
          </div>
        ) : topArtists.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-content-secondary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-content mb-2">{t('Aucun artiste trouvé')}</h3>
            <p className="text-content-secondary mb-6">
              {t('Revenez bientôt pour découvrir nos artistes à l’honneur.')}
            </p>
            <Link to="/register" className="btn-primary">
              Devenir artiste
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
                <motion.article
                  key={artist.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="editorial-card group"
                >
                  <div className="editorial-card__media aspect-[4/5]">
                    <img
                      decoding="async"
                      loading="lazy"
                      src={getImageUrl(artist.images)}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-experience.webp'
                      }}
                    />
                    {/* The rank sits on the photograph because it qualifies the
                        person pictured, not the text below. */}
                    <div className="absolute right-3 top-3 flex items-center gap-2 rounded-control bg-surface-raised/90 px-2.5 py-1.5 backdrop-blur-sm">
                      <ArtistRank tier={getQuickRank(rating, bookings)} size="sm" />
                      <span className="text-sm font-semibold text-content tabular-nums">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="editorial-card__body">
                    <h3 className="font-serif text-xl text-content">
                      <Link to={`/artist/${artist.id}`} className="editorial-card__link">
                        {artist.user.name}
                      </Link>
                    </h3>

                    {artist.discipline && (
                      <p className="text-sm font-medium text-gold">{artist.discipline}</p>
                    )}

                    <p className="text-sm text-content-secondary">
                      {formatLocation(artist.user.country)}
                    </p>

                    {artist.ratingBadge && (
                      <p className="text-[0.8125rem] text-content-secondary">{artist.ratingBadge}</p>
                    )}

                    <dl className="mt-auto flex items-baseline gap-6 border-t border-line pt-4 text-sm">
                      <div className="flex items-baseline gap-2">
                        <dt className="text-content-secondary">{t('Réservations')}</dt>
                        <dd className="font-serif text-base text-content tabular-nums">{bookings}</dd>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <dt className="text-content-secondary">Note</dt>
                        <dd className="font-serif text-base text-content tabular-nums">
                          {rating.toFixed(1)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>

      {/* Closing call to action. Two things were wrong here beyond the colour:
          the subtitle resolved to navy-on-navy and was invisible, and the
          button was .btn-primary - a navy fill - sitting on a navy band, so
          only its label could be seen. Gold is the correct fill on an inverse
          surface, and it is the only place on the page gold fills anything. */}
      <section className="band-inverse">
        <div className="shell text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mx-auto max-w-[18ch]">
              {t('Prêt à monter sur scène ?')}
            </h2>
            <p className="mt-7 text-lg text-content-inverse/70 mb-10 max-w-[50ch] mx-auto leading-relaxed">
              {t('Rejoignez notre communauté d’artistes et jouez dans les plus belles adresses du monde.')}
            </p>
            <Link to="/register?role=artist" className="btn-gold btn-lg btn-arrow">
              Devenir artiste
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}

export default TopArtistsPage
