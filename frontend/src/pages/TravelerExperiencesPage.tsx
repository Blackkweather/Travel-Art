import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Star, Music, ArrowRight, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'


import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L, { LatLngTuple } from 'leaflet'
import { tripsApi } from '@/utils/api'
import { experienceTypeLabel } from '@/utils/i18n'

// Fix for default marker icons in Leaflet with Vite
// Loaded here rather than in main.tsx: this is the only route with a map,
// so its stylesheet has no business in the global bundle.
import 'leaflet/dist/leaflet.css'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { extractArray } from '@/utils/apiPayload'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface Experience {
  id: string
  title: string
  location: { city: string; country: string; lat: number; lng: number }
  artist: string
  hotel: string
  date: string
  image: string
  type: 'rooftop' | 'intimate' | 'workshop' | 'residency'
  rating: number
  description: string
}

// Values match the `type` field the API returns and must not be translated;
// the labels come from the shared map so the filter chip and the card badge
// cannot drift apart.
const EXPERIENCE_TYPES = (['all', 'rooftop', 'intimate', 'workshop', 'residency'] as const)
  .map((value) => ({ value, label: experienceTypeLabel(value) }))

/**
 * Pans the existing map when the derived centre or zoom changes.
 *
 * react-leaflet treats `center` and `zoom` as initial values only, so they
 * cannot move a map that already exists. Remounting via `key` does move it, at
 * the cost of destroying every popup and refetching every tile; this does it
 * through Leaflet's own API instead.
 */
/**
 * Narrows the list to whatever country the map is looking at.
 *
 * Fires only once the map has settled, and only when the view is tight enough
 * to mean something: below zoom 5 you are looking at a continent, and every
 * pin in frame belongs to a different country.
 *
 * It reports a country only when the pins in view agree on one. Two countries
 * in frame is not a country filter, it is a wide shot, so the filter clears.
 */
const MapCountryWatcher: React.FC<{
  points: { lat: number; lng: number; country?: string }[]
  onChange: (country: string | null) => void
}> = ({ points, onChange }) => {
  const settle = (map: L.Map) => {
    // Below this the frame still holds most of a continent, and narrowing the
    // list would be a surprise rather than an answer to a gesture.
    if (map.getZoom() < 6) {
      onChange(null)
      return
    }

    const bounds = map.getBounds()
    const inView = points.filter(
      (p) => p.country && bounds.contains([p.lat, p.lng] as LatLngTuple)
    )
    if (inView.length === 0) {
      onChange(null)
      return
    }

    // The country of the pin nearest the centre of the map. Taking the country
    // holding the most pins instead reported France when you centred on
    // Cortina, because France has more of the Alps - and flickered as pins
    // crossed the edge of the frame. What you put in the middle of the screen
    // is what you meant.
    const centre = map.getCenter()
    const scale = Math.cos((centre.lat * Math.PI) / 180)
    let nearest = inView[0]
    let best = Infinity
    for (const p of inView) {
      const dLat = p.lat - centre.lat
      const dLng = (p.lng - centre.lng) * scale
      const d = dLat * dLat + dLng * dLng
      if (d < best) {
        best = d
        nearest = p
      }
    }
    onChange(nearest.country ?? null)
  }

  const map = useMapEvents({
    moveend: () => settle(map),
    zoomend: () => settle(map),
  })

  return null
}

const MapView: React.FC<{ center: LatLngTuple; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [map, center[0], center[1], zoom])
  return null
}

