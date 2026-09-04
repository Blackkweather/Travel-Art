import { t } from '@/i18n'

/**
 * What actually happens, in order.
 *
 * The band above this one states what each side gets out of the exchange; it
 * never says how a residency comes about. A visitor who is sold on the idea
 * still has to guess whether they apply, bid, browse or wait.
 *
 * Numbered because this is genuinely sequential - the ordinals carry
 * information a reader needs, rather than decorating three parallel points.
 * Set as a list against a rail rather than three cards, so the order is the
 * thing the eye follows.
 */

const STEPS = [
  {
    title: t('Créez votre profil'),
    body: t(
      'Artistes et hôtels se présentent : discipline, lieux, ce que vous cherchez. Chaque candidature est lue et validée à la main.'
    ),
  },
  {
    title: t('Trouvez la bonne rencontre'),
    body: t(
      'L’hôtel choisit un artiste et propose des dates. L’artiste accepte, propose autre chose ou décline — rien ne se réserve sans les deux accords.'
    ),
  },
  {
    title: t('La résidence a lieu'),
    body: t(
      'Voyage, hébergement et repas sont réglés avant l’arrivée. L’artiste garde ses honoraires et ses œuvres.'
    ),
  },
]

export default function ProcessSteps() {
  return (
    <section className="band">
      <div className="shell">
        <p className="eyebrow">{t('En pratique')}</p>
        <h2 className="mt-5 max-w-[20ch]">{t('Trois étapes, deux accords.')}</h2>

        <ol className="mt-14 space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-12">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative md:pt-10 md:border-t md:border-line-strong"
            >
              {/* The ordinal sits on the rule on wide screens, so the three
                  steps read along a line rather than as separate panels. */}
              <span
                className="font-serif text-5xl leading-none text-gold md:absolute md:-top-7
                           md:left-0 md:bg-[var(--surface)] md:pr-4 tabular-nums"
              >
                {i + 1}
              </span>
              <h3 className="mt-5 md:mt-0">{step.title}</h3>
              <p className="mt-4 text-content-secondary leading-relaxed max-w-[38ch]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
