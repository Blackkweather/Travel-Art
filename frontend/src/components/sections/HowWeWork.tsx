import { t } from '@/i18n'

/**
 * The values, as things actually done.
 *
 * The about page listed four values as words - Exigence, Clarté,
 * Accompagnement - which every company on earth also lists. This is the same
 * position stated as commitments that can be checked against the product:
 * applications really are read by hand, each residency has someone to call,
 * and the travel really is settled before arrival. Nothing about money: the
 * owner's rule for every page read before sign-up.
 */

const COMMITMENTS = [
  {
    title: t('Nous lisons chaque candidature'),
    body: t(
      'Aucun profil n’apparaît sur la plateforme sans avoir été lu. C’est plus lent qu’une inscription automatique et c’est la seule façon de savoir qui se trouve des deux côtés d’une résidence.'
    ),
  },
  {
    title: t('Nous accompagnons chaque résidence'),
    body: t(
      'Un interlocuteur des deux côtés, de la première proposition au dernier soir. Quand une question se pose sur place, quelqu’un répond — y compris un dimanche.'
    ),
  },
  {
    title: t('Nous réglons la logistique avant, pas après'),
    body: t(
      'Dates, séjour, prestation et transport sont écrits dans une convention signée avant le départ. Personne ne découvre une condition en arrivant.'
    ),
  },
  {
    title: t('Nous savons dire non'),
    body: t(
      'Tous les hôtels ne conviennent pas à une résidence, et tous les artistes ne conviennent pas à toutes les maisons. Refuser reste le meilleur service qu’on puisse rendre aux deux.'
    ),
  },
]

export default function HowWeWork() {
  return (
    <section className="band-warm">
      <div className="shell">
        <p className="eyebrow">{t('Notre façon de faire')}</p>
        <h2 className="mt-5 max-w-[24ch]">{t('Quatre engagements, pas quatre adjectifs.')}</h2>

        <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {COMMITMENTS.map((c) => (
            <div key={c.title} className="border-t border-line-strong pt-6">
              <h3>{c.title}</h3>
              <p className="mt-3 text-content-secondary leading-relaxed max-w-[44ch]">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
