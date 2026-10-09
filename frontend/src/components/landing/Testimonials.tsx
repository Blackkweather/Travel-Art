import { useEffect, useState } from 'react'
import { commonApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * What the hotels said afterwards.
 *
 * /api/testimonials returns real ratings left by hotels on completed
 * residencies. There are only two of them today, so this is set as facing
 * pull-quotes rather than a card grid: two cards in a three-column grid read
 * as a page with something missing, whereas two quotes read as two quotes.
 * The layout holds at one, two or three and stops there.
 */

interface Testimonial {
  id: string
  comment: string
  hotelName?: string | null
  location?: string | null
  rating?: number | null
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([])

  useEffect(() => {
    let alive = true
    commonApi
      .getTestimonials()
      .then((res) => {
        if (!alive || !res.data?.success) return
        const list: Testimonial[] = res.data.data || []
        setItems(list.filter((x) => x.comment && x.comment.trim()).slice(0, 3))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="band-warm">
      <div className="shell">
        <p className="eyebrow">{t('Retours')}</p>
        <h2 className="mt-5 max-w-[22ch]">{t('Ce que les hôtels en disent.')}</h2>

        <div
          className={`mt-14 grid gap-x-12 gap-y-12 ${
            items.length === 1 ? 'max-w-[54ch]' : 'md:grid-cols-2'
          } ${items.length === 3 ? 'lg:grid-cols-3' : ''}`}
        >
          {items.map((item) => (
            <figure key={item.id} className="flex flex-col">
              <blockquote className="font-serif text-xl md:text-2xl leading-[1.45] text-content">
                <span aria-hidden="true" className="text-gold">“</span>
                {item.comment}
                <span aria-hidden="true" className="text-gold">”</span>
              </blockquote>
              <figcaption className="mt-6 text-sm text-content-secondary">
                {item.hotelName && <span className="text-content">{item.hotelName}</span>}
                {item.hotelName && item.location && <span aria-hidden="true"> — </span>}
                {item.location}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
