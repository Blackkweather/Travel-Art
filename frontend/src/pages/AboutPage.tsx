import React from 'react'
import { Link } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

/* The page was a single column of seven identical h2-plus-list blocks. The copy
   was fine; the presentation gave a reader no way to tell the mission from the
   values from the contact address, because all seven looked the same and
   arrived at the same rhythm.

   It is now four movements with different shapes: a stated position, a
   two-column split for the two audiences (who are reading for different
   reasons and should not have to share a column), the values as a numbered
   list, and one inverse band to close. */

const AUDIENCES = [
  {
    eyebrow: t('Pour les artistes'),
    lines: [
      t('Un profil professionnel qui présente votre travail et vos disponibilités.'),
      t('Des hôtels d’exception qui cherchent précisément ce que vous faites.'),
      t('Vos dates et votre calendrier tenus depuis un seul tableau de bord.'),
      t('Une réputation qui se construit sur des avis vérifiés.'),
    ],
    to: '/register',
    cta: t('Rejoindre le programme'),
  },
  {
    eyebrow: t('Pour les hôtels'),
    lines: [
      t('Une sélection d’artistes vérifiés, un par un.'),
      t('Un filtre par discipline, par ville et par disponibilité.'),
      t('Une réservation réglée sur un simple solde de crédits.'),
      t('Une expérience culturelle que vos clients ne trouveront pas ailleurs.'),
    ],
    to: '/register',
    cta: t('Rejoindre le programme'),
  },
] as const

const VALUES = [
  [t('Exigence'), t('Un niveau élevé attendu des artistes comme des hôtels.')],
  [t('Clarté'), t('Des conditions et des échanges transparents à chaque étape.')],
  [t('Accompagnement'), t('Un interlocuteur dédié des deux côtés.')],
  [t('Amélioration continue'), t('Une plateforme qui évolue avec ceux qui s’en servent.')],
] as const

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title="À propos — Travel Art"
        description={t('Travel Art réunit les artistes et les hôtels d’exception : notre mission, nos valeurs et le fonctionnement du programme.')}
      />
      <SimpleNavbar />

      <main>
        {/* The position, stated once, at the size it deserves. */}
        <section className="band pt-32 md:pt-40">
          <div className="shell">
            <span className="eyebrow">À propos</span>
            <h1 className="mt-6 max-w-[18ch] font-serif text-[2.75rem] leading-[1.05] text-content md:text-[4.5rem]">
              {t('Réunir les artistes et les hôtels d’exception.')}
            </h1>
            <div className="mt-12 grid gap-10 md:grid-cols-12">
              <p className="text-lg leading-relaxed text-content md:col-span-7 md:text-xl">
                {t('Travel Art fait le lien entre les artistes interprètes et les hôtels qui veulent enrichir l’expérience de leurs clients. L’art et la culture doivent pouvoir se vivre partout, et les artistes méritent des scènes à la hauteur de leur travail.')}
              </p>
              <p className="text-content-secondary md:col-span-4 md:col-start-9">
                {t('Nous prenons en charge l’ensemble du parcours : vérification des profils, gestion des disponibilités, confirmation des réservations.')}
              </p>
            </div>
          </div>
        </section>

        {/* Two audiences, two columns. They read this page for different reasons
            and were previously made to queue in one. */}
        <section className="band-warm">
          <div className="shell grid gap-12 md:grid-cols-2 md:gap-16">
            {AUDIENCES.map(({ eyebrow, lines, to, cta }) => (
              <div key={eyebrow}>
                <span className="eyebrow">{eyebrow}</span>
                <ul className="mt-8 space-y-5">
                  {lines.map((line) => (
                    <li key={line} className="flex gap-4">
                      <span className="spark mt-2.5" aria-hidden="true" />
                      <span className="text-content">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link to={to} className="btn-arrow mt-8 inline-flex text-[0.9375rem] font-semibold uppercase tracking-[0.04em] text-content">
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <div className="shell">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-serif text-3xl text-content md:text-4xl">Nos valeurs</h2>
            </div>
            <span className="rule-reveal mt-6" />
            <ol className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {VALUES.map(([name, body], i) => (
                <li key={name} className="flex gap-6">
                  <span className="font-serif text-2xl leading-none text-content-secondary tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-content">{name}</h3>
                    <p className="mt-2 text-content-secondary">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The one inverse band on the page, which is where every page on this
            site puts its closing ask. */}
        <section className="band-inverse">
          <div className="shell text-center">
            <h2 className="mx-auto max-w-[20ch] font-serif text-3xl md:text-4xl">
              {t('Une question, une remarque ?')}
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-content-inverse/75">
              {t('Écrivez-nous. Un interlocuteur vous répond, des deux côtés du programme.')}
            </p>
            <a href="mailto:hello@travelart.com" className="btn-gold mt-10 inline-flex">
              hello@travelart.com
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AboutPage
