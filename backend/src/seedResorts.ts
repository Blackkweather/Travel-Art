/**
 * The resort network used to seed the demo database.
 *
 * Thirty-five properties across the footprint the programme actually describes:
 * the Alps, the Mediterranean, the Maghreb, West Africa, the Indian Ocean, the
 * Caribbean and a pair in Southeast Asia.
 *
 * Two decisions worth stating, because both were choices rather than defaults.
 *
 * COORDINATES ARE REAL. The previous seed wrote `coords: { lat: 0, lng: 0 }`
 * for every hotel, which is a point in the Gulf of Guinea - so every marker on
 * the experiences map stacked on Null Island and the map read as broken. Each
 * entry below carries the real coordinates of its destination.
 *
 * THE PROPERTIES ARE INVENTED; THE DESTINATIONS ARE NOT. The seed this replaces
 * used real hotel names - Hotel Plaza Athénée, La Mamounia, Nobu Hotel Ibiza -
 * which on a public marketing page reads as a claim that those hotels are
 * partners. They are not. The names here are invented in the brand's register
 * and placed at real destinations with real coordinates, so the map is
 * geographically honest without asserting a commercial relationship that does
 * not exist.
 */

export type ResortEnvironment =
  | 'alpine'
  | 'beach'
  | 'riad'
  | 'coast'
  | 'pool'
  | 'lagoon'
  | 'desert'
  | 'marina';

export interface SeedResort {
  email: string;
  name: string;
  city: string;
  country: string;
  /** Decimal degrees, WGS84. */
  lat: number;
  lng: number;
  environment: ResortEnvironment;
  description: string;
  contactPhone: string;
  repName: string;
  /** Two venues per property: one that seats a room, one that opens outward. */
  spots: Array<{
    name: string;
    type: 'ballroom' | 'lounge' | 'pool' | 'resto' | 'beach' | 'garden';
    capacity: number;
    description: string;
  }>;
}

