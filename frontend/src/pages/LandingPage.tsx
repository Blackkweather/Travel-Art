import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { tripsApi } from '@/utils/api'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AmbientAudio from '@/components/AmbientAudio'
import GalleryPan from '@/components/GalleryPan'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

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

export default function LandingPage() {
  // States
  const [experiences, setExperiences] = useState<any[]>([])
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(true)
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
  
  const weLovetags = ['MUSIQUE', 'ART', 'VOYAGE', 'LUXE', 'CULTURE', 'RENCONTRE', 'CRÉATION', 'SCÈNE']

  // The hero is a full-viewport section, so an empty slide list renders as a
  // black void. These fallbacks keep the landing page presentable whenever the
  // API is unreachable or the catalogue is still too small to fill the
  // slideshow. Imagery is served from the Unsplash CDN, which the backend CSP
  // already allows.
  const defaultSlides: Slide[] = [
    {
      id: 'fallback-1',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80&fit=crop',
      title: 'ENTRE L’OMBRE',
      subtitle: 'ET LA LUMIÈRE',
      category: 'Expérience'
    },
    {
      id: 'fallback-2',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80&fit=crop',
      title: 'LÀ OÙ L’ART',
      subtitle: 'RENÇOIT LE LUXE',
      category: 'Scène'
    },
    {
      id: 'fallback-3',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80&fit=crop',
      title: 'DES SCÈNES SANS',
      subtitle: 'FRONTIÈRES',
      category: 'Voyage'
    }
  ]

  // Fetch experiences and create slides
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripsRes = await tripsApi.getAll()
        
        let trips: any[] = []
        if (Array.isArray(tripsRes.data)) {
          trips = tripsRes.data
        } else if (tripsRes.data && Array.isArray(tripsRes.data.data)) {
          // Also covers the { success: true, data: [...] } envelope: a third
          // branch tested `data.success` as well, but any response reaching it
          // had already matched this condition, so it could never run — and it
          // assigned exactly the same value.
          trips = tripsRes.data.data
        }

        const formatted = trips.map((trip: any) => {
          let images: string[] = []
          try {
            images = Array.isArray(trip.images) ? trip.images : 
              (typeof trip.images === 'string' ? JSON.parse(trip.images) : [])
          } catch { 
            images = [] 
          }
          
          return {
            id: trip.id,
            title: trip.title || 'Expérience',
            description: trip.description?.substring(0, 100) || '',
            image: images[0] || trip.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
            category: trip.type || trip.category || 'Expérience'
          }
        })
        
        setExperiences(formatted)

        if (formatted.length >= 3) {
          const experienceSlides: Slide[] = formatted.slice(0, 5).map((exp: any) => {
            const words = (exp.title || 'Expérience').split(' ')
            const midPoint = Math.floor(words.length / 2)
            return {
              id: exp.id,
              image: exp.image,
              title: words.slice(0, midPoint).join(' ') || 'ENTRE L’OMBRE',
              subtitle: words.slice(midPoint).join(' ') || 'ET LA LUMIÈRE',
              category: exp.category
            }
          })
          setSlides(experienceSlides)
        } else {
          // Too few experiences to fill the slideshow - fall back rather than
          // leaving the hero blank.
          setSlides(defaultSlides)
        }
      } catch (error: any) {
        console.error('Failed to fetch experiences:', error)
        setExperiences([])
        setSlides(defaultSlides)
      } finally {
        setIsLoadingExperiences(false)
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

    // Cursor position is still tracked for the wheel/drag direction logic, but
    // the page no longer paints its own cursor: custom cursors hurt
    // accessibility, cost a frame on every mouse move, and do not exist on
    // touch. The hero exposes real prev/next buttons instead.
    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX
    }

    const handleMouseLeave = () => {}

    const handleWheel = (e: WheelEvent) => {
      // Only navigate slides if we're in the slideshow area and not at the edges
      const slideshowElement = slideshowRef.current
      if (!slideshowElement) return
      
      const rect = slideshowElement.getBoundingClientRect()
      // More precise check: only intercept if slideshow is fully in viewport
      const isInSlideshow = rect.top <= 0 && rect.bottom >= window.innerHeight && 
                           rect.top >= -window.innerHeight && rect.bottom <= window.innerHeight * 2
      
      // Always allow normal scrolling - don't prevent default
      // Only navigate slides on wheel if user is clearly in slideshow area
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
        
        // Only navigate if scroll is significant and user is clearly in slideshow
        // Don't prevent default - let page scroll naturally
        if (Math.abs(e.deltaY) > 50) {
          if (e.deltaY > 0) {
            navigate(NEXT)
          } else {
            navigate(PREV)
          }
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
    // Use passive: true to allow normal scrolling - we won't preventDefault
    window.addEventListener('wheel', handleWheel, { passive: true })
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
        } catch {
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
        } catch {
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
    <div className="overflow-x-hidden relative bg-[var(--surface)]">
      {/* Ambient Audio */}
      <AmbientAudio 
        src="https://www.youtube.com/watch?v=LCQSGDqWIEY" 
        initialVolume={0.5}
        maxScrollForFade={1000}
      />

      {/* The site navigation, not a third copy of it. This page carried its
          own header (and its own footer, below) with its own link list, its own
          scroll state and its own CTA styling, so the landing page drifted out
          of step with every other public page. SimpleNavbar already handles the
          dark-background case this page needs. */}
      <SimpleNavbar />

      {/* Hero. min-h-[100dvh] rather than h-screen so the iOS address bar does
          not crop it. */}
      <section ref={heroRef} className="slideshow-section relative min-h-[100dvh] flex items-center overflow-hidden">
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
              {/* Scrim keeps the headline above AA contrast whatever the photo. */}
              <div className="slide__scrim" aria-hidden="true" />
              <div className="slide__text">
                <h1 className="slide__text-line">{slide.title}</h1>
                <h2 className="slide__text-line">{slide.subtitle}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* Real buttons instead of a custom cursor: keyboard reachable and
            visible on touch, where a cursor affordance does not exist. */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 right-5 sm:right-8 lg:right-12 z-20 flex gap-3">
            <button
              type="button"
              onClick={() => navigate(PREV)}
              aria-label="Expérience précédente"
              className="w-12 h-12 rounded-control border border-white/40 text-white flex items-center justify-center hover:bg-surface-raised hover:text-content transition-colors duration-300 active:translate-y-px"
            >
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate(NEXT)}
              aria-label="Expérience suivante"
              className="w-12 h-12 rounded-control border border-white/40 text-white flex items-center justify-center hover:bg-surface-raised hover:text-content transition-colors duration-300 active:translate-y-px"
            >
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* The page is dark end to end: a hotel hosting artists is a gallery
          after hours, and gold is the only warm light in the room. No section
          inverts to a light theme. */}
      <div className="bg-[#08101D]">
        {/* Manifesto. A drop cap and a hanging measure make this read as
            editorial opening copy rather than a hero subtitle. */}
        <section ref={descriptionRef} className="section-y" style={{ opacity: 1 }}>
          <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-y-12 gap-x-8">
            <p className="lg:col-span-7 lg:col-start-2 text-2xl md:text-3xl lg:text-[2.6rem] font-serif
                          leading-[1.3] text-white
                          [&>span:first-child]:float-left [&>span:first-child]:font-serif
                          [&>span:first-child]:text-gold [&>span:first-child]:text-[5.5rem]
                          [&>span:first-child]:leading-[0.78] [&>span:first-child]:pr-4
                          [&>span:first-child]:pt-1">
              <span>L</span>e voyage et l’immersion culturelle sont le point de départ du
              travail. Nous installons des artistes dans des hôtels qui méritent qu’on
              s’y arrête, et ce qui s’y produit devient l’essentiel.
            </p>

            <div className="lg:col-span-3 lg:col-start-10 self-end">
              <p className="text-white/50 leading-relaxed">
                Musiciens, plasticiens et interprètes, dans plus de trente
                destinations.
              </p>
              <div className="mt-8 h-px w-full bg-gold/30" />
              <p className="mt-8 font-serif text-5xl text-gold">30+</p>
              <p className="text-white/40 text-sm mt-1">Destinations</p>
            </div>
          </div>
        </section>

        {/* Kinetic marquee. The only marquee on the page: it carries the
            disciplines at a glance, where a static list would bury them. */}
        <section ref={weLoveSectionRef} className="pb-24 md:pb-32 relative overflow-hidden" style={{ opacity: 1 }}>
          <div aria-hidden="true" className="space-y-4 select-none">
            <div className="flex animate-scroll-right" style={{ willChange: 'transform', width: 'fit-content' }}>
              {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-6xl md:text-8xl lg:text-9xl font-serif italic text-white/[0.07] mx-8 md:mx-14 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex animate-scroll-left" style={{ willChange: 'transform', width: 'fit-content' }}>
              {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-6xl md:text-8xl lg:text-9xl font-serif italic text-gold/20 mx-8 md:mx-14 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Screen readers get the plain list the marquee decorates. */}
          <ul className="sr-only">
            {weLovetags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </section>

        {/* Signature moment: the work travels sideways while the page holds. */}
        <GalleryPan items={experiences.slice(0, 6)} />

        {/* Closing band. The one moment on the page where gold fills a surface
            instead of accenting it, so the final action carries the most
            contrast on the page. */}
        <section ref={experienceImagesSectionRef} className="relative overflow-hidden" style={{ opacity: 1 }}>
          <div className="shell">
            <div className="border-t border-white/10 py-24 md:py-36 text-center">
              <h2 className="font-serif text-white text-5xl md:text-7xl lg:text-8xl leading-[1.02]">
                Une résidence,
                <span className="block text-gold italic leading-[1.1] pb-1">pas une prestation.</span>
              </h2>
              <p className="mt-8 text-white/55 max-w-[46ch] mx-auto leading-relaxed">
                Candidatez comme artiste, ou ouvrez votre hôtel au programme.
              </p>
              <div className="mt-12 flex flex-wrap gap-4 justify-center">
                <Link to="/register" className="btn-gold">
                  Nous rejoindre
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn-on-media"
                >
                  Le principe
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The exchange, set as two facing columns. A different layout family
            from the gallery above and the band below, and it states both sides
            of the trade at once rather than as three identical cards. */}
        <section ref={experiencesSectionRef} className="section-y" style={{ opacity: 1 }}>
          <div className="shell">
            <h2 className="font-serif text-white text-4xl md:text-5xl lg:text-6xl leading-[1.05] max-w-[16ch] mb-20">
              Un échange, deux versants.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:pr-16 lg:border-r border-white/10">
                <p className="font-serif text-gold text-3xl md:text-4xl">Pour les artistes</p>
                <p className="mt-6 text-white/60 leading-relaxed max-w-[42ch]">
                  Une chambre, une scène et le temps de créer. Vous gardez vos
                  honoraires et vos œuvres.
                </p>
                <ul className="mt-10 space-y-5">
                  {[
                    'Des résidences dans des hôtels qui programment sérieusement la culture',
                    'Aucune commission prélevée côté artiste',
                    'Voyage et hébergement réglés avant votre arrivée',
                  ].map((line) => (
                    <li key={line} className="flex gap-4 text-white/80">
                      <span aria-hidden="true" className="mt-2.5 h-px w-6 shrink-0 bg-gold" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-16 lg:mt-0 lg:pl-16">
                <p className="font-serif text-gold text-3xl md:text-4xl">Pour les hôtels</p>
                <p className="mt-6 text-white/60 leading-relaxed max-w-[42ch]">
                  Une programmation culturelle sans agence, sans producteur et sans
                  une saison de préparatifs.
                </p>
                <ul className="mt-10 space-y-5">
                  {[
                    'Des artistes sélectionnés en musique, arts visuels et scène',
                    'Un seul solde de crédits pour toutes vos réservations',
                    'Des dates que vous maîtrisez, confirmées ou annulées en un clic',
                  ].map((line) => (
                    <li key={line} className="flex gap-4 text-white/80">
                      <span aria-hidden="true" className="mt-2.5 h-px w-6 shrink-0 bg-gold" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Footer />

      <style>{`
        /* The remote PP Neue Montreal @import was removed: it is a
           render-blocking request to an unofficial font CDN, and the page now
           uses the self-hosted brand fonts. */
        body {
          overflow-x: hidden;
        }

        /* Off-black rather than pure #000, which flattens the photography. */
        .slideshow-section {
          background-color: #08101D;
          color: #fff;
        }

        .slideshow {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          height: 100%;
          overflow: hidden;
        }

        .slide__scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(
            to top,
            rgba(8, 16, 29, 0.72) 0%,
            rgba(8, 16, 29, 0.28) 45%,
            rgba(8, 16, 29, 0.45) 100%
          );
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
