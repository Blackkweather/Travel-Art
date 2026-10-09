import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';
import { prismaAdmin } from '../db';
import { tokens } from '../services/tokens';
import { nameKey } from '../shared/validation';
import { hotelKey } from '../services/identity';

export const api = () => request(app);

export const PASSWORD = 'Sup3r-Secret!';
let passwordHash: string | undefined;
const hash = async () => (passwordHash ??= await bcrypt.hash(PASSWORD, 4));

/** Empty every table, keeping the schema. */
export async function resetDb() {
  const tables = await prismaAdmin.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prismaAdmin.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;
let phoneCounter = 1000000;
/** A valid, never-repeated Moroccan mobile number. */
export const nextPhone = () => `+21261${String(++phoneCounter).padStart(7, "0")}`;
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

interface ArtistOptions {
  approved?: boolean;
  verified?: boolean;
  phone?: string;
  stageName?: string;
  availableDays?: number;
}

export async function makeArtist(opts: ArtistOptions = {}) {
  const id = unique();
  const stageName = opts.stageName ?? `Artiste ${id}`;
  const user = await prismaAdmin.user.create({
    data: {
      email: `artist-${id}@gmail.com`,
      name: `Prénom Nom ${id}`,
      passwordHash: await hash(),
      role: 'ARTIST',
      approvalStatus: opts.approved === false ? 'PENDING' : 'APPROVED',
      emailVerified: opts.verified ?? opts.approved !== false,
      phone: opts.phone ?? '+212612000000',
      phoneE164: null,
      country: 'Morocco',
      artist: {
        create: {
          stageName,
          stageNameKey: nameKey(stageName),
          birthDate: new Date('1994-05-12'),
          referralCode: `REF-${id}`.toUpperCase(),
          mainCategory: 'Bien-être',
          categoryType: 'Bien-être',
          specificCategory: 'Yoga',
          discipline: 'Bien-être - Yoga',
          bookingCreditCost: 5,
          availability: {
            create: { dateFrom: new Date(Date.now() - 86400000), dateTo: new Date(Date.now() + (opts.availableDays ?? 120) * 86400000) },
          },
        },
      },
    },
    select: { id: true, email: true, role: true, artist: { select: { id: true, referralCode: true } } },
  });
  return { user, artistId: user.artist!.id, token: tokens.session.sign(user) };
}

export async function makeHotel(opts: { credits?: number; approved?: boolean } = {}) {
  const id = unique();
  const name = `Hôtel ${id}`;
  const user = await prismaAdmin.user.create({
    data: {
      email: `hotel-${id}@hotel-example.ma`,
      name,
      passwordHash: await hash(),
      role: 'HOTEL',
      approvalStatus: opts.approved === false ? 'PENDING' : 'APPROVED',
      emailVerified: true,
      country: 'Morocco',
      hotel: {
        create: {
          name,
          nameKey: hotelKey(name, 'Marrakech'),
          city: 'Marrakech',
          country: 'Morocco',
          contactPhone: '+212524000000',
          responsibleEmail: `contact-${id}@hotel-example.ma`,
          credits: { create: { totalCredits: opts.credits ?? 50, usedCredits: 0 } },
        },
      },
    },
    select: { id: true, email: true, role: true, hotel: { select: { id: true } } },
  });
  return { user, hotelId: user.hotel!.id, token: tokens.session.sign(user) };
}

export async function makeAdmin() {
  const user = await prismaAdmin.user.create({
    data: {
      email: `admin-${unique()}@travelart.ma`,
      name: 'Admin Test',
      passwordHash: await hash(),
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
    select: { id: true, email: true, role: true },
  });
  return { user, token: tokens.session.sign(user) };
}

export const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export function bookingBody(hotelId: string, artistId: string, startDay = 10, endDay = 15) {
  return {
    hotelId,
    artistId,
    startDate: daysFromNow(startDay),
    endDate: daysFromNow(endDay),
    boardType: 'FULL_BOARD',
    transportTerms: 'HOTEL_PAYS',
    performanceDescription: 'Trois cours de yoga au lever du soleil sur le rooftop.',
    companionName: 'Sam Dupont',
    stayValue: 1200,
    performanceValue: 900,
  };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export function artistRegistration(overrides: Record<string, unknown> = {}) {
  const id = unique();
  return {
    role: 'ARTIST',
    firstName: 'Salma',
    lastName: 'Bennani',
    stageName: `Salma Yoga ${id}`,
    birthDate: '12/05/1994',
    mainCategory: 'Bien-être',
    categoryType: 'Bien-être',
    specificCategory: 'Yoga',
    audienceTypes: ['Adultes'],
    languages: ['Français'],
    videoUrls: [`https://youtu.be/${`v${id}`.padEnd(11, 'x').slice(0, 11)}`],
    email: `salma.${id}@gmail.com`,
    password: PASSWORD,
    phone: nextPhone(),
    country: 'Morocco',
    acceptTerms: true,
    ...overrides,
  };
}

export { prismaAdmin, tokens };
