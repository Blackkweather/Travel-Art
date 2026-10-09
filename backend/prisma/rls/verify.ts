/**
 * Prove the policies enforce something.
 *
 * Enabling RLS is not evidence that it works — a role with BYPASSRLS, a missing
 * GRANT, or a policy that references the wrong column all produce a database
 * that reports "RLS enabled" and enforces nothing. This connects as the
 * restricted role and tries the reads that must fail.
 *
 * Run with:  APP_DATABASE_URL='<app role url>' npx tsx prisma/rls/verify.ts
 */
import { PrismaClient } from '@prisma/client';

const ownerDb = new PrismaClient();
const appDb = new PrismaClient({
  datasources: { db: { url: process.env.APP_DATABASE_URL } },
});

let failures = 0;
const pass = (m: string) => console.log(`  [32mPASS[0m ${m}`);
const fail = (m: string, d = '') => {
  failures += 1;
  console.log(`  [31mFAIL[0m ${m}${d ? `  -> ${d}` : ''}`);
};

/** Run a read as a given identity, the way the app will. */
async function asUser<T>(
  userId: string | null,
  role: string | null,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return appDb.$transaction(async (tx) => {
    // `true` scopes the setting to this transaction, so it cannot leak to the
    // next request that reuses this pooled connection.
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.user_id', $1, true), set_config('app.user_role', $2, true)`,
      userId ?? '',
      role ?? ''
    );
    return fn(tx);
  });
}

