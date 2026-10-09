import crypto from 'crypto';
import { config } from '../config';
import { BOARD_LABELS, TRANSPORT_TERMS } from '../shared/validation';

/**
 * The tripartite exchange convention, filled in from one booking.
 *
 * The text is the owner's "Convention tripartite d'échange de prestations"
 * (séjour hôtelier contre prestation), in its generic form: the second party
 * is "le Participant" so the same document serves a DJ, a yoga teacher or a
 * painter, and the third is "le Coordinateur", whoever coordinates. Moroccan
 * law, the 89 € fee and the 15-day delay are the owner's, word for word.
 *
 * The document is built as a list of blocks so that the screen, the PDF and
 * the hash all read one source. Change the wording and bump TEXT_VERSION: a
 * signature records the hash of the terms it was given, and a convention
 * whose text moved under one party's signature must not finalise.
 */

export const CONVENTION_TEXT_VERSION = '2026-10-09';

export type Block =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'paragraph'; text: string; strong?: boolean }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'rule' }
  | { kind: 'signature'; party: PartyKey; label: string; lines: string[]; signedAt: string | null };

export type PartyKey = 'HOTEL' | 'PARTICIPANT' | 'COORDINATOR';

export interface HotelIdentity {
  legalName: string;
  legalForm: string;
  address: string;
  registrationNumber: string;
  taxId: string;
  signatoryName: string;
  signatoryTitle: string;
}

export interface ParticipantIdentity {
  stageName: string;
  fullName: string;
  address: string;
  idDocument: string;
  phone: string;
  email: string;
}

export interface CoordinatorIdentity {
  name: string;
  address: string;
  registration: string;
  representative: string;
}

/** What the document needs from a booking. Read with conventionBookingSelect. */
export interface ConventionInput {
  id: string;
  startDate: Date;
  endDate: Date;
  companionName: string | null;
  boardType: string | null;
  transportTerms: string | null;
  transportNotes: string | null;
  performanceDescription: string | null;
  performanceSchedule: string | null;
  stayValueCents: number | null;
  performanceValueCents: number | null;
  currency: string;
  roomType: string | null;
  includedServices: string | null;
  performanceLocation: string | null;
  performanceDuration: string | null;
  technicalConditions: string | null;
  socialContent: string | null;
  hotel: {
    name: string;
    city: string;
    country: string;
    address: string | null;
    legalName: string | null;
    legalForm: string | null;
    registrationNumber: string | null;
    taxId: string | null;
    signatoryName: string | null;
    signatoryTitle: string | null;
    repName: string | null;
  };
  artist: {
    stageName: string | null;
    discipline: string;
    user: { name: string; email: string; phone: string | null };
  };
}

export const conventionBookingSelect = {
  id: true,
  status: true,
  hotelId: true,
  artistId: true,
  startDate: true,
  endDate: true,
  companionName: true,
  boardType: true,
  transportTerms: true,
  transportNotes: true,
  performanceDescription: true,
  performanceSchedule: true,
  stayValueCents: true,
  performanceValueCents: true,
  currency: true,
  roomType: true,
  includedServices: true,
  performanceLocation: true,
  performanceDuration: true,
  technicalConditions: true,
  socialContent: true,
  conventionFinalizedAt: true,
  conventionHash: true,
  hotel: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      address: true,
      legalName: true,
      legalForm: true,
      registrationNumber: true,
      taxId: true,
      signatoryName: true,
      signatoryTitle: true,
      repName: true,
      user: { select: { id: true, email: true } },
    },
  },
  artist: {
    select: {
      id: true,
      stageName: true,
      discipline: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  },
  signatures: {
    select: { party: true, signerName: true, signerTitle: true, identity: true, documentHash: true, signedAt: true },
  },
} as const;

export interface SignatureInput {
  party: PartyKey;
  signerName: string;
  signerTitle: string | null;
  identity: unknown;
  signedAt: Date;
}

