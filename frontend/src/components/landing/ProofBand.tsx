import { useEffect, useState } from 'react'
import { commonApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * The figures, directly under the hero.
 *
 * A cold visitor's first question is whether any of this exists yet, and the
 * page answered it nowhere: it opened with a photograph, a marquee and a
 * gallery, then asked them to register. These are the real counts from
 * /api/stats, not copy, so they cannot drift from what the catalogue actually
 * holds.
 *
 * Deliberately not four cards in a row. Cards imply four equal things to read;
 * this is one sentence made of numbers, so it is set as a single rule-divided
 * line that a reader takes in at a glance and moves past.
 */

interface Stats {
  totalArtists: number
  totalHotels: number
  totalVenues: number
  totalBookings: number
}

export default function ProofBand() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let alive = true
    commonApi
      .getStats()
      .then((res) => {
        if (alive && res.data?.success) setStats(res.data.data)
      })
      // A failed count is not worth a broken page: the band simply does not
      // appear, and everything below it still reads.
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!stats) return null

  const figures = [
    { value: stats.totalArtists, label: t('artistes en résidence') },
    { value: stats.totalHotels, label: t('hôtels partenaires') },
    { value: stats.totalVenues, label: t('lieux de représentation') },
    { value: stats.totalBookings, label: t('résidences programmées') },
  ].filter((f) => typeof f.value === 'number' && f.value > 0)

  if (figures.length === 0) return null

  return (
    <section className="border-b border-line bg-surface" aria-label={t('Travel Art en chiffres')}>
      <div className="shell py-10 md:py-12">
        <dl
          className="grid grid-cols-2 gap-y-8 sm:gap-y-0 sm:flex sm:items-baseline
                     sm:justify-between sm:divide-x sm:divide-line"
        >
          {figures.map((f) => (
            <div key={f.label} className="sm:flex-1 sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <dd className="font-serif text-4xl md:text-5xl leading-none text-content tabular-nums">
                {f.value}
              </dd>
              <dt className="mt-2 text-[0.6875rem] uppercase tracking-[0.14em] text-content-secondary">
                {f.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
