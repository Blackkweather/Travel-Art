import { Link } from 'react-router-dom'
import { t } from '@/i18n'

/**
 * The questions people actually arrive with.
 *
 * The owner's rule: nothing about money before sign-up. The front page sells
 * the experience; fees and terms are shown inside the account and written in
 * the convention. The country spread is the catalogue's ("more than twenty"
 * rather than a count, so it does not go stale the week a hotel is added).
 *
 * Built on <details>, so it opens without JavaScript, is keyboard-operable and
 * is announced correctly, and so a reader searching the page with ctrl-F finds
 * text inside a closed answer.
 */

const QUESTIONS = [
  {
    q: t('À quoi ressemble une résidence ?'),
    a: t(
      'Quelques nuits dans une maison d’exception, pour vous et la personne de votre choix, et une scène : un toit-terrasse au coucher du soleil, un salon feutré, une salle de bal, un jardin au petit matin. Vous partagez votre art aux moments convenus avec l’hôtel ; le reste du temps vous appartient.'
    ),
  },
  {
    q: t('Quels artistes peuvent rejoindre Travel Art ?'),
    a: t(
      'Musiciens, DJ, chanteurs, danseurs, peintres et plasticiens, photographes, professeurs de yoga, artistes de cirque, conteurs, créateurs de contenu, tributes… Tout travail qui voyage et qui trouve sa place dans un lieu de vie.'
    ),
  },
  {
    q: t('Avec qui puis-je venir ?'),
    a: t(
      'Avec la personne de votre choix : chaque séjour est prévu pour deux. Elle profite de la maison avec vous, sans rien avoir à présenter.'
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
      'Les deux. L’hôtel propose une date à un artiste ; l’artiste accepte, propose autre chose ou décline. Rien n’est réservé tant que les deux ne sont pas d’accord, et tout est écrit noir sur blanc avant le départ.'
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
          <Link to="/faq" className="text-gold underline underline-offset-4">
            {t('Toutes les questions')}
          </Link>{' '}
          {t('ou')}{' '}
          <Link to="/how-it-works" className="text-gold underline underline-offset-4">
            {t('le principe en détail')}
          </Link>
        </p>
      </div>
    </section>
  )
}
