/**
 * Read-only: artist and hotel accounts whose e-mail is a Gmail address.
 *   npx tsx scripts/list-gmail-accounts.ts
 */
import { prismaAdmin as prisma } from '../src/db';

(async () => {
  const rows = await prisma.user.findMany({
    where: { role: { in: ['ARTIST', 'HOTEL'] }, email: { endsWith: '@gmail.com' } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      artist: { select: { stageName: true, discipline: true } },
      hotel: { select: { name: true, city: true } },
    },
  });
  for (const r of rows) {
    const label = r.role === 'ARTIST' ? r.artist?.stageName || r.name : `${r.hotel?.name ?? r.name}${r.hotel?.city ? ` (${r.hotel.city})` : ''}`;
    console.log(
      [r.role, r.email, label, r.role === 'ARTIST' ? r.artist?.discipline ?? '' : '', r.approvalStatus, r.emailVerified ? 'email confirmed' : 'email NOT confirmed', r.isActive ? '' : 'SUSPENDED', r.createdAt.toISOString().slice(0, 10)]
        .filter(Boolean)
        .join(' | ')
    );
  }
  console.log(`total: ${rows.length}`);
  await prisma.$disconnect();
})();
