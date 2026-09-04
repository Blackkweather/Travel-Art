import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { commonApi } from '@/utils/api'
import { countryLabel } from '@/i18n/countries'
import { t } from '@/i18n'

/**
 * The roster, as an index rather than a photo grid.
 *
 * The landing page showed the hotels' side of the catalogue and none of the
 * people. A row of portraits was the obvious answer and the wrong one: across
 * sixteen artists the catalogue holds three distinct images and one real
 * profile picture, so any four-across grid shows the same stock photograph
 * twice and announces the gap rather than the roster.
 *
 * Set as a typographic index instead - name, discipline, country, on a rule.
 * It reads as an editorial list rather than a grid with pieces missing, it
 * carries more names in less height, and it needs no photography to look
 * finished. When real portraits exist, this is the section to revisit.
 */

interface Artist {
  id: string
  stageName?: string | null
  discipline?: string | null
  user?: { name?: string | null; country?: string | null } | null
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    let alive = true
    commonApi
      .getTopArtists({ limit: 12 })
      .then((res) => {
        if (!alive || !res.data?.success) return
        const list: Artist[] = res.data.data || []
        setArtists(list.filter((a) => a.stageName || a.user?.name).slice(0, 8))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (artists.length === 0) return null

  return (
    <section className="band">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t('Les artistes')}</p>
            <h2 className="mt-5 max-w-[20ch]">{t('Ceux qui montent sur scène.')}</h2>
          </div>
          <Link to="/top-artists" className="btn-ghost btn-arrow">
            {t('Voir tous les artistes')}
          </Link>
        </div>

        <ul className="mt-12 grid gap-x-16 md:grid-cols-2 border-t border-line">
          {artists.map((a) => {
            const name = a.stageName || a.user?.name || t('Artiste')
            const where = countryLabel(a.user?.country)
            return (
              <li key={a.id} className="border-b border-line">
                <Link
                  to={`/artist/${a.id}`}
                  className="group flex items-baseline justify-between gap-6 py-5"
                >
                  <span className="font-serif text-xl md:text-2xl text-content
                                   group-hover:text-gold transition-colors duration-500">
                    {name}
                  </span>
                  <span className="shrink-0 text-right text-sm text-content-secondary">
                    {a.discipline}
                    {a.discipline && where && <span aria-hidden="true"> · </span>}
                    {where}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
