import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'
import { CONTACT_EMAIL } from '@/config/contact'

/**
 * Six groups, in the order the questions actually arrive: what the programme
 * is, how you get in, the wait that follows, the stay itself, the week on
 * site, and the paperwork underneath it.
 *
 * The owner's rule: nothing about money on the pages a visitor reads before
 * signing up. Fees appear inside the account, and every term of a residency
 * is fixed in the convention both parties sign.
 *
 * FAQ_STRUCTURED_DATA is derived from GROUPS rather than written out, so a
 * question added below reaches search engines without a second edit.
 */
const GROUPS: { label: string; items: { q: string; a: string }[] }[] = [
  {
    label: t('Le programme'),
    items: [
      {
        q: t('Qu’est-ce que Travel Art ?'),
        a: t(
          'Un programme qui accueille des artistes et des créateurs dans des hôtels d’exception, sur le principe d’un échange : l’hôtel offre un séjour pour deux, l’artiste réalise une prestation convenue à l’avance — concert, DJ set, performance, atelier, photos ou vidéos. Les dates, la formule et ce qui est attendu de chacun sont écrits dans une convention signée avant le départ. Ni une date isolée, ni un emploi : un échange.'
        ),
      },
      {
        q: t('Quels artistes peuvent rejoindre le programme ?'),
        a: t(
          'Le répertoire s’organise en cinq familles, telles que les artistes eux-mêmes les décrivent. Musique : piano, jazz, chant lyrique, fado, oud, guitare, violon, DJ et production. Danse : classique, flamenco, tango, hip-hop. Arts visuels : peinture, photographie, sculpture, calligraphie, street art, ateliers d’artisanat. Scène et bien-être : cirque, théâtre, magie, conte, humour, yoga et méditation. Image et contenu : vidéo, création de contenu pour les réseaux sociaux. Aucune de ces cases ne vous correspond ? Écrivez quand même : le répertoire s’est élargi chaque fois qu’un travail n’entrait nulle part.'
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
        q: t('Le programme est-il ouvert partout dans le monde ?'),
        a: t(
          'Le réseau couvre aujourd’hui plus de vingt pays : les Alpes françaises et italiennes, le Maroc, la Grèce, les Maldives, les Caraïbes et l’océan Indien, le Portugal, l’Espagne, la Turquie, le Sénégal, l’Égypte, la Tunisie, le Brésil, la Thaïlande, l’Indonésie. La carte des expériences les situe tous, et elle est tenue à jour plus souvent que cette page : c’est elle qui fait foi.'
        ),
      },
      {
        q: t('Et les hôtels, qui peut accueillir ?'),
        a: t(
          'Tout établissement qui offre un vrai lieu de représentation — toit-terrasse, salon, salle de bal — et l’intention de programmer la culture dans la durée plutôt que d’organiser un événement isolé. Un piano correct et un directeur qui écoute pèsent plus qu’un nombre d’étoiles.'
        ),
      },
      {
        q: t('Qu’est-ce qu’une résidence change pour un hôtel ?'),
        a: t(
          'Elle remplace une soirée par une programmation. L’artiste vit sur place le temps du séjour : il croise vos clients au petit-déjeuner, répète l’après-midi dans un salon vide, joue aux heures convenues. Ce que vos clients emportent n’est pas le souvenir d’un concert, c’est celui d’un séjour où il se passait quelque chose — et, très concrètement, des soirées où l’on reste au bar plutôt que de monter se coucher. Vous offrez un séjour pour deux ; vos clients repartent avec une histoire.'
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
        q: t('Que faut-il fournir, exactement ?'),
        a: t(
          'Des enregistrements récents de votre travail, pris en public si possible et non remontés : une captation honnête au téléphone en dit souvent plus qu’un clip. Quelques images. Une biographie brève — personne n’est retenu ici pour un curriculum. Vos disciplines, vos disponibilités sur les mois à venir, et ce que votre travail demande au lieu : un piano accordé, du silence, un mur, l’obscurité. Un dossier se remplit en une heure ; il n’y a pas de dossier à constituer pendant trois semaines.'
        ),
      },
      {
        q: t('Qui décide qui rejoint le programme ?'),
        a: t(
          'Chaque candidature est lue et validée à la main avant d’apparaître sur la plateforme. C’est plus lent qu’une inscription automatique, et c’est le seul moyen de garantir aux artistes comme aux hôtels qui se trouve en face.'
        ),
      },
      {
        q: t('Sur quoi se joue la décision ?'),
        a: t(
          'Sur le travail et sur son accord avec un lieu de vie : c’est le critère décrit plus haut, et rien d’autre ne pèse autant. Deux considérations s’y ajoutent, qui ne jugent pas votre travail mais notre capacité à le placer. La forme d’abord : un duo tient dans plus de salons qu’un orchestre, et une discipline qui demande une installation lourde réduit le nombre de lieux possibles. La géographie ensuite : certaines destinations comptent déjà beaucoup de pianistes et peu de danseurs, et une candidature excellente peut attendre pour cette seule raison. Un refus ne dit donc pas toujours quelque chose de votre travail ; il dit parfois quelque chose de notre carte.'
        ),
      },
      {
        q: t('Comment un hôtel rejoint-il le programme ?'),
        a: t(
          'De la même manière, et avec la même sélection : un hôtel candidate, et sa candidature est lue à la main. Vous décrivez vos espaces de représentation — dimensions, acoustique, instrument disponible et date de son dernier accord, sonorisation, horaires que le voisinage autorise —, les chambres que vous pouvez céder et le rythme de programmation que vous visez. Un établissement qui ne peut offrir ni chambre ni scène ne peut pas accueillir de résidence : c’est le seul refus qui se décide sans discussion.'
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
    label: t('Après la candidature'),
    items: [
      {
        q: t('Combien de temps avant une réponse ?'),
        a: t(
          'Trois semaines au plus, à compter du jour où votre dossier est complet. C’est un engagement et non une moyenne : au-delà, écrivez-nous — le silence serait de notre fait, et nous vous devons une réponse le jour même. Une décision peut être longue à prendre ; elle n’a aucune raison d’être longue à annoncer.'
        ),
      },
      {
        q: t('Que se passe-t-il pendant ces trois semaines ?'),
        a: t(
          'Quelqu’un écoute ce que vous avez envoyé, en entier. C’est lent parce que c’est fait à la main, par un petit nombre de personnes, et parce qu’un travail qui ne ressemble à rien de connu demande qu’on l’écoute deux fois. Vous n’aurez pas de nouvelles pendant ce temps : il n’y a rien à dire tant qu’il n’y a pas de décision, et nous refusons d’envoyer des messages dont le seul contenu serait de vous faire patienter. Ce silence n’est un signe de rien — ni bon, ni mauvais.'
        ),
      },
      {
        q: t('Et si ma candidature n’est pas retenue ?'),
        a: t(
          'Vous recevez un refus explicite, par écrit, dans le même délai. Une candidature ne s’éteint pas ici faute de réponse : c’est la moindre des choses que nous vous devions. En revanche, nous ne motivons pas toujours en détail. La plupart des refus ne tiennent pas à la qualité d’un travail, mais au fait qu’aucun lieu du réseau ne lui convient aujourd’hui, et l’écrire en trois lignes serait vexant autant qu’inutile. Si vous voulez savoir, demandez-le : nous répondons, sans enjoliver.'
        ),
      },
      {
        q: t('Puis-je candidater à nouveau ?'),
        a: t(
          'Oui, une fois par an, sans limite de tentatives. Renvoyer le même dossier deux mois plus tard ne sert à rien : il sera lu par les mêmes personnes, qui décideront la même chose. Ce qui change une décision, c’est un travail qui a bougé — un nouveau programme, un enregistrement pris en public, une discipline qu’on s’est mise à pratiquer sérieusement. Un refus ne ferme rien ; il date d’un dossier, pas d’une personne.'
        ),
      },
      {
        q: t('Je suis admis : est-ce que cela veut dire que je vais jouer ?'),
        a: t(
          'Non, et c’est la phrase la plus importante de cette page. L’admission ouvre votre profil aux hôtels du réseau ; elle ne réserve aucune date. Ce sont les hôtels qui proposent, et rien n’est confirmé tant que vous n’avez pas accepté. Certains artistes reçoivent une proposition dans le mois, d’autres attendent une saison — cela dépend de la discipline, des destinations que vous acceptez et de la période de l’année. Un profil complet, des disponibilités tenues à jour et des enregistrements récents raccourcissent beaucoup cette attente ; nous ne pouvons pas la supprimer.'
        ),
      },
    ],
  },
  {
    label: t('Le séjour'),
    items: [
      {
        q: t('Qu’offre l’hôtel pendant la résidence ?'),
        a: t(
          'Un séjour pour deux : vous et la personne de votre choix, dans la chambre et la formule de la maison — petit-déjeuner, demi-pension, pension complète ou all inclusive —, et une scène à la hauteur de votre travail. Tout ce qui est inclus est écrit dans la convention avant le départ.'
        ),
      },
      {
        q: t('Avec qui puis-je venir ?'),
        a: t(
          'Avec la personne de votre choix. Elle profite de la maison avec vous et n’a rien à présenter : la prestation est la vôtre, le séjour est pour deux.'
        ),
      },
      {
        q: t('Comment s’organise le voyage ?'),
        a: t(
          'Il se décide avec l’hôtel avant d’accepter la date, et s’écrit dans la convention. Un conseil simple : ne réservez votre billet qu’une fois la convention signée par tous, depuis votre espace.'
        ),
      },
      {
        q: t('Combien de temps dure une résidence ?'),
        a: t(
          'Quelques nuits, le plus souvent — le temps de comprendre un lieu, de croiser deux fois les mêmes visages et de laisser la maison entrer dans votre travail. Les dates exactes se fixent avec l’hôtel et figurent dans la convention.'
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
          'Un séjour sur place, une chambre, la formule convenue et une scène — toit-terrasse face à la ville, salon feutré, salle de bal, parfois une salle à manger que l’on réagence à vingt-deux heures. La prestation se fait aux dates et aux horaires écrits dans la convention. Entre deux, le temps vous appartient : ce que vous créez sur place reste à vous.'
        ),
      },
      {
        q: t('Combien de temps joue-t-on, exactement ?'),
        a: t(
          'Ce qui est écrit dans la convention, et rien de plus. Nature de la prestation, dates, horaires, durée, nombre de représentations : tout se fixe avec l’hôtel avant votre venue, selon le rythme de la maison — un hôtel de montagne veut de la musique en fin d’après-midi, un hôtel de bord de mer au coucher du soleil, certains préfèrent deux fois une heure à un long set. Une prestation supplémentaire ne se demande pas sur place : elle se convient par écrit, ou elle ne se fait pas.'
        ),
      },
      {
        q: t('Qui choisit le répertoire ?'),
        a: t(
          'Vous. Un hôtel ne commande pas un programme et n’envoie pas de liste de titres ; s’il le fait, dites-le-nous. Ce qu’il peut demander relève du lieu et non du goût : un niveau sonore, une heure de fin, une formation réduite un soir où la salle est petite, un moment plus discret pendant le service. Une résidence tient précisément à cet équilibre — on vous invite pour ce que vous faites, et on vous demande de le faire dans une maison où des gens dorment.'
        ),
      },
      {
        q: t('Le matériel est-il fourni ?'),
        a: t(
          'Cela dépend du lieu, et cela s’écrit avant, jamais à l’arrivée. Chaque hôtel déclare ce dont il dispose : instrument et date de son dernier accord, sonorisation, lumières, électricité disponible sur la scène, abri en cas de pluie pour les terrasses. Ce qui manque se règle au moment de la proposition de date — l’hôtel le loue, vous l’apportez, ou la date ne se fait pas. Le pire scénario de ce programme est un artiste qui découvre en arrivant un piano injouable ; c’est pour l’éviter que les fiches techniques sont remplies à l’avance, et que nous vous demandons de les lire.'
        ),
      },
      {
        q: t('Et si je tombe malade ?'),
        a: t(
          'Prévenez l’hôtel et prévenez-nous le jour même. Une représentation annulée pour maladie n’entraîne rien : ni pénalité, ni retour négatif, ni conséquence sur votre profil. Le séjour vous reste acquis pour les nuits réservées — on ne met pas dehors quelqu’un qui a de la fièvre à quatre mille kilomètres de chez lui. Si l’état se prolonge, la prestation restante est réduite ou la résidence s’interrompt, d’un commun accord. Ce qui se passe mal, ce n’est pas d’être malade : c’est de le dire trop tard.'
        ),
      },
      {
        q: t('Y a-t-il une tenue attendue ?'),
        a: t(
          'La tenue du soir de la maison, sans autre exigence : dans la plupart des hôtels du réseau, cela veut dire une tenue de scène soignée, sombre plutôt que claire, et des chaussures fermées. Aucun uniforme, aucune identité visuelle à porter — vous n’êtes pas le personnel, et il n’est bon pour personne que vous en ayez l’air. En cas de doute, la fiche de l’hôtel le précise, et votre contact sur place répond en une phrase.'
        ),
      },
      {
        q: t('À qui s’adresse-t-on sur place ?'),
        a: t(
          'À une personne nommée, désignée par l’hôtel et indiquée dans la réservation avant votre départ : le plus souvent le directeur de la restauration, la responsable de l’animation ou le directeur lui-même. C’est elle qui vous accueille, ouvre la salle et règle les questions d’horaire et de matériel. Si elle ne répond pas, écrivez-nous : nous sommes l’autre bout du fil, y compris un dimanche.'
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
  {
    label: t('Contrat, statut et questions pratiques'),
    items: [
      {
        q: t('Y a-t-il un contrat ?'),
        a: t(
          'Oui : une convention tripartite, signée avant le départ. Elle fixe les dates et le nombre de nuits, la chambre et la formule pour deux personnes, la prestation — nature, horaires, durée, lieu —, le matériel fourni par chacun, les contenus éventuels à publier, la prise en charge du transport, la valeur du séjour et celle de la prestation, et les conditions d’annulation. Chaque partie en garde le même exemplaire. Rien d’essentiel ne devrait rester à l’oral : si un point a été convenu par téléphone, faites-le écrire avant de partir.'
        ),
      },
      {
        q: t('Quel est mon statut ? Suis-je salarié de l’hôtel ?'),
        a: t(
          'Non, et pas davantage de Travel Art. Vous intervenez comme artiste indépendant : vous conservez votre statut — auto-entrepreneur, société, intermittent ou l’équivalent dans votre pays — et vous restez seul responsable de vos déclarations et de vos cotisations. Nous ne sommes ni votre employeur ni votre producteur, et nous ne pouvons pas l’être. Une chose mérite d’être dite franchement aux intermittents français : une résidence à l’étranger ne génère pas automatiquement des heures déclarées au régime français, et cela dépend du pays, de l’hôtel et de la forme que prend l’accord. Vérifiez-le avant d’accepter, pas après.'
        ),
      },
      {
        q: t('Qui assure quoi ?'),
        a: t(
          'L’hôtel assure ses locaux, sa scène et ses clients. Vous assurez ce qui est à vous : vos instruments et votre matériel, pendant le transport comme sur place, votre responsabilité civile professionnelle, et votre couverture santé et rapatriement à l’étranger. La carte européenne d’assurance maladie suffit en Europe ; elle ne sert à rien aux Maldives ni au Brésil. Une assurance voyage écarte la seule mauvaise surprise réellement grave de ce programme.'
        ),
      },
      {
        q: t('Faut-il un visa ou une autorisation de travail ?'),
        a: t(
          'C’est la partie la moins élégante du programme, et il faut la regarder en face : le réseau couvre plus de vingt pays, chacun avec ses règles, et une prestation artistique n’est pas toujours couverte par un simple visa de tourisme. Les formalités relèvent de l’artiste. L’hôtel fournit ce qu’un consulat demande habituellement — lettre d’invitation, attestation d’hébergement, description de la résidence — et nous relançons quand cela traîne. Prenez-vous-y tôt : certains dossiers demandent six à huit semaines, et une résidence perdue pour un visa arrivé en retard est perdue pour les deux. N’acceptez pas une date que vous ne pourrez pas honorer légalement.'
        ),
      },
      {
        q: t('Comment voyage-t-on avec un instrument ?'),
        a: t(
          'Comme partout ailleurs, et c’est à vous de l’organiser : soute, cabine, siège supplémentaire, assurance au transport. Deux réflexes évitent l’essentiel des ennuis. Demander à l’hôtel ce qui se trouve déjà sur place — un piano, une batterie, une sonorisation vous épargnent souvent la moitié de vos bagages. Et prévenir votre contact de ce qui arrive avec vous, pour qu’un endroit sûr et sec vous attende plutôt qu’un coin de couloir. Nous ne transportons ni ne stockons les instruments.'
        ),
      },
      {
        q: t('Quelles langues parle-t-on sur place ?'),
        a: t(
          'Le français et l’anglais suffisent dans la quasi-totalité du réseau, et la fiche de chaque hôtel indique les langues parlées par son équipe. Pour la musique, la danse et les arts visuels, la question se pose peu. Elle se pose vraiment pour le conte, le théâtre, l’humour et les ateliers, où la langue est la matière même : dans ces disciplines, l’hôtel vous dira dans quelle langue sa clientèle écoute, et il vaut mieux renoncer à une date que jouer devant une salle qui ne comprend pas.'
        ),
      },
      {
        q: t('Que se passe-t-il si l’une des deux parties annule ?'),
        a: t(
          'Une annulation se dit tôt et par écrit. Les conditions d’annulation, dans un sens comme dans l’autre, sont écrites dans la convention que chacun signe — raison de plus pour n’acheter aucun billet avant sa signature. Si vous ne pouvez plus venir, prévenez l’hôtel et prévenez-nous immédiatement : un report est souvent possible. Une annulation tardive et répétée met fin à votre présence sur la plateforme. La sélection se fait à la main des deux côtés ; l’exclusion aussi.'
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
        description={t('Le programme, la candidature, les délais de réponse, le séjour et la vie d’une résidence Travel Art.')}
        structuredData={FAQ_STRUCTURED_DATA}
      />
      <SimpleNavbar overMedia={false} />
      <main id="contenu">

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
          {t('Le programme, la candidature, le séjour et la vie d’une résidence — dans l’ordre où les questions se posent vraiment.')}
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
            <a href={`mailto:${CONTACT_EMAIL}`} className="btn-outline">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  )
}

export default FaqPage
