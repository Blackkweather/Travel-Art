/**
 * Seeds the credit packages that hotels buy.
 *
 * These figures are the authoritative ones, confirmed by the business:
 * €1,500 / €3,500 / €6,500. The API previously served €49.99 / €129.99 /
 * €399.99 from a hardcoded array while the pricing page advertised these,
 * so a hotel was quoted thirty times what the backend would have charged.
 *
 * Prices live here and only here. Nothing in the frontend or in a route may
 * hardcode them again: read them from this table.
 *
 * Money is stored in integer cents. €1,500.00 is 150000, never 1500.0 as a
 * float, so no rounding drift can reach an invoice.
 *
 * Idempotent: keyed on slug, so re-running updates rather than duplicating.
 *
 * Run with: npm run seed:packages
 */
import { prisma } from '../src/db';

const PACKAGES = [
  {
    slug: 'starter',
    name: 'Starter Package',
    credits: 10,
    bonusCredits: 0,
    priceCents: 150_000, // €1,500.00
    sortOrder: 1,
  },
  {
    slug: 'professional',
    name: 'Professional Package',
    credits: 25,
    bonusCredits: 4,
    priceCents: 350_000, // €3,500.00
    sortOrder: 2,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise Package',
    credits: 50,
    bonusCredits: 10,
    priceCents: 650_000, // €6,500.00
    sortOrder: 3,
  },
];

async function main() {
  for (const pkg of PACKAGES) {
    const saved = await prisma.creditPackage.upsert({
      where: { slug: pkg.slug },
      update: { ...pkg, active: true },
      create: { ...pkg, active: true, currency: 'EUR' },
    });

    const totalCredits = saved.credits + saved.bonusCredits;
    const perCredit = saved.priceCents / totalCredits / 100;

    console.log(
      `${saved.name.padEnd(22)}` +
        `${String(saved.credits).padStart(3)} credits` +
        `${saved.bonusCredits ? ` +${String(saved.bonusCredits).padStart(2)} bonus` : '          '}  ` +
        `€${(saved.priceCents / 100).toLocaleString('en-IE')}`.padEnd(10) +
        `  effective €${perCredit.toFixed(2)}/credit`
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Failed to seed credit packages:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
