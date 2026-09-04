import { Link } from 'react-router-dom'
import { t } from '@/i18n'

/**
 * The questions people actually arrive with.
 *
 * Everything stated here is taken from what the product does, not written to
 * fill the section: the membership tiers are the ones /api/payments/membership
 * charges, the credit packs are the ones /api/payments/packages returns, and
 * the country spread is the catalogue's ("more than twenty" rather than a
 * count, so it does not go stale the week a hotel is added).
 *
 * Built on <details>, so it opens without JavaScript, is keyboard-operable and
 * is announced correctly, and so a reader searching the page with ctrl-F finds
 * text inside a closed answer.
 */

const QUESTIONS = [
  {
    q: t('Combien cela coûte-t-il à un hôtel ?'),
    a: t(
      'L’hôtel achète des crédits et dépense des crédits pour chaque résidence. Les formules vont de 10 crédits (Découverte) à 50 crédits (Année), et le coût d’une résidence dépend de l’artiste. Pas d’abonnement, pas de commission sur ce que vous vendez ce soir-là.'
    ),
  },
  {
    q: t('Un artiste paie-t-il pour être sur Travel Art ?'),
    a: t(
      'Une adhésion annuelle : 50 € pour la formule Artiste, 100 € pour la formule Artiste confirmé. Aucune commission n’est prélevée sur vos honoraires, et vos œuvres restent les vôtres.'
    ),
  },
  {
    q: t('Qui règle le voyage, l’hébergement et les repas ?'),
    a: t(
      'L’hôtel, et avant votre arrivée. Un artiste n’avance rien : c’est la condition qui rend une résidence loin de chez soi possible.'
    ),
  },
  {
    q: t('Comment les artistes et les hôtels sont-ils choisis ?'),
    a: t(
      'Chaque candidature est lue et validée à la main avant d’apparaître sur la plateforme. C’est plus lent qu’une inscription automatique, et c’est le seul moyen de garantir aux deux côtés qui se trouve en face.'
    ),
  },
  {
    q: t('Où se trouvent les hôtels ?'),
    a: t(
      'Dans plus de vingt pays — des Alpes françaises et italiennes au Maroc, de la Grèce aux Maldives, des Antilles à l’océan Indien. La carte des expériences les situe toutes.'
    ),
  },
  {
    q: t('Qui décide de la date ?'),
    a: t(
      'Les deux. L’hôtel propose une date à un artiste ; l’artiste accepte, propose autre chose ou décline. Rien n’est réservé tant que les deux ne sont pas d’accord.'
    ),
  },
]

export default function LandingFaq() {
  return (
    <section className="band" aria-label={t('Questions fréquentes')}>
      <div className="shell">
        <p className="eyebrow">{t('Questions fréquentes')}</p>
        <h2 className="mt-5 max-w-[20ch]">{t('Ce qu’on nous demande.')}</h2>

        <div className="mt-12 max-w-[68ch] border-t border-line">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group border-b border-line py-5">
              <summary
                className="flex cursor-pointer items-start justify-between gap-6 list-none
                           text-lg text-content marker:hidden
                           [&::-webkit-details-marker]:hidden hover:text-gold
                           transition-colors duration-300"
              >
                <span>{q}</span>
                {/* Rotates to a minus when the answer is open. */}
                <span
                  aria-hidden="true"
                  className="relative mt-2.5 h-px w-4 shrink-0 bg-gold
                             before:absolute before:inset-0 before:bg-gold
                             before:transition-transform before:duration-300
                             before:rotate-90 group-open:before:rotate-0"
                />
              </summary>
              <p className="mt-4 pr-10 text-content-secondary leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-content-secondary">
          {t('Une question qui n’est pas là ?')}{' '}
          <Link to="/how-it-works" className="text-gold underline underline-offset-4">
            {t('Le principe en détail')}
          </Link>
        </p>
      </div>
    </section>
  )
}
