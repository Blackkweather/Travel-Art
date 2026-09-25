import { useEffect, useMemo, useState } from 'react'
import { commonApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * What the roster actually covers.
 *
 * /top-hotels groups its venues into types and reads the better for it;
 * /top-artists had no equivalent, so a hotelier scanning it could not tell
 * whether the catalogue held a pianist or a flamenco dancer without reading
 * every card.
 *
 * Grouped from the disciplines the artists themselves entered, not from a
 * taxonomy invented here: thirteen distinct disciplines across sixteen artists
 * is too granular to show raw, but the families are real and the counts come
 * from the data, so this cannot claim a discipline nobody practises.
 */

const FAMILIES: { name: string; match: RegExp }[] = [
  { name: t('Musique'), match: /saxo|piano|jazz|dj|production|chant|lyrique|fado|oud|guitare|violon|musique|classique/i },
  { name: t('Danse'), match: /danse|flamenco|ballet|tango|hip-hop/i },
  { name: t('Arts visuels'), match: /visuel|photo|peinture|sculpture|atelier|artisan|dessin|calligraph|street/i },
  { name: t('Scène et bien-être'), match: /yoga|cirque|th[éeè]|magie|humour|conte|m[ée]ditation|acrobat/i },
]

interface Artist {
  discipline?: string | null
}

export default function Disciplines() {
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    let alive = true
    commonApi
      .getTopArtists({ limit: 60 })
      .then((res) => {
        if (alive && res.data?.success) setArtists(res.data.data || [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const groups = useMemo(() => {
    const named = artists
      .map((a) => (a.discipline || '').trim())
      .filter(Boolean)
    if (named.length === 0) return []

    const out = FAMILIES.map((f) => ({ name: f.name, items: [] as string[], count: 0 }))
    const other = { name: t('Autres disciplines'), items: [] as string[], count: 0 }

    for (const d of named) {
      const i = FAMILIES.findIndex((f) => f.match.test(d))
      const bucket = i >= 0 ? out[i] : other
      bucket.count += 1
      // The label is the discipline; a family lists each one once.
      if (!bucket.items.includes(d)) bucket.items.push(d)
    }
    return [...out, other].filter((g) => g.count > 0)
  }, [artists])

  if (groups.length === 0) return null

  return (
    <section className="band">
      <div className="shell">
        <p className="eyebrow">{t('Le répertoire')}</p>
        <h2 className="mt-5 max-w-[22ch]">{t('Ce que couvre la sélection.')}</h2>

        <dl className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.name} className="border-t border-line pt-5">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-xl text-content md:text-2xl">{g.name}</span>
                <span className="text-sm text-content-secondary tabular-nums">
                  {g.count}
                </span>
              </dt>
              <dd className="mt-3 text-content-secondary leading-relaxed">
                {g.items.join(' · ')}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
