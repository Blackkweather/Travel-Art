import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, Users, Globe, Clock, ArrowLeft, Award, Camera } from 'lucide-react'
import Header from '../components/Header'
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
        setError('Experience ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await tripsApi.getById(id)
        
        if (res.data?.success && res.data.data) {
          const trip = res.data.data
          const location = trip.location 
            ? (typeof trip.location === 'string' ? JSON.parse(trip.location) : trip.location)
            : { city: 'Unknown', country: '', lat: 0, lng: 0 }
          
          const images = Array.isArray(trip.images) ? trip.images : 
            (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
          
          setExperience({
            id: trip.id,
            title: trip.title || 'Experience',
            location: {
              city: location.city || 'Unknown',
              country: location.country || '',
              lat: location.lat || 0,
              lng: location.lng || 0
            },
            artist: trip.artist?.user?.name || trip.artistName || 'Artist',
            hotel: trip.hotel?.name || trip.hotelName || 'Hotel',
            date: trip.startDate || trip.date || new Date().toISOString().split('T')[0],
            image: images[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop',
            type: trip.type || 'intimate',
            rating: trip.averageRating || trip.rating || 4.5,
            description: trip.description || trip.summary || 'An amazing experience awaits.',
            fullDescription: trip.fullDescription || trip.description || trip.summary || 'An amazing experience awaits.',
            duration: trip.duration || '2 hours',
            capacity: trip.capacity || '50 guests',
            price: trip.price || '€150 per person',
            includes: trip.includes || [
              'Welcome reception',
              'Performance',
              'Refreshments',
              'Venue access'
            ],
            schedule: trip.schedule || [],
            artistBio: trip.artist?.bio || trip.artistBio || 'Talented artist with years of experience.',
            venueDetails: trip.venueDetails || trip.hotel?.description || 'Beautiful venue setting.',
            reviews: trip.reviews || []
          })
        } else {
          setError('Experience not found')
        }
      } catch (err: any) {
        console.error('Error fetching experience:', err)
        setError('Failed to load experience. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchExperience()
  }, [id])

  // Fallback experience data (for reference, not used if API works)
  const fallbackExperiences: Record<string, any> = {
    '1': {
      id: '1',
      title: 'Sunset Jazz on the Rooftop',
      location: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
      artist: 'Sophie Laurent',
      hotel: 'Hotel Plaza Athénée',
      date: '2024-06-15',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop',
      type: 'rooftop',
      rating: 4.9,
      description: 'An intimate jazz performance overlooking the Eiffel Tower at sunset.',
      fullDescription: 'Experience the magic of Paris from the rooftop of Hotel Plaza Athénée as acclaimed jazz pianist Sophie Laurent performs an intimate sunset concert. This exclusive event combines world-class music with breathtaking views of the Eiffel Tower, creating an unforgettable evening of art and luxury. The performance features a curated selection of jazz standards and original compositions, perfectly timed to coincide with the golden hour over the City of Light.',
      duration: '2 hours',
      capacity: '50 guests',
      price: '€150 per person',
      includes: [
        'Welcome champagne reception',
        '2-hour jazz performance',
        'Complimentary hors d\'oeuvres',
        'Premium bar service',
        'Exclusive rooftop access',
        'Meet & greet with the artist'
      ],
      schedule: [
        { time: '7:00 PM', activity: 'Welcome reception with champagne' },
        { time: '7:30 PM', activity: 'Performance begins' },
        { time: '8:30 PM', activity: 'Intermission with refreshments' },
        { time: '8:45 PM', activity: 'Second set performance' },
        { time: '9:30 PM', activity: 'Meet & greet with Sophie Laurent' }
      ],
      artistBio: 'Sophie Laurent is an internationally acclaimed jazz pianist known for her emotive performances and innovative interpretations of classic standards. With over 15 years of experience, she has performed at prestigious venues across Europe and collaborated with renowned musicians worldwide.',
      venueDetails: 'The rooftop terrace offers panoramic views of Paris, including the Eiffel Tower, Champs-Élysées, and the Seine River. The intimate setting features comfortable seating, ambient lighting, and state-of-the-art sound system.',
      reviews: [
        { author: 'Marie Dubois', rating: 5, comment: 'Absolutely magical evening! The music, the views, everything was perfect.' },
        { author: 'James Wilson', rating: 5, comment: 'Sophie\'s performance was breathtaking. A truly unforgettable experience.' },
        { author: 'Emma Thompson', rating: 4, comment: 'Beautiful setting and wonderful music. Highly recommend!' }
      ]
    },
    '2': {
      id: '2',
      title: 'Flamenco Workshop & Performance',
      location: { city: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
      artist: 'Isabella Garcia',
      hotel: 'Hotel Arts Barcelona',
      date: '2024-07-20',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&h=600&fit=crop',
      type: 'workshop',
      rating: 4.8,
      description: 'Learn flamenco with a master dancer, followed by an evening performance.',
      fullDescription: 'Immerse yourself in the passionate world of flamenco with master dancer Isabella Garcia. This unique experience begins with an interactive workshop where you\'ll learn the basics of flamenco dance, followed by an intimate evening performance showcasing the art form\'s raw emotion and technical brilliance. Set in the elegant Hotel Arts Barcelona, this cultural immersion offers both learning and entertainment.',
      duration: '4 hours (2-hour workshop + 2-hour performance)',
      capacity: '30 participants',
      price: '€200 per person',
      includes: [
        '2-hour flamenco dance workshop',
        'Evening flamenco performance',
        'Traditional Spanish tapas',
        'Wine tasting',
        'Flamenco accessories (castanets, fan)',
        'Photo opportunities with the artist'
      ],
      schedule: [
        { time: '4:00 PM', activity: 'Workshop begins - Introduction to flamenco' },
        { time: '5:00 PM', activity: 'Basic steps and rhythm practice' },
        { time: '6:00 PM', activity: 'Break with tapas and wine' },
        { time: '7:00 PM', activity: 'Evening performance begins' },
        { time: '8:00 PM', activity: 'Q&A session with Isabella Garcia' }
      ],
      artistBio: 'Isabella Garcia is a celebrated flamenco dancer from Seville with over 20 years of professional experience. She has performed at major festivals worldwide and is known for her powerful, authentic interpretations of traditional and contemporary flamenco.',
      venueDetails: 'The hotel\'s grand ballroom provides an intimate yet elegant setting for the workshop and performance, with traditional Spanish decor and excellent acoustics.',
      reviews: [
        { author: 'Carlos Mendez', rating: 5, comment: 'Incredible experience! Isabella is a true master. The workshop was so much fun!' },
        { author: 'Sarah Johnson', rating: 5, comment: 'One of the best cultural experiences I\'ve had. Highly recommend!' },
        { author: 'Michael Brown', rating: 4, comment: 'Great workshop and amazing performance. Very authentic.' }
      ]
    },
    '3': {
      id: '3',
      title: 'Mediterranean Piano Serenade',
      location: { city: 'Nice', country: 'France', lat: 43.7102, lng: 7.2620 },
      artist: 'Marco Silva',
      hotel: 'Hotel Negresco',
      date: '2024-08-10',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=600&fit=crop',
      type: 'intimate',
      rating: 4.9,
      description: 'Classical piano in an intimate setting with Mediterranean views.',
      fullDescription: 'Enjoy an elegant evening of classical piano music performed by virtuoso Marco Silva in the intimate setting of Hotel Negresco\'s garden terrace. Overlooking the Mediterranean Sea, this performance features a carefully curated program of classical masterpieces, from Chopin to Debussy, creating a serene and sophisticated atmosphere perfect for a romantic evening.',
      duration: '2.5 hours',
      capacity: '40 guests',
      price: '€180 per person',
      includes: [
        'Welcome aperitif',
        '2-hour classical piano performance',
        'Gourmet canapés',
        'Premium wine selection',
        'Garden terrace access',
        'Program booklet with composer notes'
      ],
      schedule: [
        { time: '7:30 PM', activity: 'Welcome aperitif on the terrace' },
        { time: '8:00 PM', activity: 'First set: Romantic era compositions' },
        { time: '8:45 PM', activity: 'Intermission with refreshments' },
        { time: '9:00 PM', activity: 'Second set: French impressionist works' },
        { time: '9:45 PM', activity: 'Encore and mingling' }
      ],
      artistBio: 'Marco Silva is a classically trained pianist from Portugal, specializing in Romantic and Impressionist repertoire. He has performed at major concert halls across Europe and is known for his sensitive interpretations and technical mastery.',
      venueDetails: 'The garden terrace offers stunning views of the Mediterranean Sea and the French Riviera coastline, with elegant outdoor seating and ambient lighting creating a magical atmosphere.',
      reviews: [
        { author: 'Pierre Dubois', rating: 5, comment: 'Absolutely beautiful! Marco\'s playing was exquisite and the setting was perfect.' },
        { author: 'Anna Schmidt', rating: 5, comment: 'A truly magical evening. The music and the views were breathtaking.' },
        { author: 'Robert Taylor', rating: 4, comment: 'Wonderful performance in a beautiful setting. Highly recommend!' }
      ]
    },
    '4': {
      id: '4',
      title: 'Artist Residency: Marrakech',
      location: { city: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
      artist: 'Jean-Michel Dubois',
      hotel: 'La Mamounia',
      date: '2024-09-05',
      image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&h=600&fit=crop',
      type: 'residency',
      rating: 5.0,
      description: 'A week-long residency featuring daily performances and cultural immersion.',
      fullDescription: 'Join acclaimed multi-instrumentalist Jean-Michel Dubois for an immersive week-long residency at the iconic La Mamounia hotel in Marrakech. This unique experience combines daily musical performances with cultural workshops, traditional Moroccan music sessions, and opportunities to explore the rich artistic heritage of Morocco. Each day features different musical styles, from traditional Berber music to contemporary fusion.',
      duration: '7 days',
      capacity: '25 participants',
      price: '€1,200 per person (all-inclusive)',
      includes: [
        '7 nights accommodation at La Mamounia',
        'Daily musical performances',
        'Traditional music workshops',
        'Cultural tours of Marrakech',
        'All meals (breakfast, lunch, dinner)',
        'Traditional hammam spa experience',
        'Airport transfers',
        'Welcome and farewell receptions'
      ],
      schedule: [
        { time: 'Day 1', activity: 'Arrival, welcome reception, evening performance' },
        { time: 'Day 2', activity: 'Morning workshop, afternoon cultural tour, evening performance' },
        { time: 'Day 3', activity: 'Traditional Berber music session, hammam experience' },
        { time: 'Day 4', activity: 'Atlas Mountains excursion, sunset performance' },
        { time: 'Day 5', activity: 'Souk exploration, fusion music workshop' },
        { time: 'Day 6', activity: 'Collaborative performance with local musicians' },
        { time: 'Day 7', activity: 'Farewell brunch and final performance' }
      ],
      artistBio: 'Jean-Michel Dubois is a versatile musician known for blending Western classical music with traditional North African and Middle Eastern sounds. His innovative approach has earned him international recognition and numerous awards.',
      venueDetails: 'La Mamounia\'s historic palace setting provides multiple performance spaces, from intimate courtyards to grand halls, each offering unique acoustics and atmosphere.',
      reviews: [
        { author: 'Fatima Alami', rating: 5, comment: 'An absolutely transformative experience! The music, the culture, everything was perfect.' },
        { author: 'David Chen', rating: 5, comment: 'Best cultural immersion I\'ve ever had. Jean-Michel is incredible!' },
        { author: 'Lisa Anderson', rating: 5, comment: 'Life-changing week! The combination of music and culture was magical.' }
      ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading experience...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-navy mb-4">Experience Not Found</h1>
          <p className="text-gray-600 mb-8">The experience you're looking for doesn't exist.</p>
          <Link to="/experiences" className="btn-primary">
            Back to Experiences
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
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
            <span className="inline-block px-4 py-2 bg-gold/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4 capitalize">
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
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiences
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
              <h2 className="text-3xl font-serif font-bold text-navy mb-4 gold-underline">
                About This Experience
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {experience.fullDescription}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-xl font-bold text-navy">{experience.rating}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-sm font-bold text-navy">{experience.duration}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="text-sm font-bold text-navy">{experience.capacity}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-sm font-bold text-navy">{experience.price}</p>
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
              <h2 className="text-3xl font-serif font-bold text-navy mb-6 gold-underline">
                Schedule
              </h2>
              <div className="space-y-4">
                {experience.schedule.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-24 text-gold font-semibold">
                      {item.time}
                    </div>
                    <div className="flex-1 text-gray-600">
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
              <h2 className="text-3xl font-serif font-bold text-navy mb-6 gold-underline">
                What's Included
              </h2>
              <ul className="space-y-3">
                {experience.includes.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gold rounded-full"></div>
                    </div>
                    <span className="text-gray-600">{item}</span>
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
              <h2 className="text-3xl font-serif font-bold text-navy mb-4 gold-underline">
                About the Artist
              </h2>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Music className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                    {experience.artist}
                  </h3>
                  <p className="text-gray-600">{experience.artistBio}</p>
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
              <h2 className="text-3xl font-serif font-bold text-navy mb-6 gold-underline">
                Guest Reviews
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
                              i < review.rating ? 'text-gold fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-navy">{review.author}</span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
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
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gold" />
                </div>
                <div className="text-2xl font-bold text-navy mb-2">
                  {new Date(experience.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-gray-600 mb-6">
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
                <div className="p-4 bg-gold/10 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-navy">{experience.duration}</p>
                </div>
                <div className="p-4 bg-gold/10 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="font-semibold text-navy">{experience.capacity}</p>
                </div>
                <div className="p-4 bg-gold/10 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="font-semibold text-navy text-lg">{experience.price}</p>
                </div>
              </div>

              <button className="w-full btn-primary text-lg py-4">
                Book This Experience
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-navy mb-3">Venue Details</h4>
                <div className="flex items-start gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{experience.hotel}</p>
                </div>
                <p className="text-sm text-gray-600">{experience.venueDetails}</p>
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