export const RESORTS: SeedResort[] = [
  // ---------------------------------------------------------------- the Alps
  {
    email: 'hotel1@example.com',
    name: 'Les Terrasses de Val d’Isère',
    city: 'Val d’Isère',
    country: 'France',
    lat: 45.4489,
    lng: 6.9797,
    environment: 'alpine',
    description:
      'Un chalet de vingt-huit chambres au pied de la Face de Bellevarde, où le salon devient scène dès la nuit tombée.',
    contactPhone: '+33 4 79 06 10 20',
    repName: 'Camille Rousseau',
    spots: [
      { name: 'Le Grand Salon', type: 'lounge', capacity: 70, description: 'Cheminée ouverte et piano droit — pour les formations acoustiques.' },
      { name: 'La Terrasse Sud', type: 'garden', capacity: 120, description: 'Plein sud face au glacier, en fin d’après-midi.' },
    ],
  },
  {
    email: 'hotel2@example.com',
    name: 'Refuge de Tignes',
    city: 'Tignes',
    country: 'France',
    lat: 45.4681,
    lng: 6.9056,
    environment: 'alpine',
    description:
      'Bois brut, laine et lumière rase au bord du lac. Une programmation d’hiver dense, du jazz au répertoire contemporain.',
    contactPhone: '+33 4 79 06 32 14',
    repName: 'Thibault Mercier',
    spots: [
      { name: 'La Salle Voûtée', type: 'ballroom', capacity: 150, description: 'Voûte de pierre, acoustique longue — cordes et chœurs.' },
      { name: 'Le Bar du Lac', type: 'lounge', capacity: 45, description: 'Intimiste, face à l’eau gelée.' },
    ],
  },
  {
    email: 'hotel3@example.com',
    name: 'Maison Serre Chevalier',
    city: 'Serre Chevalier',
    country: 'France',
    lat: 44.9333,
    lng: 6.55,
    environment: 'alpine',
    description:
      'Une ancienne ferme de la Clarée reprise pierre par pierre, à mi-chemin entre la vallée et les mélèzes.',
    contactPhone: '+33 4 92 24 71 88',
    repName: 'Élodie Barrault',
    spots: [
      { name: 'La Grange', type: 'ballroom', capacity: 110, description: 'Charpente apparente, sol de terre battue — folk et musiques traditionnelles.' },
      { name: 'Le Jardin d’Hiver', type: 'garden', capacity: 40, description: 'Verrière chauffée, ouverte toute l’année.' },
    ],
  },
  {
    email: 'hotel4@example.com',
    name: 'Chalet des Praz',
    city: 'Chamonix',
    country: 'France',
    lat: 45.9237,
    lng: 6.8694,
    environment: 'alpine',
    description:
      'Face aux Drus, dans le hameau des Praz. Résidences longues pour les artistes qui viennent travailler autant que jouer.',
    contactPhone: '+33 4 50 53 05 09',
    repName: 'Nicolas Vasseur',
    spots: [
      { name: 'L’Atelier', type: 'lounge', capacity: 35, description: 'Ancien atelier de guide, verrière plein nord — arts visuels et lectures.' },
      { name: 'La Terrasse des Drus', type: 'garden', capacity: 90, description: 'Sets de fin de journée face au massif.' },
    ],
  },
  {
    email: 'hotel5@example.com',
    name: 'Zermatt Alpin Lodge',
    city: 'Zermatt',
    country: 'Switzerland',
    lat: 46.0207,
    lng: 7.7491,
    environment: 'alpine',
    description:
      'Village sans voiture, silence rare. Le lodge programme des sets courts, quatre soirs par semaine, face au Cervin.',
    contactPhone: '+41 27 966 88 00',
    repName: 'Anna Brunner',
    spots: [
      { name: 'Die Halle', type: 'ballroom', capacity: 130, description: 'Volume de mélèze, plafond haut — quintets et ensembles.' },
      { name: 'Sonnenterrasse', type: 'garden', capacity: 80, description: 'Terrasse plein sud, matin et fin d’après-midi.' },
    ],
  },
  {
    email: 'hotel6@example.com',
    name: 'Villa Engadina',
    city: 'Saint-Moritz',
    country: 'Switzerland',
    lat: 46.4908,
    lng: 9.8355,
    environment: 'alpine',
    description:
      'Une villa Belle Époque au-dessus du lac, tenue par la même famille depuis quatre générations.',
    contactPhone: '+41 81 833 21 40',
    repName: 'Gian Caduff',
    spots: [
      { name: 'Le Salon de Musique', type: 'ballroom', capacity: 95, description: 'Quart-de-queue Bösendorfer, parquet d’origine.' },
      { name: 'La Véranda', type: 'lounge', capacity: 50, description: 'Fenêtres sur le lac, lumière du soir.' },
    ],
  },
  {
    email: 'hotel7@example.com',
    name: 'Kitzbühel Hof',
    city: 'Kitzbühel',
    country: 'Austria',
    lat: 47.4467,
    lng: 12.3924,
    environment: 'alpine',
    description:
      'Maison de ville du XVIe siècle sur la Vorderstadt, cour intérieure pavée et acoustique courte.',
    contactPhone: '+43 5356 71300',
    repName: 'Lena Hofer',
    spots: [
      { name: 'Der Innenhof', type: 'garden', capacity: 140, description: 'Cour pavée, murs hauts — cuivres et percussions.' },
      { name: 'Die Stube', type: 'lounge', capacity: 40, description: 'Boiseries anciennes, très intime.' },
    ],
  },

  // ------------------------------------------------- the Mediterranean coast
  {
    email: 'hotel8@example.com',
    name: 'La Réserve de Ramatuelle',
    city: 'Saint-Tropez',
    country: 'France',
    lat: 43.2677,
    lng: 6.6407,
    environment: 'coast',
    description:
      'Pins parasols, terrasses en gradins et une vue plein ouest sur la baie de Pampelonne.',
    contactPhone: '+33 4 94 44 94 44',
    repName: 'Sophie Delmas',
    spots: [
      { name: 'La Pinède', type: 'garden', capacity: 160, description: 'Sous les pins, au coucher du soleil.' },
      { name: 'Le Bar de la Piscine', type: 'pool', capacity: 60, description: 'Sets tardifs au bord du bassin.' },
    ],
  },
  {
    email: 'hotel9@example.com',
    name: 'Hôtel de la Côte des Basques',
    city: 'Biarritz',
    country: 'France',
    lat: 43.4832,
    lng: -1.5586,
    environment: 'coast',
    description:
      'Au-dessus de la Côte des Basques, façade Art déco et houle de l’Atlantique en fond sonore permanent.',
    contactPhone: '+33 5 59 24 09 40',
    repName: 'Maialen Etcheverry',
    spots: [
      { name: 'Le Grand Balcon', type: 'garden', capacity: 100, description: 'Balcon de béton blanc suspendu au-dessus de la plage.' },
      { name: 'Le Fumoir', type: 'lounge', capacity: 35, description: 'Petit, sombre, parfait pour la voix seule.' },
    ],
  },
  {
    email: 'hotel10@example.com',
    name: 'Domaine de Palombaggia',
    city: 'Porto-Vecchio',
    country: 'France',
    lat: 41.5912,
    lng: 9.2795,
    environment: 'beach',
    description:
      'Vingt hectares de maquis descendant jusqu’au sable rouge de Palombaggia, en Corse-du-Sud.',
    contactPhone: '+33 4 95 70 03 20',
    repName: 'Ange-Marie Santini',
    spots: [
      { name: 'La Plage', type: 'beach', capacity: 200, description: 'Scène montée sur le sable, face aux îles Cerbicale.' },
      { name: 'La Cave', type: 'resto', capacity: 55, description: 'Cave voûtée, polyphonies corses et cordes.' },
    ],
  },
  {
    email: 'hotel11@example.com',
    name: 'Palazzo Cefalù',
    city: 'Cefalù',
    country: 'Italy',
    lat: 38.0397,
    lng: 14.0228,
    environment: 'coast',
    description:
      'Un palais du XVIIIe adossé à la Rocca, à cinq minutes de la cathédrale normande.',
    contactPhone: '+39 0921 421 234',
    repName: 'Giulia Randazzo',
    spots: [
      { name: 'Il Cortile', type: 'garden', capacity: 120, description: 'Cour à arcades, très réverbérante — chœurs et cuivres.' },
      { name: 'La Loggia', type: 'lounge', capacity: 45, description: 'Loggia ouverte sur les toits et la mer.' },
    ],
  },
  {
    email: 'hotel12@example.com',
    name: 'Rifugio Cortina',
    city: 'Cortina d’Ampezzo',
    country: 'Italy',
    lat: 46.5405,
    lng: 12.1357,
    environment: 'alpine',
    description:
      'Au pied des Tofane, un refuge repris par un couple de restaurateurs vénitiens.',
    contactPhone: '+39 0436 860 111',
    repName: 'Matteo Zardini',
    spots: [
      { name: 'La Sala Grande', type: 'ballroom', capacity: 120, description: 'Pierre et mélèze, très bonne diffusion.' },
      { name: 'La Terrazza', type: 'garden', capacity: 70, description: 'Plein sud, face aux Dolomites.' },
    ],
  },
  {
    email: 'hotel13@example.com',
    name: 'Can Talaia',
    city: 'Ibiza',
    country: 'Spain',
    lat: 38.9067,
    lng: 1.4206,
    environment: 'pool',
    description:
      'Une finca du nord de l’île, murs blanchis à la chaux, loin des clubs et tournée vers la création.',
    contactPhone: '+34 971 33 45 60',
    repName: 'Marc Torres',
    spots: [
      { name: 'El Patio', type: 'garden', capacity: 90, description: 'Patio de sabina, sets au crépuscule.' },
      { name: 'La Piscina', type: 'pool', capacity: 130, description: 'Bassin à débordement face au couchant.' },
    ],
  },
  {
    email: 'hotel14@example.com',
    name: 'Son Vell Mallorca',
    city: 'Palma de Mallorca',
    country: 'Spain',
    lat: 39.5696,
    lng: 2.6502,
    environment: 'pool',
    description:
      'Ancienne possessió agricole de la Serra de Tramuntana, oliveraie centenaire et cloître restauré.',
    contactPhone: '+34 971 22 11 00',
    repName: 'Aina Bennàssar',
    spots: [
      { name: 'El Claustro', type: 'ballroom', capacity: 140, description: 'Cloître de pierre, acoustique exceptionnelle.' },
      { name: 'El Olivar', type: 'garden', capacity: 180, description: 'Concerts sous les oliviers, en soirée.' },
    ],
  },
  {
    email: 'hotel15@example.com',
    name: 'Kalisto Santorini',
    city: 'Santorin',
    country: 'Greece',
    lat: 36.3932,
    lng: 25.4615,
    environment: 'coast',
    description:
      'Creusé dans la falaise d’Oia, seize chambres troglodytes ouvertes sur la caldeira.',
    contactPhone: '+30 22860 71 500',
    repName: 'Eleni Marinaki',
    spots: [
      { name: 'La Terrasse de la Caldeira', type: 'garden', capacity: 80, description: 'Face au volcan, à l’heure du couchant.' },
      { name: 'La Citerne', type: 'lounge', capacity: 30, description: 'Ancienne citerne voûtée, réverbération très longue.' },
    ],
  },
  {
    email: 'hotel16@example.com',
    name: 'Aegea Mykonos',
    city: 'Mykonos',
    country: 'Greece',
    lat: 37.4467,
    lng: 25.3289,
    environment: 'pool',
    description:
      'Sur la côte sud, à l’écart de Chora. Architecture cycladique, meltemi permanent, programmation électronique et acoustique.',
    contactPhone: '+30 22890 23 400',
    repName: 'Nikos Vlachos',
    spots: [
      { name: 'Le Deck', type: 'pool', capacity: 200, description: 'Grande terrasse de bois sur la mer.' },
      { name: 'La Chapelle Blanche', type: 'lounge', capacity: 40, description: 'Volume nu et blanc — voix et cordes seules.' },
    ],
  },
  {
    email: 'hotel17@example.com',
    name: 'Bodrum Yalı',
    city: 'Bodrum',
    country: 'Turkey',
    lat: 37.0344,
    lng: 27.4305,
    environment: 'marina',
    description:
      'Une maison de bord de mer ottomane sur la presqu’île de Bodrum, jetée privée et figuiers.',
    contactPhone: '+90 252 313 80 00',
    repName: 'Deniz Arslan',
    spots: [
      { name: 'L’Embarcadère', type: 'beach', capacity: 110, description: 'Scène en bout de jetée, sur l’eau.' },
      { name: 'Le Hammam', type: 'lounge', capacity: 25, description: 'Coupole percée, acoustique de pierre — très intime.' },
    ],
  },
  {
    email: 'hotel18@example.com',
    name: 'Quinta da Falésia',
    city: 'Albufeira',
    country: 'Portugal',
    lat: 37.0891,
    lng: -8.2503,
    environment: 'coast',
    description:
      'En haut des falaises ocre de l’Algarve, une quinta blanche entourée d’amandiers.',
    contactPhone: '+351 289 500 100',
    repName: 'Rui Cavaco',
    spots: [
      { name: 'O Miradouro', type: 'garden', capacity: 95, description: 'Belvédère au-dessus de l’Atlantique.' },
      { name: 'A Adega', type: 'resto', capacity: 60, description: 'Chai voûté — fado et guitare portugaise.' },
    ],
  },

  // --------------------------------------------------------------- Maghreb
  {
    email: 'hotel19@example.com',
    name: 'Riad Dar Tazi',
    city: 'Marrakech',
    country: 'Morocco',
    lat: 31.6295,
    lng: -7.9811,
    environment: 'riad',
    description:
      'Dans la médina, à deux ruelles de la Bahia. Zellige, cèdre sculpté et un patio à l’acoustique remarquable.',
    contactPhone: '+212 524 38 90 10',
    repName: 'Yasmine El Fassi',
    spots: [
      { name: 'Le Patio', type: 'garden', capacity: 85, description: 'Bassin central, orangers — musique andalouse et gnaoua.' },
      { name: 'La Terrasse', type: 'lounge', capacity: 50, description: 'Sur les toits, face à l’Atlas.' },
    ],
  },
  {
    email: 'hotel20@example.com',
    name: 'Dar Essaouira',
    city: 'Essaouira',
    country: 'Morocco',
    lat: 31.5085,
    lng: -9.7595,
    environment: 'coast',
    description:
      'Dans les remparts de Mogador, face au port. La ville du gnaoua, alizé permanent.',
    contactPhone: '+212 524 47 62 00',
    repName: 'Omar Bouzid',
    spots: [
      { name: 'La Skala', type: 'garden', capacity: 130, description: 'Sur le bastion, face à l’Atlantique.' },
      { name: 'Le Salon Bleu', type: 'lounge', capacity: 45, description: 'Tapis, coussins bas, percussions.' },
    ],
  },
  {
    email: 'hotel21@example.com',
    name: 'Taghazout Bay Lodge',
    city: 'Agadir',
    country: 'Morocco',
    lat: 30.4278,
    lng: -9.5981,
    environment: 'beach',
    description:
      'Au nord d’Agadir, entre argania et océan. Résidences longues, ateliers et scène de plage.',
    contactPhone: '+212 528 84 20 00',
    repName: 'Nadia Ait Ali',
    spots: [
      { name: 'La Plage Nord', type: 'beach', capacity: 220, description: 'Grande scène de sable, sets au coucher.' },
      { name: 'L’Atelier Bois', type: 'lounge', capacity: 30, description: 'Atelier ouvert — artisanat et arts visuels.' },
    ],
  },
  {
    email: 'hotel22@example.com',
    name: 'Dar Djerba',
    city: 'Djerba',
    country: 'Tunisia',
    lat: 33.8076,
    lng: 10.8451,
    environment: 'pool',
    description:
      'Un menzel traditionnel restauré à Erriadh, cour blanche et coupoles.',
    contactPhone: '+216 75 75 00 00',
    repName: 'Sami Ben Achour',
    spots: [
      { name: 'La Cour aux Coupoles', type: 'garden', capacity: 100, description: 'Cour blanchie, coupoles — malouf et musiques modales.' },
      { name: 'Le Bassin', type: 'pool', capacity: 70, description: 'Bassin d’irrigation converti, sets de fin de journée.' },
    ],
  },
  {
    email: 'hotel23@example.com',
    name: 'El Gouna Lagoon House',
    city: 'El Gouna',
    country: 'Egypt',
    lat: 27.3948,
    lng: 33.6778,
    environment: 'lagoon',
    description:
      'Sur les lagunes de la mer Rouge, architecture nubienne et eau de tous côtés.',
    contactPhone: '+20 65 358 0100',
    repName: 'Farida Mansour',
    spots: [
      { name: 'Le Ponton', type: 'beach', capacity: 120, description: 'Ponton de bois sur la lagune.' },
      { name: 'La Salle Nubienne', type: 'ballroom', capacity: 90, description: 'Voûtes de brique crue, son mat et chaud.' },
    ],
  },

  // ----------------------------------------- West Africa and Indian Ocean
  {
    email: 'hotel24@example.com',
    name: 'Saly Résidence',
    city: 'Saly',
    country: 'Senegal',
    lat: 14.4419,
    lng: -17.0175,
    environment: 'beach',
    description:
      'Sur la Petite Côte, à une heure de Dakar. Un lieu de résidence tourné vers les scènes ouest-africaines.',
    contactPhone: '+221 33 957 22 00',
    repName: 'Aminata Diallo',
    spots: [
      { name: 'Le Baobab', type: 'garden', capacity: 250, description: 'Scène sous le baobab — grandes formations, percussions.' },
      { name: 'Le Studio', type: 'lounge', capacity: 25, description: 'Petit studio d’enregistrement ouvert aux résidents.' },
    ],
  },
  {
    email: 'hotel25@example.com',
    name: 'Belle Mare Beach House',
    city: 'Belle Mare',
    country: 'Mauritius',
    lat: -20.19,
    lng: 57.77,
    environment: 'lagoon',
    description:
      'Sur la côte est, lagon protégé par la barrière de corail et filaos en rideau.',
    contactPhone: '+230 402 26 00',
    repName: 'Priya Ramdhun',
    spots: [
      { name: 'Le Lagon', type: 'beach', capacity: 180, description: 'Scène sur le sable, face au lagon.' },
      { name: 'La Varangue', type: 'lounge', capacity: 55, description: 'Longue véranda coloniale, séga et jazz.' },
    ],
  },
  {
    email: 'hotel26@example.com',
    name: 'Anse Royale Retreat',
    city: 'Mahé',
    country: 'Seychelles',
    lat: -4.6796,
    lng: 55.492,
    environment: 'lagoon',
    description:
      'Blocs de granit, takamakas et eau très claire, au sud de Mahé.',
    contactPhone: '+248 4 37 10 00',
    repName: 'Jean-Claude Payet',
    spots: [
      { name: 'Les Rochers', type: 'beach', capacity: 90, description: 'Entre les blocs de granit, à marée basse.' },
      { name: 'Le Pavillon', type: 'lounge', capacity: 40, description: 'Pavillon ouvert sur trois côtés.' },
    ],
  },
  {
    email: 'hotel27@example.com',
    name: 'Nosy Be Lodge',
    city: 'Nosy Be',
    country: 'Madagascar',
    lat: -13.3167,
    lng: 48.2667,
    environment: 'beach',
    description:
      'Île aux parfums : ylang-ylang, vanille et une scène tournée vers les musiques de l’océan Indien.',
    contactPhone: '+261 32 07 000 00',
    repName: 'Hery Rakotonirina',
    spots: [
      { name: 'La Plage d’Andilana', type: 'beach', capacity: 160, description: 'Sable blanc, couchant plein ouest.' },
      { name: 'Le Toit de Palme', type: 'lounge', capacity: 60, description: 'Toit de palme, salegy et musiques traditionnelles.' },
    ],
  },
  {
    email: 'hotel28@example.com',
    name: 'Kaafu Atoll House',
    city: 'Atoll de Malé Nord',
    country: 'Maldives',
    lat: 4.1755,
    lng: 73.5093,
    environment: 'lagoon',
    description:
      'Vingt-deux pavillons sur pilotis, à quarante minutes de bateau de Malé.',
    contactPhone: '+960 664 0000',
    repName: 'Ibrahim Waheed',
    spots: [
      { name: 'Le Ponton Ouest', type: 'beach', capacity: 70, description: 'Sur pilotis, face au couchant.' },
      { name: 'Le Pavillon Central', type: 'ballroom', capacity: 110, description: 'Charpente de bois ouverte sur le lagon.' },
    ],
  },

  // ------------------------------------------------ Caribbean and Americas
  {
    email: 'hotel29@example.com',
    name: 'Habitation Trois-Îlets',
    city: 'Les Trois-Îlets',
    country: 'Martinique',
    lat: 14.5389,
    lng: -61.0367,
    environment: 'beach',
    description:
      'Ancienne habitation sucrière face à la baie de Fort-de-France, jardin créole et cases restaurées.',
    contactPhone: '+596 596 68 30 00',
    repName: 'Lucienne Céleste',
    spots: [
      { name: 'La Cour de la Sucrerie', type: 'garden', capacity: 200, description: 'Machines anciennes en fond de scène — biguine et jazz.' },
      { name: 'La Case Bleue', type: 'lounge', capacity: 45, description: 'Case de bois, très chaleureuse.' },
    ],
  },
  {
    email: 'hotel30@example.com',
    name: 'Anse Sainte-Anne',
    city: 'Sainte-Anne',
    country: 'Guadeloupe',
    lat: 16.227,
    lng: -61.3825,
    environment: 'beach',
    description:
      'Sur la Grande-Terre, lagon peu profond et cocoteraie, à l’écart des grands ensembles.',
    contactPhone: '+590 590 88 20 00',
    repName: 'Marc-Olivier Nestor',
    spots: [
      { name: 'La Cocoteraie', type: 'garden', capacity: 170, description: 'Sous les cocotiers, scène basse.' },
      { name: 'Le Carbet', type: 'lounge', capacity: 50, description: 'Carbet ouvert — gwoka et tambours.' },
    ],
  },
  {
    email: 'hotel31@example.com',
    name: 'Punta Cana Palmar',
    city: 'Punta Cana',
    country: 'Dominican Republic',
    lat: 18.5601,
    lng: -68.3725,
    environment: 'pool',
    description:
      'Sur la côte de Bávaro, palmeraie dense et une grande scène couverte pour la saison sèche.',
    contactPhone: '+1 809 468 0000',
    repName: 'Rosa Jiménez',
    spots: [
      { name: 'El Palmar', type: 'garden', capacity: 300, description: 'La plus grande scène du réseau — merengue, bachata, grandes formations.' },
      { name: 'La Piscina Norte', type: 'pool', capacity: 120, description: 'Sets d’après-midi au bord du bassin.' },
    ],
  },
  {
    email: 'hotel32@example.com',
    name: 'Grace Bay Studio',
    city: 'Providenciales',
    country: 'Turks and Caicos',
    lat: 21.7738,
    lng: -72.2762,
    environment: 'lagoon',
    description:
      'Sur Grace Bay, une maison basse et un studio ouvert aux résidents toute l’année.',
    contactPhone: '+1 649 946 5000',
    repName: 'Dwight Forbes',
    spots: [
      { name: 'The Sandbar', type: 'beach', capacity: 100, description: 'Scène de sable, eau turquoise en fond.' },
      { name: 'The Studio', type: 'lounge', capacity: 20, description: 'Studio de travail, ouvert aux résidences longues.' },
    ],
  },
  {
    email: 'hotel33@example.com',
    name: 'Casa Trancoso',
    city: 'Trancoso',
    country: 'Brazil',
    lat: -16.5906,
    lng: -39.0958,
    environment: 'beach',
    description:
      'Sur le Quadrado de Trancoso, en Bahia. Maisons de couleur, église blanche et falaise sur l’Atlantique.',
    contactPhone: '+55 73 3668 1000',
    repName: 'Beatriz Nogueira',
    spots: [
      { name: 'O Quadrado', type: 'garden', capacity: 240, description: 'Sur la place herbeuse, face à l’église — samba, forró, MPB.' },
      { name: 'A Varanda', type: 'lounge', capacity: 45, description: 'Véranda de bois au-dessus de la falaise.' },
    ],
  },

  // ------------------------------------------------------- Southeast Asia
  {
    email: 'hotel34@example.com',
    name: 'Ubud River House',
    city: 'Ubud',
    country: 'Indonesia',
    lat: -8.5069,
    lng: 115.2625,
    environment: 'pool',
    description:
      'Au-dessus de la rivière Ayung, rizières en terrasses et ateliers de gamelan dans le village voisin.',
    contactPhone: '+62 361 975 000',
    repName: 'Wayan Sudira',
    spots: [
      { name: 'Le Bale', type: 'ballroom', capacity: 120, description: 'Pavillon traditionnel ouvert — gamelan et musiques croisées.' },
      { name: 'La Terrasse des Rizières', type: 'garden', capacity: 80, description: 'En balcon sur les rizières, au lever du jour.' },
    ],
  },
  {
    email: 'hotel35@example.com',
    name: 'Phuket Cape House',
    city: 'Phuket',
    country: 'Thailand',
    lat: 7.8804,
    lng: 98.3923,
    environment: 'coast',
    description:
      'Sur un cap de la côte ouest, entre plage de Kata et forêt. Résidences de saison sèche.',
    contactPhone: '+66 76 330 000',
    repName: 'Siriporn Chaiyaphum',
    spots: [
      { name: 'The Cape Deck', type: 'garden', capacity: 140, description: 'Terrasse de teck sur la mer d’Andaman.' },
      { name: 'The Long Room', type: 'lounge', capacity: 50, description: 'Salle longue et basse, très mate — voix et cordes.' },
    ],
  },
];

/**
 * Photography is assigned per environment rather than per property. Thirty-five
 * bespoke shoots is not a thing a seed file can honestly claim, and rotating
 * one generic placeholder across all of them looks worse than admitting the
 * grouping: an alpine resort gets the alpine frame, a lagoon gets the lagoon.
 */
export const ENVIRONMENT_IMAGES: Record<ResortEnvironment, string[]> = {
  alpine: ['/images/resorts/alpine.webp', '/images/hero/ombre.webp'],
  beach: ['/images/resorts/beach.webp', '/images/headers/experiences.webp'],
  // The Moroccan properties get the desert frame as their second image: both
  // sit on the edge of the Saharan south, and it keeps the riad gallery from
  // repeating one courtyard across three cities.
  riad: ['/images/resorts/riad.webp', '/images/resorts/desert.webp', '/images/pillars/residence.webp'],
  coast: ['/images/resorts/coast.webp', '/images/hero/scene.webp'],
  pool: ['/images/resorts/pool.webp', '/images/headers/hotels.webp'],
  lagoon: ['/images/resorts/lagoon.webp', '/images/headers/partners.webp'],
  desert: ['/images/resorts/desert.webp', '/images/pillars/creation.webp'],
  marina: ['/images/resorts/marina.webp', '/images/hero/voyage.webp'],
};
