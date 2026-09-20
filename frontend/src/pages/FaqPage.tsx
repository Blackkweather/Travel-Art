import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

/**
 * Six groups, in the order the worry actually arrives: what the programme is,
 * how you get in, the silence that follows, what it costs and what it does not
 * cover, the week itself, and the paperwork underneath it.
 *
 * The terms are given as numbers - seven nights, twelve hours, 50 € or 100 € a
 * year, travel paid by the artist - because vagueness on any of those reads as
 * something being hidden. The membership fee especially: it used to be visible
 * only from inside the dashboard, after admission, and a price someone has to
 * go looking for is a price they assume is a trap. It now sits in group four
 * with what each tier contains, and group two says out loud that applying
 * costs nothing.
 *
 * The unflattering answers are the longest and the flattest on purpose - who
 * pays for the plane ticket, what a refusal means, whether being admitted
 * means you will play. That is where a FAQ is either believed or not.
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
          'Un programme de résidences qui installe des artistes dans des hôtels d’exception : une chambre, une scène et le temps de créer, en échange de représentations pendant le séjour. Une résidence dure sept nuits et demande douze heures de scène, deux heures par jour au maximum. Le déplacement y est tenu pour une matière de travail, pas pour un trajet — on ne vient pas jouer un soir avant de repartir, on s’installe. Ni une date isolée, ni un emploi : une résidence.'
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
          'Elle remplace une soirée par une programmation. L’artiste vit sur place sept nuits : il croise vos clients au petit-déjeuner, répète l’après-midi dans un salon vide, joue douze heures dans la semaine. Ce que vos clients emportent n’est pas le souvenir d’un concert, c’est celui d’un séjour où il se passait quelque chose — et, très concrètement, des soirées où l’on reste au bar plutôt que de monter se coucher. Vous cédez une chambre et des repas ; vous ne payez ni cachet à la soirée ni commission sur ce que vous vendez ce soir-là.'
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
        q: t('Faut-il payer quelque chose pour candidater ?'),
        a: t(
          'Non. Candidater ne coûte rien et rien ne vous est demandé tant qu’une décision n’est pas prise. L’adhésion annuelle — 50 € ou 100 € selon la formule — ne se règle qu’une fois la candidature retenue, et vous en connaissez le montant avant même de commencer : il est écrit plus bas, dans la partie consacrée à l’argent. Nous préférons que vous le lisiez ici plutôt que de le découvrir une fois admis.'
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
    label: t('L’argent : ce qui est inclus, ce qui ne l’est pas'),
    items: [
      {
        q: t('Que reçoit l’artiste pendant la résidence ?'),
        a: t(
          'Une chambre dans l’hôtel et la pension complète pour la durée du séjour — sept nuits —, et une scène. Vous venez accompagné si vous le souhaitez : l’artiste et un accompagnant, en chambre double, aux mêmes conditions de table. Ce n’est pas un hébergement échangé contre un service, c’est un séjour entier, pendant lequel on vous demande douze heures.'
        ),
      },
      {
        q: t('Qui paie le voyage jusqu’à l’hôtel ?'),
        a: t(
          'Vous. Le trajet aller et retour est à la charge de l’artiste, quelle que soit la destination — une résidence aux Maldives suppose un billet pour les Maldives. C’est la limite du programme, et nous l’écrivons ici plutôt que de vous la laisser découvrir au moment d’accepter une date. Tout le reste est pris en charge sur place : la chambre, les repas, la scène, pour vous et votre accompagnant, et rien ne vous est demandé une fois arrivé. Regardez donc le prix du billet froidement avant de dire oui : c’est la seule arithmétique qui compte. Rien n’interdit à un hôtel de participer au transport, cela se discute avant d’accepter la date, mais ce n’est ni une règle ni une condition du programme.'
        ),
      },
      {
        q: t('L’artiste reçoit-il un cachet ?'),
        a: t(
          'Ce que la résidence garantit, c’est le séjour : la chambre, la pension complète et la scène, pour deux personnes et sept nuits. Un cachet, lorsqu’il y en a un, se négocie directement entre l’artiste et l’hôtel — avant l’acceptation de la date, jamais après. Travel Art ne le fixe pas, ne s’y interpose pas et ne prélève aucune commission sur ce que vous convenez. Un artiste qui ne souhaite pas jouer sans cachet doit le dire au moment de la proposition : c’est le seul moment où cela se discute sereinement.'
        ),
      },
      {
        q: t('Combien coûte l’adhésion, et que comprend-elle ?'),
        a: t(
          '50 € par an pour la formule Artiste, 100 € par an pour la formule Artiste confirmé. La formule Artiste ouvre un profil détaillé, un portfolio de vingt images, un calendrier de disponibilités, la réception des demandes de réservation et une assistance par e-mail. La formule Artiste confirmé comprend tout cela et y ajoute un portfolio illimité, la priorité dans les résultats de recherche, des statistiques détaillées, les distinctions et évaluations reçues après chaque date, une assistance prioritaire et le programme de parrainage. L’adhésion se règle après l’admission, jamais avant, et aucune commission n’est prélevée sur vos honoraires.'
        ),
      },
      {
        q: t('Pourquoi une adhésion plutôt qu’une commission ?'),
        a: t(
          'Parce qu’une commission nous donnerait intérêt au nombre de vos dates plutôt qu’à leur justesse. 50 € par an ne se rattrapent pas en vous poussant à accepter une semaine qui ne vous convient pas ; un pourcentage, si. C’est aussi la raison pour laquelle le montant figure sur cette page au lieu d’apparaître dans un tableau de bord une fois l’admission obtenue : un prix qu’il faut aller chercher est un prix dont on a honte.'
        ),
      },
      {
        q: t('Combien cela coûte-t-il à un hôtel ?'),
        a: t(
          'L’hôtel achète des crédits et en dépense pour chaque résidence. Trois formules : Découverte, 10 crédits pour 1 500 € ; Résidence, 25 crédits assortis de 4 crédits offerts pour 3 500 € ; Année, 50 crédits assortis de 10 crédits offerts pour 6 500 €. Le coût d’une résidence varie selon l’artiste. Pas d’abonnement, pas de frais d’entrée, aucune commission sur ce que vous vendez le soir de la représentation. S’y ajoutent la chambre et les repas de l’artiste et de son accompagnant, que vous fournissez et qui ne passent pas par nous.'
        ),
      },
      {
        q: t('Y a-t-il d’autres frais ?'),
        a: t(
          'Non, et voici la liste complète de ce qui reste à votre charge, pour que personne ne la découvre en chemin : le voyage aller et retour, le transport de vos instruments, vos assurances, les formalités de visa lorsqu’un pays en demande, et ce que vous consommez à l’hôtel en dehors de la pension — minibar, spa, extras portés sur la note. Aucun frais de dossier, aucun frais de mise en relation, aucun prélèvement sur vos honoraires. Si une somme vous est réclamée qui ne figure pas dans cette liste, écrivez-nous : c’est une erreur, ou ce n’est pas nous.'
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
          'Sept nuits sur place, une chambre, la pension complète et une scène — toit-terrasse face à la ville, salon feutré, salle de bal, parfois une salle à manger que l’on réagence à vingt-deux heures. Douze heures de représentation dans la semaine, rien le jour de l’arrivée ni celui du départ. Entre deux, le temps de création vous appartient : ce que vous produisez sur place reste entièrement à vous.'
        ),
      },
      {
        q: t('Combien de temps joue-t-on, exactement ?'),
        a: t(
          'Douze heures par semaine, deux heures par jour au maximum, et rien le jour de l’arrivée ni celui du départ. Ces douze heures se répartissent avec l’hôtel avant votre venue, selon le rythme de la maison : un hôtel de montagne veut de la musique en fin d’après-midi, un hôtel de bord de mer au coucher du soleil, certains préfèrent deux fois une heure à un long set. Les répétitions et le temps d’installation ne sont pas comptés dans les douze heures ; les ateliers et les rencontres avec les clients, si.'
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
          'Prévenez l’hôtel et prévenez-nous le jour même. Une représentation annulée pour maladie ne se paie pas : ni pénalité, ni retour négatif, ni conséquence sur votre profil. La chambre et la pension vous restent acquises pour les nuits réservées — on ne met pas dehors quelqu’un qui a de la fièvre à quatre mille kilomètres de chez lui. Si l’état se prolonge, les heures restantes sont réduites ou la résidence s’interrompt, d’un commun accord. Ce qui se passe mal, ce n’est pas d’être malade : c’est de le dire trop tard.'
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
          'Oui. Une date acceptée des deux côtés produit un document qui vaut engagement : les dates exactes du séjour, le nombre de nuits, la répartition des douze heures, le lieu de représentation, ce que l’hôtel fournit — chambre, pension, matériel —, le nom de votre contact sur place et les conditions d’annulation. L’artiste et l’hôtel en reçoivent le même exemplaire. Rien d’essentiel ne devrait rester à l’oral : si un point a été convenu par téléphone, faites-le écrire avant de partir.'
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
          'L’hôtel assure ses locaux, sa scène et ses clients. Vous assurez ce qui est à vous : vos instruments et votre matériel, pendant le transport comme sur place, votre responsabilité civile professionnelle, et votre couverture santé et rapatriement à l’étranger. La carte européenne d’assurance maladie suffit en Europe ; elle ne sert à rien aux Maldives ni au Brésil. Ce sont vingt euros d’assurance voyage qui écartent la seule mauvaise surprise réellement grave de ce programme.'
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
          'Une annulation se dit tôt et par écrit. Si l’hôtel annule, ses crédits lui sont restitués et nous cherchons à vous replacer sur la même période, sans pouvoir le garantir ; un billet déjà acheté reste votre risque, ce qui est une raison de plus de ne rien réserver avant que la résidence soit confirmée des deux côtés. Si c’est vous qui annulez, prévenez-nous immédiatement : une annulation motivée n’a aucune conséquence, une annulation tardive et répétée met fin à votre présence sur la plateforme. La sélection se fait à la main des deux côtés ; l’exclusion aussi.'
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
        description={t('Le programme, la candidature, les délais de réponse, ce qui est inclus et ce qui ne l’est pas, la vie d’une résidence Travel Art.')}
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
          {t('Le programme, la candidature, l’argent et la vie d’une résidence — dans l’ordre où les questions se posent vraiment.')}
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

      </main>
      <Footer />
    </div>
  )
}

export default FaqPage
