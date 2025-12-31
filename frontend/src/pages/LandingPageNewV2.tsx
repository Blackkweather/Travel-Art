import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getLogoUrl } from '@/config/assets'
import { tripsApi } from '@/utils/api'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AmbientAudio from '@/components/AmbientAudio'
import CustomCursor from '@/components/CustomCursor'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function LandingPageNewV2() {
  // States
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [experiences, setExperiences] = useState<any[]>([])
  
  // Refs for GSAP animations
  const heroRef = useRef<HTMLElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null)
  const heroButtonRef = useRef<HTMLAnchorElement>(null)
  const weLoveSectionRef = useRef<HTMLElement>(null)
  const descriptionRef = useRef<HTMLElement>(null)
  const experienceImagesSectionRef = useRef<HTMLElement>(null)
  const experiencesSectionRef = useRef<HTMLElement>(null)
  
  const weLovetags = ['MUSIC', 'ART', 'TRAVEL', 'LUXURY', 'CULTURE', 'EXPERIENCE', 'CREATIVITY', 'PERFORMANCE']

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // GSAP Animations on Mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Set initial visibility to ensure elements are visible even if GSAP fails
    if (heroTitleRef.current) heroTitleRef.current.style.opacity = '1'
    if (heroSubtitleRef.current) heroSubtitleRef.current.style.opacity = '1'
    if (heroButtonRef.current) heroButtonRef.current.style.opacity = '1'

    // Hero section animations - stagger entrance (only if elements exist)
    if (heroTitleRef.current && heroSubtitleRef.current && heroButtonRef.current) {
      // Set initial state
      gsap.set([heroTitleRef.current, heroSubtitleRef.current, heroButtonRef.current], {
        opacity: 0,
        y: 100
      })
      
      // Animate in
      gsap.to([heroTitleRef.current, heroSubtitleRef.current, heroButtonRef.current], {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power3.out',
        delay: 0.3
      })
    }

    // Parallax effect for hero background
    if (heroRef.current) {
      const heroImg = heroRef.current.querySelector('img')
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        })
      }
    }

    // Scroll-triggered reveals for sections (with fallback visibility)
    const sectionsToAnimate = [
      { ref: weLoveSectionRef, delay: 0 },
      { ref: descriptionRef, delay: 0.1 },
      { ref: experienceImagesSectionRef, delay: 0.15 },
      { ref: experiencesSectionRef, delay: 0.2 }
    ]

    sectionsToAnimate.forEach(({ ref, delay }) => {
      if (ref.current) {
        // CRITICAL: Ensure visible by default FIRST - always visible
        ref.current.style.opacity = '1'
        ref.current.style.transform = 'translateY(0)'
        ref.current.style.visibility = 'visible'
        ref.current.style.display = '' // Ensure not hidden
        
        // Only add subtle animation enhancement if ScrollTrigger works
        // Don't hide elements - just add movement
        try {
          if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger) {
            // Use immediate: false to prevent initial state setting
            gsap.fromTo(ref.current, 
              { y: 20, opacity: 0.9 }, // Start state (still mostly visible)
              {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: ref.current,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                  once: true,
                  immediateRender: false // Don't apply initial state immediately
                },
                delay,
                onStart: () => {
                  // Ensure visible when animation starts
                  if (ref.current) {
                    ref.current.style.opacity = '1'
                    ref.current.style.visibility = 'visible'
                  }
                }
              }
            )
          }
        } catch (e) {
          // If GSAP fails, ensure element is visible
          if (ref.current) {
            ref.current.style.opacity = '1'
            ref.current.style.transform = 'translateY(0)'
            ref.current.style.visibility = 'visible'
          }
        }
      }
    })

    // Experience cards stagger animation (with fallback)
    setTimeout(() => {
      const experienceCards = document.querySelectorAll('.experience-card')
      if (experienceCards.length > 0) {
        // Set all cards visible by default FIRST
        experienceCards.forEach(card => {
          const htmlCard = card as HTMLElement
          if (htmlCard && htmlCard.style) {
            htmlCard.style.opacity = '1'
            htmlCard.style.transform = 'translateY(0)'
            htmlCard.style.visibility = 'visible'
          }
        })
        
        try {
          // Check if ScrollTrigger is available
          if (typeof ScrollTrigger !== 'undefined') {
            // Animate cards with subtle effect - they're already visible
            gsap.from(experienceCards, {
              y: 30, // Less dramatic movement
              opacity: 0.7, // Start slightly transparent but visible
              duration: 0.8,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: experiencesSectionRef.current,
                start: 'top 70%',
                toggleActions: 'play none none reverse',
                once: true
              }
            })
          }
        } catch (e) {
          // If GSAP fails, ensure cards are visible
          experienceCards.forEach((card) => {
            const htmlCard = card as HTMLElement
            if (htmlCard && htmlCard.style) {
              htmlCard.style.opacity = '1'
              htmlCard.style.transform = 'translateY(0)'
              htmlCard.style.visibility = 'visible'
            }
          })
        }
      }
    }, 100)

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [experiences])


  // Fetch experiences data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching experiences...')
        // The trips API always returns PUBLISHED trips, no need for status param
        const tripsRes = await tripsApi.getAll()
        
        // Check if response is an error
        if (!tripsRes || !tripsRes.data) {
          console.error('❌ Invalid response:', tripsRes)
          setExperiences([])
          return
        }
        
        console.log('🔍 Trips API Response:', tripsRes)
        console.log('🔍 Response data:', tripsRes.data)
        console.log('🔍 Response data type:', typeof tripsRes.data)
        console.log('🔍 Is array?', Array.isArray(tripsRes.data))
        
        // Handle different response formats
        let trips: any[] = []
        
        if (Array.isArray(tripsRes.data)) {
          trips = tripsRes.data
          console.log('✅ Using direct array format, count:', trips.length)
        } else if (tripsRes.data && Array.isArray(tripsRes.data.data)) {
          trips = tripsRes.data.data
          console.log('✅ Using wrapped data format, count:', trips.length)
        } else if (tripsRes.data && tripsRes.data.success && Array.isArray(tripsRes.data.data)) {
          trips = tripsRes.data.data
          console.log('✅ Using success.data format, count:', trips.length)
        } else {
          console.error('❌ Unknown response format:', tripsRes.data)
          trips = []
        }
        
        console.log('📊 Parsed trips count:', trips.length)
        console.log('📊 First trip:', trips[0])
        
        const formatted = trips.map((trip: any) => {
          let images: string[] = []
          try {
            images = Array.isArray(trip.images) ? trip.images : 
              (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
          } catch (e) { 
            console.warn('Failed to parse images for trip:', trip.id, e)
            images = [] 
          }
          
          return {
            id: trip.id,
            title: trip.title || 'Experience',
            description: trip.description?.substring(0, 100) || '',
            image: images[0] || trip.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
            category: trip.type || trip.category || 'Experience'
          }
        })
        
        console.log('✅ Formatted experiences count:', formatted.length)
        setExperiences(formatted)
      } catch (error: any) {
        console.error('❌ Failed to fetch experiences:', error)
        
        // Check if it's a connection error
        if (error.code === 'ERR_CONNECTION_REFUSED' || error.message?.includes('Connection refused')) {
          console.error('⚠️ Backend server is not running! Please start it with: cd backend && npm run dev')
        }
        
        // Set empty array on error so UI shows "no experiences" instead of loading forever
        setExperiences([])
      }
    }
    fetchData()
  }, [])

  return (
    <div className="bg-white overflow-x-hidden relative">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Ambient Audio */}
      <AmbientAudio 
        src="https://www.youtube.com/watch?v=LCQSGDqWIEY" 
        initialVolume={0.5}
        maxScrollForFade={1000}
      />

      {/* 1. FIXED HEADER - Enhanced with backdrop blur */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        headerScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="hover:opacity-80 transition-all duration-300 hover:scale-105">
              <img 
                src={getLogoUrl('transparent')} 
                alt="Travel Art" 
                className="h-12 md:h-20 lg:h-24 xl:h-28 w-auto object-contain transition-all duration-300"
              />
            </Link>
            <nav className="hidden md:flex gap-8">
              <Link 
                to="/experiences" 
                className={`text-sm font-semibold transition-all duration-300 relative group ${
                  headerScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                Experiences
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                }`} />
              </Link>
              <Link 
                to="/how-it-works" 
                className={`text-sm font-semibold transition-all duration-300 relative group ${
                  headerScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                How it Works
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                }`} />
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className={`text-sm font-semibold transition-all duration-300 hidden sm:block relative group ${
                headerScrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              Sign In
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
              }`} />
            </Link>
            <Link 
              to="/register"
              className="bg-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">Join Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - Enhanced with bold typography and animations */}
      <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        
        <div className="relative z-10 text-white px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full">
          <h1 
            ref={heroTitleRef}
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold mb-8 max-w-4xl leading-tight tracking-tight opacity-100"
            style={{ 
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: 1
            }}
          >
            Where Creativity Meets Luxury.
          </h1>
          <p 
            ref={heroSubtitleRef}
            className="text-xl md:text-2xl lg:text-3xl mb-10 font-light max-w-3xl leading-relaxed text-white/95 opacity-100"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)', opacity: 1 }}
          >
            A platform connecting highly talented hearts with luxury hotels
            to create unforgettable experiences.
          </p>
          <Link 
            ref={heroButtonRef}
            to="/experiences"
            className="inline-block bg-teal-500 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-teal-400 transition-all duration-300 shadow-2xl hover:shadow-teal-500/50 hover:scale-105 relative overflow-hidden group opacity-100"
            style={{ opacity: 1 }}
          >
            <span className="relative z-10 flex items-center gap-2">
            Discover Experiences
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </div>
      </section>

      {/* 3. INFINITE SCROLL "WE LOVE" SECTION - Enhanced typography */}
      <section ref={weLoveSectionRef} className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white relative opacity-100" style={{ opacity: 1, minHeight: '400px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_50%)] pointer-events-none" style={{ zIndex: 0 }} />
        <div className="relative z-10" style={{ zIndex: 10 }}>
          <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold text-center mb-16 text-gray-900">
            We love
          </h2>
          
          <div className="space-y-8 overflow-hidden">
          {/* Row 1 - Scroll Right */}
            <div className="flex animate-scroll-right" style={{ willChange: 'transform', width: 'fit-content' }}>
            {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mx-8 md:mx-12 whitespace-nowrap hover:text-teal-600 transition-colors duration-300"
                  style={{ opacity: 1, visibility: 'visible' }}
                >
                {tag}
              </div>
            ))}
          </div>

          {/* Row 2 - Scroll Left */}
            <div className="flex animate-scroll-left" style={{ willChange: 'transform', width: 'fit-content' }}>
            {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mx-8 md:mx-12 whitespace-nowrap hover:text-teal-600 transition-colors duration-300"
                  style={{ opacity: 1, visibility: 'visible' }}
                >
                {tag}
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. DESCRIPTION PARAGRAPH - Enhanced with modern styling */}
      <section ref={descriptionRef} className="py-24 md:py-32 px-6 bg-white relative opacity-100" style={{ opacity: 1, minHeight: '300px' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-gray-700 text-center font-light" style={{ opacity: 1 }}>
            Travel Art is founded on the idea that <span className="font-semibold text-gray-900">travel and cultural immersion</span> are at the origin of inspiration. 
            We connect highly talented hearts with luxury hotels to create <span className="font-semibold text-teal-600">unforgettable experiences</span>. Our platform 
            brings together a community of artists and creatives across multiple disciplines (Music, Visual Arts, 
            Performance) to develop their artistic projects in <span className="font-semibold text-gray-900">over 30 destinations worldwide</span>, combining travel 
            and creation in the most beautiful places on earth.
          </p>
        </div>
      </section>

      {/* 5. EXPERIENCE IMAGES SECTION - 3 images with animations */}
      <section ref={experienceImagesSectionRef} className="py-16 md:py-24 px-6 bg-white experience-images-section" style={{ opacity: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {experiences.length > 0 ? (
              experiences.slice(0, 3).map((exp, index) => (
                <Link
                  key={exp.id}
                  to={`/experience/${exp.id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-200 experience-image-card block"
                    style={{
                    animationDelay: `${index * 0.15}s`
                  }}
                >
                  <img
                    src={exp.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                    alt={exp.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Top text overlay - appears on hover */}
                  <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/60 to-transparent transform -translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out experience-card-top-text">
                    <div className="text-sm text-teal-400 font-bold mb-1 uppercase tracking-wider">
                      {exp.category || 'Experience'}
                    </div>
                    <h3 className="text-white text-2xl font-bold leading-tight">
                      {exp.title}
                  </h3>
                </div>
                  
                  {/* Bottom overlay - existing */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="text-sm text-teal-400 font-bold mb-2 uppercase tracking-wide">
                      {exp.category || 'Experience'}
            </div>
                    <h3 className="text-white text-xl font-bold">
                      {exp.title}
                    </h3>
          </div>
                </Link>
              ))
            ) : (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-200 animate-pulse">
                    <div className="w-full h-full bg-gray-300" />
              </div>
            ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 6. CTA SECTION - Enhanced button */}
      <section className="py-12 text-center bg-gradient-to-b from-white to-gray-50">
        <Link 
          to="/experiences"
          className="inline-block bg-teal-500 text-white px-14 py-6 rounded-full text-xl font-bold hover:bg-teal-400 transition-all duration-300 shadow-2xl hover:shadow-teal-500/50 hover:scale-110 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center gap-3">
          Discover Experiences
            <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </section>

      {/* 7. EXPERIENCES GRID - Enhanced cards with hover effects */}
      <section ref={experiencesSectionRef} className="pt-0 pb-24 md:pb-32 px-6 bg-gradient-to-b from-gray-50 to-white opacity-100" style={{ opacity: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-8 text-gray-900">
              Immersive Experiences
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
              Discover unique artistic moments in luxury settings. Get inspired by 
              the experiences of our artist community and join the program yourself.
            </p>
          </div>

          {experiences.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {experiences.map((exp) => (
                <Link 
                  key={exp.id} 
                  to={`/experience/${exp.id}`} 
                  className="group experience-card cursor-pointer opacity-100"
                  style={{ opacity: 1 }}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl mb-6 bg-gray-200 relative">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="text-white text-sm font-semibold">View Details →</span>
                    </div>
                  </div>
                  <div className="text-sm text-teal-600 font-bold mb-3 uppercase tracking-wide">
                    {exp.category}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors duration-300">
                    {exp.title}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">No experiences available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new experiences!</p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link 
              to="/experiences"
              className="inline-block border-2 border-gray-900 text-gray-900 px-10 py-4 rounded-full font-bold hover:bg-gray-900 hover:text-white transition-all duration-300 hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">View all experiences</span>
              <span className="absolute inset-0 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER - Enhanced styling */}
      <footer className="bg-gray-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div>
              <h4 className="font-bold mb-6 text-lg">Programme</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="/register" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    Join Now
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Discover</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="/about" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Social</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors duration-300 inline-block transform hover:translate-x-1">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
            <div></div>
          </div>
          
          <div className="text-sm text-gray-500 text-center pt-8 border-t border-gray-800">
            © 2024 Travel Art. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Enhanced CSS Animations */}
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
          animation: scroll-right 40s linear infinite;
          display: flex;
          width: fit-content;
        }
        
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
          display: flex;
          width: fit-content;
        }
        
        /* Ensure scrolling tags are visible */
        .animate-scroll-right > div,
        .animate-scroll-left > div {
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }
        
        /* Container for scrolling tags */
        section[ref*="weLove"] > div > div {
          overflow-x: visible;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Enhanced hover effects */
        .experience-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .experience-card:hover {
          transform: translateY(-8px);
        }
        
        /* Experience images section animation */
        .experience-images-section {
          animation: fadeInSection 1s ease-out forwards;
        }
        
        /* Experience image cards animation with scale and stagger */
        .experience-image-card {
          animation: fadeInUpScale 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(50px) scale(0.9);
        }
        
        @keyframes fadeInSection {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUpScale {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Stagger animation delays for cards */
        .experience-image-card:nth-child(1) {
          animation-delay: 0.1s;
        }
        
        .experience-image-card:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .experience-image-card:nth-child(3) {
          animation-delay: 0.5s;
        }
        
        /* Top text overlay animation on hover */
        .experience-card-top-text {
          will-change: transform, opacity;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .experience-image-card:hover .experience-card-top-text {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }
        
        /* Remove focus outlines for images */
        img:focus,
        img:focus-visible,
        img:active {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
