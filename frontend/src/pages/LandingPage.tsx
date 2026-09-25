import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { tripsApi } from '@/utils/api'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GalleryPan from '@/components/GalleryPan'
import CinematicHero from '@/components/landing/CinematicHero'
import ProofBand from '@/components/landing/ProofBand'
import ProcessSteps from '@/components/landing/ProcessSteps'
import FeaturedArtists from '@/components/landing/FeaturedArtists'
import Testimonials from '@/components/landing/Testimonials'
import LandingFaq from '@/components/landing/LandingFaq'
import SimpleNavbar from '@/components/SimpleNavbar'
import { useAuthStore } from '@/store/authStore'
import Footer from '@/components/Footer'
import { extractArray, parseJsonField } from '@/utils/apiPayload'
import { t } from '@/i18n'
import { experienceTypeLabel } from '@/utils/i18n'
import { countryLabel } from '@/i18n/countries'

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

// The three promises the programme makes, in the order an artist weighs them:
// where they will be, what they will make, what it costs them.
//
// The imagery was three Unsplash stock frames - a hotel bed with a television,
// a neon MUSIC sign, a festival crowd - which said "hotel" and "music" without
// saying anything about a residency. These are commissioned to the brand
// instead: one warm-light register across all three, navy in the shadows, gold
// in the highlights, and an artist's presence implied by their tools rather
// than staged. Self-hosted, so the CDN round trip and its CSP entry go away.
const PILLARS = [
  {
    title: t('Résidence'),
    body: t('Une chambre et une scène dans un hôtel qui programme la culture toute l’année, pas un soir de gala.'),
    image: '/images/pillars/residence.webp',
    width: 1792,
    height: 2304,
  },
  {
    title: t('Création'),
    body: t('Du temps entre deux représentations. Ce que vous produisez sur place vous appartient entièrement.'),
    image: '/images/pillars/creation.webp',
    width: 1792,
    height: 2432,
  },
  {
    title: t('Tout compris'),
    body: t('Voyage, hébergement et repas réglés avant votre arrivée. Aucune commission prélevée côté artiste.'),
    image: '/images/pillars/tout-compris.webp',
    width: 2048,
    height: 2048,
  },
] as const

// Spans, crops and vertical offsets for the pillar trio. Kept beside the data
// so the two cannot fall out of step: three entries, three pillars.
const PILLAR_LAYOUT = [
  { col: 'md:col-span-5', ratio: 'aspect-[4/5]', offset: '' },
  { col: 'md:col-span-4', ratio: 'aspect-[3/4]', offset: 'md:mt-16' },
  { col: 'md:col-span-3', ratio: 'aspect-square', offset: 'md:mt-32' },
] as const


/**
 * Choose the narrowest hero variant that still covers the viewport.
 *
 * Only rewrites paths under /images/hero/, which are the ones that have -960
 * and -1440 siblings; anything else (a trip photograph from the API) is
 * returned untouched, because guessing at a variant that does not exist would
 * render a broken hero.
 */
const heroVariant = (src: string): string => {
  if (typeof window === 'undefined') return src
  if (!src.startsWith('/images/hero/') || !src.endsWith('.webp')) return src
  const effective = window.innerWidth * (window.devicePixelRatio || 1)
  if (effective <= 960) return src.replace('.webp', '-960.webp')
  if (effective <= 1440) return src.replace('.webp', '-1440.webp')
  return src
}

/**
 * First letter set as a drop cap.
 *
 * The initial used to be written into the markup - <span>L</span> followed by
 * "e voyage..." - which is only ever right in French. Taking it off the front
 * of the sentence keeps the effect and lets the sentence be translated.
 */
function DropCap({ children }: { children: string }) {
  return (
    <>
      <span>{children.charAt(0)}</span>
      {children.slice(1)}
    </>
  )
}

