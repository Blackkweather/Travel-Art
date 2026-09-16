import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

/**
 * Grouped by who's asking, the way a visitor actually arrives with a
 * question: as an artist wondering what a residency looks like, as a hotel
 * wondering how the roster is chosen, or as neither yet. Money lives on
 * /how-it-works and in the dashboards, not here — this page is about the
 * programme itself, not what it costs.
 */
const GROUPS: { label: string; items: { q: string; a: string }[] }[] = [
  {
    label: t('Le programme'),
    items: [
      {
        q: t('Qu’est-ce que Travel Art ?'),
        a: t(
          'Un programme de résidences qui installe des artistes dans des hôtels d’exception : une chambre, une scène et le temps de créer, en échange de représentations pendant le séjour. Le déplacement y est tenu pour une matière de travail, pas pour un trajet — on ne vient pas jouer un soir avant de repartir, on s’installe. Ni une date isolée, ni un emploi : une résidence.'
        ),
      },
      {
        q: t('Quels artistes peuvent rejoindre le programme ?'),
        a: t(
          'Le répertoire s’organise en quatre familles, telles que les artistes eux-mêmes les décrivent. Musique : piano, jazz, chant lyrique, fado, oud, guitare, violon, DJ et production. Danse : classique, flamenco, tango, hip-hop. Arts visuels : peinture, photographie, sculpture, calligraphie, street art, ateliers d’artisanat. Scène et bien-être : cirque, théâtre, magie, conte, humour, yoga et méditation. Aucune de ces cases ne vous correspond ? Écrivez quand même : le répertoire s’est élargi chaque fois qu’un travail n’entrait nulle part.'
        ),
      },
      {
        q: t('Le seul critère qui compte vraiment'),
        a: t(
          'Un travail qui voyage, et qui tient dans un lieu de vie. Vous ne jouez pas devant un public venu exprès pour vous : vous jouez dans un salon, sur un toit, dans une salle à manger, devant des gens qui ne s’y attendaient pas. Les artistes pour qui cela devient un terrain plutôt qu’une contrainte sont ceux à qui ce programme s’adresse.'
        ),
      },
      {
        q: t('Faut-il déjà être connu pour candidater ?'),
        a: t(
          'Non. La sélection porte sur le travail et sur la manière dont il s’accorde à un lieu, pas sur une notoriété acquise ailleurs. Les distinctions se construisent ici, résidence après résidence, et un premier séjour se juge sur ce qui s’y est passé — pas sur ce qui le précédait.'
        ),
      },
      {
        q: t('Et les hôtels, qui peut accueillir ?'),
        a: t(
          'Tout établissement qui offre un vrai lieu de représentation — toit-terrasse, salon, salle de bal — et l’intention de programmer la culture dans la durée plutôt que d’organiser un événement isolé. Un piano correct et un directeur qui écoute pèsent plus qu’un nombre d’étoiles.'
        ),
      },
      {
        q: t('Le programme est-il ouvert partout dans le monde ?'),
        a: t(
          'Le réseau couvre aujourd’hui plus de vingt pays, des Alpes françaises et italiennes au Maroc, de la Grèce aux Maldives, des Antilles à l’océan Indien. La carte des expériences les situe toutes.'
        ),
      },
    ],
  },
  {
    label: t('Candidater et être sélectionné'),
    items: [
      {
        q: t('Comment se déroule une candidature ?'),
        a: t(
          'Vous créez un profil et présentez votre travail : portfolio et vidéos pour un artiste, espaces de représentation et conditions d’accueil pour un hôtel. Vous précisez ensuite vos disponibilités ou votre calendrier de programmation.'
        ),
      },
      {
        q: t('Qui décide qui rejoint le programme ?'),
        a: t(
          'Chaque candidature est lue et validée à la main avant d’apparaître sur la plateforme. C’est plus lent qu’une inscription automatique, et c’est le seul moyen de garantir aux artistes comme aux hôtels qui se trouve en face.'
        ),
      },
      {
        q: t('Comment un artiste et un hôtel se rencontrent-ils ?'),
        a: t(
          'Notre système de mise en relation rapproche les deux selon le lieu, les dates, l’esthétique et les contraintes de la salle. Un hôtel propose une date à un artiste ; l’artiste l’accepte, en propose une autre ou décline — rien n’est confirmé tant que les deux ne sont pas d’accord.'
        ),
      },
    ],
  },
  {
    label: t('Pendant la résidence'),
    items: [
      {
        q: t('À quoi ressemble une résidence ?'),
        a: t(
          'Un hébergement sur place et une scène — toit-terrasse face à la ville, salon feutré, salle de bal — pour la durée convenue avec l’hôtel. Entre deux représentations, le temps de création vous appartient : ce que vous produisez sur place reste entièrement à vous.'
        ),
      },
      {
        q: t('Que se passe-t-il après une représentation ?'),
        a: t(
          'L’hôtel évalue la prestation, le professionnalisme et l’accueil reçu par ses clients. Ces retours et distinctions restent visibles sur le profil de l’artiste — une réputation qui se construit résidence après résidence, pas d’un coup.'
        ),
      },
      {
        q: t('Comment grandir sur la plateforme une fois inscrit ?'),
        a: t(
          'En jouant : chaque résidence étoffe le portfolio et les distinctions d’un artiste, et enrichit la programmation d’un hôtel. Un programme de parrainage et des points de fidélité font grandir le réseau des deux côtés en parallèle.'
        ),
      },
    ],
  },
]

const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((group) =>
    group.items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    }))
  ),
}

const FaqPage: React.FC = () => {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={t('Questions fréquentes — Travel Art')}
        description={t('Le programme, la candidature et la vie d’une résidence Travel Art, expliqués simplement.')}
        structuredData={FAQ_STRUCTURED_DATA}
      />
      <SimpleNavbar overMedia={false} />

      <section className="shell pt-32 md:pt-40 pb-16">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow"
        >
          {t('Questions fréquentes')}
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-[22ch] font-serif text-content text-4xl md:text-6xl leading-[1.05]"
        >
          {t('Ce qu’on nous demande.')}
        </motion.h1>
        <p className="mt-6 max-w-[52ch] text-content-secondary leading-relaxed">
          {t('Le programme, la candidature et la vie d’une résidence — dans l’ordre où les questions se posent vraiment.')}
        </p>
      </section>

      {GROUPS.map((group, groupIndex) => (
        <section
          key={group.label}
          className={groupIndex % 2 === 0 ? 'band' : 'band-warm'}
        >
          <div className="shell">
            <h2 className="max-w-[24ch]">{group.label}</h2>

            <div className="mt-10 max-w-[68ch] border-t border-line">
              {group.items.map(({ q, a }) => (
                <details key={q} className="group border-b border-line py-5">
                  <summary
                    className="flex cursor-pointer items-start justify-between gap-6 list-none
                               text-lg text-content marker:hidden
                               [&::-webkit-details-marker]:hidden hover:text-gold
                               transition-colors duration-300"
                  >
                    <span>{q}</span>
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
          </div>
        </section>
      ))}

      <section className="band">
        <div className="shell text-center">
          <h2 className="mx-auto max-w-[24ch]">
            {t('Une question qui n’est pas là ?')}
          </h2>
          <p className="mt-5 text-content-secondary max-w-[46ch] mx-auto leading-relaxed">
            {t('Le déroulé complet du programme, ou une réponse directe si vous préférez nous écrire.')}
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/how-it-works" className="btn-gold">
              {t('Le principe en détail')}
            </Link>
            <a href="mailto:hello@travelart.com" className="btn-outline">
              hello@travelart.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default FaqPage
