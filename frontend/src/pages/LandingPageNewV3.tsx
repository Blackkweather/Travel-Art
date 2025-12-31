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

interface Slide {
  id: string
  image: string
  title: string
  subtitle: string
  category?: string
}

const NEXT = 1
const PREV = -1
const SLIDE_DURATION = 1.5

export default function LandingPageNewV3() {
  // States
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [experiences, setExperiences] = useState<any[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [showSlideshowCursor, setShowSlideshowCursor] = useState(true)
  
  // Refs
  const heroRef = useRef<HTMLElement>(null)
  const slideshowRef = useRef<HTMLDivElement>(null)
  const counterStripRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)
  const mouseXRef = useRef(0)
  const weLoveSectionRef = useRef<HTMLElement>(null)
  const descriptionRef = useRef<HTMLElement>(null)
  const experienceImagesSectionRef = useRef<HTMLElement>(null)
  const experiencesSectionRef = useRef<HTMLElement>(null)
  
  const weLovetags = ['MUSIC', 'ART', 'TRAVEL', 'LUXURY', 'CULTURE', 'EXPERIENCE', 'CREATIVITY', 'PERFORMANCE']

  // Default slides
  const defaultSlides: Slide[] = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
      title: 'BETWEEN SHADOW',
      subtitle: 'AND LIGHT',
      category: 'EXPERIENCE'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80',
      title: 'ARTISTIC JOURNEYS',
      subtitle: 'IN PARADISE',
      category: 'TRAVEL'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80',
      title: 'CULTURAL IMMERSION',
      subtitle: 'WORLDWIDE',
      category: 'CULTURE'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
      title: 'LUXURY DESTINATIONS',
      subtitle: '30+ LOCATIONS',
      category: 'LUXURY'
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
      title: 'UNFORGETTABLE',
      subtitle: 'EXPERIENCES',
      category: 'MUSIC'
    }
  ]

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch experiences and create slides
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripsRes = await tripsApi.getAll()
        
        let trips: any[] = []
        if (Array.isArray(tripsRes.data)) {
          trips = tripsRes.data
        } else if (tripsRes.data && Array.isArray(tripsRes.data.data)) {
          trips = tripsRes.data.data
        } else if (tripsRes.data && tripsRes.data.success && Array.isArray(tripsRes.data.data)) {
          trips = tripsRes.data.data
        }

        const formatted = trips.map((trip: any) => {
          let images: string[] = []
          try {
            images = Array.isArray(trip.images) ? trip.images : 
              (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
          } catch (e) { 
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
        
        setExperiences(formatted)

        if (formatted.length >= 3) {
          const experienceSlides: Slide[] = formatted.slice(0, 5).map((exp: any) => {
            const words = (exp.title || 'Experience').split(' ')
            const midPoint = Math.floor(words.length / 2)
            return {
              id: exp.id,
              image: exp.image,
              title: words.slice(0, midPoint).join(' ') || 'BETWEEN SHADOW',
              subtitle: words.slice(midPoint).join(' ') || 'AND LIGHT',
              category: exp.category
            }
          })
          setSlides(experienceSlides.length >= 3 ? experienceSlides : defaultSlides)
        } else {
          setSlides(defaultSlides)
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch experiences:', error)
        setExperiences([])
        setSlides(defaultSlides)
      }
    }
    fetchData()
  }, [])

  // Format number with leading zero
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`
  }

  // Initialize counter strip
  const initCounterStrip = () => {
    if (!counterStripRef.current || slides.length === 0) return
    
    counterStripRef.current.innerHTML = ''
    
    for (let i = 0; i < slides.length; i++) {
      const numberDiv = document.createElement('div')
      numberDiv.className = 'counter-number'
      numberDiv.textContent = formatNumber(i + 1)
      counterStripRef.current.appendChild(numberDiv)
    }
    
    gsap.set(counterStripRef.current, { y: 0 })
  }

  // Animate counter
  const animateCounter = (targetIndex: number, timeline: gsap.core.Timeline) => {
    if (!counterStripRef.current) return
    
    const targetY = -targetIndex * 1.2
    
    timeline.to(
      counterStripRef.current,
      {
        y: `${targetY}rem`,
        duration: SLIDE_DURATION,
        ease: 'power2.inOut'
      },
      0.2
    )
  }

  // Navigation function
  const navigate = (direction: number) => {
    if (isAnimatingRef.current || slides.length === 0 || !slideshowRef.current) return

    const prevIndex = currentSlideIndex
    const nextIndex = direction === NEXT
      ? currentSlideIndex < slides.length - 1 ? currentSlideIndex + 1 : 0
      : currentSlideIndex > 0 ? currentSlideIndex - 1 : slides.length - 1

    performNavigation(prevIndex, nextIndex, direction)
  }

  // Perform navigation animation
  const performNavigation = (prevIndex: number, nextIndex: number, direction: number) => {
    if (!slideshowRef.current) return

    isAnimatingRef.current = true

    const slideElements = slideshowRef.current.querySelectorAll('.slide')
    const slideImages = slideshowRef.current.querySelectorAll('.slide__img')

    const currentSlide = slideElements[prevIndex] as HTMLElement
    const currentImage = slideImages[prevIndex] as HTMLElement
    const currentTextLines = currentSlide.querySelectorAll('.slide__text-line')

    const nextSlide = slideElements[nextIndex] as HTMLElement
    const nextImage = slideImages[nextIndex] as HTMLElement
    const nextTextLines = nextSlide.querySelectorAll('.slide__text-line')

    // Make sure next slide is ready
    gsap.set(nextSlide, {
      visibility: 'visible',
      y: direction * 100 + '%'
    })

    // Enhanced image setup
    gsap.set(nextImage, {
      y: -direction * 40 + '%',
      scale: 1.4,
      scaleY: 1.8,
      rotation: -direction * 8,
      transformOrigin: direction === NEXT ? '0% 0%' : '100% 100%'
    })

    // Reset next text lines
    gsap.set(nextTextLines, {
      y: '100%',
      opacity: 0
    })

    // Create animation timeline
    const tl = gsap.timeline({
      defaults: { duration: SLIDE_DURATION, ease: 'power2.inOut' },
      onComplete: () => {
        gsap.set(currentSlide, { visibility: 'hidden' })
        currentSlide.classList.remove('active')
        nextSlide.classList.add('active')
        isAnimatingRef.current = false
        setCurrentSlideIndex(nextIndex)
      }
    })

    // Add counter animation
    animateCounter(nextIndex, tl)

    // Animate out current text
    tl.to(
      currentTextLines,
      {
        y: '-80%',
        opacity: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: 'power2.in'
      },
      0
    )

    // Animate current slide out
    tl.to(
      currentSlide,
      {
        y: -direction * 100 + '%'
      },
      0.2
    )

    // Enhanced image animation for current slide
    tl.to(
      currentImage,
      {
        y: direction * 40 + '%',
        scale: 1.4,
        scaleY: 1.8,
        rotation: direction * 8,
        ease: 'power1.out',
        transformOrigin: direction === NEXT ? '0% 100%' : '100% 0%'
      },
      0.2
    )

    // Animate in next slide
    tl.to(
      nextSlide,
      {
        y: '0%'
      },
      0.2
    )

    // Enhanced image animation for next slide
    tl.to(
      nextImage,
      {
        y: '0%',
        scale: 1,
        scaleY: 1,
        rotation: 0,
        ease: 'imageWarp'
      },
      0.2
    )

    // Animate in next text
    tl.to(
      nextTextLines,
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.6
      },
      0.9
    )
  }

  // Initialize slideshow - CodePen style
  useEffect(() => {
    if (slides.length === 0 || !slideshowRef.current) return

    // Use standard GSAP eases that match the CodePen feel
    // slideInOut: '0.25, 1, 0.5, 1' -> power2.inOut
    // textReveal: '0.77, 0, 0.175, 1' -> power3.out
    // imageWarp: '0.22, 1, 0.36, 1' -> power1.out

    // Initialize counter strip
    initCounterStrip()

    // Initialize first slide
    const slideElements = slideshowRef.current.querySelectorAll('.slide')
    const firstSlide = slideElements[0] as HTMLElement
    if (firstSlide) {
      gsap.set(firstSlide, {
        visibility: 'visible',
        y: '0%'
      })
      firstSlide.classList.add('active')

      // Animate in first slide text
      const firstSlideTextLines = firstSlide.querySelectorAll('.slide__text-line')
      gsap.to(firstSlideTextLines, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.1,
        delay: 0.5,
        ease: 'textReveal'
      })
    }

    // Custom cursor functionality
    const handleMouseMove = (e: MouseEvent) => {
      if (!cursorRef.current) return

      mouseXRef.current = e.clientX

      gsap.to(cursorRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1
      })

      cursorRef.current.classList.add('active')

      const windowWidth = window.innerWidth
      if (e.clientX < windowWidth / 2) {
        cursorRef.current.classList.remove('next')
        cursorRef.current.classList.add('prev')
      } else {
        cursorRef.current.classList.remove('prev')
        cursorRef.current.classList.add('next')
      }

      clearTimeout((window as any).cursorTimeout)
      ;(window as any).cursorTimeout = setTimeout(() => {
        if (cursorRef.current) {
          cursorRef.current.classList.remove('active')
        }
      }, 2000)
    }

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.remove('active')
      }
    }

    const handleWheel = (e: WheelEvent) => {
      // Only navigate slides if we're in the slideshow area and not at the edges
      const slideshowElement = slideshowRef.current
      if (!slideshowElement) return
      
      const rect = slideshowElement.getBoundingClientRect()
      const isInSlideshow = rect.top <= 0 && rect.bottom >= window.innerHeight
      
      // If we're at the last slide and scrolling down, allow normal scroll
      // If we're at the first slide and scrolling up, allow normal scroll
      if (isInSlideshow) {
        // Check if we're trying to scroll past the slideshow
        if (e.deltaY > 0 && currentSlideIndex === slides.length - 1) {
          // Allow normal scroll down after last slide
          return
        }
        if (e.deltaY < 0 && currentSlideIndex === 0) {
          // Allow normal scroll up at first slide
          return
        }
        
        // Otherwise, navigate slides
        e.preventDefault()
        if (e.deltaY > 0) {
          navigate(NEXT)
        } else {
          navigate(PREV)
        }
      }
    }

    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].screenY
      if (touchStartY > touchEndY + 5) {
        navigate(NEXT)
      } else if (touchStartY < touchEndY - 5) {
        navigate(PREV)
      }
    }

    const handleClick = () => {
      if (mouseXRef.current < window.innerWidth / 2) {
        navigate(PREV)
      } else {
        navigate(NEXT)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        navigate(NEXT)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        navigate(PREV)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('wheel', handleWheel)
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('wheel', handleWheel)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      gsap.killTweensOf(slideElements)
    }
  }, [slides, currentSlideIndex])

  // GSAP Animations for other sections
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const sectionsToAnimate = [
      { ref: weLoveSectionRef, delay: 0 },
      { ref: descriptionRef, delay: 0.1 },
      { ref: experienceImagesSectionRef, delay: 0.15 },
      { ref: experiencesSectionRef, delay: 0.2 }
    ]

    sectionsToAnimate.forEach(({ ref, delay }) => {
      if (ref.current) {
        ref.current.style.opacity = '1'
        ref.current.style.transform = 'translateY(0)'
        ref.current.style.visibility = 'visible'
        
        try {
          if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger) {
            gsap.fromTo(ref.current, 
              { y: 20, opacity: 0.9 },
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
                  immediateRender: false
                },
                delay
              }
            )
          }
        } catch (e) {
          if (ref.current) {
            ref.current.style.opacity = '1'
            ref.current.style.transform = 'translateY(0)'
            ref.current.style.visibility = 'visible'
          }
        }
      }
    })

    setTimeout(() => {
      const experienceCards = document.querySelectorAll('.experience-card')
      if (experienceCards.length > 0) {
        experienceCards.forEach(card => {
          const htmlCard = card as HTMLElement
          if (htmlCard && htmlCard.style) {
            htmlCard.style.opacity = '1'
            htmlCard.style.transform = 'translateY(0)'
            htmlCard.style.visibility = 'visible'
          }
        })
        
        try {
          if (typeof ScrollTrigger !== 'undefined') {
            gsap.from(experienceCards, {
              y: 30,
              opacity: 0.7,
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

  // Hide slideshow cursor and counter when scrolled past slideshow
  useEffect(() => {
    const handleScroll = () => {
      const slideshowElement = slideshowRef.current
      if (!slideshowElement) return
      
      const rect = slideshowElement.getBoundingClientRect()
      // If slideshow is completely scrolled past (bottom is above viewport top)
      // Or if we're on the last slide and scrolled down significantly
      const isPastSlideshow = rect.bottom < window.innerHeight * 0.5
      
      if (isPastSlideshow) {
        setShowSlideshowCursor(false)
      } else {
        setShowSlideshowCursor(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="overflow-x-hidden relative bg-white">
      {/* Custom Cursor - V2 Style */}
      {!showSlideshowCursor && <CustomCursor />}

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
                className="h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain transition-all duration-300"
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

      {/* 2. SLIDESHOW - CodePen Style */}
      <section ref={heroRef} className="slideshow-section relative h-screen flex items-center overflow-hidden">
        <div ref={slideshowRef} className="slideshow">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide ${index === 0 ? 'active' : ''}`}
            >
              <div 
                className="slide__img"
                style={{
                  backgroundImage: `url(${slide.image})`
                }}
              />
              <div className="slide__text">
                <h1 className="slide__text-line">{slide.title}</h1>
                <h2 className="slide__text-line">{slide.subtitle}</h2>
              </div>
            </div>
          ))}
        </div>


        {/* Slideshow Custom Cursor - Only show when in slideshow */}
        {showSlideshowCursor && (
          <div ref={cursorRef} className="cursor">
            <div className="cursor-arrow prev">←</div>
            <div className="cursor-arrow next">→</div>
          </div>
        )}
      </section>

      {/* Rest of the page sections - keeping existing structure */}
      <div className="bg-white">
        {/* 3. INFINITE SCROLL "WE LOVE" SECTION */}
        <section ref={weLoveSectionRef} className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white relative opacity-100" style={{ opacity: 1, minHeight: '400px' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_50%)] pointer-events-none" style={{ zIndex: 0 }} />
          <div className="relative z-10" style={{ zIndex: 10 }}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold text-center mb-16 text-gray-900">
              We love
            </h2>
            
            <div className="space-y-8 overflow-hidden">
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

        {/* 4. DESCRIPTION PARAGRAPH */}
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

        {/* 5. EXPERIENCE IMAGES SECTION */}
        <section ref={experienceImagesSectionRef} className="py-16 md:py-24 px-6 bg-white experience-images-section" style={{ opacity: 1 }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {experiences.length > 0 ? (
                experiences.slice(0, 3).map((exp, index) => (
                  <Link
                    key={exp.id}
                    to={`/experience/${exp.id}`}
                    className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-200 experience-image-card block"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <img
                      src={exp.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                      alt={exp.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/60 to-transparent transform -translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out experience-card-top-text">
                      <div className="text-sm text-teal-400 font-bold mb-1 uppercase tracking-wider">
                        {exp.category || 'Experience'}
                      </div>
                      <h3 className="text-white text-2xl font-bold leading-tight">
                        {exp.title}
                      </h3>
                    </div>
                    
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

        {/* 6. CTA SECTION */}
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

        {/* 7. EXPERIENCES GRID */}
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

        {/* 8. FOOTER */}
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
      </div>

      {/* CSS - CodePen Style */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/pp-neue-montreal');
        
        *,
        *:before,
        *:after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "PP Neue Montreal", sans-serif;
          overflow-x: hidden;
        }
        
        /* Only apply black background to slideshow section */
        .slideshow-section {
          background-color: #000;
          color: #fff;
        }
        
        .slideshow {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        
        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          visibility: hidden;
          overflow: hidden;
          transform: translateY(0);
        }
        
        .slide.active {
          visibility: visible;
        }
        
        .slide__img {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 120%;
          height: 120%;
          background-size: cover;
          background-position: center;
          will-change: transform;
        }
        
        .slide__img::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0) 40%
          );
        }
        
        .slide__text {
          position: absolute;
          bottom: 5rem;
          left: 5rem;
          max-width: 80%;
          overflow: hidden;
          z-index: 5;
        }
        
        .slide__text-line {
          display: block;
          font-size: clamp(3rem, 8vw, 8rem);
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          transform: translateY(100%);
          opacity: 0;
        }
        
        .slide-counter {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          z-index: 10;
          color: #fff;
        }
        
        .counter-container {
          position: relative;
          min-width: 2rem;
          height: 1.2rem;
          overflow: hidden;
          text-align: right;
        }
        
        .counter-strip {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          text-align: right;
        }
        
        .counter-number {
          height: 1.2rem;
          display: block;
        }
        
        .counter-separator {
          width: 40px;
          height: 1px;
          background-color: #fff;
          margin: 0 1rem;
        }
        
        .counter-total {
          min-width: 2rem;
          text-align: left;
        }
        
        .cursor {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          margin-top: -30px;
          margin-left: -30px;
          z-index: 9999;
          pointer-events: none;
          transform: scale(0);
          transition: transform 0.3s ease;
        }
        
        .cursor-arrow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.2rem;
          opacity: 0;
        }
        
        .cursor.active {
          transform: scale(1);
        }
        
        .cursor.prev .cursor-arrow.prev,
        .cursor.next .cursor-arrow.next {
          opacity: 1;
        }
        
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
        
        .experience-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .experience-card:hover {
          transform: translateY(-8px);
        }
        
        @media (max-width: 768px) {
          .slide__text {
            bottom: 3rem;
            left: 2rem;
            max-width: 90%;
          }

          .slide__text-line {
            font-size: clamp(2.5rem, 6vw, 4rem);
          }
        }
      `}</style>
    </div>
  )
}