export default function LandingPage() {
  // The hero is a full-viewport section, so an empty slide list renders as a
  // black void. These fallbacks keep the landing page presentable whenever the
  // API is unreachable or the catalogue is still too small to fill the
  // slideshow. The three photographs are commissioned to the brand and served
  // from /public, so the hero no longer depends on a third-party CDN being up.
  const defaultSlides: Slide[] = [
    {
      id: 'fallback-1',
      image: '/images/hero/ombre.webp',
      title: t('Entre l’ombre'),
      subtitle: t('et la lumière'),
      category: t('Expérience')
    },
    {
      id: 'fallback-2',
      image: '/images/hero/scene.webp',
      title: t('Là où l’art'),
      subtitle: t('rencontre le luxe'),
      category: t('Scène')
    },
    {
      id: 'fallback-3',
      image: '/images/hero/voyage.webp',
      title: t('Des scènes sans'),
      subtitle: 'frontières',
      category: 'Voyage'
    }
  ]

  // States
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [experiences, setExperiences] = useState<any[]>([])
  // The only slide state that is rendered from. It is set when a navigation
  // *starts*, because the photograph has to begin dissolving with the type
  // rather than after it; the timeline's own completion is tracked on
  // currentIndexRef below. A second piece of state held the settled index and
  // was read by nothing - it only forced a render per navigation.
  const [heroFrame, setHeroFrame] = useState(0)
  // Seeded, not empty: the hero paints on the first render instead of
  // showing a black full-height void until the trips request resolves. Only
  // the opening slide is seeded - seeding all three made the phone fetch two
  // more full-bleed photographs (144 kB) that the API slides then replaced
  // without either ever being seen.
  const [slides, setSlides] = useState<Slide[]>(() => defaultSlides.slice(0, 1))

  // Refs
  const heroRef = useRef<HTMLElement>(null)
  const slideshowRef = useRef<HTMLDivElement>(null)
  const counterStripRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)
  const mouseXRef = useRef(0)
  // The wheel, touch, click and key handlers are bound once and must still see
  // the current slide when they fire. Reading it from state instead meant the
  // setup effect had to list currentSlideIndex as a dependency, and that
  // rebound the listeners - and re-ran the opening reveal - on every
  // navigation. See the intro effect below.
  const currentIndexRef = useRef(0)
  const introPlayedRef = useRef(false)
  const weLoveSectionRef = useRef<HTMLElement>(null)
  const descriptionRef = useRef<HTMLElement>(null)
  const experienceImagesSectionRef = useRef<HTMLElement>(null)
  const experiencesSectionRef = useRef<HTMLElement>(null)
  
/* The signed-out gallery.
 *
 * GalleryPan is the pinned horizontal run - the page holds still and the work
 * travels sideways. It renders nothing on an empty array, and gating the
 * catalogue emptied it, so the signature moment on the front page disappeared
 * for every visitor who was not logged in. Which is every visitor.
 *
 * These six keep it. They are the curated photographs already in the repo,
 * captioned with a discipline and a country and nothing else: no hotel, no
 * artist, no city precise enough to name a house on its own. They point at
 * /register rather than a residency a visitor cannot open.
 */