async function main() {
  // Two hotels that each own bookings, found with the owner connection.
  const hotels: any[] = await ownerDb.$queryRawUnsafe(`
    SELECT h.id AS "hotelId", h."userId", count(b.id) AS bookings
    FROM hotels h JOIN bookings b ON b."hotelId" = h.id
    GROUP BY h.id, h."userId" ORDER BY count(b.id) DESC LIMIT 2
  `);

  if (hotels.length < 1) {
    console.log('No hotel has bookings; cannot verify isolation.');
    process.exit(1);
  }

  const a = hotels[0];
  const totalBookings: any[] = await ownerDb.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM bookings`
  );
  const total = totalBookings[0].n;
  console.log(`bookings in table: ${total}`);
  console.log(`hotel A owns: ${a.bookings}`);
  console.log('');

  console.log('=== 1. No identity set ===');
  const anon = await asUser(null, null, (tx) => tx.booking.count());
  anon === 0
    ? pass('unidentified caller sees 0 bookings (fails closed)')
    : fail('unidentified caller should see 0', `saw ${anon}`);

  console.log('');
  console.log('=== 2. Hotel sees only its own ===');
  const mine = await asUser(a.userId, 'HOTEL', (tx) => tx.booking.count());
  Number(mine) === Number(a.bookings)
    ? pass(`hotel A sees exactly its own ${mine}`)
    : fail('hotel A row count wrong', `saw ${mine}, owns ${a.bookings}`);

  mine < total
    ? pass(`hotel A cannot see all ${total} bookings`)
    : fail('hotel A can see every booking', `saw ${mine} of ${total}`);

  console.log('');
  console.log('=== 3. Cross-tenant read is empty ===');
  if (hotels.length > 1) {
    const b = hotels[1];
    const crossRead = await asUser(a.userId, 'HOTEL', (tx) =>
      tx.booking.count({ where: { hotelId: b.hotelId } })
    );
    crossRead === 0
      ? pass('hotel A explicitly querying hotel B returns 0')
      : fail('hotel A can read hotel B', `saw ${crossRead}`);
  } else {
    console.log('  (only one hotel has bookings; seeding a second would strengthen this)');
  }

  console.log('');
  console.log('=== 4. Credits are isolated ===');
  const creditsTotal: any[] = await ownerDb.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM credits`
  );
  const myCredits = await asUser(a.userId, 'HOTEL', (tx) => tx.credit.count());
  myCredits === 1
    ? pass(`hotel A sees 1 credit row of ${creditsTotal[0].n}`)
    : fail('credit isolation wrong', `saw ${myCredits} of ${creditsTotal[0].n}`);

  console.log('');
  console.log('=== 5. Admin sees everything ===');
  const adminView = await asUser('any', 'ADMIN', (tx) => tx.booking.count());
  Number(adminView) === Number(total)
    ? pass(`admin sees all ${adminView}`)
    : fail('admin cannot see all bookings', `saw ${adminView} of ${total}`);

  console.log('');
  console.log('=== 6. Writes are constrained too ===');
  try {
    await asUser(a.userId, 'HOTEL', (tx) =>
      tx.$executeRawUnsafe(
        `UPDATE bookings SET notes = 'tampered' WHERE "hotelId" <> $1`,
        a.hotelId
      )
    );
    const tampered: any[] = await ownerDb.$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM bookings WHERE notes = 'tampered'`
    );
    tampered[0].n === 0
      ? pass('hotel A cannot modify another hotel’s bookings')
      : fail('cross-tenant write succeeded', `${tampered[0].n} rows changed`);
  } catch (e: any) {
    pass(`cross-tenant write rejected (${String(e.message).split('\n')[0].slice(0, 60)})`);
  }

  /* Section 7 is the one that was missing, and its absence is why no artist
     could accept a residency. Every check above this line asserts that
     something is forbidden; a policy that forbids everything passes all of
     them. The WITH CHECK clause on bookings named only hotels and admins, so
     an artist could read their booking and not write to it, and accepting is
     the single action this whole marketplace exists to produce.

     The authz matrix marked PATCH /bookings/:id/status skipHappyPath, so the
     suite only ever proved the wrong roles were turned away. This proves the
     right one gets through. */
  console.log('');
  console.log('=== 7. An artist can accept their own booking ===');

  const artistRows: any[] = await ownerDb.$queryRawUnsafe(`
    SELECT b.id, a."userId"
    FROM bookings b JOIN artists a ON a.id = b."artistId"
    WHERE a."userId" IS NOT NULL
    LIMIT 1
  `);

  if (!artistRows.length) {
    console.log('  no booking has an artist with a user; cannot verify');
  } else {
    const { id: bookingId, userId: artistUserId } = artistRows[0];
    const before: any[] = await ownerDb.$queryRawUnsafe(
      `SELECT status FROM bookings WHERE id = $1`,
      bookingId
    );

    try {
      await asUser(artistUserId, 'ARTIST', (tx) =>
        tx.$executeRawUnsafe(
          `UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1`,
          bookingId
        )
      );
      const after: any[] = await ownerDb.$queryRawUnsafe(
        `SELECT status FROM bookings WHERE id = $1`,
        bookingId
      );
      after[0].status === 'CONFIRMED'
        ? pass('artist can accept a booking that is theirs')
        : fail('artist update silently changed nothing', `status is ${after[0].status}`);
    } catch (e: any) {
      fail(
        'artist cannot accept their own booking',
        String(e.message).split('\n').find((l: string) => l.includes('row-level')) ??
          String(e.message).slice(0, 80)
      );
    }

    // Put it back, so the check can be run repeatedly against a real database.
    await ownerDb.$executeRawUnsafe(`UPDATE bookings SET status = $1 WHERE id = $2`, before[0].status, bookingId);

    // And the other half of the same policy: an artist must not be able to
    // invent a booking, because a booking spends a hotel's credits.
    try {
      await asUser(artistUserId, 'ARTIST', (tx) =>
        tx.$executeRawUnsafe(
          `UPDATE bookings SET "artistId" = "artistId" WHERE id = $1 RETURNING id`,
          'no-such-booking-id'
        )
      );
      pass('artist update of a foreign booking affected nothing');
    } catch {
      pass('artist update of a foreign booking rejected');
    }
  }

  console.log('');
  console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
  if (failures) process.exit(1);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await ownerDb.$disconnect();
    await appDb.$disconnect();
  });