// ------------------------------------------------------------------ helpers

const BLANK = '..............................';

const orBlank = (v: string | null | undefined) => (v && v.trim() ? v.trim() : BLANK);
const orNotSpecified = (v: string | null | undefined) => (v && v.trim() ? v.trim() : 'Non précisé');

export function formatDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export function formatMoney(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents === null || cents === undefined) return BLANK;
  const amount = (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return `${amount.replace(/ | /g, ' ')} ${currency === 'EUR' ? '€' : currency}`;
}

export function nightsBetween(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
}

const TRANSPORT_OPTIONS: Record<(typeof TRANSPORT_TERMS)[number], string> = {
  ARTIST_PAYS: 'À la charge du Participant',
  HOTEL_PAYS: 'Pris en charge par l’Hôtel',
  SHARED: 'Pris en charge partiellement par l’Hôtel',
  NOT_NEEDED: 'Autre : aucun transport nécessaire',
};

/** The hotel's identity as the document prints it: from its signature once signed, else its profile. */
export function hotelIdentityOf(input: ConventionInput, signature?: SignatureInput): HotelIdentity {
  const signed = (signature?.identity ?? null) as Partial<HotelIdentity> | null;
  const h = input.hotel;
  return {
    legalName: signed?.legalName ?? h.legalName ?? h.name,
    legalForm: signed?.legalForm ?? h.legalForm ?? '',
    address: signed?.address ?? h.address ?? [h.city, h.country].filter(Boolean).join(', '),
    registrationNumber: signed?.registrationNumber ?? h.registrationNumber ?? '',
    taxId: signed?.taxId ?? h.taxId ?? '',
    signatoryName: signed?.signatoryName ?? h.signatoryName ?? h.repName ?? '',
    signatoryTitle: signed?.signatoryTitle ?? h.signatoryTitle ?? '',
  };
}

/**
 * The participant's identity. Address and identity document are asked only
 * at signature and live only on the signature row, never on the profile.
 */
export function participantIdentityOf(input: ConventionInput, signature?: SignatureInput): ParticipantIdentity {
  const signed = (signature?.identity ?? null) as Partial<ParticipantIdentity> | null;
  const a = input.artist;
  return {
    stageName: a.stageName ?? '',
    fullName: signed?.fullName ?? a.user.name,
    address: signed?.address ?? '',
    idDocument: signed?.idDocument ?? '',
    phone: a.user.phone ?? '',
    email: a.user.email,
  };
}

export function coordinatorIdentity(): CoordinatorIdentity {
  return { ...config.coordinator };
}

/**
 * SHA-256 of the terms: everything both parties agree to except who they
 * are. Each party's identity is frozen on its own signature row instead,
 * since each fills in its own at the moment it signs.
 */
export function termsHash(input: ConventionInput): string {
  const terms = {
    v: CONVENTION_TEXT_VERSION,
    id: input.id,
    start: input.startDate.toISOString(),
    end: input.endDate.toISOString(),
    companion: input.companionName ?? null,
    board: input.boardType ?? null,
    room: input.roomType ?? null,
    included: input.includedServices ?? null,
    transport: input.transportTerms ?? null,
    transportNotes: input.transportNotes ?? null,
    perf: input.performanceDescription ?? null,
    schedule: input.performanceSchedule ?? null,
    duration: input.performanceDuration ?? null,
    location: input.performanceLocation ?? null,
    technical: input.technicalConditions ?? null,
    social: input.socialContent ?? null,
    stay: input.stayValueCents ?? null,
    value: input.performanceValueCents ?? null,
    currency: input.currency,
    category: input.artist.discipline || null,
    fee: config.hotelCancellationFeeCents,
  };
  return crypto.createHash('sha256').update(JSON.stringify(terms)).digest('hex');
}

// ----------------------------------------------------------------- document

