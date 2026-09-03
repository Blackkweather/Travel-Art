/**
 * Generate frontend/public/sitemap.xml from the routes and the database.
 *
 * robots.txt has advertised a sitemap since before this existed; the URL
 * returned 404. This writes the real thing: the static public routes, plus one
 * entry for every published trip, every resort and every artist - about 100
 * URLs that a crawler currently has no way to discover, because the app is a
 * single-page bundle and none of those pages is linked from a crawlable
 * <a href> until React has run.
 *
 * Only public content is listed. Everything robots.txt disallows is excluded
 * here too, so the two files cannot disagree - a sitemap that advertises a
 * disallowed URL is a contradiction crawlers report as an error.
 *
 * Run:  SITE_URL=https://travel-art.vercel.app npx tsx prisma/rls/generate-sitemap.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const SITE = (process.env.SITE_URL || 'https://travel-art.vercel.app').replace(/\/$/, '');
const OUT = path.join(__dirname, '../../../frontend/public/sitemap.xml');

interface Entry {
  loc: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  lastmod?: string;
}

/** Static routes. Auth and dashboard paths are deliberately absent. */
const STATIC: Entry[] = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/experiences', changefreq: 'daily', priority: '0.9' },
  { loc: '/top-artists', changefreq: 'daily', priority: '0.9' },
  { loc: '/top-hotels', changefreq: 'daily', priority: '0.9' },
  { loc: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
  { loc: '/partners', changefreq: 'weekly', priority: '0.7' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/cookies', changefreq: 'yearly', priority: '0.3' },
];

/** XML text escaping. Ids are cuids, but a URL builder should never assume. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const iso = (d: Date | null | undefined) =>
  d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;

async function main() {
  const entries: Entry[] = [...STATIC];

  // Only PUBLISHED trips. A draft in a sitemap is a 404 waiting to be crawled.
  const trips = await prisma.trip.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
  });
  for (const t of trips) {
    entries.push({
      loc: `/experience/${t.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: iso(t.updatedAt),
    });
  }

  const hotels = await prisma.hotel.findMany({ select: { id: true, createdAt: true } });
  for (const h of hotels) {
    entries.push({
      loc: `/hotel/${h.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: iso(h.createdAt),
    });
  }

  // Only artists whose account is admitted and active. Listing a pending or
  // rejected applicant would publish the fact that they applied.
  const artists = await prisma.artist.findMany({
    where: { user: { approvalStatus: 'APPROVED', isActive: true } },
    select: { id: true, createdAt: true },
  });
  for (const a of artists) {
    entries.push({
      loc: `/artist/${a.id}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: iso(a.createdAt),
    });
  }

  const body = entries
    .map((e) => {
      const lines = [
        `    <loc>${esc(SITE + e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
      ].filter(Boolean);
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    })
    .join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</urlset>\n';

  fs.writeFileSync(OUT, xml, 'utf8');

  console.log(`sitemap written: ${OUT}`);
  console.log(`  static      ${STATIC.length}`);
  console.log(`  experiences ${trips.length}`);
  console.log(`  resorts     ${hotels.length}`);
  console.log(`  artists     ${artists.length}`);
  console.log(`  total       ${entries.length} URLs`);
  console.log(`  base        ${SITE}`);
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
