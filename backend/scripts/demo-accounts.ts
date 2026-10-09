/**
 * Demo accounts for showing the platform: one admin, one hotel, one artist,
 * all admitted and confirmed, so they can sign in straight away.
 *
 *   npx tsx scripts/demo-accounts.ts <output.json>
 *
 * Runs against DATABASE_URL (the owner connection). Safe to run again: the
 * accounts are found by e-mail, and a run gives them fresh passwords. The
 * passwords are written only to <output.json> - keep that file out of git.
 *
 * The addresses are @example.com on purpose: that domain is reserved and
 * receives no mail, so nothing the platform sends these accounts reaches a
 * stranger.
 */
import crypto from 'crypto';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { prismaAdmin as prisma } from '../src/db';
import { nameKey } from '../src/shared/validation';
import { hotelKey } from '../src/services/identity';
import { newVerificationCode } from '../src/services/videoVerification';

const out = process.argv[2];
if (!out) {
  console.error('usage: npx tsx scripts/demo-accounts.ts <output.json>');
  process.exit(1);
}

/** 20 characters with every class the password rule asks for. */
function password(): string {
  const pick = (set: string, n: number) => Array.from(crypto.randomBytes(n), (b) => set[b % set.length]).join('');
  const chars = pick('ABCDEFGHJKMNPQRSTUVWXYZ', 4) + pick('abcdefghjkmnpqrstuvwxyz', 8) + pick('23456789', 4) + pick('!@#%*-_+', 4);
  return Array.from(chars).sort(() => crypto.randomInt(3) - 1).join('');
}

const now = new Date();
const inDays = (d: number) => new Date(now.getTime() + d * 86400000);

const ACCOUNTS = {
  admin: { email: 'admin.demo@example.com', name: 'Admin Démo' },
  hotel: { email: 'hotel.demo@example.com', name: 'Riad Démo Marrakech' },
  artist: { email: 'artist.demo@example.com', name: 'Salma Démo', stageName: 'Salma Démo Yoga' },
};

async function upsertUser(email: string, name: string, role: 'ADMIN' | 'HOTEL' | 'ARTIST', plain: string) {
  const passwordHash = await bcrypt.hash(plain, 12);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      passwordHash,
      country: 'Morocco',
      approvalStatus: 'APPROVED',
      reviewedAt: now,
      emailVerified: true,
      emailVerifiedAt: now,
      isActive: true,
      acceptedTermsAt: now,
      acceptedTermsVersion: 'demo',
    },
    // A rerun resets the password and signs out any old session.
    update: { passwordHash, approvalStatus: 'APPROVED', emailVerified: true, isActive: true, sessionsValidFrom: now },
    select: { id: true },
  });
}

(async () => {
  const pw = { admin: password(), hotel: password(), artist: password() };

  await upsertUser(ACCOUNTS.admin.email, ACCOUNTS.admin.name, 'ADMIN', pw.admin);

  // ---------------------------------------------------------------- hotel
  const hotelUser = await upsertUser(ACCOUNTS.hotel.email, ACCOUNTS.hotel.name, 'HOTEL', pw.hotel);
  const hotel = await prisma.hotel.upsert({
    where: { userId: hotelUser.id },
    create: {
      userId: hotelUser.id,
      name: ACCOUNTS.hotel.name,
      nameKey: hotelKey(ACCOUNTS.hotel.name, 'Marrakech'),
      description: 'Un riad de douze chambres au cœur de la médina, avec un toit-terrasse face à l’Atlas et un patio où l’on dîne aux bougies.',
      city: 'Marrakech',
      country: 'Morocco',
      address: 'Derb Démo, Médina, Marrakech',
      latitude: 31.6295,
      longitude: -7.9811,
      hotelType: 'Riad',
      roomCount: 12,
      repName: 'Nadia Démo',
      responsibleName: 'Nadia Démo',
      responsibleEmail: ACCOUNTS.hotel.email,
      programme: { create: { audiences: ['Adultes'], hasStage: true, hasSound: true, offersLodging: true, offersMeals: true } },
      spaces: {
        create: [
          { name: 'Toit-terrasse', type: 'rooftop', setting: 'OUTDOOR', capacity: 40, description: 'Vue sur l’Atlas au coucher du soleil.', position: 0 },
          { name: 'Patio', type: 'lounge', setting: 'INDOOR', capacity: 25, description: 'Fontaine, zellige et lumière tamisée.', position: 1 },
        ],
      },
    },
    update: {},
    select: { id: true },
  });
  // Enough credits to book several residencies during the demo.
  await prisma.credit.upsert({
    where: { hotelId: hotel.id },
    create: { hotelId: hotel.id, totalCredits: 50, usedCredits: 0 },
    update: { totalCredits: { increment: 0 } },
  });

  // --------------------------------------------------------------- artist
  const artistUser = await upsertUser(ACCOUNTS.artist.email, ACCOUNTS.artist.name, 'ARTIST', pw.artist);
  const existing = await prisma.artist.findUnique({ where: { userId: artistUser.id }, select: { id: true } });
  if (!existing) {
    await prisma.artist.create({
      data: {
        userId: artistUser.id,
        stageName: ACCOUNTS.artist.stageName,
        stageNameKey: nameKey(ACCOUNTS.artist.stageName),
        birthDate: new Date('1992-04-18'),
        bio: 'Professeure de yoga et de méditation, elle guide des séances au lever du soleil, en plein air, ouvertes à tous les niveaux.',
        referralCode: `DEMO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        mainCategory: 'Bien-être',
        categoryType: 'Bien-être',
        specificCategory: 'Yoga',
        discipline: 'Bien-être - Yoga',
        audienceTypes: ['Adultes'],
        languages: ['Français', 'Anglais'],
        verificationCode: newVerificationCode(),
        availability: { create: { dateFrom: now, dateTo: inDays(365) } },
      },
    });
  }

  const result = {
    site: 'https://travel-art.vercel.app/login',
    createdAt: now.toISOString(),
    note: 'Demo accounts. Never commit or share this file publicly. Re-running scripts/demo-accounts.ts gives new passwords.',
    admin: { email: ACCOUNTS.admin.email, password: pw.admin },
    hotel: { email: ACCOUNTS.hotel.email, password: pw.hotel, name: ACCOUNTS.hotel.name, credits: 50 },
    artist: { email: ACCOUNTS.artist.email, password: pw.artist, stageName: ACCOUNTS.artist.stageName },
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  console.log(`3 accounts ready; credentials written to ${out}`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