const SIGNED_OUT_GALLERY = [
  { id: 'g-alpine',  image: '/images/resorts/alpine.webp', title: 'Piano, en altitude',      category: 'Musique',      location: 'France',   href: '/register' },
  { id: 'g-riad',    image: '/images/resorts/riad.webp',   title: 'Oud, dans un patio',      category: 'Musique',      location: 'Maroc',    href: '/register' },
  { id: 'g-lagoon',  image: '/images/resorts/lagoon.webp', title: 'Danse, face au lagon',    category: 'Scène',        location: 'Thaïlande', href: '/register' },
  { id: 'g-coast',   image: '/images/resorts/coast.webp',  title: 'Voix, au coucher',        category: 'Musique',      location: 'Portugal', href: '/register' },
  { id: 'g-desert',  image: '/images/resorts/desert.webp', title: 'Atelier, plein désert',   category: 'Arts visuels', location: 'Maroc',    href: '/register' },
  { id: 'g-marina',  image: '/images/resorts/marina.webp', title: 'Jazz, sur le port',       category: 'Musique',      location: 'Italie',   href: '/register' },
]

  const weLovetags = ['MUSIQUE', 'ART', 'VOYAGE', 'LUXE', 'CULTURE', 'RENCONTRE', 'CRÉATION', 'SCÈNE']


  // Fetch experiences and create slides
  useEffect(() => {
    /* The catalogue is behind an account, so a guest's request can only 401.
       Skipping it keeps a guaranteed failure, and a red line in the console,
       off the front page - and the hero simply keeps the curated slides it
       opened with, which name no hotel and no artist. */
    if (!isAuthenticated) {
      setExperiences(SIGNED_OUT_GALLERY)
      setSlides(defaultSlides)
      return
    }

    const fetchData = async () => {
      try {
        const tripsRes = await tripsApi.getAll()
        
        const trips = extractArray(tripsRes.data, 'trips')

        const formatted = trips.map((trip: any) => {
          const images = Array.isArray(trip.images) ? trip.images : parseJsonField<string[]>(trip.images, [])

          // location arrives as {city, country}; the card wants one line.
          const loc = parseJsonField<any>(trip.location, null)
          const place = loc ? [loc.city, countryLabel(loc.country)].filter(Boolean).join(', ') : ''

          return {
            id: trip.id,
            title: trip.title || t('Expérience'),
            description: trip.description?.substring(0, 100) || '',
            image: images[0] || trip.image || '/images/placeholder-experience.webp',
            // experienceTypeLabel turns the stored value into copy; without it
            // the card printed the enum, "rooftop", on a French page.
            category: experienceTypeLabel(trip.type) || trip.category || t('Expérience'),
            location: place || trip.hotel || '',
            // Kept apart as well as joined: the hero sets them on two
            // separate lines, and re-splitting the joined string there would
            // break on any city whose name contains a comma.
            city: loc?.city || '',
            country: countryLabel(loc?.country),
          }
        })
        
        setExperiences(formatted)

        if (formatted.length >= 3) {
          const experienceSlides: Slide[] = formatted.slice(0, 5).map((exp: any) => {
            /* The place leads. Every trip is titled "Résidence — <place>", so
               splitting on the em-dash put the same word, in the largest type
               on the page, at the top of five consecutive slides: the hero
               changed photograph and said "Résidence" again. What actually
               differs is the city and its country, and both are already
               parsed off the trip's location.

               The title split stays as the fallback for a trip with no
               location, and the word-halving below for one whose title has no
               separator either. */
            const raw = exp.title || t('Expérience')
            const dash = raw.includes('—')
              ? raw.split('—').map((part: string) => part.trim())
              : null
            const words = raw.split(' ')
            const midPoint = Math.max(1, Math.floor(words.length / 2))

            const lead = exp.city || (dash ? dash[1] : words.slice(0, midPoint).join(' '))
            const under = exp.country || (dash ? dash[0] : words.slice(midPoint).join(' '))

            return {
              id: exp.id,
              image: exp.image,
              title: lead || t('Entre l’ombre'),
              subtitle: under || t('et la lumière'),
              category: exp.category
            }
          })
          // Keep the opening slide. It is already on screen and already
          // decoded, so replacing the whole array would swap the image the
          // reader is looking at a second after they arrived.
          setSlides([defaultSlides[0], ...experienceSlides])
        } else {
          // Too few experiences to fill the slideshow - fall back rather than
          // leaving the hero blank.
          setSlides(defaultSlides)
        }
      } catch (error: any) {
        console.error('Failed to fetch experiences:', error)
        setExperiences([])
        setSlides(defaultSlides)
      }
    }
    fetchData()
  }, [isAuthenticated])

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

    const prevIndex = currentIndexRef.current
    const nextIndex = direction === NEXT
      ? prevIndex < slides.length - 1 ? prevIndex + 1 : 0
      : prevIndex > 0 ? prevIndex - 1 : slides.length - 1

    performNavigation(prevIndex, nextIndex)
  }

  // Perform navigation animation
  const performNavigation = (prevIndex: number, nextIndex: number) => {
    if (!slideshowRef.current) return

    isAnimatingRef.current = true
    setHeroFrame(nextIndex)

    const slideElements = slideshowRef.current.querySelectorAll('.slide')

    const currentSlide = slideElements[prevIndex] as HTMLElement
    const currentTextLines = currentSlide.querySelectorAll('.slide__text-line')

    const nextSlide = slideElements[nextIndex] as HTMLElement
    const nextTextLines = nextSlide.querySelectorAll('.slide__text-line')

    /* The photograph dissolves on the GPU in CinematicHero, so these .slide
       elements now carry only the type. Pushing one a whole viewport up while
       the other arrives from below - and staggering the lines inside them at
       the same time - was two vertical gestures fighting over the same words.
       The container stays put; only the type moves, and only once. */
    gsap.set(nextSlide, {
      visibility: 'visible',
      y: '0%'
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
        currentIndexRef.current = nextIndex
      }
    })

    // Add counter animation
    animateCounter(nextIndex, tl)

    // Animate out current text
    /* Out: a short lift and a fade, close enough that the words look like
       they are being taken off the page rather than thrown off it. It has to
       finish before the next line arrives, because without the container
       push the two sets of type now occupy the same place. */
    tl.to(
      currentTextLines,
      {
        y: '-45%',
        opacity: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power3.in'
      },
      0
    )

    // The photograph itself is no longer animated here: CinematicHero
    // dissolves it on the GPU, driven by currentSlideIndex. Only the type
    // moves in this timeline.

    /* Animate in next text.
       No delay: this tween is already positioned at 0.9s on the timeline, and
       the 0.6s delay on top of that started the headline at 1.5s - the
       outgoing type has been gone since 0.7s, so the hero spent the middle
       third of every transition with no words on it at all, and the timeline
       ran ~2.9s when the photograph had finished dissolving at 1.6s. The type
       now rises while the image is still resolving, which reads as one
       gesture rather than two. */
    tl.to(
      nextTextLines,
      {
        y: 0,
        opacity: 1,
        duration: 0.95,
        stagger: 0.08,
        ease: 'power3.out'
      },
      0.55
    )
  }

  // Initialize slideshow - CodePen style
  useEffect(() => {
    if (slides.length === 0 || !slideshowRef.current) return

    // Standard GSAP eases, in place of the three named curves this was
    // written against. 'textReveal' was still being passed as an ease string
    // below: GSAP does not know that name, so it silently used its default
    // and warned - the opening reveal has never actually run on the curve
    // this comment describes.

    // Initialize counter strip
    initCounterStrip()

    const slideElements = Array.from(
      slideshowRef.current.querySelectorAll('.slide')
    ) as HTMLElement[]

    /* Exactly one slide may be visible, and it is whichever one is showing
       now - not always the first. This effect used to re-show slide 0 on
       every navigation, which left two headlines stacked at y:0 and replayed
       the opening reveal underneath the slide the visitor was actually on. */
    const active = Math.min(currentIndexRef.current, slideElements.length - 1)
    slideElements.forEach((element, i) => {
      gsap.set(element, { visibility: i === active ? 'visible' : 'hidden', y: '0%' })
      element.classList.toggle('active', i === active)
    })

    const activeSlide = slideElements[active]
    // The reveal is an entrance, so it belongs to the first paint only. The
    // slide list grows once, when the trips request resolves, and replaying
    // the reveal then would stutter type the visitor is already reading.
    if (activeSlide && !introPlayedRef.current) {
      introPlayedRef.current = true
      const firstSlideTextLines = activeSlide.querySelectorAll('.slide__text-line')
      // No delay: the reveal is the first thing on the page, and the hero
      // already costs a hydration pass before it can run at all.
      gsap.to(firstSlideTextLines, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.08,
        delay: 0,
        ease: 'power3.out'
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
        if (e.deltaY > 0 && currentIndexRef.current === slides.length - 1) {
          // Allow normal scroll down after last slide
          return
        }
        if (e.deltaY < 0 && currentIndexRef.current === 0) {
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
    // Deliberately not currentSlideIndex: every handler above reads the live
    // value from currentIndexRef, so re-binding them per navigation bought
    // nothing and cost a duplicated opening animation.
  }, [slides])

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
  return (
    <div className="overflow-x-hidden relative bg-[var(--surface)]">
      {/* The site navigation, not a third copy of it. This page carried its
          own header (and its own footer, below) with its own link list, its own
          scroll state and its own CTA styling, so the landing page drifted out
          of step with every other public page. SimpleNavbar already handles the
          dark-background case this page needs. */}
      <SimpleNavbar overMedia />
      <main id="contenu">

      {/* Hero. min-h-[100dvh] rather than h-screen so the iOS address bar does
          not crop it. */}
      <section ref={heroRef} className="slideshow-section relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Painted first and never animated: whatever happens to WebGL, the
            opening photograph is on screen. The canvas above it is the
            enhancement, not the content. */}
        <div
          className="slide__base"
          aria-hidden="true"
          style={{ backgroundImage: `url(${heroVariant(slides[0]?.image ?? '')})` }}
        />

        <CinematicHero images={slides.map((slide) => heroVariant(slide.image))} index={heroFrame} />

        {/* Scrim keeps the headline above AA contrast whatever the photo. */}
        <div className="slide__scrim" aria-hidden="true" />

        <div ref={slideshowRef} className="slideshow">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide ${index === 0 ? 'active' : ''}`}
            >
              <div className="slide__text">
                <h1 className="slide__text-line">{slide.title}</h1>
                <h2 className="slide__text-line">{slide.subtitle}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* The hero had no call to action at all: the first screen of the site
            named the product and then asked the visitor for nothing. Both
            audiences are addressed here because the homepage serves two
            entirely different people and guessing which one arrived is worse
            than asking. */}
        <div className="absolute bottom-24 sm:bottom-10 left-5 sm:left-8 lg:left-12 z-20 flex flex-wrap gap-3">
          <Link to="/register?role=artist" className="btn-gold btn-arrow">
            {t('Je suis artiste')}
          </Link>
          <Link to="/register?role=hotel" className="btn-on-media btn-arrow">
            {t('Je suis un hôtel')}
          </Link>
        </div>

        {/* Real buttons instead of a custom cursor: keyboard reachable and
            visible on touch, where a cursor affordance does not exist. */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 right-5 sm:right-8 lg:right-12 z-20 flex gap-3">
            <button
              type="button"
              onClick={() => navigate(PREV)}
              aria-label={t('Expérience précédente')}
              className="w-12 h-12 rounded-control border border-white/60 bg-black/25 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-navy hover:border-white transition-colors duration-300 active:translate-y-px"
            >
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate(NEXT)}
              aria-label={t('Expérience suivante')}
              className="w-12 h-12 rounded-control border border-white/60 bg-black/25 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white hover:text-navy hover:border-white transition-colors duration-300 active:translate-y-px"
            >
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* Below the hero the page is light. Bands alternate white and warm and
          never repeat a tone twice in a row, so a long scroll reads as a
          sequence of separate ideas. The one inverse band is the closing call
          to action, which makes it the highest-contrast moment on the page -
          exactly where the decision is asked for. */}
      <div className="bg-[var(--surface)]">
        {/* Disciplines, immediately after the hero. Moving this above the
            manifesto answers "what kind of artists?" before asking anyone to
            read a paragraph. Outlined type rather than a near-invisible tint:
            on a white page a 7%-opacity fill is not decoration, it is nothing,
            whereas an outline reads as deliberate display lettering. */}
        {/* The first thing after the photograph: proof the catalogue is real. */}
        <ProofBand />

        <section ref={weLoveSectionRef} className="py-16 md:py-24 relative overflow-hidden border-b border-line" style={{ opacity: 1 }}>
          <div aria-hidden="true" className="space-y-2 select-none">
            <div className="flex animate-scroll-right" style={{ willChange: 'transform', width: 'fit-content' }}>
              {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-5xl md:text-7xl lg:text-8xl font-serif italic text-outline mx-6 md:mx-10 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex animate-scroll-left" style={{ willChange: 'transform', width: 'fit-content' }}>
              {[...weLovetags, ...weLovetags, ...weLovetags].map((tag, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-5xl md:text-7xl lg:text-8xl font-serif italic text-gold mx-6 md:mx-10 whitespace-nowrap"
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

        {/* Manifesto. A drop cap and a hanging measure make this read as
            editorial opening copy rather than a hero subtitle. */}
        <section ref={descriptionRef} className="band-warm" style={{ opacity: 1 }}>
          <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-y-12 gap-x-8">
            <p className="lg:col-span-7 lg:col-start-2 text-2xl md:text-3xl lg:text-[2.4rem] font-serif
                          leading-[1.3] text-content
                          [&>span:first-child]:float-left [&>span:first-child]:font-serif
                          [&>span:first-child]:text-gold [&>span:first-child]:text-[5.5rem]
                          [&>span:first-child]:leading-[0.78] [&>span:first-child]:pr-4
                          [&>span:first-child]:pt-1">
              <DropCap>
                {t(
                  'Le voyage et l’immersion culturelle sont le point de départ du travail. Nous installons des artistes dans des hôtels qui méritent qu’on s’y arrête, et ce qui s’y produit devient l’essentiel.'
                )}
              </DropCap>
            </p>

            {/* A headline beside a small explainer paragraph is the templated
                section header this design language keeps reaching for. The
                paragraph that used to open this column restated the manifesto
                next to it and was cut; what remains is a figure, which is a
                compositional element rather than filler, and earns the split. */}
            <div className="lg:col-span-3 lg:col-start-10 self-end">
              <div className="h-px w-full bg-line-strong" />
              <p className="mt-8 font-serif text-6xl text-gold leading-none">30+</p>
              <p className="text-content-secondary text-sm mt-3">
                {t('Destinations, de Paris à Ibiza')}
              </p>
            </div>
          </div>
        </section>

        {/* The three pillars, the reference's central device: what the
            programme actually is, said in three images rather than in a
            paragraph nobody finishes. Each one is a promise the product has to
            keep, which is why they are named for what the artist receives
            rather than for platform features. */}
        <section className="band">
          <div className="shell">
            <p className="eyebrow">{t('Le programme')}</p>
            <h2 className="mt-5 max-w-[18ch]">{t('Une résidence, pas une prestation.')}</h2>

            {/* Three equal columns at identical heights is the single most
                recognisable generated-layout shape, and it also flattens the
                content: these three promises are not equally weighted. The
                residency is the offer, so it takes the widest column and the
                tallest crop; the other two step down in width, aspect and
                vertical offset. Twelve columns, spans 5 / 4 / 3. */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-x-10 lg:gap-y-12">
              {PILLARS.map((pillar, i) => (
                <article
                  key={pillar.title}
                  className={`flex flex-col ${PILLAR_LAYOUT[i].col} ${PILLAR_LAYOUT[i].offset}`}
                >
                  <div className={`relative overflow-hidden rounded-card bg-surface-sunken ${PILLAR_LAYOUT[i].ratio}`}>
                    {/* alt is empty on purpose: the heading directly below
                        names the pillar, so describing the photograph would
                        make a screen reader announce it twice. */}
                    <img
                      src={pillar.image}
                      alt=""
                      width={pillar.width}
                      height={pillar.height}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mt-6">{pillar.title}</h3>
                  <p className="mt-3 text-content-secondary leading-relaxed max-w-[38ch]">
                    {pillar.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Signature moment: the work travels sideways while the page holds. */}
        <GalleryPan items={experiences.slice(0, 6)} />

        {/* The gallery shows the places; this shows who plays them. */}
        <FeaturedArtists />

        {/* The exchange, set as two facing columns. A different layout family
            from the gallery above and the band below, and it states both sides
            of the trade at once rather than as three identical cards. */}
        <section ref={experiencesSectionRef} className="band-warm" style={{ opacity: 1 }}>
          <div className="shell">
            <p className="eyebrow">{t('Comment ça marche')}</p>
            <h2 className="mt-5 max-w-[16ch] mb-16">{t('Un échange, deux versants.')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:pr-16 lg:border-r border-line-strong">
                <h3 className="text-gold">{t('Pour les artistes')}</h3>
                <p className="mt-6 text-content-secondary leading-relaxed max-w-[42ch]">
                  {t('Une chambre, une scène et le temps de créer. Vous gardez vos honoraires et vos œuvres.')}
                </p>
                <ul className="mt-10 space-y-5">
                  {[
                    t('Des résidences dans des hôtels qui programment sérieusement la culture'),
                    t('Aucune commission prélevée côté artiste'),
                    t('Voyage et hébergement réglés avant votre arrivée'),
                  ].map((line) => (
                    <li key={line} className="flex gap-4 text-content">
                      <span aria-hidden="true" className="spark mt-2" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=artist" className="btn-primary btn-arrow mt-10">
                  {t('Je suis artiste')}
                </Link>
              </div>

              <div className="mt-16 lg:mt-0 lg:pl-16">
                <h3 className="text-gold">{t('Pour les hôtels')}</h3>
                <p className="mt-6 text-content-secondary leading-relaxed max-w-[42ch]">
                  {t('Une programmation culturelle sans agence, sans producteur et sans une saison de préparatifs.')}
                </p>
                <ul className="mt-10 space-y-5">
                  {[
                    t('Des artistes sélectionnés en musique, arts visuels et scène'),
                    t('Un seul solde de crédits pour toutes vos réservations'),
                    t('Des dates que vous maîtrisez, confirmées ou annulées en un clic'),
                  ].map((line) => (
                    <li key={line} className="flex gap-4 text-content">
                      <span aria-hidden="true" className="spark mt-2" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=hotel" className="btn-primary btn-arrow mt-10">
                  {t('Je suis un hôtel')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The band above states what each side gets; these state how it
            happens, how it went for the hotels that have done it, and the
            questions a visitor still has when they reach the bottom. */}
        <ProcessSteps />
        <Testimonials />
        <LandingFaq />

        {/* Closing band. The only inverse surface below the hero, so the final
            action carries the most contrast on the page. */}
        <section ref={experienceImagesSectionRef} className="band-inverse relative overflow-hidden" style={{ opacity: 1 }}>
          <div className="shell text-center">
            <h2 className="mx-auto max-w-[20ch] text-4xl md:text-6xl lg:text-7xl leading-[1.05]">
              {t('Rejoignez le programme.')}
            </h2>
            <p className="mt-8 text-content-inverse/70 max-w-[46ch] mx-auto leading-relaxed">
              {t('Candidatez comme artiste, ou ouvrez votre hôtel au programme.')}
            </p>
            {/* "Nous rejoindre" here was a third label for the action the hero
                already names twice. The page asks the same question at the
                start and at the end, in the same words, so a visitor who
                scrolled past the hero meets a choice they recognise rather
                than a new one they have to re-read. */}
            <div className="mt-12 flex flex-wrap gap-4 justify-center">
              <Link to="/register?role=artist" className="btn-gold btn-arrow">
                {t('Je suis artiste')}
              </Link>
              <Link to="/register?role=hotel" className="btn-on-media btn-arrow">
                {t('Je suis un hôtel')}
              </Link>
            </div>
          </div>
        </section>

      </div>

      </main>
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
          z-index: 5;
          width: 100%;
          min-height: 100dvh;
          height: 100%;
          overflow: hidden;
        }

        /* The layer the canvas is drawn over. Same photograph, same crop, so
           if WebGL is unavailable the hero simply looks like it always did. */
        .slide__base {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
        }

        .slideshow-section > canvas {
          z-index: 1;
        }

        .slide__scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
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
        
        /* Raised clear of the CTA pair that now sits at the foot of the hero. */
        .slide__text {
          position: absolute;
          bottom: 11rem;
          left: 5rem;
          max-width: 80%;
          overflow: hidden;
          z-index: 5;
        }
        
        .slide__text-line {
          display: block;
          font-size: clamp(2.75rem, 7vw, 7rem);
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.015em;
          transform: translateY(100%);
          opacity: 0;
          /* The parent masks overflow so each line can slide up from behind an
             edge. With line-height 1 the line box is exactly the font size, so
             the accent on an uppercase É - which sits above the cap height -
             was clipped, and RÉSIDENCE rendered as RESIDENCE. The padding gives
             the glyph room inside the mask; the negative margin cancels it so
             the line does not move. */
          padding-top: 0.14em;
          margin-top: -0.14em;
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
          /* Clears the stacked CTA pair below it: two 48px buttons plus the gap,
             sitting on a 6rem offset, occupy about 12.5rem of the bottom edge. */
          .slide__text {
            bottom: 14.5rem;
            left: 1.25rem;
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
