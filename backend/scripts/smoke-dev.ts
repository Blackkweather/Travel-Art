/**
 * Smoke test of a running API against whatever database it is connected to.
 * Read-only apart from nothing: it never writes. Signs a session for an
 * existing admitted hotel and artist and calls the routes the dashboards use.
 *
 *   npx tsx scripts/smoke-dev.ts http://localhost:4200
 */
import { prismaAdmin } from '../src/db';
import { tokens } from '../src/services/tokens';

const base = process.argv[2] || 'http://localhost:4200';

async function call(path: string, token?: string, init: RequestInit = {}) {
  const res = await fetch(base + '/api' + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body: any = await res.json().catch(() => null);
  return { status: res.status, body };
}

const results: string[] = [];
const check = (ok: boolean, label: string) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);

(async () => {
  const hotelUser = await prismaAdmin.user.findFirst({ where: { role: 'HOTEL', approvalStatus: 'APPROVED', isActive: true, hotel: { bookings: { some: {} } } }, select: { id: true, role: true } });
  const artistUser = await prismaAdmin.user.findFirst({ where: { role: 'ARTIST', approvalStatus: 'APPROVED', isActive: true }, select: { id: true, role: true } });
  const hotel = tokens.session.sign(hotelUser!);
  const artist = tokens.session.sign(artistUser!);

  check((await call('/health')).status === 200, 'health');
  const stats = await call('/stats');
  check(stats.status === 200 && stats.body.data.totalHotels > 0, `public stats (${stats.body?.data?.totalHotels} hotels, ${stats.body?.data?.totalArtists} artists)`);

  const me = await call('/hotels/me', hotel);
  check(me.status === 200 && Array.isArray(me.body.data.performanceSpots), `hotel profile with spaces (${me.body?.data?.performanceSpots?.length})`);
  const bookings = await call('/bookings', hotel);
  check(bookings.status === 200 && bookings.body.data.bookings.length > 0, `hotel bookings through row-level security (${bookings.body?.data?.bookings?.length})`);
  const credits = await call(`/hotels/${me.body.data.id}/credits`, hotel);
  check(credits.status === 200, `hotel credits (${credits.body?.data?.availableCredits} available)`);

  const list = await call('/artists?limit=50', hotel);
  check(list.status === 200 && list.body.data.artists.length > 0, `artist browse (${list.body?.data?.artists?.length})`);
  check(!JSON.stringify(list.body).includes('birthDate') && !JSON.stringify(list.body).includes('referralCode'), 'browse carries no private fields');
  check(list.body.data.artists.some((a: any) => a.images.length > 0), 'artists still have their photos after the migration');

  const own = await call('/artists/me', artist);
  check(own.status === 200, 'artist own profile');
  check((await call('/top?type=hotels&limit=5', artist)).status === 200, 'top hotels');
  check((await call('/trips', artist)).body?.data?.trips?.length > 0, 'experiences');
  check((await call('/testimonials')).status === 200, 'testimonials');

  const junk = await call('/auth/register', undefined, { method: 'POST', body: JSON.stringify({ role: 'ARTIST', email: 'test@test.com' }) });
  check(junk.status === 400 && Boolean(junk.body.error.fields?.email), 'registration refuses junk, field by field');

  const legacy = await call('/auth/me', tokens.passwordReset.sign({ id: hotelUser!.id, passwordHash: 'x' }));
  check(legacy.status === 401, 'a reset link is not a session');

  console.log(results.join('\n'));
  await prismaAdmin.$disconnect();
  if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
})();
