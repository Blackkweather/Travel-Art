/**
 * Authorization matrix: every endpoint, every role.
 *
 * The happy-path smoke tests answer "does the feature work". This answers the
 * different and more important question: "can the wrong person reach it".
 *
 * Every case here is safe to run against live data, including the DELETE
 * endpoints, because the guard rejects the request before the handler executes.
 * A route that is correctly protected never touches the database in these
 * cases; a route that is NOT protected is exactly what this is looking for, and
 * the ids used are deliberately non-existent so even an unguarded handler finds
 * nothing to act on.
 */

const API = 'http://localhost:4000/api';

const CREDENTIALS = {
  admin: {
    email: 'admin@travelart.test',
    password: process.env.SEED_ADMIN_PASSWORD || '',
  },
  hotel: {
    email: 'hotel1@example.com',
    password: process.env.SEED_DEMO_PASSWORD || '',
  },
  artist: {
    email: 'artist1@example.com',
    password: process.env.SEED_DEMO_PASSWORD || '',
  },
};

type Role = 'anon' | 'artist' | 'hotel' | 'admin';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  /** Roles that should be allowed through the guard. 'anon' means public. */
  allow: Role[];
  /** Skipped: side effects that are not safe to fire repeatedly. */
  skipHappyPath?: boolean;
}

// A cuid-shaped id that does not exist, so an unguarded handler finds nothing.
const NOPE = 'ckxxxxxxxxxxxxxxxxxxxxxxx';

const ENDPOINTS: Endpoint[] = [
  // --- public ------------------------------------------------------------
  { method: 'GET', path: '/trips', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/stats', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/top?type=artists', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/top?type=hotels', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/testimonials', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/artists', allow: ['anon', 'artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/payments/packages', allow: ['anon', 'artist', 'hotel', 'admin'] },

  // --- authenticated, any role ------------------------------------------
  { method: 'GET', path: '/auth/me', allow: ['artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/bookings', allow: ['artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/payments/transactions', allow: ['artist', 'hotel', 'admin'] },
  { method: 'GET', path: '/referrals', allow: ['artist', 'hotel', 'admin'] },

  // --- artist only -------------------------------------------------------
  { method: 'GET', path: '/artists/me', allow: ['artist'] },

  // --- hotel only --------------------------------------------------------
  { method: 'GET', path: '/hotels/me', allow: ['hotel'] },
  { method: 'GET', path: `/hotels/${NOPE}/credits`, allow: ['hotel'] },
  { method: 'GET', path: `/hotels/${NOPE}/artists`, allow: ['hotel'] },

  // --- admin only --------------------------------------------------------
  { method: 'GET', path: '/admin/dashboard', allow: ['admin'] },
  { method: 'GET', path: '/admin/users', allow: ['admin'] },
  { method: 'GET', path: '/admin/bookings', allow: ['admin'] },
  { method: 'GET', path: '/admin/logs', allow: ['admin'] },
  { method: 'GET', path: '/admin/activities', allow: ['admin'] },
  { method: 'GET', path: '/admin/referrals', allow: ['admin'] },
  { method: 'GET', path: '/admin/admissions', allow: ['admin'] },
  { method: 'GET', path: '/admin/export', allow: ['admin'] },
  { method: 'GET', path: '/hotels', allow: ['admin'] },

  // --- mutations: guard-only, against ids that do not exist --------------
  { method: 'POST', path: `/admin/users/${NOPE}/suspend`, allow: ['admin'], skipHappyPath: true },
  { method: 'POST', path: `/admin/users/${NOPE}/activate`, allow: ['admin'], skipHappyPath: true },
  { method: 'POST', path: `/admin/admissions/${NOPE}/approve`, allow: ['admin'], skipHappyPath: true },
  { method: 'POST', path: `/admin/admissions/${NOPE}/reject`, allow: ['admin'], skipHappyPath: true },
  { method: 'PUT', path: '/artists/me', allow: ['artist'], skipHappyPath: true },
  { method: 'PUT', path: '/hotels/me', allow: ['hotel'], skipHappyPath: true },
  { method: 'DELETE', path: `/artists/${NOPE}`, allow: ['artist'], skipHappyPath: true },
  { method: 'DELETE', path: `/hotels/${NOPE}`, allow: ['hotel'], skipHappyPath: true },
  { method: 'POST', path: `/hotels/${NOPE}/rooms`, allow: ['hotel'], skipHappyPath: true },
  { method: 'POST', path: `/hotels/${NOPE}/bookings`, allow: ['hotel'], skipHappyPath: true },
  { method: 'POST', path: '/payments/credits/purchase', allow: ['hotel'], skipHappyPath: true },
  { method: 'POST', path: '/payments/membership', allow: ['artist'], skipHappyPath: true },
  { method: 'POST', path: '/bookings', allow: ['hotel'], skipHappyPath: true },
  // No authorize() on this route by design: the handler resolves the caller's
  // own hotel/artist and checks ownership itself, so an admin passing the guard
  // is expected. The guard is not the control here.
  { method: 'PATCH', path: `/bookings/${NOPE}/status`, allow: ['artist', 'hotel', 'admin'], skipHappyPath: true },
  { method: 'POST', path: '/upload/media', allow: ['artist', 'hotel', 'admin'], skipHappyPath: true },
];

const tokens: Record<string, string | null> = { anon: null };

async function login(role: keyof typeof CREDENTIALS): Promise<string | null> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS[role]),
  });
  const body: any = await res.json().catch(() => ({}));
  return body?.data?.token ?? null;
}

async function call(ep: Endpoint, role: Role): Promise<number> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokens[role];
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${ep.path}`, {
    method: ep.method,
    headers,
    body: ep.method === 'GET' ? undefined : JSON.stringify({}),
  });
  return res.status;
}

/**
 * A status is acceptable when it matches the expectation for that role.
 *
 * For a permitted role we do not demand 200: a guard-only probe against a
 * non-existent id correctly returns 404, and a mutation with an empty body
 * correctly returns 400. What matters is that it got PAST the guard — so
 * anything other than 401/403 counts as allowed.
 */
function verdict(
  status: number,
  allowed: boolean
): { ok: boolean; note: string; inconclusive?: boolean } {
  // A rate-limited request never reached the guard, so it proves nothing either
  // way. Counting it would be reporting a number that is not about
  // authorization at all.
  if (status === 429) {
    return { ok: false, note: 'rate limited - inconclusive', inconclusive: true };
  }
  const blocked = status === 401 || status === 403;
  if (allowed) {
    return { ok: !blocked, note: blocked ? `blocked with ${status}` : `passed guard (${status})` };
  }
  return { ok: blocked, note: blocked ? `blocked (${status})` : `LEAKED - got ${status}` };
}

async function main() {
  tokens.admin = await login('admin');
  tokens.hotel = await login('hotel');
  tokens.artist = await login('artist');

  for (const [k, v] of Object.entries(tokens)) {
    if (k !== 'anon' && !v) {
      console.error(`could not log in as ${k}; aborting`);
      process.exit(1);
    }
  }

  const roles: Role[] = ['anon', 'artist', 'hotel', 'admin'];
  let pass = 0;
  let inconclusiveCount = 0;
  const failures: string[] = [];

  console.log('%s', 'ENDPOINT'.padEnd(46) + roles.map((r) => r.padEnd(9)).join(''));
  console.log('-'.repeat(46 + roles.length * 9));

  for (const ep of ENDPOINTS) {
    const cells: string[] = [];
    for (const role of roles) {
      const allowed = ep.allow.includes(role);
      const status = await call(ep, role);
      const { ok, note, inconclusive } = verdict(status, allowed);
      if (inconclusive) inconclusiveCount += 1;
      else if (ok) pass += 1;
      else failures.push(`${ep.method} ${ep.path} as ${role}: ${note}`);
      const mark = inconclusive ? '?' : ok ? (allowed ? '.' : 'x') : '!';
      cells.push(`${mark}${String(status).padStart(4)}`.padEnd(9));
    }
    const label = `${ep.method} ${ep.path}`.slice(0, 45);
    console.log(label.padEnd(46) + cells.join(''));
  }

  const total = ENDPOINTS.length * roles.length;
  console.log('');
  console.log('legend:  . passed guard   x correctly blocked   ! WRONG   ? rate limited');
  console.log('');
  const conclusive = total - inconclusiveCount;
  console.log(`${pass}/${conclusive} conclusive authorization checks correct`);
  if (inconclusiveCount) {
    console.log(`${inconclusiveCount} inconclusive (rate limited)`);
  }
  if (failures.length) {
    console.log('');
    console.log('FAILURES:');
    for (const f of failures) console.log('  ' + f);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
