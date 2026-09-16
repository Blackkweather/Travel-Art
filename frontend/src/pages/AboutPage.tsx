import React from 'react'
import { Link } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'
import ProofBand from '@/components/landing/ProofBand'
import HowWeWork from '@/components/sections/HowWeWork'

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

/* Both sides are admitted by hand. Publishing what that hand looks for is the
   difference between curation and a door policy: asserted selectivity invites
   a visitor to test it, stated selectivity does not. */
const CRITERIA = [
  {
    eyebrow: t('Chez un artiste'),
    items: [
      [t('Un travail qui voyage'), t('Il tient dans un salon, sur un toit, dans une salle à manger, devant des gens qui ne s’y attendaient pas.')],
      [t('Une présence, pas une prestation'), t('Rester une semaine suppose d’accepter d’être là, et pas seulement d’être sur scène.')],
      [t('La tenue'), t('Les dates annoncées sont tenues, les heures aussi. C’est très exactement ce que la maison réserve.')],
      [t('La curiosité du lieu'), t('Les artistes pour qui le pays où ils ont atterri devient une matière de travail plutôt qu’un décor.')],
    ],
  },
  {
    eyebrow: t('Chez une maison'),
    items: [
      [t('Un vrai lieu de représentation'), t('Un toit, un salon, une salle de bal. Et, pour la musique, un instrument correct.')],
      [t('Une intention dans la durée'), t('Programmer la culture sur une saison, plutôt qu’organiser un événement isolé.')],
      [t('L’accueil, réellement'), t('Une chambre, la pension complète, et un référent nommé, présent toute la semaine.')],
      [t('Le respect du travail'), t('Un artiste n’est pas une ambiance. La différence se voit en une soirée.')],
    ],
  },
] as const

/* The terms, including the ones that do not flatter us. An unnumbered
   obligation reads as an unlimited one, and a fee discovered after admission
   reads as a trap - so the hours and the membership are both here, on the page
   a visitor reads before applying. */
