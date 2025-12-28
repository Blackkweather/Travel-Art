import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { 
  ArrowRight, 
  Users, 
  MapPin, 
  Compass,
  ChevronRight,
  Heart,
  Award,
  Globe
} from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import { ArtistRank, getQuickRank } from '@/components/ArtistRank'
import Footer from '@/components/Footer'
import NewsletterSignup from '@/components/NewsletterSignup'
import { commonApi, tripsApi } from '@/utils/api'

const LandingPage: React.FC = () => {
  const { scrollY } = useScroll()
  const heroRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const experienceRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const showcaseRef = useRef<HTMLDivElement>(null)
  const journalRef = useRef<HTMLDivElement>(null)
  const topArtistsRef = useRef<HTMLDivElement>(null)
  const topHotelsRef = useRef<HTMLDivElement>(null)
  
  // Scroll-based animations - Transparent header
  const textColor = useTransform(scrollY, [0, 100], ['white', 'white'])
  
  // Hero parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Typing animation state
  const [currentWord, setCurrentWord] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const words = ['Hospitality', 'Luxury', 'Excellence', 'Perfection']

  // Typing effect
  useEffect(() => {
    const typeSpeed = 100
    const deleteSpeed = 50
    const pauseTime = 2000

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < words[currentWord].length) {
          setCurrentText(words[currentWord].slice(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentWord((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, currentWord, isDeleting, words])


  // In view animations
  const aboutInView = useInView(aboutRef, { once: true, margin: "-100px" })
  const experienceInView = useInView(experienceRef, { once: true, margin: "-100px" })
  const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" })
  const showcaseInView = useInView(showcaseRef, { once: true, margin: "-100px" })
  const journalInView = useInView(journalRef, { once: true, margin: "-100px" })
  const topArtistsInView = useInView(topArtistsRef, { once: true, margin: "-100px" })
  const topHotelsInView = useInView(topHotelsRef, { once: true, margin: "-100px" })

  // Helper function to infer category from trip title/description
  const inferCategory = (title: string, description: string): string => {
    const text = `${title} ${description}`.toLowerCase()
    
    if (text.match(/\b(jazz|music|saxophone|piano|guitar|dj|concert|performance|live music|rooftop jazz|musical|song|singer)\b/)) {
      return "Music"
    }
    if (text.match(/\b(art|gallery|visual|painting|sculpture|exhibition|artwork|canvas|artist)\b/)) {
      return "Visual Arts"
    }
    if (text.match(/\b(photography|photo|camera|sunset|capture|photographer|shoot|portrait)\b/)) {
      return "Photography"
    }
    if (text.match(/\b(theater|dance|performance|show|theatre|ballet|acting|drama)\b/)) {
      return "Performance"
    }
    if (text.match(/\b(culinary|cooking|chef|food|cuisine|kitchen|dining|gastronomy)\b/)) {
      return "Culinary"
    }
    if (text.match(/\b(wellness|spa|yoga|meditation|relaxation|mindfulness|massage|therapy)\b/)) {
      return "Wellness"
    }
    
    // Default to Music if no match
    return "Music"
  }

  // Experience grid data - fetched from database only (no fallback)
  const [experiences, setExperiences] = useState<any[]>([])

  // Steps data
  const steps = [
    {
      id: 1,
      icon: <Users className="w-8 h-8 text-gold" />,
      title: "Join Our Community",
      description: "Sign up as an artist or hotel partner and create your profile"
    },
    {
      id: 2,
      icon: <MapPin className="w-8 h-8 text-gold" />,
      title: "Discover & Connect",
      description: "Browse opportunities and connect with like-minded professionals"
    },
    {
      id: 3,
      icon: <Award className="w-8 h-8 text-gold" />,
      title: "Create Magic",
      description: "Book experiences and create unforgettable moments together"
    }
  ]

  // Showcase data - fetch from API only (no fallback)
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E'
  
  const [artists, setArtists] = useState<any[]>([])

  const hotelPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Crect x="150" y="80" width="100" height="140" rx="5"/%3E%3Crect x="170" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="170" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="175" y="190" width="50" height="30" rx="3"/%3E%3C/g%3E%3C/svg%3E'
  
  const [hotels, setHotels] = useState<any[]>([])

  // Fetch artists and hotels from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artistsRes, hotelsRes] = await Promise.all([
          commonApi.getTopArtists({ limit: 4 }).catch(() => null),
          commonApi.getTopHotels({ limit: 4 }).catch(() => null)
        ])

        if (artistsRes?.data?.success && artistsRes.data.data) {
          const apiArtists = Array.isArray(artistsRes.data.data) 
            ? artistsRes.data.data.slice(0, 4)
            : []
          
          if (apiArtists.length > 0) {
            const formattedArtists = apiArtists.map((artist: any) => {
              // Parse images if they're a string, otherwise use array directly
              let images: string[] = []
              if (artist.images) {
                try {
                  images = Array.isArray(artist.images) 
                    ? artist.images 
                    : (typeof artist.images === 'string' ? JSON.parse(artist.images) : [])
                } catch (e) {
                  images = []
                }
              }
              
              return {
                id: artist.id || artist.artistId || Math.random(),
                name: artist.user?.name || artist.name || 'Unknown Artist',
                specialty: artist.discipline || artist.specialty || 'Artist',
                image: images && images.length > 0 
                  ? images[0] 
                  : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E',
                rating: artist.averageRating || artist.rating || 4.5,
                bookings: artist.bookingCount || artist.totalBookings || 0,
                location: artist.user?.country || artist.location || 'Unknown'
              }
            })
            setArtists(formattedArtists)
          }
        }

        if (hotelsRes?.data?.success && hotelsRes.data.data) {
          const apiHotels = Array.isArray(hotelsRes.data.data)
            ? hotelsRes.data.data.slice(0, 4)
            : []
          
          if (apiHotels.length > 0) {
            const formattedHotels = apiHotels.map((hotel: any) => {
              // Parse location safely
              let location: any = {}
              if (hotel.location) {
                try {
                  location = typeof hotel.location === 'string' 
                    ? JSON.parse(hotel.location) 
                    : hotel.location
                } catch (e) {
                  location = {}
                }
              }
              
              // Parse images if they're a string, otherwise use array directly
              let images: string[] = []
              if (hotel.images) {
                try {
                  images = Array.isArray(hotel.images) 
                    ? hotel.images 
                    : (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : [])
                } catch (e) {
                  images = []
                }
              }
              
              return {
                id: hotel.id || Math.random(),
                name: hotel.name || 'Hotel',
                location: location.city 
                  ? `${location.city}, ${location.country || ''}`.trim()
                  : (location.country || hotel.user?.country || 'Unknown'),
                image: images && images.length > 0
                  ? images[0]
                  : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Crect x="150" y="80" width="100" height="140" rx="5"/%3E%3Crect x="170" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="170" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="175" y="190" width="50" height="30" rx="3"/%3E%3C/g%3E%3C/svg%3E',
                rating: hotel.averageRating || hotel.rating || 4.5,
                features: Array.isArray(hotel.performanceSpots) && hotel.performanceSpots.length > 0
                  ? hotel.performanceSpots.slice(0, 3).map((spot: any) => spot.name || spot)
                  : []
              }
            })
            setHotels(formattedHotels)
          }
        }
        } catch (error) {
        // Silently fail - no fallback data
        console.warn('Failed to fetch landing page data:', error)
      }
    }

    fetchData()
  }, [])

  // Fetch experiences from trips API
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const res = await tripsApi.getAll({ status: 'PUBLISHED' })
        
        // The trips API returns an array directly (not wrapped in success/data)
        const trips = Array.isArray(res.data) ? res.data : []
        
        if (trips.length > 0) {
          // Map trips to experiences format
          const formattedExperiences = trips.slice(0, 6).map((trip: any) => {
            // Parse images array
            let images: string[] = []
            try {
              images = Array.isArray(trip.images) 
                ? trip.images 
                : (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
            } catch (e) {
              images = []
            }
            
            const category = inferCategory(trip.title || '', trip.description || '')
            
            // Only use image if it exists in database
            const image = images && images.length > 0 
              ? images[0] 
              : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Crect x="150" y="80" width="100" height="140" rx="5"/%3E%3C/g%3E%3C/svg%3E'
            
            // Create short description from full description (first 50 chars)
            const shortDescription = trip.description 
              ? (trip.description.length > 50 ? trip.description.substring(0, 50) + '...' : trip.description)
              : 'An amazing artistic experience'
            
            return {
              id: trip.id || String(Math.random()),
              title: trip.title || 'Experience',
              description: shortDescription,
              image: image,
              category: category
            }
          })
          
          if (formattedExperiences.length > 0) {
            setExperiences(formattedExperiences)
          }
        }
        } catch (error) {
        // Silently fail - no fallback data
        console.warn('Failed to fetch experiences from trips API:', error)
      }
    }

    fetchExperiences()
  }, [])

  // Journal stories data - no static fallback (will be fetched from DB in future)
  const stories: any[] = []

  return (
    <div className="min-h-screen bg-cream">
      {/* Transparent Navigation */}
      {/* Header */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10 px-5 md:px-20 h-[55px]"
        style={{
          background: 'transparent',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-12 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8 flex-wrap justify-center">
            <motion.div style={{ color: textColor }}>
              <Link to="/how-it-works" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                How it Works
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/partners" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                Partners
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/pricing" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                Pricing
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-artists" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                Top Artists
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-hotels" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                Top Hotels
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/experiences" className="hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap">
                Experiences
              </Link>
            </motion.div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.div style={{ color: textColor }}>
              <Link to="/login" className="hover:text-gold transition-colors font-medium text-sm px-4 py-2">
                Sign In
              </Link>
            </motion.div>
            <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-sm shadow-lg">
              Join
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Full Screen with Parallax */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: heroY }}
        >
          {/* Background Image - Optimized size and preloaded */}
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=75"
            alt="Luxury hotel rooftop"
            className="w-full h-full object-cover"
            style={{ minHeight: '100vh' }}
            fetchPriority="high"
            onError={(e) => {
              // Fallback to gradient if image fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const gradientDiv = target.nextElementSibling as HTMLElement
              if (gradientDiv) gradientDiv.style.display = 'block'
            }}
          />
          <div 
            className="w-full h-full bg-gradient-to-br from-navy via-navy/90 to-gold/20"
            style={{ 
              minHeight: '100vh',
              display: 'none'
            }}
          />
          {/* Gradient Overlay - Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/70 via-navy/60 to-gold/20"></div>
          {/* Additional subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/20 via-transparent to-gold/10"></div>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          style={{ opacity: heroOpacity }}
        >
          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-4 h-4 bg-gold/30 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-6 h-6 bg-white/20 rounded-full"
              animate={{
                y: [0, 15, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-3 h-3 bg-gold/40 rounded-full"
              animate={{
                y: [0, -25, 0],
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
              Where Creativity Meets
              <span className="block text-gold mt-2 sm:mt-4">
                {currentText}
                <span className="animate-pulse text-gold">|</span>
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              Connect luxury hotels with talented artists for unforgettable rooftop performances, 
              intimate concerts, and magical experiences that inspire and delight.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register?role=artist" className="w-full sm:w-auto bg-gold text-navy px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-300 text-base sm:text-lg shadow-lg flex items-center justify-center group">
                  Join as Artist
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register?role=hotel" className="w-full sm:w-auto border-2 border-gold text-gold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold hover:bg-gold hover:text-navy transition-all duration-300 text-base sm:text-lg flex items-center justify-center group">
                  Join as Hotel
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* About/Story Section - 60/40 Split */}
      <section ref={aboutRef} className="py-12 sm:py-16 md:py-20 lg:py-24 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 sm:gap-12 items-center">
            {/* Text Content - 60% */}
            <motion.div 
              className="lg:col-span-3 order-2 lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="gold-underline mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-navy mb-2 sm:mb-4">
                  We Love Artists
                </h2>
              </div>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                At Travel Art, we believe that exceptional hospitality and artistic talent create 
                the most memorable experiences. Our platform connects world-class artists with 
                luxury hotels to create moments that guests will treasure forever.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                From intimate jazz sessions on Parisian rooftops to sunset photography workshops 
                in Tokyo, we curate experiences that celebrate creativity and bring communities together.
              </p>
              <Link to="/how-it-works" className="btn-primary inline-flex items-center text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                Learn More
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </motion.div>

            {/* Image Content - 40% */}
            <motion.div 
              className="lg:col-span-2 order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl shadow-luxury overflow-hidden">
                {artists.length > 0 && artists[0]?.image ? (
                  <img 
                    src={artists[0].image} 
                    alt="Featured Artist"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy/20 to-gold/10 flex items-center justify-center">
                    <img 
                      src="data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E"
                      alt="Artist Placeholder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Experience Grid - 3x2 */}
      <section ref={experienceRef} className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={experienceInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Immersive Experiences</h2>
            <p className="section-subtitle">
              Discover the diverse range of artistic experiences we create with our partner hotels
            </p>
          </motion.div>

          {experiences.length > 0 ? (
            <div className="experience-grid" data-testid="feature-grid">
              {experiences.map((experience, index) => (
              <Link
                key={experience.id}
                to={`/experience/${experience.id}`}
                className="block"
              >
                <motion.div
                  className="card-experience group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={experienceInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={experience.image} 
                      alt={experience.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-gold text-navy px-3 py-1 rounded-full text-sm font-bold">
                      {experience.category}
                    </div>
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-xl font-serif font-bold mb-2">{experience.title}</h3>
                      <p className="text-sm opacity-90">{experience.description}</p>
                      <button 
                        className="mt-3 bg-gold text-navy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors"
                      >
                        Discover More
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Check back soon to discover our immersive experiences.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works - Three Steps */}
      <section ref={stepsRef} className="py-24 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to start creating extraordinary experiences
            </p>
          </motion.div>

          <div className="relative">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
              <motion.div
                  key={step.id}
                  className="relative"
                initial={{ opacity: 0, y: 30 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="card-luxury text-center group hover:scale-105 transition-all duration-300">
                    <div className="mb-6 flex justify-center">
                      <div className="p-4 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 group-hover:from-gold/30 group-hover:to-gold/10 transition-all duration-300">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-navy mb-4 group-hover:text-gold transition-colors duration-300">
                      {step.title}
                </h3>
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Step Connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block step-connector"></div>
                  )}
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Carousel - Artists */}
      <section ref={showcaseRef} className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={showcaseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Featured Artists</h2>
            <p className="section-subtitle">
              Meet the talented artists creating unforgettable experiences
            </p>
          </motion.div>

          {artists.length > 0 ? (
            <div className="carousel-container">
              <div className="carousel-track carousel-auto-scroll">
                {[...artists, ...artists].map((artist, index) => (
                <div key={`${artist.id}-${index}`} className="carousel-item w-80">
                  <div className="card-showcase">
                    <div className="relative mb-4">
                      <img 
                        src={artist.image} 
                        alt={artist.name}
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Cg transform="translate(200 200)"%3E%3Ccircle fill="%239ca3af" opacity="0.2" r="80"/%3E%3Cpath fill="%239ca3af" d="M0-40c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 120c-30 0-80 15-80 45v20h160v-20c0-30-50-45-80-45z"/%3E%3C/g%3E%3C/svg%3E'
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full flex items-center space-x-2">
                        <ArtistRank tier={getQuickRank(artist.rating, artist.bookings)} size="sm" />
                        <span className="text-sm font-semibold text-navy">{artist.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">{artist.name}</h3>
                    <p className="text-gold font-semibold mb-2">{artist.specialty}</p>
                    <p className="text-gray-600 text-sm">{artist.location}</p>
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Check back soon to discover our featured artists.</p>
            </div>
          )}
        </div>
      </section>

      {/* Showcase Carousel - Hotels */}
      <section className="py-24 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={showcaseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Partner Hotels</h2>
            <p className="section-subtitle">
              Luxury hotels creating extraordinary guest experiences
            </p>
          </motion.div>

          {hotels.length > 0 ? (
            <div className="carousel-container">
              <div className="carousel-track carousel-auto-scroll" style={{ animationDirection: 'reverse' }}>
                {[...hotels, ...hotels].map((hotel, index) => (
                <div key={`${hotel.id}-${index}`} className="carousel-item w-64 flex-shrink-0">
                  <div className="card-showcase h-full flex flex-col">
                    <div className="relative mb-4">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Crect x="150" y="80" width="100" height="140" rx="5"/%3E%3Crect x="170" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="100" width="20" height="30" fill="%23fff"/%3E%3Crect x="170" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="210" y="150" width="20" height="30" fill="%23fff"/%3E%3Crect x="175" y="190" width="50" height="30" rx="3"/%3E%3C/g%3E%3C/svg%3E'
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-navy flex items-center space-x-1">
                        <span className="text-gold font-bold">◆</span>
                        <span>{hotel.rating}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-navy mb-2">{hotel.name}</h3>
                        <p className="text-gold font-semibold mb-3">{hotel.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hotel.features.map((feature, idx) => (
                          <span key={idx} className="bg-gold/20 text-navy px-2 py-1 rounded text-xs font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Check back soon to discover our partner hotels.</p>
            </div>
          )}
        </div>
      </section>

      {/* Journal/Stories Section */}
      {stories.length > 0 && (
        <section ref={journalRef} className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={journalInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Backstage Stories</h2>
            <p className="section-subtitle">
              Behind the scenes of our most memorable experiences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                className="card-experience group"
                initial={{ opacity: 0, y: 30 }}
                animate={journalInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-gold text-navy px-3 py-1 rounded-full text-sm font-bold">
                    {story.category}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-xs opacity-80 mb-2">{story.date}</p>
                    <h3 className="text-lg font-serif font-bold mb-2 group-hover:text-gold transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-sm opacity-90">{story.excerpt}</p>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Artists Section */}
      <section ref={topArtistsRef} className="py-24 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={topArtistsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Top Artists</h2>
            <p className="section-subtitle">
              Our most booked and highly rated artists
            </p>
          </motion.div>

          {artists.length > 0 ? (
            <div className="carousel-container">
              <div className="carousel-track carousel-auto-scroll">
                {[...artists, ...artists].map((artist, index) => (
                <div key={`top-${artist.id}-${index}`} className="carousel-item w-80">
                  <div className="card-showcase relative">
                    <div className="relative mb-4">
                      <img 
                        src={artist.image} 
                        alt={artist.name}
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full flex items-center space-x-2">
                        <ArtistRank tier={getQuickRank(artist.rating, artist.bookings)} size="sm" />
                        <span className="text-sm font-semibold text-navy">{artist.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">{artist.name}</h3>
                    <p className="text-gold font-semibold mb-2">{artist.specialty}</p>
                    <p className="text-gray-600 text-sm">{artist.location}</p>
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Check back soon to discover our top artists.</p>
            </div>
          )}
        </div>
      </section>

      {/* Top Hotels Section */}
      <section ref={topHotelsRef} className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={topHotelsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Top Hotels</h2>
            <p className="section-subtitle">
              Luxury hotels creating exceptional guest experiences
            </p>
          </motion.div>

          {hotels.length > 0 ? (
            <div className="carousel-container">
              <div className="carousel-track carousel-auto-scroll" style={{ animationDirection: 'reverse' }}>
                {[...hotels, ...hotels].map((hotel, index) => (
                <div key={`top-hotel-${hotel.id}-${index}`} className="carousel-item w-80">
                  <div className="card-showcase relative">
                    <div className="relative mb-4">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-navy flex items-center space-x-1">
                        <span className="text-gold font-bold">◆</span>
                        <span>{hotel.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">{hotel.name}</h3>
                    <p className="text-gold font-semibold mb-2">{hotel.location}</p>
                    <div className="flex flex-wrap gap-1">
                      {hotel.features.map((feature, idx) => (
                        <span key={idx} className="bg-gold/20 text-navy px-2 py-1 rounded text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Check back soon to discover our top hotels.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-cream">
        <NewsletterSignup variant="banner" />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage