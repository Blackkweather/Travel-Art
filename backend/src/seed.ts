import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { randomInt } from 'crypto';

// Seed passwords used to be the literals 'Password123!' and 'password123',
// printed at the end of the run. This repository is public, so those were
// published credentials for whatever database the seed had last been run
// against - which included production. They are now taken from the environment,
// or generated per run when it is not set, and the generated values are printed
// once so a local developer can still log in.
const generateSeedPassword = () => {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@$!%*?&#';
  return Array.from({ length: 20 }, () => alphabet[randomInt(alphabet.length)]).join('');
};

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || generateSeedPassword();
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || generateSeedPassword();
const passwordsWereGenerated = !process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_DEMO_PASSWORD;

// Load .env files (same as config.ts)
// Try multiple paths to find .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), 'backend/.env')
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file!');
  console.error('Please set DATABASE_URL in your .env file with a PostgreSQL connection string.');
  console.error('Example: DATABASE_URL="postgresql://user:password@host:port/database"');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://');
  console.error(`Current value starts with: ${process.env.DATABASE_URL.substring(0, 20)}...`);
  process.exit(1);
}

// Prisma Client - uses DATABASE_URL from environment
import { RESORTS, ENVIRONMENT_IMAGES, type SeedResort, type ResortEnvironment } from './seedResorts';

// The seed creates rows across every hotel and artist, with no session to
// attribute them to, so it uses the owner connection directly rather than the
// request-scoped client. DATABASE_URL stays pointed at the owner for exactly
// this reason; APP_DATABASE_URL is what the running server uses.
const prisma = new PrismaClient();

/* ---------------------------------------------------------------------------
 * THE PUBLISHED TERMS OF A RESIDENCY
 *
 * Every residency row used to carry a null duration, capacity, includes,
 * schedule and date, so /experiences described the light on a teak terrace and
 * not one thing a hotel could put its name to. The competitor we are measured
 * against wins on published specifics alone, so the specifics are written here.
 *
 * The programme's terms are fixed and identical everywhere: seven nights,
 * twelve hours of performance across the week, two hours a day at most, nothing
 * on the day of arrival nor on the day of departure, a double room and full
 * board for the artist and one companion, a stage, and travel to the property
 * at the artist's own expense.
 *
 * The arithmetic closes, and it closes on purpose: seven nights is eight days,
 * the first and the last carry no performance, and the six days between them at
 * two hours each are exactly the twelve hours the programme publishes. A hotel
 * that counts the days in the planning below arrives at the number on the
 * contract.
 *
 * What varies is the craft and the place. A rooftop DJ set needs a booth and a
 * curfew; a piano salon needs a tuner and a room that can be taken to black; a
 * workshop needs tables, materials and somewhere to leave the work overnight.
 * That is what the tables below encode - the terms are shared, the kit and the
 * week are not.
 *
 * PRICES STAY AT ZERO. priceFrom/priceTo are the hotel-side cost and the
 * programme is paid in credits, not per residency; a number invented here would
 * contradict the credit model on the very page a hotel reads first.
 * ------------------------------------------------------------------------- */

export type ResidencyType = 'residency' | 'intimate' | 'rooftop' | 'workshop';

/** How the headline room is described in the capacity line. */
const VENUE_KIND: Record<SeedResort['spots'][number]['type'], string> = {
  ballroom: 'grande salle',
  lounge: 'salon',
  resto: 'salle voûtée',
  pool: 'bord de bassin',
  beach: 'plein air',
  garden: 'plein air',
};

/** The technical kit the property provides, by discipline. */
const DISCIPLINE_KIT: Record<ResidencyType, string[]> = {
  residency: [
    'Backline complet : batterie, amplificateurs basse et guitare, cinq retours',
    'Sonorisation et éclairage de scène montés et réglés avant les balances',
    'Un technicien de la maison présent aux balances et à chaque représentation',
  ],
  intimate: [
    'Piano accordé la veille de la première représentation',
    'Deux micros voix et deux pieds, et la possibilité de jouer sans amplification',
    'Salle mise au noir, éclairage réglé sur la scène seule',
  ],
  rooftop: [
    'Régie DJ : deux platines, table de mixage quatre voies, casque de contrôle',
    'Diffusion extérieure et caisson de basses calibrés pour le voisinage',
    'Couvre-feu sonore à une heure du matin, arrêté avec la direction',
  ],
  workshop: [
    'Atelier équipé : tables de travail, point d’eau et rangement fermé',
    'Matériel et consommables pour douze participants par séance',
    'Un espace de stockage pour les pièces en cours entre deux séances',
  ],
};

/** The one line that only this kind of place can offer. */
const VENUE_NOTE: Record<ResortEnvironment, string> = {
  alpine: 'Transfert depuis la gare ou l’aéroport le plus proche, et forfait de remontées pour la semaine',
  beach: 'Scène de plein air montée et démontée par l’équipe technique de la maison',
  riad: 'Tapis, coussins bas et lanternes pour la mise en place du patio',
  coast: 'Bâches et housses contre l’air marin pour le matériel laissé en place',
  pool: 'Câblage et régie tenus à distance réglementaire du bassin',
  lagoon: 'Transfert en bateau pour l’artiste, l’accompagnant et le matériel',
  desert: 'Groupe électrogène silencieux et éclairage autonome pour les sets du soir',
  marina: 'Amarrage et navette depuis le port pour l’artiste et son matériel',
};

/** Whether the headline room is a stage or a workbench. */
const STAGE_LINE: Record<ResidencyType, (room: string, seats: number) => string> = {
  residency: (room, seats) => `${room} en configuration scène, ${seats} personnes`,
  intimate: (room, seats) => `${room} en configuration scène, ${seats} personnes`,
  rooftop: (room, seats) => `${room} en configuration scène, ${seats} personnes`,
  workshop: (room, seats) => `${room} en configuration atelier, ${seats} personnes`,
};

const SECOND_ROOM_LINE: Record<ResidencyType, (room: string) => string> = {
  residency: (room) => `Répétitions en journée dans le second lieu de la maison : ${room}`,
  intimate: (room) => `Répétitions en journée dans le second lieu de la maison : ${room}`,
  rooftop: (room) => `Calage du système en journée dans le second lieu de la maison : ${room}`,
  workshop: (room) => `Travail en journée dans le second lieu de la maison : ${room}`,
};

/** What the hotel receives. The first four lines are the contract itself. */
export function residencyIncludes(resort: SeedResort, type: ResidencyType): string[] {
  const [stage, second] = resort.spots;
  return [
    '12 heures de représentation sur la semaine, 2 heures par jour au maximum',
    'Rien le jour de l’arrivée ni le jour du départ',
    'Chambre double pour l’artiste et un accompagnant',
    'Pension complète pour les deux personnes, du dîner d’arrivée au petit-déjeuner du départ',
    STAGE_LINE[type](stage.name, stage.capacity),
    SECOND_ROOM_LINE[type](second.name),
    'Accès aux espaces de l’hôtel en dehors des heures de scène',
    'Un référent culturel de la maison présent toute la semaine',
    ...DISCIPLINE_KIT[type],
    VENUE_NOTE[resort.environment],
    'Le voyage jusqu’au lieu reste à la charge de l’artiste',
  ];
}

/**
 * The week, day by day. Eight days for seven nights; the six in the middle
 * carry two hours each, which is where the twelve hours come from.
 */
const WEEK_TEMPLATES: Record<ResidencyType, (stage: string, second: string) => string[]> = {
  residency: (stage, second) => [
    'Arrivée en fin d’après-midi, installation dans la chambre, dîner avec l’équipe de la maison. Pas de scène ce soir.',
    `Repérage et montage : ${stage}. Balances dans l’après-midi, puis deux heures de représentation après le dîner.`,
    'Matinée de travail à huis clos. Deux heures de représentation en soirée.',
    'Répétition ouverte en fin d’après-midi : les clients entrent pendant que la formation travaille. Deux heures de scène ensuite.',
    `Deux heures de représentation dans le second lieu de la maison : ${second}.`,
    'Rencontre avec les clients autour du répertoire avant le service, puis deux heures de scène.',
    'Dernière soirée, deux heures. Les douze heures de la semaine sont faites.',
    'Petit-déjeuner et départ dans la matinée. Pas de scène ce jour.',
  ],
  intimate: (stage, second) => [
    'Arrivée, installation, dîner avec la direction. Pas de scène ce soir.',
    `Accord du piano et réglage du lieu : ${stage}. Deux heures de représentation en fin de soirée, sans amplification.`,
    'Matinée de travail seul. Deux heures de représentation après le dîner, salle au noir.',
    'Écoute commentée pour une trentaine de clients en fin d’après-midi, puis deux heures de représentation.',
    `Deux heures dans le second lieu de la maison : ${second}, devant un public plus restreint.`,
    'Journée de travail sur le programme de la dernière soirée, puis deux heures de représentation.',
    'Dernière soirée, deux heures, programme choisi par l’artiste. Les douze heures sont faites.',
    'Petit-déjeuner et départ dans la matinée. Pas de scène ce jour.',
  ],
  rooftop: (stage, second) => [
    'Arrivée, installation, repérage du lieu à la tombée du jour. Pas de set ce soir.',
    `Montage de la régie : ${stage}. Calage du système, puis deux heures de set au coucher du soleil.`,
    'Deux heures au coucher du soleil, fin à la nuit tombée.',
    'Une heure d’écoute ouverte en cabine pour les clients curieux, puis deux heures de set.',
    `Deux heures dans le second lieu de la maison : ${second}.`,
    'Set en deux parties, deux heures au total, fin à une heure du matin.',
    'Dernier set de deux heures. Les douze heures de la semaine sont faites.',
    'Départ dans la matinée. Pas de set ce jour.',
  ],
  workshop: (stage, second) => [
    'Arrivée, visite de l’atelier et des espaces de travail. Pas de séance ce jour.',
    `Installation de l’atelier : ${stage}. Deux heures de séance ouverte en fin d’après-midi.`,
    'Travail personnel le matin, deux heures de séance avec les clients l’après-midi.',
    'Deux heures de séance, douze participants au maximum, matériel fourni.',
    `Séance de deux heures ailleurs dans la maison : ${second}.`,
    'Deux heures de séance, puis accrochage des pièces réalisées depuis le début de la semaine.',
    'Dernière séance de deux heures et présentation du travail aux clients. Les douze heures sont faites.',
    'Décrochage et départ dans la matinée. Pas de séance ce jour.',
  ],
};

export function residencySchedule(resort: SeedResort, type: ResidencyType) {
  const [stage, second] = resort.spots;
  return WEEK_TEMPLATES[type](stage.name, second.name).map((activity, day) => ({
    time: `Jour ${day + 1}`,
    activity,
  }));
}

/* ---- When each destination actually receives -------------------------------
 * A residency dated August in Val d'Isère, or February in Mykonos, tells a
 * hotel we have never opened their calendar. Each destination therefore carries
 * its own season as a recurring window - the Alps from mid-December to the end
 * of March, the western Mediterranean and the Greek islands across the summer,
 * the Maghreb in the shoulder months either side of it, the tropics in their
 * dry season - and the residencies of one destination are spread across it.
 *
 * The windows are month/day pairs rather than fixed dates so the seed still
 * produces upcoming residencies whenever it is run, rather than going stale on
 * a hard-coded year.
 */
type SeasonWindow = { from: [number, number]; to: [number, number] };

const SEASONS: Record<string, SeasonWindow> = {
  // Anything in the mountains, whichever country it stands in.
  alpine: { from: [12, 14], to: [3, 22] },
  France: { from: [6, 7], to: [9, 13] },
  Italy: { from: [6, 7], to: [9, 13] },
  Spain: { from: [5, 17], to: [9, 20] },
  Greece: { from: [5, 24], to: [9, 20] },
  Turkey: { from: [6, 7], to: [9, 20] },
  Portugal: { from: [5, 17], to: [9, 13] },
  Morocco: { from: [10, 5], to: [4, 26] },
  Tunisia: { from: [10, 5], to: [5, 31] },
  Egypt: { from: [10, 12], to: [4, 19] },
  Senegal: { from: [11, 9], to: [4, 26] },
  Mauritius: { from: [10, 5], to: [12, 14] },
  Seychelles: { from: [10, 5], to: [11, 30] },
  Madagascar: { from: [10, 5], to: [11, 30] },
  Maldives: { from: [12, 7], to: [4, 19] },
  Martinique: { from: [12, 7], to: [4, 19] },
  Guadeloupe: { from: [12, 7], to: [4, 19] },
  'Dominican Republic': { from: [12, 7], to: [4, 19] },
  'Turks and Caicos': { from: [12, 7], to: [4, 19] },
  Brazil: { from: [12, 7], to: [3, 22] },
  Indonesia: { from: [5, 3], to: [9, 27] },
  Thailand: { from: [11, 9], to: [4, 5] },
};

const DEFAULT_SEASON: SeasonWindow = { from: [5, 1], to: [9, 30] };
const DAY_MS = 24 * 60 * 60 * 1000;

const seasonKeyFor = (resort: SeedResort) =>
  resort.environment === 'alpine' ? 'alpine' : resort.country;

/**
 * Places one residency inside its destination's next season, spread evenly
 * against the others that share it, then falls back to the Monday on or before
 * that point: hotels count their weeks from Monday, and a seven-night stay that
 * starts on a Wednesday reads as a number somebody made up.
 */
function residencyDate(resort: SeedResort, ordinal: number, total: number, today: Date): Date {
  const window = SEASONS[seasonKeyFor(resort)] ?? DEFAULT_SEASON;
  const wraps = window.to[0] * 100 + window.to[1] <= window.from[0] * 100 + window.from[1];
  const earliest = today.getTime() + 21 * DAY_MS;

  let from = 0;
  let to = 0;
  for (let year = today.getUTCFullYear() - 1; year <= today.getUTCFullYear() + 2; year++) {
    from = Date.UTC(year, window.from[0] - 1, window.from[1]);
    to = Date.UTC(wraps ? year + 1 : year, window.to[0] - 1, window.to[1]);
    if (to > earliest) break;
  }

  const start = Math.max(from, earliest);
  const span = Math.max(to - start, 7 * DAY_MS);
  const date = new Date(start + Math.round(((ordinal + 1) / (total + 1)) * span));
  date.setUTCHours(16, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (date.getTime() < earliest) date.setUTCDate(date.getUTCDate() + 7);
  return date;
}

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Log database connection info (mask password)
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`📊 Database: ${maskedUrl.substring(0, 50)}...`);

  // ---- Retire the previous seed's rows -----------------------------------
  // Matched on literal identifiers the old seed wrote, so this can only ever
  // remove those exact rows. Anything a user created is untouched, and a
  // database that never held them reports zero.
  const RETIRED_HOTEL_EMAILS = [
    'ritz.paris@example.com',
    'aman.tokyo@example.com',
    'plaza.newyork@example.com',
    'ushuaia.ibiza@example.com'
  ];

  // Read off the previous seed file, not guessed.
  const RETIRED_TRIP_SLUGS = [
    'art-gallery-exhibitions',
    'culinary-arts',
    'live-performances',
    'rooftop-jazz-sessions',
    'sunset-photography',
    'wellness-sessions'
  ];

  const prunedTrips = await prisma.trip.deleteMany({
    where: { slug: { in: RETIRED_TRIP_SLUGS } }
  });

  // Deleting the user cascades to the hotel row (onDelete: Cascade on
  // Hotel.user), so this does not leave an orphaned hotel behind.
  const prunedHotels = await prisma.user.deleteMany({
    where: { email: { in: RETIRED_HOTEL_EMAILS } }
  });

  if (prunedTrips.count || prunedHotels.count) {
    console.log(
      `🧹 Retired ${prunedHotels.count} legacy hotel account(s) and ${prunedTrips.count} legacy trip(s)`
    );
  }

  // Create admin user
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: 'admin@travelart.test' },
    // Rotating is the whole point of a freshly generated password: without the
    // hash here, a re-seed printed a new one and left the old one working.
    update: {
      passwordHash: adminPasswordHash,
      language: 'fr',
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
    create: {
      role: 'ADMIN',
      // Seeded accounts are known-good, so they are admitted and verified
      // outright. Without this they inherit the PENDING default and nobody -
      // including this administrator - can sign in to a fresh database.
      approvalStatus: 'APPROVED',
      emailVerified: true,
      email: 'admin@travelart.test',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      country: 'France',
      language: 'fr'
    }
  });

  console.log('✅ Admin user created');

  // Create hotel users
  const hotels = RESORTS;
  const createdHotels = [];

  for (const hotelData of hotels) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // Real coordinates. These used to be hardcoded to 0,0 for every property,
    // which put all of them on Null Island and made the map look broken.
    const location = JSON.stringify({
      city: hotelData.city,
      country: hotelData.country,
      coords: { lat: hotelData.lat, lng: hotelData.lng },
      lat: hotelData.lat,
      lng: hotelData.lng
    });

    const images = JSON.stringify(ENVIRONMENT_IMAGES[hotelData.environment]);
    const performanceSpots = JSON.stringify(hotelData.spots);
    const rooms = JSON.stringify([
      { id: 'room1', name: 'Chambre double', capacity: 2 },
      { id: 'room2', name: 'Suite', capacity: 4 }
    ]);

    const user = await prisma.user.upsert({
      where: { email: hotelData.email },
      update: {
        name: hotelData.name,
        country: hotelData.country,
        passwordHash,
        approvalStatus: 'APPROVED',
        emailVerified: true,
      },
      create: {
        role: 'HOTEL',
        // Seeded accounts are known-good, so they are admitted and verified
        // outright. Without this they inherit the PENDING default and nobody -
        // including this administrator - can sign in to a fresh database.
        approvalStatus: 'APPROVED',
        emailVerified: true,
        email: hotelData.email,
        passwordHash,
        name: hotelData.name,
        country: hotelData.country,
        language: 'fr'
      }
    });

    // `update` carries the real fields rather than `{}`. With an empty update
    // a re-seed silently kept whatever was already stored, so the coordinate
    // fix would never have reached a database that had been seeded before.
    const hotel = await prisma.hotel.upsert({
      where: { userId: user.id },
      update: {
        name: hotelData.name,
        description: hotelData.description,
        location,
        // Mirrored from the same source as `location`, in the same write, so
        // the JSON and the queryable columns cannot disagree.
        latitude: hotelData.lat,
        longitude: hotelData.lng,
        contactPhone: hotelData.contactPhone,
        images,
        performanceSpots,
        rooms,
        repName: hotelData.repName
      },
      create: {
        userId: user.id,
        name: hotelData.name,
        description: hotelData.description,
        location,
        latitude: hotelData.lat,
        longitude: hotelData.lng,
        contactPhone: hotelData.contactPhone,
        images,
        performanceSpots,
        rooms,
        repName: hotelData.repName
      }
    });

    /* Credits and the entry that explains where they came from, together.
       The ledger calls itself an append-only record of every credit movement,
       and the Stripe webhook honours that - it writes a PURCHASE row in the
       same transaction as the balance. The seed did not, so every seeded
       hotel held a balance with no provenance and the ledger could never
       reconcile against it: checked across 35 hotels, the one with any
       history at all summed to -20 against a stored 40, purely because the
       opening balance was invisible.

       A grant nobody paid for is PROMOTIONAL_GRANT, which is what it is. */
    await prisma.credit.upsert({
      where: { hotelId: hotel.id },
      update: { totalCredits: 60, usedCredits: 0 },
      create: {
        hotelId: hotel.id,
        totalCredits: 60,
        usedCredits: 0
      }
    });

    const openingEntry = await prisma.creditLedger.findFirst({
      where: { hotelId: hotel.id, reason: 'PROMOTIONAL_GRANT' },
      select: { id: true }
    });
    if (!openingEntry) {
      await prisma.creditLedger.create({
        data: {
          hotelId: hotel.id,
          delta: 60,
          reason: 'PROMOTIONAL_GRANT',
          note: 'Solde initial de démonstration'
        }
      });
    }

    createdHotels.push(hotel);
  }

  console.log(`✅ ${createdHotels.length} resorts created`);

  // Create artist users
  const artists = [
    {
      email: 'artist1@example.com',
      name: 'Sophie Laurent',
      country: 'France',
      discipline: 'Piano classique',
      bio: 'Pianiste classique primée, quinze ans de scène dans les plus grandes salles européennes. Joue aussi bien en formation intime sur les toits que dans les grands salons.',
      priceRange: '€500-1000',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist2@example.com',
      name: 'Marco Silva',
      country: 'Portugal',
      discipline: 'DJ',
      bio: 'DJ international, deep house et musiques électroniques. Résident des clubs de Lisbonne et d’Ibiza. Compose ses sets pour l’heure du coucher de soleil.',
      priceRange: '€300-800',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist3@example.com',
      name: 'Yoga Master Ananda',
      country: 'Inde',
      discipline: 'Yoga',
      bio: 'Professeure de yoga certifiée, vingt ans de pratique. Séances au lever du jour sur les toits et ateliers de méditation en hôtellerie.',
      priceRange: '€200-500',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist4@example.com',
      name: 'Isabella Garcia',
      country: 'Espagne',
      discipline: 'Danse flamenco',
      bio: 'Danseuse et chorégraphe de flamenco. Spectacles traditionnels et contemporains, sur les toits comme dans les petites salles.',
      priceRange: '€400-700',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist5@example.com',
      name: 'Jean-Michel Dubois',
      country: 'France',
      discipline: 'Saxophone jazz',
      bio: 'Saxophoniste de jazz, du bebop au répertoire contemporain. Joue en petite formation, souvent en fin de soirée sur les terrasses.',
      priceRange: '€350-600',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([])
    },
    {
      email: 'artist6@example.com',
      name: 'Maria Santos',
      country: 'Portugal',
      discipline: 'Chant fado',
      bio: 'Chanteuse de fado portugais, d’une voix qui ne s’oublie pas. Répertoire traditionnel.',
      priceRange: '€250-450',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist7@example.com',
      name: 'Ahmed Benali',
      country: 'Maroc',
      discipline: 'Oud',
      bio: 'Maître du oud. Musique arabe classique et fusions contemporaines.',
      priceRange: '€300-550',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist8@example.com',
      name: 'Elena Popov',
      country: 'Russie',
      discipline: 'Danse classique',
      bio: 'Ancienne danseuse étoile du Bolchoi. Interprète aujourd’hui le répertoire contemporain et donne des masterclasses.',
      priceRange: '€600-1200',
      images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist9@example.com',
      name: 'Luca Romano',
      country: 'Italie',
      discipline: 'Chant lyrique',
      bio: 'Chanteuse lyrique, répertoire italien. A chanté sur les grandes scènes d’opéra européennes.',
      priceRange: '€800-1500',
      images: JSON.stringify([
        '/images/pillars/tout-compris.webp',
        '/images/hero/scene.webp',
        '/images/pillars/creation.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    },
    {
      email: 'artist10@example.com',
      name: 'Sarah Johnson',
      country: 'États-Unis',
      discipline: 'Atelier artisanal',
      bio: 'Animatrice d’ateliers créatifs autour de l’artisanat durable. Transmet en faisant faire.',
      priceRange: '€150-300',
      images: JSON.stringify([
        '/images/pillars/creation.webp',
        '/images/hero/ombre.webp',
        '/images/headers/experiences.webp'
      ]),
      videos: JSON.stringify([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ])
    }
  ];

  const createdArtists = [];
  for (const artistData of artists) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await prisma.user.upsert({
      where: { email: artistData.email },
      // Reconciles rather than no-ops, so the translated country reaches rows
      // that already exist. With `{}` the seed silently keeps the old value.
      update: {
        name: artistData.name,
        country: artistData.country,
        passwordHash,
        approvalStatus: 'APPROVED',
        emailVerified: true,
      },
      create: {
        role: 'ARTIST',
        // Seeded accounts are known-good, so they are admitted and verified
        // outright. Without this they inherit the PENDING default and nobody -
        // including this administrator - can sign in to a fresh database.
        approvalStatus: 'APPROVED',
        emailVerified: true,
        email: artistData.email,
        passwordHash,
        name: artistData.name,
        country: artistData.country,
        language: 'fr'
      }
    });

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      // A real update block, so re-seeding reconciles an existing artist. With
      // `{}` here the discipline translations above would never have reached a
      // database that had already been seeded.
      update: {
        bio: artistData.bio,
        discipline: artistData.discipline,
      },
      create: {
        userId: user.id,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
        membershipStatus: 'ACTIVE',
        membershipRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        images: artistData.images,
        videos: artistData.videos,
        mediaUrls: JSON.stringify([]),
        loyaltyPoints: Math.floor(Math.random() * 500) + 100
      }
    });

    // Create availability for next 6 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    // Deterministic id: one seeded availability window per artist, replaced
    // rather than duplicated on a re-run.
    await prisma.artistAvailability.upsert({
      where: { id: `seed-avail-${artist.id}` },
      update: { dateFrom: startDate, dateTo: endDate },
      create: {
        id: `seed-avail-${artist.id}`,
        artistId: artist.id,
        dateFrom: startDate,
        dateTo: endDate
      }
    });

    createdArtists.push(artist);
  }

  console.log('✅ Artists created');

  // Create sample bookings
  const bookings = [
    {
      hotelId: createdHotels[0].id,
      artistId: createdArtists[0].id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'CONFIRMED',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PAID'
    },
    {
      hotelId: createdHotels[1].id,
      artistId: createdArtists[1].id,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
      status: 'COMPLETED',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PAID'
    },
    {
      hotelId: createdHotels[2].id,
      artistId: createdArtists[2].id,
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
      status: 'PENDING',
      creditsUsed: 0, // Deprecated
      weeklyPaymentAmount: 200.0,
      numberOfWeeks: 1,
      totalPaymentAmount: 200.0,
      paymentStatus: 'PENDING'
    }
  ];

  const createdBookings = [];
  for (const [index, bookingData] of bookings.entries()) {
    const id = `seed-booking-${index}`;
    const booking = await prisma.booking.upsert({
      where: { id },
      update: bookingData,
      create: { id, ...bookingData }
    });
    createdBookings.push(booking);
  }

  console.log('✅ Bookings created');

  // Create sample ratings for completed bookings
  const ratings = [
    {
      bookingId: createdBookings[1].id,
      hotelId: createdBookings[1].hotelId,
      artistId: createdBookings[1].artistId,
      stars: 5,
      textReview: 'Prestation remarquable. Le set a tenu la salle du début à la fin, nos clients en parlent encore.',
      isVisibleToArtist: false
    }
  ];

  for (const [index, ratingData] of ratings.entries()) {
    const id = `seed-rating-${index}`;
    await prisma.rating.upsert({
      where: { id },
      update: ratingData,
      create: { id, ...ratingData }
    });
  }

  console.log('✅ Ratings created');

  // Create sample transactions
  const transactions = [
    {
      hotelId: createdHotels[0].id,
      type: 'CREDIT_PURCHASE',
      amount: 500.00
    },
    {
      hotelId: createdHotels[1].id,
      type: 'CREDIT_PURCHASE',
      amount: 300.00
    },
    {
      artistId: createdArtists[0].id,
      type: 'MEMBERSHIP',
      amount: 200.00
    }
  ];

  for (const [index, transactionData] of transactions.entries()) {
    const id = `seed-transaction-${index}`;
    await prisma.transaction.upsert({
      where: { id },
      update: transactionData,
      create: { id, ...transactionData }
    });
  }

  console.log('✅ Transactions created');

  // Add featured artists from static data
  const featuredArtists = [
    {
      email: 'elena.rodriguez@example.com',
      name: 'Elena Rodriguez',
      country: 'France',
      city: 'Paris',
      discipline: 'Saxophone jazz',
      bio: 'Saxophoniste de jazz reconnu, habitué des toits parisiens. Sessions intimistes, à la nuit tombée.',
      priceRange: '€500-1000',
      stageName: 'Elena Rodriguez',
      artisticProfile: JSON.stringify({
        mainCategory: 'Music',
        secondaryCategory: 'Jazz',
        audienceType: ['Adults', 'Couples'],
        languages: ['French', 'English', 'Spanish'],
        categoryType: 'Instrumental',
        specificCategory: 'Saxophone',
        domain: 'Concert'
      })
    },
    {
      email: 'marcus.chen@example.com',
      name: 'Marcus Chen',
      country: 'Japon',
      city: 'Tokyo',
      discipline: 'Arts visuels',
      bio: 'Artiste plasticien contemporain. Transforme les espaces d’un hôtel en parcours d’exposition immersif.',
      priceRange: '€600-1200',
      stageName: 'Marcus Chen',
      artisticProfile: JSON.stringify({
        mainCategory: 'Visual Arts',
        secondaryCategory: 'Contemporary',
        audienceType: ['Adults', 'Families'],
        languages: ['Japanese', 'English', 'Mandarin'],
        categoryType: 'Visual',
        specificCategory: 'Painting',
        domain: 'Exhibition'
      })
    },
    {
      email: 'sophie.laurent@example.com',
      name: 'Sophie Laurent',
      country: 'États-Unis',
      city: 'New York',
      discipline: 'Photographie',
      bio: 'Photographe primée, ateliers autour de la lumière du soir. Travaille les lieux autant que les visages.',
      priceRange: '€400-800',
      stageName: 'Sophie Laurent',
      artisticProfile: JSON.stringify({
        mainCategory: 'Photography',
        secondaryCategory: 'Portrait',
        audienceType: ['Adults', 'Couples'],
        languages: ['English', 'French'],
        categoryType: 'Photography',
        specificCategory: 'Portrait Photography',
        domain: 'Workshop'
      })
    },
    {
      email: 'david.kim@example.com',
      name: 'David Kim',
      country: 'Espagne',
      city: 'Ibiza',
      discipline: 'DJ et production',
      bio: 'DJ et producteur international. Résident de clubs réputés, spécialiste de la deep house.',
      priceRange: '€800-1500',
      stageName: 'David Kim',
      artisticProfile: JSON.stringify({
        mainCategory: 'Music',
        secondaryCategory: 'Electronic',
        audienceType: ['Adults', 'Young Adults'],
        languages: ['English', 'Spanish', 'Korean'],
        categoryType: 'DJ',
        specificCategory: 'Electronic Music',
        domain: 'Concert'
      })
    }
  ];

  for (const artistData of featuredArtists) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await prisma.user.upsert({
      where: { email: artistData.email },
      // Reconciles rather than no-ops, so the translated country reaches rows
      // that already exist. With `{}` the seed silently keeps the old value.
      update: {
        name: artistData.name,
        country: artistData.country,
        passwordHash,
        approvalStatus: 'APPROVED',
        emailVerified: true,
      },
      create: {
        role: 'ARTIST',
        // Seeded accounts are known-good, so they are admitted and verified
        // outright. Without this they inherit the PENDING default and nobody -
        // including this administrator - can sign in to a fresh database.
        approvalStatus: 'APPROVED',
        emailVerified: true,
        email: artistData.email,
        passwordHash,
        name: artistData.name,
        country: artistData.country,
        language: 'fr'
      }
    });

    const artist = await prisma.artist.upsert({
      where: { userId: user.id },
      // The last upsert still passing `{}`. Its source carried the translated
      // disciplines all along; they simply never reached an existing row.
      update: {
        stageName: artistData.stageName,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
      },
      create: {
        userId: user.id,
        stageName: artistData.stageName,
        bio: artistData.bio,
        discipline: artistData.discipline,
        priceRange: artistData.priceRange,
        membershipStatus: 'ACTIVE',
        membershipRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        images: JSON.stringify([
        '/images/headers/experiences.webp',
        '/images/pillars/residence.webp',
        '/images/pillars/tout-compris.webp'
      ]),
        videos: JSON.stringify([]),
        mediaUrls: JSON.stringify([]),
        artisticProfile: artistData.artisticProfile,
        loyaltyPoints: Math.floor(Math.random() * 500) + 100
      }
    });

    // Create availability if it doesn't exist
    const existingAvailability = await prisma.artistAvailability.findFirst({
      where: { artistId: artist.id }
    });

    if (!existingAvailability) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      await prisma.artistAvailability.upsert({
        where: { id: `seed-avail-${artist.id}` },
        update: { dateFrom: startDate, dateTo: endDate },
        create: {
          id: `seed-avail-${artist.id}`,
          artistId: artist.id,
          dateFrom: startDate,
          dateTo: endDate
        }
      });
    }
  }

  console.log('✅ Featured artists created');


  // Add immersive experiences (Trips)
  // One residency per resort, built from the resort record itself. The map on
  // the experiences page plots trips, so this is what actually puts thirty-five
  // pins on it - previously there were eight trips across four cities, and the
  // hotels they belonged to were all sitting at 0,0 anyway.
  const RESIDENCY_TYPES: ResidencyType[] = ['residency', 'intimate', 'rooftop', 'workshop'];

  const slugify = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // How many residencies share each season, so each one can take its own place
  // inside the window rather than all landing on the same week.
  const seasonTotals = new Map<string, number>();
  for (const resort of RESORTS) {
    const key = seasonKeyFor(resort);
    seasonTotals.set(key, (seasonTotals.get(key) ?? 0) + 1);
  }
  const seasonSeen = new Map<string, number>();
  const today = new Date();

  const experiences = RESORTS.map((resort, index) => {
    const headline = resort.spots[0];
    const type = RESIDENCY_TYPES[index % RESIDENCY_TYPES.length];
    const artist = createdArtists.length
      ? createdArtists[index % createdArtists.length]
      : null;
    const hotel = createdHotels[index] ?? null;

    // Each destination opens in its own season, and the residencies of one
    // destination are spread across it rather than stacked on one date.
    const seasonKey = seasonKeyFor(resort);
    const ordinal = seasonSeen.get(seasonKey) ?? 0;
    seasonSeen.set(seasonKey, ordinal + 1);
    const start = residencyDate(resort, ordinal, seasonTotals.get(seasonKey) ?? 1, today);

    return {
      title: `Résidence — ${resort.city}`,
      slug: `residence-${slugify(resort.city)}-${slugify(resort.name)}`.slice(0, 80),
      description:
        `${resort.description} La résidence occupe ${headline.name} : ${headline.description.toLowerCase()}`,
      priceFrom: 0,
      priceTo: 0,
      location: JSON.stringify({
        city: resort.city,
        country: resort.country,
        lat: resort.lat,
        lng: resort.lng
      }),
      latitude: resort.lat,
      longitude: resort.lng,
      images: JSON.stringify(ENVIRONMENT_IMAGES[resort.environment]),
      status: 'PUBLISHED',
      type,
      rating: Number((4.3 + ((index * 7) % 7) / 10).toFixed(1)),
      date: start,
      // The published terms. Identical on all thirty-five, because they are the
      // programme's terms rather than this property's.
      duration: '7 nuits',
      capacity: `${VENUE_KIND[headline.type]} — ${headline.capacity} personnes`,
      includes: JSON.stringify(residencyIncludes(resort, type)),
      schedule: JSON.stringify(residencySchedule(resort, type)),
      artistId: artist ? artist.id : null,
      hotelId: hotel ? hotel.id : null
    };
  });

  for (const experienceData of experiences) {
    // A real `update` block, so re-seeding reconciles an existing row instead
    // of leaving whatever was written the first time.
    const payload = {
      title: experienceData.title,
      description: experienceData.description,
      priceFrom: experienceData.priceFrom,
      priceTo: experienceData.priceTo,
      location: experienceData.location,
      latitude: experienceData.latitude,
      longitude: experienceData.longitude,
      images: experienceData.images,
      status: experienceData.status,
      type: experienceData.type,
      rating: experienceData.rating,
      date: experienceData.date,
      duration: experienceData.duration,
      capacity: experienceData.capacity,
      includes: experienceData.includes,
      schedule: experienceData.schedule,
      artistId: experienceData.artistId,
      hotelId: experienceData.hotelId
    };

    await prisma.trip.upsert({
      where: { slug: experienceData.slug },
      update: payload,
      create: { slug: experienceData.slug, ...payload }
    });
  }

  console.log(`✅ ${experiences.length} residencies created`);

  // Credit packages. These existed only as rows somebody inserted by hand: no
  // migration and no seed created them, so a fresh database served an empty
  // purchase page. Keyed by slug, which is what the checkout route looks up.
  // Kept in step with prisma/seed-packages.ts by hand: two seed entry points
  // upsert the same slugs, so a name that only changed here would be
  // reverted the next time the other one runs.
  const CREDIT_PACKAGES = [
    { slug: 'starter', name: 'Découverte', credits: 10, bonusCredits: 0, priceCents: 150000, sortOrder: 1 },
    { slug: 'professional', name: 'Résidence', credits: 25, bonusCredits: 4, priceCents: 350000, sortOrder: 2 },
    { slug: 'enterprise', name: 'Année', credits: 50, bonusCredits: 10, priceCents: 650000, sortOrder: 3 },
  ];

  for (const pack of CREDIT_PACKAGES) {
    await prisma.creditPackage.upsert({
      where: { slug: pack.slug },
      update: {
        name: pack.name,
        credits: pack.credits,
        bonusCredits: pack.bonusCredits,
        priceCents: pack.priceCents,
        sortOrder: pack.sortOrder,
        currency: 'EUR',
        active: true,
      },
      create: { ...pack, currency: 'EUR', active: true },
    });
  }
  console.log(`✅ ${CREDIT_PACKAGES.length} credit packages reconciled`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Accounts created:');
  console.log('  admin@travelart.test  (ADMIN)');
  console.log('  hotel1-5@example.com, ritz.paris@, aman.tokyo@, plaza.newyork@, ushuaia.ibiza@  (HOTEL)');
  console.log('  artist1-10@example.com, elena.rodriguez@, marcus.chen@, sophie.laurent@, david.kim@  (ARTIST)');

  if (passwordsWereGenerated) {
    // Printed once, to this terminal only. Never commit these.
    console.log('\n🔑 Generated passwords for this run:');
    console.log(`  admin:  ${ADMIN_PASSWORD}`);
    console.log(`  demo:   ${DEMO_PASSWORD}`);
    console.log('\n  Set SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD to choose your own.');
  } else {
    console.log('\n🔑 Passwords taken from SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD.');
  }
}

/* Only seed when this file is the thing being run. The residency-term
   generators above are imported by backfill-residency-terms.ts, and before
   this guard existed that import would have re-seeded the entire database as
   a side effect of loading them. */
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