const TERMS = [
  [t('Sept nuits'), t('La durée d’une résidence.')],
  [t('Douze heures de représentation sur la semaine'), t('Deux heures par jour au maximum, et rien le jour de l’arrivée ni celui du départ.')],
  [t('Chambre et pension complète'), t('Pour l’artiste et un accompagnant, du dîner d’arrivée au petit-déjeuner du départ.')],
  [t('Le voyage est à la charge de l’artiste'), t('Nous préférons l’écrire ici plutôt que vous le laisser découvrir.')],
  [t('Adhésion artiste : 50 € par an, 100 € en formule confirmée'), t('Annoncée avant de candidater, pas après la sélection.')],
  [t('Côté maison : des crédits, à partir de 1 500 €'), t('Trois formules, selon le nombre de résidences envisagées dans l’année.')],
  [t('Réponse sous trois semaines'), t('Chaque dossier est lu par une personne, ce qui prend le temps que cela prend.')],
] as const

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={t('À propos — Travel Art')}
        description={t('Travel Art réunit les artistes et les hôtels d’exception : notre mission, nos valeurs et le fonctionnement du programme.')}
      />
      <SimpleNavbar />

      <main>
        {/* The position, stated once, at the size it deserves. */}
        <section className="band pt-32 md:pt-40">
          <div className="shell">
            <span className="eyebrow">{t('À propos')}</span>
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

        {/* The story. The page stated a position and never said where it came
            from - and unlike the reference this site is measured against, there
            is no parent brand here to vouch for it, so the origin has to be
            told rather than borrowed. */}
        <section className="band">
          <div className="shell grid items-center gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-6">
              <span className="eyebrow">{t('L’origine')}</span>
              <h2 className="mt-6 font-serif text-3xl leading-tight text-content md:text-[2.75rem]">
                {t('Un soir ne suffit pas.')}
              </h2>
              <div className="mt-8 space-y-6 text-lg leading-relaxed text-content-secondary">
                <p>{t('La musique entre dans les hôtels depuis toujours, et presque toujours de la même façon : l’artiste arrive en fin d’après-midi, joue deux heures, repart avant le petit-déjeuner. La maison a eu sa soirée, l’artiste a eu son cachet, et personne n’a eu de rencontre.')}</p>
                <p>{t('Nous avons voulu l’inverse. Que l’artiste reste. Qu’il ait une chambre, une scène, et surtout le temps : celui de comprendre où il a atterri, de croiser deux fois les mêmes visages, de laisser le lieu entrer dans son travail. Une semaine ne fait pas d’un musicien un habitant — elle suffit à ce qu’il s’y passe quelque chose qu’un soir ne permet pas.')}</p>
                <p className="text-content">{t('C’est la seule idée du programme. La sélection à la main, les crédits, le calendrier : tout le reste n’existe que pour la rendre possible.')}</p>
              </div>
            </div>
            <div className="md:col-span-6">
              <img
                src="/images/about/dance.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-control object-cover"
              />
            </div>
          </div>
        </section>

        {/* Where the programme actually is. Claiming a history it does not have
            would be the one lie a visitor could check. */}
        <section className="band-warm">
          <div className="shell">
            <span className="eyebrow">{t('Où nous en sommes')}</span>
            <h2 className="mt-6 max-w-[24ch] font-serif text-3xl text-content md:text-4xl">
              {t('Le programme ouvre.')}
            </h2>
            <p className="mt-8 max-w-[62ch] text-lg leading-relaxed text-content-secondary">
              {t('Trente-cinq maisons ont rejoint le réseau, dans plus de vingt pays, et les premières candidatures d’artistes sont en lecture. Nous ne revendiquons pas un historique que nous n’avons pas : la première promotion se constitue en ce moment même. C’est précisément le moment où il vaut la peine d’en être.')}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <img src="/images/about/alpine.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-56 w-full rounded-control object-cover" />
              <img src="/images/about/riad.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-56 w-full rounded-control object-cover" />
              <img src="/images/about/lagoon.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-56 w-full rounded-control object-cover" />
            </div>
          </div>
        </section>

        {/* Published admission criteria, both sides. */}
        <section className="band">
          <div className="shell">
            <span className="eyebrow">{t('La sélection')}</span>
            <h2 className="mt-6 max-w-[22ch] font-serif text-3xl text-content md:text-4xl">
              {t('Ce que nous regardons.')}
            </h2>
            <p className="mt-6 max-w-[58ch] text-content-secondary">
              {t('Les deux côtés du programme sont admis à la main, un dossier après l’autre. Voici sur quoi.')}
            </p>
            <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
              {CRITERIA.map(({ eyebrow, items }) => (
                <div key={eyebrow}>
                  <span className="eyebrow">{eyebrow}</span>
                  <ul className="mt-8 space-y-7">
                    {items.map(([name, body]) => (
                      <li key={name}>
                        <h3 className="font-serif text-xl text-content">{name}</h3>
                        <p className="mt-2 text-content-secondary">{body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The terms, numbers and all. */}
        <section className="band-warm">
          <div className="shell">
            <span className="eyebrow">{t('Les termes')}</span>
            <h2 className="mt-6 font-serif text-3xl text-content md:text-4xl">{t('Sans détour.')}</h2>
            <span className="rule-reveal mt-6" />
            <dl className="mt-12 divide-y divide-line border-y border-line">
              {TERMS.map(([term, detail]) => (
                <div key={term} className="grid gap-2 py-6 md:grid-cols-12 md:gap-8">
                  <dt className="font-serif text-lg text-content md:col-span-5">{term}</dt>
                  <dd className="text-content-secondary md:col-span-7">{detail}</dd>
                </div>
              ))}
            </dl>
            <Link to="/faq" className="btn-arrow mt-10 inline-flex text-[0.9375rem] font-semibold uppercase tracking-[0.04em] text-content">
              {t('Toutes les questions')}
            </Link>
          </div>
        </section>

        {/* Two audiences, two columns. They read this page for different reasons
            and were previously made to queue in one. */}
        {/* The same figures the landing page opens with: a page about who we
            are should say how much of it exists. */}
        <ProofBand />

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
              <h2 className="font-serif text-3xl text-content md:text-4xl">{t('Nos valeurs')}</h2>
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
        <HowWeWork />

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
