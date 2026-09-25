import { Link } from 'react-router-dom'
import { t } from '@/i18n'

/**
 * Why an artist would join, on the page that lists artists.
 *
 * /partners spends a whole band on what a hotel gets out of this and closes at
 * around 9,000 characters. /top-artists listed twelve faces, said nothing
 * about the terms, and closed at 1,600 — the two sides of the same marketplace
 * were not being sold with the same care.
 *
 * Every figure here is what the product actually charges: the tiers are the
 * ones /api/payments/membership bills, and the fee and travel terms are the
 * ones stated on the landing page and in the booking flow.
 */

const TERMS = [
  {
    title: t('Vos honoraires, entiers'),
    body: t(
      'Travel Art ne prélève aucune commission sur ce que l’hôtel vous verse. Ce qui est convenu est ce que vous touchez.'
    ),
  },
  {
    title: t('Vous n’avancez rien'),
    body: t(
      'Voyage, hébergement et repas sont réglés par l’hôtel avant votre arrivée. C’est ce qui rend une date à l’autre bout du monde possible.'
    ),
  },
  {
    title: t('Vos œuvres restent les vôtres'),
    body: t(
      'Une résidence n’achète pas votre travail. Vous gardez vos droits sur ce que vous créez et sur ce que vous jouez.'
    ),
  },
  {
    title: t('Des maisons qui programment sérieusement'),
    body: t(
      'Chaque hôtel est validé à la main avant d’apparaître ici. Vous ne jouez pas dans un hall en fond sonore.'
    ),
  },
]

export default function ArtistBenefits() {
  return (
    <section className="band-warm">
      <div className="shell">
        <p className="eyebrow">{t('Pour les artistes')}</p>
        <h2 className="mt-5 max-w-[22ch]">{t('Ce que vous y gagnez.')}</h2>

        {/* Two by two rather than four across: these are four sentences to
            read, not four labels to scan, and they need the measure. */}
        <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {TERMS.map((term) => (
            <div key={term.title} className="border-t border-line-strong pt-6">
              <h3>{term.title}</h3>
              <p className="mt-3 text-content-secondary leading-relaxed max-w-[42ch]">
                {term.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-4">
          <Link to="/register?role=artist" className="btn-primary btn-arrow">
            {t('Rejoindre le programme')}
          </Link>
          <p className="text-sm text-content-secondary">
            {t('Adhésion annuelle à partir de 50 € — aucune commission sur vos cachets.')}
          </p>
        </div>
      </div>
    </section>
  )
}