export interface ConventionDocument {
  title: string;
  reference: string;
  blocks: Block[];
  termsHash: string;
}

export function buildConvention(input: ConventionInput, signatures: SignatureInput[] = [], finalizedAt: Date | null = null): ConventionDocument {
  const sig = (party: PartyKey) => signatures.find((s) => s.party === party);
  const hotel = hotelIdentityOf(input, sig('HOTEL'));
  const participant = participantIdentityOf(input, sig('PARTICIPANT'));
  const coordinator = coordinatorIdentity();
  const nights = nightsBetween(input.startDate, input.endDate);
  const board = input.boardType ? BOARD_LABELS[input.boardType as keyof typeof BOARD_LABELS] : null;
  const included = (input.includedServices ?? '')
    .split(/\r?\n|;/)
    .map((s) => s.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);
  const participantLabel = participant.stageName ? `${participant.stageName} (${participant.fullName})` : participant.fullName;
  const category = input.artist.discipline || 'Prestation créative';
  const stayValue = formatMoney(input.stayValueCents, input.currency);
  const performanceValue = formatMoney(input.performanceValueCents, input.currency);
  const fee = formatMoney(config.hotelCancellationFeeCents, 'EUR');
  const reference = `TA-${input.id.slice(-8).toUpperCase()}`;

  const b: Block[] = [];
  const h = (text: string) => b.push({ kind: 'heading', text });
  const sh = (text: string) => b.push({ kind: 'subheading', text });
  const p = (text: string, strong = false) => b.push({ kind: 'paragraph', text, strong });
  const f = (label: string, value: string) => b.push({ kind: 'field', label, value });
  const list = (items: string[]) => b.push({ kind: 'list', items });
  const rule = () => b.push({ kind: 'rule' });

  b.push({ kind: 'title', text: 'CONVENTION TRIPARTITE D’ÉCHANGE DE PRESTATIONS' });
  b.push({ kind: 'subtitle', text: 'Séjour hôtelier contre prestation' });
  f('Référence', reference);

  p('Entre les soussignés :', true);

  sh('1. L’ÉTABLISSEMENT HÔTELIER');
  f('Dénomination', orBlank(hotel.legalName));
  f('Nom commercial', input.hotel.name);
  f('Forme juridique', orBlank(hotel.legalForm));
  f('Adresse', orBlank(hotel.address));
  f('RC / immatriculation', orBlank(hotel.registrationNumber));
  f('ICE / identifiant fiscal', orBlank(hotel.taxId));
  f('Représenté par', orBlank(hotel.signatoryName));
  f('En qualité de', orBlank(hotel.signatoryTitle));
  p('Ci-après dénommé « l’Hôtel »,');

  sh('2. LE PARTICIPANT');
  f('Nom / Nom artistique', orBlank(participant.stageName || participant.fullName));
  f('Nom complet', orBlank(participant.fullName));
  f('Adresse', orBlank(participant.address));
  f('CIN / Passeport', orBlank(participant.idDocument));
  f('Téléphone', orBlank(participant.phone));
  f('E-mail', orBlank(participant.email));
  p('Ci-après dénommé « le Participant »,');

  sh('3. LE TIERS COORDINATEUR');
  f('Nom / Dénomination', orBlank(coordinator.name));
  f('Adresse', orBlank(coordinator.address));
  f('RC / ICE, le cas échéant', orBlank(coordinator.registration));
  f('Représenté par', orBlank(coordinator.representative));
  p('Ci-après dénommé « le Coordinateur ».');
  p('L’Hôtel, le Participant et le Coordinateur sont ci-après collectivement désignés « les Parties ».');
  rule();

  h('PRÉAMBULE');
  p('Les Parties souhaitent organiser une opération de partenariat reposant sur un échange de prestations entre l’Hôtel et le Participant.');
  p('Dans ce cadre, l’Hôtel souhaite accueillir le Participant et une personne de son choix pour un séjour déterminé, en contrepartie de la réalisation par le Participant d’une prestation définie dans la présente convention.');
  p('Les Parties souhaitent formaliser précisément leurs engagements respectifs, les conditions du séjour, la prestation ainsi que les conditions d’annulation et de responsabilité.');
  p('Le présent contrat constitue l’intégralité de leur accord concernant l’opération décrite ci-dessous.');

  h('ARTICLE 1 — OBJET');
  p('La présente convention a pour objet de définir les conditions dans lesquelles :');
  list([
    'l’Hôtel fournit au Participant et à son accompagnant un séjour hôtelier pour deux personnes ;',
    'le Participant réalise, en contrepartie, la prestation définie dans la présente convention et son annexe ;',
    'le Coordinateur assure, lorsque cela est prévu, la mise en relation, la coordination administrative et/ou opérationnelle entre l’Hôtel et le Participant.',
  ]);
  p('L’opération constitue un échange de prestations en nature librement accepté par les Parties.', true);

  h('ARTICLE 2 — PRINCIPE DE L’ÉCHANGE ET VALEUR DES PRESTATIONS');
  p('Les Parties déclarent avoir librement convenu d’un échange de prestations en nature.');
  p('Dans ce cadre, l’Hôtel s’engage à fournir au Participant et à son accompagnant un séjour pour deux personnes, comprenant les prestations définies dans la présente convention.');
  f('Valeur du séjour pour deux personnes', stayValue);
  p('En contrepartie, le Participant s’engage à réaliser la prestation définie dans la présente convention et son annexe, laquelle peut notamment prendre la forme d’une prestation musicale, artistique, créative, photographique, audiovisuelle, de création de contenu, de danse, de performance, de création artisanale ou toute autre prestation expressément convenue entre les Parties.');
  p('La nature exacte de la prestation est précisée à l’article 5 et dans l’Annexe 1.');
  f('Valeur de la prestation', performanceValue);
  p('Les Parties reconnaissent que le séjour et la prestation constituent les contreparties respectives de l’échange et acceptent librement le principe de cet échange.');
  p('En conséquence, le Participant reconnaît que le séjour constitue la contrepartie convenue de sa prestation et qu’aucune rémunération, aucun cachet, aucun honoraire ni aucun paiement supplémentaire ne lui est dû au titre de la prestation prévue par la présente convention, sous réserve des droits auxquels il ne pourrait légalement être renoncé.', true);
  p('Toute prestation supplémentaire ou toute modification substantielle de la prestation initialement convenue devra faire l’objet d’un accord écrit préalable entre les Parties.');

  h('ARTICLE 3 — DESCRIPTION DU SÉJOUR');
  p('L’Hôtel met à disposition du Participant et de son accompagnant :');
  f('Dates', `du ${formatDay(input.startDate)} au ${formatDay(input.endDate)}`);
  f('Nombre de nuits', String(nights));
  f('Type de chambre', orNotSpecified(input.roomType));
  f('Formule', board ?? 'Non précisée');
  p('Le séjour comprend exclusivement :');
  list(['hébergement pour deux personnes ;', ...(board ? [`restauration selon la formule « ${board} » ;`] : []), ...included.map((i) => `${i} ;`)]);
  p('Toute prestation non expressément incluse dans la présente convention est exclue de l’échange.');
  p('Les consommations, prestations ou dommages facturés individuellement par l’Hôtel restent à la charge de leur auteur.');

  h('ARTICLE 4 — ACCOMPAGNANT');
  p('Le séjour est prévu pour :');
  list(['1 Participant ;', `1 accompagnant désigné par le Participant${input.companionName ? ` : ${input.companionName}` : ''}.`]);
  p('L’accompagnant n’est pas partie à la prestation et n’a aucune obligation de réaliser une prestation, de publier du contenu ou de participer aux activités professionnelles du Participant, sauf accord écrit distinct.');
  p('Le Participant s’engage à informer son accompagnant du règlement intérieur de l’Hôtel et des règles applicables aux clients de l’établissement.');
  p('Le Participant répond, dans les limites prévues par la législation applicable, des dommages directement causés par son accompagnant lorsque sa responsabilité peut légalement être engagée.');

  h('ARTICLE 5 — PRESTATION');
  p('Le Participant réalisera la prestation suivante :');
  f('Catégorie', category);
  f('Dates', `pendant le séjour, du ${formatDay(input.startDate)} au ${formatDay(input.endDate)}`);
  f('Horaires', orNotSpecified(input.performanceSchedule));
  f('Durée totale', orNotSpecified(input.performanceDuration));
  f('Lieu', orNotSpecified(input.performanceLocation));
  f('Nature de la prestation', orNotSpecified(input.performanceDescription));
  p('La prestation devra être réalisée conformément aux conditions techniques raisonnablement nécessaires et communiquées préalablement au Participant.');
  p('Toute modification substantielle de la prestation devra être acceptée par écrit par le Participant.');

  h('ARTICLE 6 — OBLIGATIONS DU PARTICIPANT');
  p('Le Participant s’engage à :');
  list([
    'être présent aux dates et horaires convenus ;',
    'réaliser personnellement la prestation prévue ;',
    'respecter les règles de sécurité et le règlement intérieur de l’Hôtel ;',
    'adopter un comportement professionnel ;',
    'respecter les équipes, clients et installations de l’Hôtel ;',
    'informer son accompagnant des règles applicables ;',
    'disposer, lorsque cela est nécessaire, des autorisations ou droits lui permettant d’exécuter sa prestation ;',
    'utiliser un matériel conforme aux règles de sécurité applicables.',
  ]);
  p('Le Participant ne pourra substituer une autre personne à sa place sans accord préalable écrit de l’Hôtel.');

  h('ARTICLE 7 — OBLIGATIONS DE L’HÔTEL');
  p('L’Hôtel s’engage à :');
  list([
    'assurer le séjour prévu dans les conditions convenues ;',
    'mettre à disposition les prestations incluses dans l’échange ;',
    'fournir les conditions raisonnablement nécessaires à la réalisation de la prestation ;',
    'informer le Participant suffisamment à l’avance de toute modification affectant la prestation ;',
    'respecter les conditions de l’échange convenues dans la présente convention.',
  ]);
  p('L’Hôtel demeure responsable de ses propres services, de ses installations et de son personnel conformément à la réglementation applicable.');

  h('ARTICLE 8 — MATÉRIEL ET CONDITIONS TECHNIQUES');
  p('Les Parties conviennent des conditions techniques suivantes :');
  f('Conditions techniques', orNotSpecified(input.technicalConditions));
  p('Le Participant devra communiquer ses besoins techniques avant la date de la prestation.');
  p('Sauf accord contraire, le matériel personnel du Participant reste sous sa responsabilité.');

  h('ARTICLE 9 — DROIT À L’IMAGE ET COMMUNICATION');
  p('Le Participant autorise l’Hôtel à utiliser, dans le cadre de la communication relative à l’opération, les photographies et vidéos réalisées pendant la prestation, sous réserve que cette utilisation reste conforme à l’objet du partenariat.');
  p('Cette autorisation concerne notamment :');
  list(['les réseaux sociaux de l’Hôtel ;', 'le site internet de l’Hôtel ;', 'les supports de communication relatifs à l’événement ;', 'les contenus promotionnels présentant la collaboration.']);
  p('Toute utilisation commerciale distincte, notamment dans le cadre d’une campagne publicitaire payante ou d’une exploitation indépendante de l’opération, devra faire l’objet d’un accord spécifique lorsque celui-ci est requis par la législation applicable.');
  p('L’Hôtel s’engage à ne pas présenter le Participant comme cautionnant un produit, une marque ou une activité sans son accord préalable lorsque cette utilisation dépasse le cadre normal de l’opération.');

  h('ARTICLE 10 — CONTENU ET RÉSEAUX SOCIAUX');
  if (input.socialContent && input.socialContent.trim()) {
    p('Les publications prévues du Participant sont définies comme suit :');
    f('Publications', input.socialContent.trim());
  } else {
    p('Aucune publication du Participant n’est prévue par la présente convention.');
  }
  p('Sauf stipulation contraire dans l’annexe, aucune obligation de publication personnelle ne pèse sur l’accompagnant.');

  h('ARTICLE 11 — ABSENCE DE RÉMUNÉRATION MONÉTAIRE');
  p('Les Parties reconnaissent expressément que la prestation du Participant est réalisée dans le cadre de l’échange prévu au présent contrat.');
  p('La contrepartie convenue est constituée par le séjour hôtelier défini à l’article 3.');
  p('En conséquence, aucun cachet, salaire, honoraire ou autre rémunération monétaire supplémentaire n’est dû au Participant au titre de cette prestation, sauf accord écrit ultérieur entre les Parties ou droit impératif contraire.', true);
  p('La présente clause ne saurait être interprétée comme une renonciation à un droit auquel la loi applicable interdit de renoncer.');

  h('ARTICLE 12 — FRAIS DE TRANSPORT');
  p('Les frais de transport du Participant et de son accompagnant sont :');
  list(
    (Object.keys(TRANSPORT_OPTIONS) as (keyof typeof TRANSPORT_OPTIONS)[]).map(
      (k) => `[${input.transportTerms === k ? 'X' : ' '}] ${TRANSPORT_OPTIONS[k]}`
    )
  );
  if (input.transportNotes) f('Modalités', input.transportNotes);
  p('Lorsque les frais sont pris en charge par l’Hôtel, les modalités doivent être précisées dans l’annexe.');

  h('ARTICLE 13 — ANNULATION PAR LE PARTICIPANT');
  p('En cas d’empêchement du Participant, celui-ci doit prévenir l’Hôtel et le Coordinateur dans les meilleurs délais.');
  p('En cas d’empêchement injustifié entraînant l’annulation de la prestation, l’Hôtel pourra demander le remboursement des dépenses directement engagées et non récupérables du fait de cette annulation, sous réserve de pouvoir les justifier et dans les limites permises par la loi applicable.');
  p('Aucune pénalité forfaitaire disproportionnée ne pourra être appliquée.');

  h('ARTICLE 14 — ANNULATION PAR L’HÔTEL');
  p('En cas d’annulation par l’Hôtel après validation définitive de la présente convention, lorsque cette annulation est imputable à l’Hôtel et ne résulte pas d’un cas de force majeure ou d’une obligation légale ou administrative indépendante de sa volonté, l’Hôtel devra :');
  list([
    'rembourser au Participant les frais de transport liés à la mission, effectivement engagés, justifiés et non remboursables ;',
    `verser au Coordinateur, lorsqu’il est effectivement chargé de la coordination de l’opération, des frais fixes de traitement de dossier de ${fee}.`,
  ]);
  p('Les frais de transport devront être justifiés par des documents permettant d’établir leur montant et leur caractère non remboursable.');
  p('Le paiement interviendra dans un délai de 15 jours calendaires suivant la réception d’une demande complète accompagnée des justificatifs nécessaires, sauf accord différent entre les Parties.');
  p('Les Parties pourront privilégier un report de la prestation plutôt qu’une annulation définitive.');

  h('ARTICLE 15 — FORCE MAJEURE');
  p('Aucune Partie ne pourra être tenue responsable d’un manquement résultant d’un événement de force majeure au sens de la législation applicable.');
  p('La Partie concernée devra informer les autres Parties dans les meilleurs délais.');
  p('Les Parties rechercheront prioritairement une solution de report de la prestation ou du séjour.');
  p('Les frais déjà engagés seront traités conformément à la réglementation applicable et aux possibilités de remboursement ou d’indemnisation disponibles.');

  h('ARTICLE 16 — RESPONSABILITÉ');
  p('Chaque Partie est responsable de ses propres obligations.');
  p('Le Participant est responsable de son matériel personnel et de son comportement ainsi que, dans les limites prévues par la loi, du comportement de son accompagnant.');
  p('L’Hôtel est responsable de ses propres installations, prestations et obligations en qualité d’établissement hôtelier.');
  p('Aucune Partie ne pourra être tenue responsable d’un dommage indirect qui ne serait pas directement imputable à son fait ou à sa négligence.');

  h('ARTICLE 17 — PROPRIÉTÉ INTELLECTUELLE');
  p('Chaque Partie conserve ses droits sur ses créations, marques, photographies, vidéos, logos, œuvres et autres éléments préexistants.');
  p('La présente convention ne constitue aucune cession générale de droits de propriété intellectuelle.');
  p('Le Participant conserve ses droits sur ses créations et interprétations dans les limites prévues par la législation applicable.');
  p('Toute cession ou licence de droits allant au-delà de l’utilisation prévue à l’article 9 devra faire l’objet d’un accord distinct précisant notamment son objet, sa durée, son territoire et ses modes d’exploitation.');

  h('ARTICLE 18 — CONFIDENTIALITÉ');
  p('Les Parties s’engagent à ne pas divulguer les informations confidentielles obtenues dans le cadre de la présente opération, notamment les informations commerciales, financières, techniques ou stratégiques qui ne sont pas publiquement accessibles.');
  p('Cette obligation ne s’applique pas aux informations :');
  list(['déjà publiques ;', 'devenues publiques sans violation du présent contrat ;', 'dont la divulgation est imposée par la loi ou une autorité compétente.']);

  h('ARTICLE 19 — DURÉE');
  p('La présente convention prend effet à compter de sa signature par les Parties.');
  p('Elle prend fin après exécution complète des obligations prévues, sans préjudice des clauses qui, par leur nature, sont destinées à survivre à son expiration, notamment celles relatives à la confidentialité, aux droits de propriété intellectuelle et aux éventuelles responsabilités.');

  h('ARTICLE 20 — MODIFICATION DU CONTRAT');
  p('Toute modification de la présente convention devra être effectuée par écrit et acceptée par les Parties concernées.');
  p('Un échange de messages électroniques permettant d’établir clairement l’accord des Parties pourra constituer une preuve de cet accord, sous réserve des règles de preuve applicables.');

  h('ARTICLE 21 — RÈGLEMENT DES DIFFÉRENDS');
  p('Les Parties s’engagent à rechercher en priorité une solution amiable à tout différend relatif à l’interprétation ou à l’exécution de la présente convention.');
  p('À défaut d’accord amiable, le différend sera soumis aux juridictions marocaines compétentes, sous réserve des règles impératives de compétence territoriale applicables.');

  h('ARTICLE 22 — DROIT APPLICABLE');
  p('La présente convention est soumise au droit marocain, sous réserve des dispositions impératives qui seraient applicables à la situation des Parties ou à la nature de la prestation.', true);

  h('ARTICLE 23 — INTÉGRALITÉ DE L’ACCORD');
  p('La présente convention et ses annexes constituent l’intégralité de l’accord entre les Parties concernant l’opération.');
  p('Toute disposition déclarée nulle ou inapplicable n’affectera pas la validité des autres dispositions, sauf lorsque cette nullité rendrait l’économie générale du contrat impossible.');
  p('Les Parties s’engagent, dans ce cas, à remplacer la disposition concernée par une disposition juridiquement valable se rapprochant autant que possible de son objectif initial.');

  h('ARTICLE 24 — SIGNATURES');
  p('Les Parties déclarent avoir lu et compris l’intégralité de la présente convention et l’accepter librement.');
  p('La signature de la présente convention vaut acceptation de l’ensemble de ses dispositions et de l’échange de prestations décrit ci-dessus.');
  p('La présente convention est signée électroniquement par chacune des Parties depuis son espace personnel ; chaque signature est horodatée et rattachée à l’empreinte des conditions signées, reproduite ci-dessous.');
  f('Fait à', config.conventionPlace || input.hotel.city || BLANK);
  f('Le', finalizedAt ? formatDay(finalizedAt) : BLANK);

  const stamp = (s?: SignatureInput) => (s ? `Signé électroniquement le ${formatDay(s.signedAt)} à ${s.signedAt.toISOString().slice(11, 16)} UTC` : 'Signature : en attente');
  const hs = sig('HOTEL');
  const ps = sig('PARTICIPANT');
  const cs = sig('COORDINATOR');
  b.push({ kind: 'signature', party: 'HOTEL', label: 'L’HÔTEL', lines: [`Nom : ${hs?.signerName ?? orBlank(hotel.signatoryName)}`, `Fonction : ${hs?.signerTitle ?? orBlank(hotel.signatoryTitle)}`, stamp(hs)], signedAt: hs ? hs.signedAt.toISOString() : null });
  b.push({ kind: 'signature', party: 'PARTICIPANT', label: 'LE PARTICIPANT', lines: [`Nom / Nom artistique : ${ps?.signerName ?? participantLabel}`, stamp(ps)], signedAt: ps ? ps.signedAt.toISOString() : null });
  b.push({ kind: 'signature', party: 'COORDINATOR', label: 'LE COORDINATEUR', lines: [`Nom / Dénomination : ${coordinator.name}`, `Représentant : ${cs?.signerName ?? orBlank(coordinator.representative)}`, stamp(cs)], signedAt: cs ? cs.signedAt.toISOString() : null });
  rule();

  h('ANNEXE 1 — FICHE DE L’ÉCHANGE');
  sh('SÉJOUR HÔTELIER');
  f('Participant', participantLabel);
  f('Accompagnant', orNotSpecified(input.companionName));
  f('Dates', `du ${formatDay(input.startDate)} au ${formatDay(input.endDate)}`);
  f('Nombre de nuits', String(nights));
  f('Type de chambre', orNotSpecified(input.roomType));
  f('Formule', board ?? 'Non précisée');
  f('Prestations incluses', included.length ? included.join(' ; ') : 'Hébergement pour deux personnes');
  f('Valeur commerciale du séjour', stayValue);
  sh('PRESTATION');
  f('Participant', participantLabel);
  f('Catégorie', category);
  f('Nature', orNotSpecified(input.performanceDescription));
  f('Horaires', orNotSpecified(input.performanceSchedule));
  f('Durée', orNotSpecified(input.performanceDuration));
  f('Lieu', orNotSpecified(input.performanceLocation));
  f('Conditions techniques', orNotSpecified(input.technicalConditions));
  f('Valeur commerciale de la prestation', performanceValue);
  sh('RAPPEL DU PRINCIPE');
  p('Les Parties reconnaissent que le séjour hôtelier accordé pour deux personnes constitue la contrepartie contractuellement convenue de la prestation réalisée par le Participant.');
  p('Aucune rémunération monétaire supplémentaire n’est due au Participant au titre de cette prestation, sous réserve des droits auxquels il ne pourrait légalement être renoncé.', true);
  p('Toute prestation ou dépense supplémentaire devra faire l’objet d’un accord écrit préalable.');

  const hash = termsHash(input);
  f('Empreinte des conditions (SHA-256)', hash);
  f('Version du modèle', CONVENTION_TEXT_VERSION);

  return { title: 'Convention tripartite d’échange de prestations', reference, blocks: b, termsHash: hash };
}
