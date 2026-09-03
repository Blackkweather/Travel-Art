import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { t } from '@/i18n'

gsap.registerPlugin(ScrollTrigger)

export interface GalleryItem {
  id: string
  image: string
  title: string
  category?: string
}

interface GalleryPanProps {
  items: GalleryItem[]
}

/**
 * Pinned horizontal gallery.
 *
 * The motion is motivated: browsing a body of work is a lateral act, so the
 * page holds still and the work travels past, the way you walk a gallery wall.
 * Under reduced motion it degrades to an ordinary horizontal scroller that the
 * user drives themselves.
 */
export default function GalleryPan({ items }: GalleryPanProps) {
  const wrap = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Pinning fights touch scrolling on narrow screens, where the plain
    // scroller is the better interaction anyway.
    const isNarrow = window.matchMedia('(max-width: 1023px)').matches
    if (prefersReduced || isNarrow || !wrap.current || !track.current) return

    const ctx = gsap.context(() => {
      const distance = () => track.current!.scrollWidth - window.innerWidth

      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    }, wrap)

    return () => ctx.revert()
  }, [items.length])

  if (items.length === 0) return null

  return (
    <section
      ref={wrap}
      aria-label={t('Résidences sélectionnées')}
      className="relative overflow-hidden bg-[var(--surface)]"
    >
      <div
        ref={track}
        className="flex gap-6 md:gap-10 lg:h-[100dvh] items-center px-5 sm:px-8 lg:px-[12vw] py-24 lg:py-0
                   overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scrollbar-hide"
      >
        {/* The section title travels with the work rather than sitting above
            it, so the pin starts on an image instead of dead space. */}
        <div className="shrink-0 w-[78vw] sm:w-[46vw] lg:w-[30vw] snap-start">
          <h2 className="text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            {t('Entre l’ombre')}
            <span className="block text-gold italic">{t('et la lumière.')}</span>
          </h2>
          <p className="mt-6 text-content-secondary text-base leading-relaxed max-w-[34ch]">
            {t('Des résidences dans des hôtels où même un hall mérite qu’on y joue.')}
          </p>
        </div>

        {items.map((item, i) => (
          <Link
            key={item.id}
            to={`/experience/${item.id}`}
            className="group shrink-0 snap-start w-[78vw] sm:w-[52vw] lg:w-[34vw]"
          >
            {/* Alternating heights keep the run from reading as a filmstrip. */}
            <div
              className={`relative overflow-hidden bg-surface-sunken rounded-card ${
                i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[4/5] lg:mt-24'
              }`}
            >
              <img decoding="async"
                src={item.image}
                alt={item.title}
                loading={i < 2 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-entrance
                           group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="text-xl md:text-2xl group-hover:text-gold transition-colors duration-500">
                {item.title}
              </h3>
              {item.category && (
                <span className="text-content-secondary text-sm shrink-0">{item.category}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
