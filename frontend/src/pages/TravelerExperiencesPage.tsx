import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Star, Music, ArrowRight, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

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

const experiences: Experience[] = [
  {
    id: '1',
    title: 'Sunset Jazz on the Rooftop',
    location: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    artist: 'Sophie Laurent',
    hotel: 'Hotel Plaza Athénée',
    date: '2024-06-15',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    type: 'rooftop',
    rating: 4.9,
    description: 'An intimate jazz performance overlooking the Eiffel Tower at sunset.'
  },
  {
    id: '2',
    title: 'Flamenco Workshop & Performance',
    location: { city: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
    artist: 'Isabella Garcia',
    hotel: 'Hotel Arts Barcelona',
    date: '2024-07-20',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    type: 'workshop',
    rating: 4.8,
    description: 'Learn flamenco with a master dancer, followed by an evening performance.'
  },
  {
    id: '3',
    title: 'Mediterranean Piano Serenade',
    location: { city: 'Nice', country: 'France', lat: 43.7102, lng: 7.2620 },
    artist: 'Marco Silva',
    hotel: 'Hotel Negresco',
    date: '2024-08-10',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    type: 'intimate',
    rating: 4.9,
    description: 'Classical piano in an intimate setting with Mediterranean views.'
  },
  {
    id: '4',
    title: 'Artist Residency: Marrakech',
    location: { city: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
    artist: 'Jean-Michel Dubois',
    hotel: 'La Mamounia',
    date: '2024-09-05',
    image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=800',
    type: 'residency',
    rating: 5.0,
    description: 'A week-long residency featuring daily performances and cultural immersion.'
  }
]

const TravelerExperiencesPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const mapRef = useRef<HTMLDivElement>(null)
  const storiesRef = useRef<HTMLDivElement>(null)
  const storiesInView = useInView(storiesRef, { once: true, margin: '-100px' })

  const filteredExperiences = useMemo(() => {
    return experiences.filter(exp => {
      const matchesLocation = !selectedLocation || exp.location.city === selectedLocation
      const matchesType = filterType === 'all' || exp.type === filterType
      return matchesLocation && matchesType
    })
  }, [selectedLocation, filterType])

  const locations = useMemo(() => {
    const unique = new Set(experiences.map(e => e.location.city))
    return Array.from(unique).sort()
  }, [])

  const handleMapPinClick = (city: string) => {
    setSelectedLocation(city === selectedLocation ? null : city)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-navy to-navy/90 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920')] opacity-20 bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
              Discover Artistic Experiences
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Immerse yourself in world-class performances at luxury hotels around the globe
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-gold">
                Join as Traveler
              </Link>
              <Link to="/top-artists" className="btn-gold-outline">
                Browse Artists
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold text-navy mb-4">
              Explore Experiences Worldwide
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Click on locations to discover upcoming performances and artist residencies
            </p>
          </motion.div>

          {/* Map Placeholder with Interactive Pins */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-8" style={{ height: '500px' }}>
            <div ref={mapRef} className="w-full h-full relative">
              {/* Simple map background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 opacity-50" />
              
              {/* Interactive Pins */}
              {experiences.map((exp) => {
                // Simplified positioning (in real app, use actual map coordinates)
                const left = 20 + (exp.location.lat % 10) * 8
                const top = 30 + (Math.abs(exp.location.lng) % 10) * 6
                const isActive = selectedLocation === exp.location.city
                
                return (
                  <button
                    key={exp.id}
                    onClick={() => handleMapPinClick(exp.location.city)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                      isActive ? 'scale-150 z-10' : 'hover:scale-110'
                    }`}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    aria-label={`View experiences in ${exp.location.city}`}
                  >
                    <MapPin 
                      className={`w-8 h-8 ${
                        isActive ? 'text-gold fill-current' : 'text-navy hover:text-gold'
                      } transition-colors`}
                    />
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-48 z-20"
                      >
                        <h3 className="font-semibold text-navy text-sm mb-1">{exp.location.city}</h3>
                        <p className="text-xs text-gray-600">{exp.title}</p>
                      </motion.div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedLocation(null)}
              className={`px-4 py-2 rounded-full transition-colors ${
                !selectedLocation
                  ? 'bg-gold text-navy font-semibold'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Locations
            </button>
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLocation === loc
                    ? 'bg-gold text-navy font-semibold'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['all', 'rooftop', 'intimate', 'workshop', 'residency'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full transition-colors capitalize ${
                  filterType === type
                    ? 'bg-navy text-white font-semibold'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExperiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-experience group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
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
                <div className="p-6 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-gold/20 text-gold text-xs font-semibold rounded-full capitalize">
                      {exp.type}
                    </span>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(exp.date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exp.description}</p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Music className="w-4 h-4 mr-2 text-gold" />
                      <span>{exp.artist}</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gold" />
                      <span>{exp.hotel}</span>
                    </div>
                  </div>
                  <Link
                    to={`/experience/${exp.id}`}
                    className="inline-flex items-center text-gold font-semibold hover:text-navy transition-colors group"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Stories Section */}
      <section ref={storiesRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={storiesInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold text-navy mb-4">
              Stories from the Road
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover how artists and hotels create unforgettable experiences together
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'The Rooftop Revolution: How Artists Are Redefining Hotel Experiences',
                excerpt: 'Explore how luxury hotels are partnering with world-class artists to create unique cultural experiences that guests will never forget.',
                image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                date: '2024-05-15'
              },
              {
                title: 'From Studio to Rooftop: A Pianist\'s Journey',
                excerpt: 'Follow Sophie Laurent as she performs at iconic hotels across Europe, bringing classical music to unexpected places.',
                image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
                date: '2024-04-22'
              },
              {
                title: 'Cultural Immersion: Artist Residencies That Transform Travel',
                excerpt: 'Learn how week-long artist residencies create deeper connections between travelers and local culture.',
                image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=800',
                date: '2024-03-10'
              },
              {
                title: 'The Art of Intimate Performance: Creating Magic in Small Spaces',
                excerpt: 'Discover how intimate performances create more meaningful connections between artists and audiences.',
                image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
                date: '2024-02-28'
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={storiesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-showcase group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden rounded-lg mb-4">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(story.date).toLocaleDateString()}
                </div>
                <h3 className="text-xl font-serif font-semibold text-navy mb-3 group-hover:text-gold transition-colors">
                  {story.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{story.excerpt}</p>
                <Link
                  to={`/stories/${index + 1}`}
                  className="inline-flex items-center text-gold font-semibold hover:text-navy transition-colors group"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-navy to-navy/90 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Experience Art in Luxury?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join our community of travelers, artists, and hotels creating unforgettable experiences together.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-gold text-lg px-8 py-4">
                Get Started
              </Link>
              <Link to="/top-artists" className="btn-gold-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-navy">
                Explore Artists
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

