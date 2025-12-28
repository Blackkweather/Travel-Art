import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import Footer from '@/components/Footer'
import { commonApi, tripsApi } from '@/utils/api'

const LandingPageNew: React.FC = () => {
  const { scrollY } = useScroll()
  const splitScreenRef = useRef<HTMLDivElement>(null)
  const experiencesRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Scroll effects
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState(0) // Track which keyword is active
  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  // In-view animations
  const splitScreenInView = useInView(splitScreenRef, { once: true, amount: 0.3 })
  const experiencesInView = useInView(experiencesRef, { once: true, amount: 0.2 })

  // Keywords with their images
  const keywords = [
    { 
      word: 'Exclusive', 
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80' 
    },
    { 
      word: 'Curated', 
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80' 
    },
    { 
      word: 'Unforgettable', 
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80' 
    }
  ]

  // Scroll-based keyword detection
  useEffect(() => {
    const handleScroll = () => {
      const section = splitScreenRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const scrollProgress = 1 - (rect.top / window.innerHeight)
      
      // Calculate which keyword should be active based on scroll
      if (scrollProgress < 0.3) {
        setActiveKeyword(0) // Exclusive
      } else if (scrollProgress < 0.6) {
        setActiveKeyword(1) // Curated
      } else {
        setActiveKeyword(2) // Unforgettable
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Data state
  const [experiences, setExperiences] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch experiences
        const tripsRes = await tripsApi.getAll({ status: 'PUBLISHED' })
        const trips = Array.isArray(tripsRes.data) ? tripsRes.data : []
        
        if (trips.length > 0) {
          const formatted = trips.slice(0, 6).map((trip: any) => {
            let images: string[] = []
            try {
              images = Array.isArray(trip.images) ? trip.images : 
                (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
            } catch (e) { images = [] }
            
            return {
              id: trip.id,
              title: trip.title || 'Experience',
              description: trip.description?.substring(0, 100) || '',
              image: images[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
              category: trip.type || 'Experience'
            }
          })
          setExperiences(formatted)
        }

        // Fetch artists
        const artistsRes = await commonApi.getTopArtists({ limit: 6 })
        if (artistsRes?.data?.success && artistsRes.data.data) {
          const apiArtists = Array.isArray(artistsRes.data.data) ? artistsRes.data.data.slice(0, 6) : []
          const formattedArtists = apiArtists.map((artist: any) => {
            let images: string[] = []
            try {
              images = Array.isArray(artist.images) ? artist.images : 
                (typeof artist.images === 'string' ? JSON.parse(artist.images) : [])
            } catch (e) { images = [] }
            
            return {
              id: artist.id,
              name: artist.user?.name || 'Artist',
              specialty: artist.discipline || 'Performer',
              image: images[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
              rating: artist.averageRating || 4.5
            }
          })
          setArtists(formattedArtists)
        }
      } catch (error) {
        console.warn('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  // Carousel scroll functions
  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = carouselRef.current
    if (!container) return
    const scrollAmount = 400
    container.scrollBy({ 
      left: direction === 'left' ? -scrollAmount : scrollAmount, 
      behavior: 'smooth' 
    })
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* HEADER - Club Med Style */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerScrolled 
            ? 'bg-navy/90 backdrop-blur-md shadow-lg py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-16 w-auto"
            />
          </Link>
          
          {/* Simplified Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/how-it-works" className="text-white hover:text-gold transition-colors font-medium">
              How it Works
            </Link>
            <Link to="/experiences" className="text-white hover:text-gold transition-colors font-medium">
              Experiences
            </Link>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-white hover:text-gold transition-colors font-medium hidden sm:block"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-gold text-navy px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition-all shadow-lg"
            >
              Join Now
            </Link>
          </div>
        </div>
      </motion.header>

      {/* HERO SECTION - Full Screen with Parallax */}
      <section className="relative h-screen flex items-center justify-start overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: heroY }}
        >
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80"
            alt="Artist performing"
            className="w-full h-full object-cover"
            style={{ minHeight: '100vh' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/60 to-transparent"></div>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          className="container mx-auto px-6 lg:px-12 relative z-10 max-w-4xl"
          style={{ opacity: heroOpacity }}
        >
          <motion.h1 
            className="text-5xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Where Creativity Meets Luxury.
          </motion.h1>
          
          <motion.p 
            className="text-xl lg:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            A platform connecting world-class artists with luxury hotels 
            to create unforgettable experiences.
          </motion.p>
          
          {/* Animated CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Link 
                to="/experiences"
                className="inline-flex items-center bg-gold text-navy px-8 py-4 rounded-full font-semibold text-lg hover:bg-gold/90 transition-all shadow-xl group"
              >
                Discover Experiences
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* SPLIT-SCREEN SECTION - "Residence Live" Style with Scroll Animations */}
      <section ref={splitScreenRef} className="grid lg:grid-cols-2 min-h-[85vh] rounded-3xl overflow-hidden">
        {/* Left Side - Text Content */}
        <motion.div 
          className="flex flex-col justify-center p-12 lg:p-20 bg-cream rounded-tl-3xl rounded-bl-3xl"
          initial={{ opacity: 0, x: -50 }}
          animate={splitScreenInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Yellow Label - Animates with scroll */}
          <motion.div
            className="inline-block mb-8"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={splitScreenInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="bg-gold text-navy px-6 py-4 font-bold text-2xl inline-block rounded-lg"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Travel Art Experience
            </motion.div>
          </motion.div>
          
          {/* Large Keywords with Highlight Effect */}
          <div className="space-y-4">
            {keywords.map((item, i) => (
              <motion.div
                key={item.word}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={splitScreenInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + (i * 0.1) }}
              >
                {/* Animated highlight box */}
                <motion.div
                  className="absolute -inset-2 bg-gold rounded-lg -z-10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: activeKeyword === i ? 0.3 : 0,
                    scale: activeKeyword === i ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <h2 className={`text-6xl lg:text-7xl font-serif font-bold leading-none transition-colors duration-500 ${
                  activeKeyword === i ? 'text-navy' : 'text-navy/40'
                }`}>
                  {item.word}
                </h2>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Right Side - Image with Transitions */}
        <motion.div 
          className="relative overflow-hidden rounded-tr-3xl rounded-br-3xl"
          initial={{ opacity: 0, x: 50 }}
          animate={splitScreenInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Multiple images that fade between each other */}
          {keywords.map((item, i) => (
            <motion.img
              key={i}
              src={item.image}
              alt={item.word}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{
                opacity: activeKeyword === i ? 1 : 0,
                scale: activeKeyword === i ? 1 : 1.1,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </section>

      {/* EXPERIENCES GRID */}
      <section ref={experiencesRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={experiencesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-serif font-bold text-navy mb-4">
              Immersive Experiences
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover unique artistic moments in luxury settings
            </p>
          </motion.div>

          {experiences.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {experiences.map((exp, index) => (
                <Link key={exp.id} to={`/experience/${exp.id}`}>
                  <motion.div
                    className="group cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={experiencesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                  >
                    <div className="relative h-80 overflow-hidden rounded-xl shadow-lg">
                      <img 
                        src={exp.image}
                        alt={exp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent"></div>
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 bg-gold text-navy px-4 py-2 rounded-full text-sm font-bold">
                        {exp.category}
                      </div>
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-serif font-bold mb-2">{exp.title}</h3>
                        <p className="text-sm opacity-90 line-clamp-2">{exp.description}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading experiences...</p>
            </div>
          )}
        </div>
      </section>

      {/* HORIZONTAL CAROUSEL - Artists */}
      <section className="py-24 bg-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-5xl font-serif font-bold text-navy">
              Featured Artists
            </h2>
            
            {/* Carousel Controls */}
            <div className="flex gap-4">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-14 h-14 rounded-full bg-gold text-navy flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-14 h-14 rounded-full bg-gold text-navy flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Container */}
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {artists.map((artist, index) => (
              <motion.div
                key={artist.id}
                className="flex-none w-80"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10 }}
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
                  <img 
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-2xl font-serif font-bold text-navy mb-2">
                    {artist.name}
                  </h3>
                  <p className="text-gold font-semibold mb-2">{artist.specialty}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-navy font-semibold">{artist.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <motion.footer 
        className="bg-navy text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-8">
              <Link to="/about" className="text-sm hover:text-gold transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-sm hover:text-gold transition-colors">
                Contact
              </Link>
              <Link to="/terms" className="text-sm hover:text-gold transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm hover:text-gold transition-colors">
                Privacy
              </Link>
            </div>
            <p className="text-xs opacity-70">
              © 2024 Travel Art. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default LandingPageNew

