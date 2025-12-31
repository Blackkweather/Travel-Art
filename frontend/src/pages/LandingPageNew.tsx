import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import Footer from '@/components/Footer'
import { commonApi, tripsApi } from '@/utils/api'

const LandingPageNew: React.FC = () => {
  const { scrollY } = useScroll()
  const experiencesRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const stickyContainerRef = useRef<HTMLDivElement>(null)

  // Scroll effects
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState(0) // Track which keyword is active
  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  // In-view animations
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

  // We Love tags for infinite scroll
  const weLovetags = ['MUSIC', 'ART', 'TRAVEL', 'LUXURY', 'CULTURE', 'EXPERIENCE', 'CREATIVITY', 'PERFORMANCE']

  // Scroll detection for sticky section
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const rect = scrollContainer.getBoundingClientRect()
      const sectionTop = rect.top
      const sectionHeight = rect.height
      const viewportHeight = window.innerHeight

      // Calculate scroll progress through the section
      const progress = Math.max(0, Math.min(1, 
        (viewportHeight - sectionTop) / (sectionHeight + viewportHeight)
      ))

      // Determine active section based on progress
      if (progress < 0.33) {
        setActiveKeyword(0)
      } else if (progress < 0.66) {
        setActiveKeyword(1)
      } else {
        setActiveKeyword(2)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
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
    <div className="min-h-screen bg-cream overflow-x-hidden">
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
            A platform connecting talented hearts with luxury hotels 
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white" />
        </div>
      </section>

      {/* WE LOVE SECTION - Infinite Scroll */}
      <section className="py-20 bg-cream overflow-hidden">
        <h2 className="text-5xl md:text-6xl font-serif font-bold text-center mb-12 text-navy">We love</h2>
        
        {/* Two rows of infinite scrolling tags */}
        <div className="space-y-6">
          {/* Row 1 - Scroll Right */}
          <div className="flex animate-scroll-right">
            {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
              <div key={i} className="flex-shrink-0 text-4xl md:text-5xl font-bold text-navy mx-8">
                {tag}
              </div>
            ))}
          </div>

          {/* Row 2 - Scroll Left */}
          <div className="flex animate-scroll-left">
            {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
              <div key={i} className="flex-shrink-0 text-4xl md:text-5xl font-bold text-navy mx-8">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESCRIPTION SECTION */}
      <section className="py-20 px-6 max-w-5xl mx-auto bg-white">
        <p className="text-xl md:text-2xl leading-relaxed text-gray-800 text-center">
          Travel Art is founded on the idea that travel and cultural immersion are at the origin of inspiration. 
          We connect talented hearts with luxury hotels to create unforgettable experiences. Our platform 
          brings together a community of artists and creatives across multiple disciplines (Music, Visual Arts, 
          Performance) to develop their artistic projects in over 30 destinations worldwide, combining travel 
          and creation in the most beautiful places on earth.
        </p>
      </section>

      {/* STICKY SPLIT-SCREEN SECTION - The Key Section */}
      <section ref={scrollContainerRef} className="relative bg-white" style={{ height: '300vh', minHeight: '300vh' }}>
        <div 
          ref={stickyContainerRef}
          className="sticky top-0 left-0 right-0 h-screen grid md:grid-cols-2"
        >
          {/* LEFT SIDE - Text */}
          <div className="flex flex-col justify-center px-12 md:px-20 bg-white">
            <div className="space-y-12">
              {keywords.map((section, index) => (
                <div key={index} className="relative">
                  <h3 
                    className={`text-5xl md:text-6xl lg:text-7xl font-bold transition-all duration-700 ${
                      activeKeyword === index 
                        ? 'text-gray-900 opacity-100' 
                        : 'text-gray-900 opacity-20'
                    }`}
                  >
                    {section.word}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE - Images */}
          <div className="relative overflow-hidden bg-gray-900">
            {keywords.map((section, index) => (
              <div
                key={index}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: activeKeyword === index ? 1 : 0,
                  zIndex: activeKeyword === index ? 1 : 0
                }}
              >
                <img
                  src={section.image}
                  alt={section.word}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCES GRID */}
      <section ref={experiencesRef} className="py-24 bg-gradient-to-b from-cream via-white to-cream">
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
                    <span className="text-amber-500">★</span>
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

      {/* Infinite Scroll Animations */}
      <style>{`
        @keyframes scroll-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        
        @keyframes scroll-left {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
        
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
        
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LandingPageNew

