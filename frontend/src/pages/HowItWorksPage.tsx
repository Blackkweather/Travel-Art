import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'

/**
 * Copy is the original page content, unchanged. Only the presentation moved:
 * six equal cards with white-on-gold circle icons (a contrast failure) became
 * a hairline ladder beside a sticky heading, which suits six items far better.
 */
const STEPS = [
  {
    title: 'Rejoindre, comme artiste ou comme hôtel',
    lede: "Créez votre profil et présentez votre travail ou votre lieu. Les artistes déposent leur portfolio, indiquent leurs disponibilités et précisent leur discipline. Les hôtels décrivent leurs espaces de représentation et leurs conditions d’accueil.",
    points: [
      'Artistes : photos et vidéos de vos performances',
      'Hôtels : toits-terrasses, salons et lieux intimistes',
      'Renseignez votre calendrier de disponibilités',
      'Précisez votre discipline artistique',
    ],
  },
  {
    title: 'Trouver la bonne rencontre',
    lede: "Notre système de mise en relation rapproche artistes et hôtels selon le lieu, les dates, l’esthétique et les contraintes de la salle. Parcourez les profils et choisissez la collaboration qui vous ressemble.",
    points: [
      'Mise en relation par affinités',
      'Filtres par ville, date et style',
      'Profils et portfolios détaillés',
      'Avis et évaluations vérifiés',
    ],
  },
  {
    title: 'Réserver la résidence',
    lede: "Les hôtels invitent les artistes pour un concert sur les toits, un set intimiste ou un événement particulier. Les artistes reçoivent l’hébergement et une scène dans un cadre d’exception.",
    points: [
      'Demande de dates en quelques clics',
      'Adhésion annuelle pour les artistes',
      'Réservation sécurisée',
      'Conditions d’annulation souples',
    ],
  },
  {
    title: 'Créer ensemble',
    lede: "Les artistes jouent sur des toits-terrasses, dans des salons feutrés et des espaces hôteliers d’exception. Les hôtels offrent l’hébergement et des moments dont leurs clients se souviennent.",
    points: [
      'Concerts sur les toits, face à la ville',
      'Sets acoustiques dans des salons intimistes',
      'Formations jazz en salle de bal',
      'DJ sets au coucher du soleil',
    ],
  },
  {
    title: 'Évaluer et commenter',
    lede: "Après chaque représentation, l’hôtel évalue l’artiste sur la qualité de la prestation, le professionnalisme et l’accueil reçu par ses clients. L’artiste reçoit ses distinctions et les retours reçus.",
    points: [
      'Notation de 1 à 5 étoiles par les hôtels',
      'Distinctions visibles sur le profil artiste',
      'Retours détaillés après chaque date',
      'Une réputation qui se construit dans la durée',
    ],
  },
  {
    title: 'Grandir et rayonner',
    lede: "Les artistes accumulent des nuits d’hébergement et étoffent leur portfolio. Les hôtels enrichissent l’expérience de leurs clients. Les deux élargissent leur réseau.",
    points: [
      'Artistes : hébergement offert pendant la résidence',
      'Hôtels : une expérience client singulière',
      'Programme de parrainage',
      'Points de fidélité',
    ],
  },
]

const HowItWorksPage: React.FC = () => {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar overMedia />

      {/* Asymmetric hero. The headline sits in the grid rather than centred
          over a darkened photograph, which is the default this page had. */}
      <section className="relative min-h-[78dvh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img decoding="async"
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=2070&q=70&fit=crop&auto=format"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-surface/70 to-surface/40"
          />
        </div>

        <div className="shell relative z-10 pb-20 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 font-serif text-content text-5xl md:text-6xl lg:text-7xl leading-[1.03]"
          >
            Le principe
            <span className="block text-gold italic leading-[1.1] pb-1">Travel Art</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:col-start-9 text-content-secondary leading-relaxed"
          >
            Réunir les hôtels d’exception et les artistes, pour des concerts sur
            les toits et des moments plus intimes. Du saxophone jazz sur une
            terrasse parisienne au DJ set au coucher du soleil à Ibiza.
          </motion.p>
        </div>
      </section>

      {/* Sticky heading beside a scrolling ladder. */}
      <section className="section-y">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="font-serif text-content text-3xl md:text-4xl leading-[1.1]">
                Pourquoi Travel Art ?
              </h2>
              <p className="mt-5 text-content-secondary leading-relaxed max-w-[34ch]">
                La rencontre juste entre l’hôtellerie d’exception et l’exigence
                artistique.
              </p>
              <Link to="/register" className="btn-gold mt-10">
                Nous rejoindre
              </Link>
            </div>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6">
            {STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`py-12 ${i === 0 ? 'pt-0' : 'border-t border-line'}`}
              >
                <h3 className="font-serif text-gold text-3xl md:text-4xl">{step.title}</h3>
                <p className="mt-4 text-content-secondary text-lg leading-relaxed max-w-prose">
                  {step.lede}
                </p>
                <ul className="mt-6 space-y-3">
                  {step.points.map((point) => (
                    <li key={point} className="flex gap-4 text-content-secondary">
                      <span aria-hidden="true" className="mt-2.5 h-px w-5 shrink-0 bg-gold/60" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing band, matching the landing page so the two read as one site. */}
      <section className="shell">
        <div className="border-t border-line py-24 md:py-32 text-center">
          <h2 className="font-serif text-content text-4xl md:text-6xl leading-[1.05]">
            Prêt à créer ?
          </h2>
          <p className="mt-6 text-content-secondary max-w-[52ch] mx-auto leading-relaxed">
            Rejoignez Travel Art et commencez à faire dialoguer hôtels
            d’exception et artistes.
          </p>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-gold">
              Je suis artiste
            </Link>
            <Link to="/register" className="btn-on-media">
              Je suis hôtelier
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HowItWorksPage
