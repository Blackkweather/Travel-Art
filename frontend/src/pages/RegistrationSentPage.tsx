import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import { t } from '@/i18n'

/**
 * Where registration lands now that it no longer signs anyone in.
 *
 * Both flows used to redirect to /dashboard/profile on success, which worked
 * only because registration returned a session token. With an admission gate
 * that redirect sends an applicant to a protected route they cannot enter, and
 * they get bounced to the login screen with no explanation of what happened.
 *
 * This says the three things a person needs at that moment: it worked, here is
 * what you do next, here is what we do next.
 */
const RegistrationSentPage: React.FC = () => {
  const location = useLocation()
  const state = (location.state ?? {}) as { email?: string; role?: string }

  const steps = [
    {
      title: t('Confirmez votre adresse'),
      body: state.email
        ? `Nous avons envoyé un lien de confirmation à ${state.email}. Ouvrez-le pour valider votre adresse.`
        : t('Nous vous avons envoyé un lien de confirmation par e-mail. Ouvrez-le pour valider votre adresse.'),
    },
    {
      title: t('Nous examinons votre demande'),
      body:
        state.role === 'HOTEL'
          ? t('Notre équipe vérifie chaque établissement avant de l’ouvrir au programme.')
          : t('Notre équipe examine chaque candidature artistique avant de l’ouvrir au programme.'),
    },
    {
      title: t('Vous recevez notre réponse'),
      body: t('Dès qu’une décision est prise, vous recevez un e-mail. Votre compte est alors utilisable.'),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />

      <main className="shell pb-24 pt-32 md:pt-40">
        <div className="max-w-prose">
          <span className="eyebrow">{t('Candidature')}</span>
          <h1 className="mt-6 font-serif text-[2.25rem] leading-tight text-content md:text-[3rem]">
            {t('Votre demande est enregistrée')}
          </h1>
          <p className="mt-4 text-lg text-content-secondary">
            {t('Merci. Voici ce qui se passe maintenant.')}
          </p>
          <span className="rule-reveal mt-10" />
        </div>

        <ol className="mt-14 grid max-w-4xl gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="font-serif text-2xl leading-none text-content-secondary tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-4 font-serif text-lg text-content">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-content-secondary">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link to="/" className="btn-secondary">
            {t('Retour à l’accueil')}
          </Link>
          <Link to="/login" className="btn-ghost">
            {t('Se connecter')}
          </Link>
        </div>

        <p className="mt-10 max-w-prose text-[0.8125rem] leading-relaxed text-content-secondary">
          {t('Vous n’avez rien reçu ? Vérifiez vos indésirables. Le lien de confirmation expire après 24 heures — vous pourrez en demander un nouveau depuis la page de connexion.')}
        </p>
      </main>

      <Footer />
    </div>
  )
}

export default RegistrationSentPage
