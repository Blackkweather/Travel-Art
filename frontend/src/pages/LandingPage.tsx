import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { 
  ArrowRight, 
  Users, 
  MapPin, 
  Compass,
  Star,
  ChevronRight,
  Heart,
  Award,
  Globe
} from 'lucide-react'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'

const LandingPage: React.FC = () => {
  const { scrollY } = useScroll()
  const heroRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const experienceRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const showcaseRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const journalRef = useRef<HTMLDivElement>(null)
  const topArtistsRef = useRef<HTMLDivElement>(null)
  const topHotelsRef = useRef<HTMLDivElement>(null)
  
  // Scroll-based animations
  const headerBackground = useTransform(scrollY, [0, 100], ['rgba(11, 31, 63, 0.1)', 'rgba(11, 31, 63, 0.1)'])
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
  const pricingInView = useInView(pricingRef, { once: true, margin: "-100px" })
  const journalInView = useInView(journalRef, { once: true, margin: "-100px" })
  const topArtistsInView = useInView(topArtistsRef, { once: true, margin: "-100px" })
  const topHotelsInView = useInView(topHotelsRef, { once: true, margin: "-100px" })

  // Experience grid data
  const experiences = [
    {
      id: 1,
      title: "Rooftop Jazz Sessions",
      description: "Intimate performances under the stars",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Music"
    },
    {
      id: 2,
      title: "Art Gallery Exhibitions",
      description: "Curated visual experiences",
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Visual Arts"
    },
    {
      id: 3,
      title: "Sunset Photography",
      description: "Capture magical moments",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Photography"
    },
    {
      id: 4,
      title: "Live Performances",
      description: "Theater and dance shows",
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Performance"
    },
    {
      id: 5,
      title: "Culinary Arts",
      description: "Interactive cooking experiences",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Culinary"
    },
    {
      id: 6,
      title: "Wellness Sessions",
      description: "Mindfulness and relaxation",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      category: "Wellness"
    }
  ]

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

  // Showcase data
  const artists = [
    {
      id: 1,
      name: "Elena Rodriguez",
      specialty: "Jazz Saxophonist",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      location: "Paris, France"
    },
    {
      id: 2,
      name: "Marcus Chen",
      specialty: "Visual Artist",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      location: "Tokyo, Japan"
    },
    {
      id: 3,
      name: "Sophie Laurent",
      specialty: "Photographer",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      location: "New York, USA"
    },
    {
      id: 4,
      name: "David Kim",
      specialty: "DJ & Producer",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
      location: "Ibiza, Spain"
    }
  ]

  const hotels = [
    {
      id: 1,
      name: "The Ritz Paris",
      location: "Paris, France",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
      features: ["Rooftop Terrace", "Art Gallery", "Live Music"]
    },
    {
      id: 2,
      name: "Aman Tokyo",
      location: "Tokyo, Japan",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      features: ["Sky Lounge", "Cultural Events", "Wellness Center"]
    },
    {
      id: 3,
      name: "The Plaza New York",
      location: "New York, USA",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      features: ["Grand Ballroom", "Art Collection", "Live Performances"]
    },
    {
      id: 4,
      name: "Ushuaïa Ibiza",
      location: "Ibiza, Spain",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
      features: ["Beach Club", "DJ Sets", "Sunset Views"]
    }
  ]

  // Journal stories data
  const stories = [
    {
      id: 1,
      title: "Behind the Scenes: Jazz at The Ritz",
      excerpt: "Discover how Elena Rodriguez created an unforgettable rooftop jazz experience...",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      category: "Music",
      date: "Dec 15, 2024"
    },
    {
      id: 2,
      title: "Art Meets Hospitality in Tokyo",
      excerpt: "Marcus Chen's visual art exhibition transformed Aman Tokyo's lobby...",
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      category: "Visual Arts",
      date: "Dec 12, 2024"
    },
    {
      id: 3,
      title: "Sunset Photography Masterclass",
      excerpt: "Sophie Laurent's photography workshop captured magical moments...",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      category: "Photography",
      date: "Dec 10, 2024"
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Transparent Navigation */}
      {/* Header */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10"
        style={{
          background: headerBackground,
          padding: '10px 80px',
          height: '55px',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity -ml-4">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              style={{
                height: '150px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div style={{ color: textColor }}>
              <Link to="/how-it-works" className="hover:text-gold transition-colors font-medium text-sm">
                How it Works
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/partners" className="hover:text-gold transition-colors font-medium text-sm">
                Partners
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/pricing" className="hover:text-gold transition-colors font-medium text-sm">
                Pricing
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-artists" className="hover:text-gold transition-colors font-medium text-sm">
                Top Artists
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-hotels" className="hover:text-gold transition-colors font-medium text-sm">
                Top Hotels
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
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Luxury hotel rooftop with city view" 
            className="w-full h-full object-cover"
            style={{ minHeight: '100vh' }}
          />
          {/* Gradient Overlay - Transparent to match header */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/20 via-transparent to-gold/10"></div>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          style={{ opacity: heroOpacity }}
        >
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12 px-4">
              <Link to="/register?role=artist" className="w-full sm:w-auto bg-gold text-navy px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-300 text-base sm:text-lg shadow-lg hover:scale-105 flex items-center justify-center">
                Join as Artist
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
              <Link to="/register?role=hotel" className="w-full sm:w-auto border-2 border-gold text-gold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold hover:bg-gold hover:text-navy transition-all duration-300 text-base sm:text-lg hover:scale-105 flex items-center justify-center">
                Join as Hotel
              </Link>
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
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Artist performing at luxury hotel" 
                  className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-xl shadow-luxury"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/20 to-transparent rounded-xl"></div>
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-white">
                  <p className="text-xs sm:text-sm font-medium">Live Performance</p>
                  <p className="text-xs opacity-80">The Ritz Paris</p>
                </div>
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

          <div className="experience-grid">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 left-4 bg-gold text-navy px-3 py-1 rounded-full text-sm font-bold">
                    {experience.category}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xl font-serif font-bold mb-2">{experience.title}</h3>
                    <p className="text-sm opacity-90">{experience.description}</p>
                    <button className="mt-3 bg-gold text-navy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors">
                      Discover More
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-navy flex items-center space-x-1">
                        <span className="text-gold font-bold">◆</span>
                        <span>{artist.rating}</span>
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
              </div>
      </section>
        
      {/* Membership/Pricing Split */}
      <section ref={pricingRef} className="py-24 bg-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Membership Plans</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Choose the plan that fits your creative journey
            </p>
            </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Artists Plan */}
            <motion.div
              className="relative overflow-hidden rounded-xl"
              initial={{ opacity: 0, x: -50 }}
              animate={pricingInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="parallax-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="gradient-overlay"></div>
              <div className="relative z-10 p-8 text-white">
                <div className="mb-6">
                  <h3 className="text-3xl font-serif font-bold mb-4">For Artists</h3>
                  <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl font-bold text-gold">50-100€</span>
                    <span className="text-lg">per year</span>
                  </div>
                  <p className="text-white/90 mb-6">
                    Join our exclusive community of artists and showcase your talent to luxury hotels worldwide.
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Premium profile visibility</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Direct booking opportunities</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Free Travel Art t-shirt</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>24/7 support</span>
                  </li>
                </ul>
                <Link to="/register?role=artist" className="btn-gold w-full text-center">
                  Join as Artist
                </Link>
              </div>
            </motion.div>

            {/* Hotels Plan */}
            <motion.div
              className="relative overflow-hidden rounded-xl"
              initial={{ opacity: 0, x: 50 }}
              animate={pricingInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="parallax-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="gradient-overlay"></div>
              <div className="relative z-10 p-8 text-white">
                <div className="mb-6">
                  <h3 className="text-3xl font-serif font-bold mb-4">For Hotels</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-bold text-gold">Per Artist</span>
                    <span className="text-lg">credit system</span>
                  </div>
                  <p className="text-white/90 mb-6">
                    Enhance your guest experience with curated artistic performances and cultural events.
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Curated artist selection</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Flexible booking system</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Event management support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span>Marketing assistance</span>
                  </li>
                </ul>
                <Link to="/register?role=hotel" className="btn-gold w-full text-center">
                  Join as Hotel
                </Link>
              </div>
            </motion.div>
              </div>
            </div>
      </section>

      {/* Journal/Stories Section */}
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
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-navy flex items-center space-x-1">
                        <span className="text-gold font-bold">◆</span>
                        <span>{artist.rating}</span>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-16 relative overflow-hidden">
        {/* Compass Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Compass className="w-96 h-96 text-gold" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Logo & Mission */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/logo-1-final.png" 
                  alt="Travel Art" 
                  className="h-12 w-auto"
                />
                <h3 className="text-2xl font-serif font-bold text-white">Travel Art</h3>
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">
                Connecting luxury hotels with talented artists for unique experiences 
                that create lasting memories and inspire communities worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-white/60 hover:text-gold transition-colors">
                  <Globe className="w-6 h-6" />
                </a>
                <a href="#" className="text-white/60 hover:text-gold transition-colors">
                  <Heart className="w-6 h-6" />
                </a>
                <a href="#" className="text-white/60 hover:text-gold transition-colors">
                  <Award className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-serif font-bold text-white mb-6">Quick Links</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-gold font-semibold mb-3">For Artists</h5>
                  <ul className="space-y-2 text-white/80">
                    <li><Link to="/how-it-works" className="hover:text-gold transition-colors">How it Works</Link></li>
                    <li><Link to="/pricing" className="hover:text-gold transition-colors">Pricing</Link></li>
                    <li><Link to="/top-artists" className="hover:text-gold transition-colors">Success Stories</Link></li>
              </ul>
            </div>
            <div>
                  <h5 className="text-gold font-semibold mb-3">For Hotels</h5>
                  <ul className="space-y-2 text-white/80">
                    <li><Link to="/partners" className="hover:text-gold transition-colors">Partners</Link></li>
                    <li><Link to="/top-hotels" className="hover:text-gold transition-colors">Featured Hotels</Link></li>
                    <li><Link to="/pricing" className="hover:text-gold transition-colors">Credit Packages</Link></li>
              </ul>
                </div>
              </div>
            </div>
            
            {/* Support & Contact */}
            <div>
              <h4 className="text-xl font-serif font-bold text-white mb-6">Support</h4>
              <ul className="space-y-3 text-white/80">
                <li><Link to="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
                <li><Link to="/help" className="hover:text-gold transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
              </ul>
              
              <div className="mt-8">
                <h5 className="text-gold font-semibold mb-3">Newsletter</h5>
                <p className="text-white/80 text-sm mb-4">
                  Stay updated with our latest artists and experiences
                </p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-l-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <button className="px-4 py-2 bg-gold text-navy rounded-r-lg font-semibold hover:bg-gold/90 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/60">
            <p>&copy; 2024 Travel Art. All rights reserved. | Applied Club Med Live-inspired redesign — Travel Art 2025.</p>
          </div>
        </div>
      </footer>
      
      <Footer />
    </div>
  )
}

export default LandingPage