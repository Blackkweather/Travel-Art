import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Star, Music, ArrowRight, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L, { LatLngTuple } from 'leaflet'
import { tripsApi } from '@/utils/api'
import { experienceTypeLabel } from '@/utils/i18n'

// Fix for default marker icons in Leaflet with Vite
// Loaded here rather than in main.tsx: this is the only route with a map,
// so its stylesheet has no business in the global bundle.
import 'leaflet/dist/leaflet.css'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

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

const TravelerExperiencesPage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Fetch experiences from API
  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true)
      try {
        // The trips API always returns PUBLISHED trips, no need for status param
        const res = await tripsApi.getAll()
        
        console.log('🔍 Trips API Response:', res)
        console.log('🔍 Response data:', res.data)
        console.log('🔍 Response data type:', typeof res.data)
        console.log('🔍 Is array?', Array.isArray(res.data))
        
        // The trips API returns an array directly (not wrapped in success/data)
        // Axios wraps the response, so res.data is the actual array
        let trips: any[] = []
        
        if (Array.isArray(res.data)) {
          trips = res.data
          console.log('✅ Using direct array format')
        } else if (res.data && Array.isArray(res.data.data)) {
          // Also covers the { success: true, data: [...] } envelope: a third
          // branch tested `data.success` as well, but any response reaching it
          // had already matched this condition, so it could never run — and it
          // assigned exactly the same value. Its log line never printed.
          trips = res.data.data
          console.log('✅ Using wrapped data format')
        } else {
          console.error('❌ Unknown response format:', res.data)
        }
        
        console.log('📊 Parsed trips count:', trips.length)
        console.log('📊 Parsed trips:', trips)
        
        if (trips.length > 0) {
          const formattedExperiences = trips.map((trip: any) => {
            // Parse location if it's a string
            let location = { city: 'Unknown', country: '', lat: 0, lng: 0 }
            if (trip.location) {
              try {
                location = typeof trip.location === 'string' 
                  ? JSON.parse(trip.location) 
                  : trip.location
              } catch (e) {
                console.warn('Failed to parse location:', e)
                location = { city: 'Unknown', country: '', lat: 0, lng: 0 }
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
                city: location.city || 'Unknown',
                country: location.country || '',
                lat: location.lat || 0,
                lng: location.lng || 0
              },
              artist: trip.artist || 'Featured Artist',
              hotel: trip.hotel || 'Luxury Venues',
              date: trip.date || new Date().toISOString().split('T')[0],
              image: images && images.length > 0
                ? images[0]
                : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=70&auto=format&fit=crop',
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

  const filteredExperiences = useMemo(() => {
    console.log('🔍 Filtering experiences:', {
      total: experiences.length,
      filterType,
      selectedLocation,
      experiences: experiences.map(e => ({ id: e.id, title: e.title, type: e.type, city: e.location?.city }))
    })
    
    if (experiences.length === 0) {
      console.log('⚠️ No experiences to filter')
      return []
    }
    
    const filtered = experiences.filter(exp => {
      const matchesLocation = !selectedLocation || (exp.location?.city === selectedLocation)
      const matchesType = filterType === 'all' || exp.type === filterType
      
      console.log(`🔍 Experience "${exp.title}":`, {
        type: exp.type,
        filterType,
        matchesType,
        city: exp.location?.city,
        selectedLocation,
        matchesLocation,
        passes: matchesLocation && matchesType
      })
      
      return matchesLocation && matchesType
    })
    
    console.log('🔍 Filtered result:', filtered.length, 'experiences')
    return filtered
  }, [experiences, selectedLocation, filterType])

  const locations = useMemo(() => {
    const unique = new Set(experiences.map(e => e.location.city))
    return Array.from(unique).sort()
  }, [])

  // Calculate map center based on filtered experiences
  const mapCenter: LatLngTuple = useMemo(() => {
    if (filteredExperiences.length === 0) return [45, 2] as LatLngTuple // Default center of Europe
    
    const avgLat = filteredExperiences.reduce((sum, exp) => sum + exp.location.lat, 0) / filteredExperiences.length
    const avgLng = filteredExperiences.reduce((sum, exp) => sum + exp.location.lng, 0) / filteredExperiences.length
    return [avgLat, avgLng] as LatLngTuple
  }, [filteredExperiences])

  // Calculate zoom level based on number of experiences
  const mapZoom = useMemo(() => {
    if (filteredExperiences.length === 0) return 4
    if (filteredExperiences.length === 1) return 8
    if (filteredExperiences.length <= 3) return 5
    return 4
  }, [filteredExperiences])

  const handleMapPinClick = (city: string) => {
    setSelectedLocation(city === selectedLocation ? null : city)
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar overMedia />
      
      {/* The photograph was set at 20% opacity behind a near-opaque navy
          gradient, which is a way of paying to download an image nobody can
          see. It now carries the hero at full strength under a scrim shaped to
          the type. */}
      <header className="relative min-h-[62vh] flex items-end pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img decoding="async"
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=70&fit=crop&auto=format"
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
            <p className="eyebrow text-white/80">Le programme</p>
            <h1 className="mt-5 max-w-[16ch] text-white">
              Découvrir les expériences
            </h1>
            <p className="mt-7 text-lg text-white/80 max-w-[54ch] leading-relaxed">
              Vivez les performances d’artistes accueillis par les hôtels d’exception du monde entier.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register?role=artist" className="btn-gold btn-arrow">
                Rejoindre en tant qu’artiste
              </Link>
              <Link to="/top-artists" className="btn-on-media">
                Parcourir les artistes
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
              Explorer les expériences dans le monde
            </h2>
            <p className="text-content-secondary max-w-2xl mx-auto">
              Cliquez sur un lieu pour découvrir les prochaines dates et les résidences d’artistes
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
              key={`${mapCenter[0]}-${mapCenter[1]}-${filteredExperiences.length}`} // Force re-render on filter change
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredExperiences.map((exp) => {
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
                        <p className="text-xs text-content-secondary">{exp.artist} at {exp.hotel}</p>
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
              Toutes les villes
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
              <p className="text-content-secondary text-lg">Chargement des expériences…</p>
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-content-secondary text-lg mb-4">Aucune expérience.</p>
              <p className="text-content-secondary mb-2">Total experiences in state: {experiences.length}</p>
              <p className="text-content-secondary mb-2">Filtered experiences: {filteredExperiences.length}</p>
              <p className="text-content-secondary">Revenez bientôt pour découvrir nos expériences.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExperiences.map((exp, index) => (
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
                    En savoir plus
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
              </Link>
              ))}
            </div>
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
              Envie de vivre l’art autrement ?
            </h2>
            <p className="mt-7 text-lg text-content-inverse/70 mb-10 max-w-[52ch] mx-auto leading-relaxed">
              Rejoignez la communauté de voyageurs, d’artistes et d’hôtels qui créent ces moments ensemble.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-gold btn-lg btn-arrow">
                Commencer
              </Link>
              <Link to="/top-artists" className="btn-on-media btn-lg">
                Parcourir les artistes
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

