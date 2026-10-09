/**
 * Render a sample convention to a PDF, with made-up parties, to check the
 * layout by eye: `npx tsx scripts/sample-convention.ts out.pdf [draft]`.
 * Touches no database.
 */
import fs from 'fs';
import { buildConvention, type ConventionInput, type SignatureInput } from '../src/services/convention';
import { renderConventionPdf } from '../src/services/conventionPdf';

const input: ConventionInput = {
  id: 'cmsample0000example1234',
  startDate: new Date('2026-11-12T14:00:00Z'),
  endDate: new Date('2026-11-17T10:00:00Z'),
  companionName: 'Inès Haddad',
  boardType: 'HALF_BOARD',
  transportTerms: 'ARTIST_PAYS',
  transportNotes: 'Vol Paris–Marrakech à la charge de l’artiste',
  performanceDescription: 'Trois séances de yoga au lever du soleil sur la terrasse, ouvertes aux clients de l’hôtel.',
  performanceSchedule: '7h – 8h, du vendredi au dimanche',
  stayValueCents: 150000,
  performanceValueCents: 150000,
  currency: 'EUR',
  roomType: 'Suite Atlas, vue jardin',
  includedServices: 'accès au spa ; transfert aéroport aller-retour',
  performanceLocation: 'Terrasse panoramique',
  performanceDuration: '3 heures au total',
  technicalConditions: 'Tapis fournis par l’hôtel, enceinte Bluetooth',
  socialContent: '1 reel Instagram et 3 stories mentionnant @hotel',
  hotel: {
    name: 'Riad Example',
    city: 'Marrakech',
    country: 'MA',
    address: '12 derb Example, Médina, Marrakech',
    legalName: 'Riad Example SARL',
    legalForm: 'SARL',
    registrationNumber: 'RC 123456',
    taxId: 'ICE 001234567000089',
    signatoryName: 'Karim Example',
    signatoryTitle: 'Gérant',
    repName: null,
  },
  artist: { stageName: 'Salma Yoga', discipline: 'Yoga', user: { name: 'Salma Bennani', email: 'salma@example.com', phone: '+33612345678' } },
};

const draft = process.argv[3] === 'draft';
const now = new Date('2026-10-09T10:30:00Z');
const signatures: SignatureInput[] = draft
  ? []
  : [
      { party: 'HOTEL', signerName: 'Karim Example', signerTitle: 'Gérant', identity: {}, signedAt: now },
      { party: 'PARTICIPANT', signerName: 'Salma Bennani', signerTitle: null, identity: { fullName: 'Salma Bennani', address: '4 rue Exemple, 75011 Paris', idDocument: 'AB123456' }, signedAt: now },
      { party: 'COORDINATOR', signerName: 'Travel Art', signerTitle: null, identity: {}, signedAt: now },
    ];

(async () => {
  const doc = buildConvention(input, signatures, draft ? null : now);
  const pdf = await renderConventionPdf(doc, { draft });
  fs.writeFileSync(process.argv[2] || 'sample-convention.pdf', pdf);
  console.log(`${doc.reference} ${pdf.length} bytes, hash ${doc.termsHash.slice(0, 12)}…`);
})();