const TravelerExperiencesPage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [mapCountry, setMapCountry] = useState<string | null>(null)
  // Two rows of three. Reset whenever the result set changes underneath.
  const [page, setPage] = useState(0)

  // Fetch experiences from API
  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true)
      try {
        // The trips API always returns PUBLISHED trips, no need for status param
        const res = await tripsApi.getAll()
        
        // One documented envelope now, so no shape-detection: the helper knows
        // both `data.trips` and a bare `data` array and nothing else is emitted.
        const trips = extractArray(res.data, 'trips')
        
        console.log('📊 Parsed trips count:', trips.length)
        console.log('📊 Parsed trips:', trips)
        
        if (trips.length > 0) {
          const formattedExperiences = trips.map((trip: any) => {
            // Parse location if it's a string
            let location = { city: 'Lieu inconnu', country: '', lat: 0, lng: 0 }
            if (trip.location) {
              try {
                location = typeof trip.location === 'string' 
                  ? JSON.parse(trip.location) 
                  : trip.location
              } catch (e) {
                console.warn('Failed to parse location:', e)
                location = { city: 'Lieu inconnu', country: '', lat: 0, lng: 0 }
              }
            }
            
            // Parse images if they're a string
            let images: string[] = []
            if (trip.images) {
              try {
                images = Array.isArray(trip.images) 
                  ? trip.images 
                  : (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
              } catch (e) {
                console.warn('Failed to parse images:', e)
                images = []
              }
            }
            
            return {
              id: trip.id || String(Math.random()),
              title: trip.title || 'Experience',
              location: {
                city: location.city || 'Lieu inconnu',
                country: location.country || '',
                lat: location.lat || 0,
                lng: location.lng || 0
              },
              /* The two trip endpoints disagree about this field. The list
                 route projects it to a plain string before responding, while
                 the detail route and the raw Prisma result carry the related
                 record. Reading only one shape leaves the other rendering a
                 placeholder - or, for the object, hands React an object to
                 render and throws. So both are handled. */
              artist:
                typeof trip.artist === 'string'
                  ? trip.artist
                  : trip.artist?.user?.name || trip.artist?.name || 'Artiste en résidence',
              hotel:
                typeof trip.hotel === 'string'
                  ? trip.hotel
                  : trip.hotel?.name || 'Lieu à confirmer',
              date: trip.date || new Date().toISOString().split('T')[0],
              image: images && images.length > 0
                ? images[0]
                : '/images/placeholder-experience.webp',
              type: (trip.type === 'rooftop' || trip.type === 'intimate' || trip.type === 'workshop' || trip.type === 'residency' 
                ? trip.type 
                : 'intimate') as Experience['type'],
              rating: trip.rating || 4.5,
              description: trip.description || 'An amazing experience awaits.'
            }
          })
          
          console.log('Formatted experiences:', formattedExperiences)
          console.log('✅ Formatted experiences:', formattedExperiences)
          console.log('✅ Setting experiences state with', formattedExperiences.length, 'items')
          setExperiences(formattedExperiences)
        } else {
          console.warn('⚠️ No trips found in API response')
          console.warn('⚠️ Response was:', res.data)
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch experiences from API:', error)
        console.error('❌ Error details:', error.response?.data || error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchExperiences()
  }, [])

  /**
   * The explicit filters only - search box, type, chosen city.
   *
   * Kept separate from the map-driven country filter on purpose: the map's
   * centre and zoom are derived from this, so a filter the map itself sets
   * cannot move the map, which would move the filter, which would move the map.
   */
  const baseFiltered = useMemo(() => {
    if (experiences.length === 0) return []
    return experiences.filter((exp) => {
      const matchesLocation = !selectedLocation || exp.location?.city === selectedLocation
      const matchesType = filterType === 'all' || exp.type === filterType
      return matchesLocation && matchesType
    })
  }, [experiences, selectedLocation, filterType])

  /** What the grid shows: the explicit filters, narrowed by the map. */
  const filteredExperiences = useMemo(() => {
    if (!mapCountry) return baseFiltered
    return baseFiltered.filter((exp) => exp.location?.country === mapCountry)
  }, [baseFiltered, mapCountry])

  // Was [] - computed once, before anything had loaded, so the city dropdown
  // was permanently empty.
  const PAGE_SIZE = 6
  const pageCount = Math.max(1, Math.ceil(filteredExperiences.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleExperiences = filteredExperiences.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  )

  // A filter change can leave you on a page that no longer exists.
  useEffect(() => {
    setPage(0)
  }, [selectedLocation, filterType, mapCountry, experiences.length])

  const locations = useMemo(() => {
    const unique = new Set(experiences.map((e) => e.location?.city).filter(Boolean))
    return Array.from(unique).sort()
  }, [experiences])

  // Calculate map center based on filtered experiences
  const mapCenter: LatLngTuple = useMemo(() => {
    if (filteredExperiences.length === 0) return [45, 2] as LatLngTuple // Default center of Europe
    
    const avgLat = filteredExperiences.reduce((sum, exp) => sum + exp.location.lat, 0) / filteredExperiences.length
    const avgLng = filteredExperiences.reduce((sum, exp) => sum + exp.location.lng, 0) / filteredExperiences.length
    return [avgLat, avgLng] as LatLngTuple
  }, [baseFiltered])

  // Calculate zoom level based on number of experiences
  const mapZoom = useMemo(() => {
    if (baseFiltered.length === 0) return 4
    if (baseFiltered.length === 1) return 8
    if (baseFiltered.length <= 3) return 5
    return 4
  }, [baseFiltered])

  const handleMapPinClick = (city: string) => {
    setSelectedLocation(city === selectedLocation ? null : city)
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={t('Expériences et résidences d’artistes — Travel Art')}
        description={t('Concerts, expositions et résidences dans 35 hôtels d’exception, de Val d’Isère à Phuket. Découvrez les prochaines dates sur la carte.')}
      />
        <SimpleNavbar overMedia />
      
      {/* The photograph was set at 20% opacity behind a near-opaque navy
          gradient, which is a way of paying to download an image nobody can
          see. It now carries the hero at full strength under a scrim shaped to
          the type. */}
      <header className="relative min-h-[62vh] flex items-end pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img loading="lazy" decoding="async"
            src="/images/headers/experiences.webp"
            srcSet="/images/headers/experiences-960.webp 960w, /images/headers/experiences-1440.webp 1440w, /images/headers/experiences.webp 1920w"
            sizes="100vw"
            width={1920}
            height={1097}
            alt=""
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-navy/25" />
        </div>

        <div className="shell relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow text-white/80">{t('Le programme')}</p>
            <h1 className="mt-5 max-w-[16ch] text-white">
              {t('Découvrir les expériences')}
            </h1>
            <p className="mt-7 text-lg text-white/80 max-w-[54ch] leading-relaxed">
              {t('Vivez les performances d’artistes accueillis par les hôtels d’exception du monde entier.')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register?role=artist" className="btn-gold btn-arrow">
                {t('Rejoindre en tant qu’artiste')}
              </Link>
              <Link to="/top-artists" className="btn-on-media">
                {t('Parcourir les artistes')}
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Interactive Map Section */}
      <section className="py-16 bg-[var(--surface-raised)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold text-content mb-4">
              {t('Explorer les expériences dans le monde')}
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              {t('Cliquez sur un lieu pour découvrir les prochaines dates et les résidences d’artistes')}
            </p>
          </motion.div>

          {/* Interactive Map */}
          <div className="relative rounded-card overflow-hidden mb-8 shadow-lg" style={{ height: '500px' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              minZoom={3}
              maxZoom={18}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
            >
              {/* Moves the live map instead of replacing it. */}
              <MapView center={mapCenter} zoom={mapZoom} />
            <MapCountryWatcher
              points={baseFiltered.map((e) => ({
                lat: e.location.lat,
                lng: e.location.lng,
                country: e.location.country,
              }))}
              onChange={setMapCountry}
            />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* baseFiltered, not filteredExperiences: the map keeps every
                  pin the explicit filters allow. Narrowing the pins by the
                  country the map itself picked would erase everywhere else
                  the moment you zoomed in. */}
              {baseFiltered.map((exp) => {
                const isActive = selectedLocation === exp.location.city
                return (
                  <Marker
                    key={exp.id}
                    position={[exp.location.lat, exp.location.lng]}
                    eventHandlers={{
                      click: () => handleMapPinClick(exp.location.city),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-content text-sm mb-1">{exp.location.city}</h3>
                        <p className="text-xs text-content-secondary mb-2">{exp.title}</p>
                        <p className="text-xs text-content-secondary">{exp.artist} — {exp.hotel}</p>
                        <p className="text-xs text-content-secondary mt-1">
                          {new Date(exp.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          {/* Location Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedLocation(null)}
              className={`px-4 py-2 rounded-control transition-colors ${
                !selectedLocation
                  ? 'bg-gold text-off-black font-semibold'
                  : 'bg-surface-sunken text-content-secondary hover:bg-surface-warm'
              }`}
            >
              {t('Toutes les villes')}
            </button>
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-4 py-2 rounded-control transition-colors ${
                  selectedLocation === loc
                    ? 'bg-gold text-off-black font-semibold'
                    : 'bg-surface-sunken text-content-secondary hover:bg-surface-warm'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Type Filter. The values are compared against `exp.type` coming
              from the API, so they stay in English; only the labels are
              translated. Before this the chips rendered the raw value -
              "Rooftop", "Intimate", "Workshop", "Residency" - on a site that
              ships in French only, and `capitalize` was doing the presentation
              work a label should do. */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {EXPERIENCE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterType(value)}
                aria-pressed={filterType === value}
                className={`px-4 py-2 min-h-[44px] rounded-control transition-colors ${
                  filterType === value
                    ? 'bg-navy text-white font-semibold'
                    : 'bg-surface-sunken text-content-secondary hover:bg-surface-warm'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-control h-12 w-12 border-b-2 border-gold mb-4"></div>
              <p className="text-content-secondary text-lg">{t('Chargement des expériences…')}</p>
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-content-secondary text-lg mb-4">{t('Aucune expérience.')}</p>
              <p className="text-content-secondary">{t('Revenez bientôt pour découvrir nos expériences.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleExperiences.map((exp, index) => (
              <Link
                key={exp.id}
                to={`/experience/${exp.id}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card-experience group cursor-pointer"
                >
                <div className="relative h-64 overflow-hidden">
                  <img decoding="async" loading="lazy"
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {exp.location.city}, {exp.location.country}
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold mb-1">{exp.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-gold fill-current" />
                      <span className="text-sm">{exp.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-[var(--surface-raised)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-gold/20 text-gold-700 text-xs font-semibold rounded-control">
                      {experienceTypeLabel(exp.type)}
                    </span>
                    <div className="flex items-center text-content-secondary text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(exp.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <p className="text-content-secondary text-sm mb-4 line-clamp-2">{exp.description}</p>
                  <div className="space-y-2 text-sm text-content-secondary mb-4">
                    <div className="flex items-center">
                      <Music className="w-4 h-4 mr-2 text-gold" />
                      <span>{exp.artist}</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gold" />
                      <span>{exp.hotel}</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center text-gold font-semibold group-hover:text-content transition-colors">
                    {t('En savoir plus')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
              </Link>
              ))}
            </div>
          )}

          {/* Paging. Hidden when everything already fits on one page - a pager
              that cannot page is furniture. The count is spelled out rather
              than shown as numbered pages: with six to a page the useful
              information is where you are, not a row of page numbers. */}
          {!loading && pageCount > 1 && (
            <nav
              className="mt-12 flex items-center justify-center gap-6"
              aria-label={t('Pagination des expériences')}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('Page précédente')}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                {t('Précédent')}
              </button>

              <p className="text-sm text-content-secondary tabular-nums" aria-live="polite">
                {t('Page {current} sur {total}', {
                  current: currentPage + 1,
                  total: pageCount,
                })}
              </p>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                className="btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('Page suivante')}
              >
                {t('Suivant')}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </nav>
          )}

          {/* Says why the list is short when the map is doing the narrowing,
              and offers the way out. Without this a zoomed-in map looks like
              a site with three experiences. */}
          {mapCountry && !loading && (
            <p className="mt-6 text-center text-sm text-content-secondary">
              {t('Filtré sur {country} par la carte.', { country: mapCountry })}{' '}
              <button
                type="button"
                onClick={() => setMapCountry(null)}
                className="text-gold hover:underline"
              >
                {t('Tout afficher')}
              </button>
            </p>
          )}
        </div>
      </section>

      {/* The second button's class list was self-contradicting - btn-gold-outline
          sets a gold border and gold label, then border-white and text-content
          overrode both, and the hover pair set the same colour it already had.
          It also still read "Explore Artists" on a site that ships in French
          only. */}
      <section className="band-inverse">
        <div className="shell text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mx-auto max-w-[18ch]">
              {t('Envie de vivre l’art autrement ?')}
            </h2>
            <p className="mt-7 text-lg text-content-inverse/70 mb-10 max-w-[52ch] mx-auto leading-relaxed">
              {t('Rejoignez la communauté de voyageurs, d’artistes et d’hôtels qui créent ces moments ensemble.')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-gold btn-lg btn-arrow">
                Commencer
              </Link>
              <Link to="/top-artists" className="btn-on-media btn-lg">
                {t('Parcourir les artistes')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TravelerExperiencesPage

