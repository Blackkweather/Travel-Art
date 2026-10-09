/**
 * Guard against running the integration suites at a real database.
 *
 * Every suite in src/__tests__ clears its fixtures with unfiltered calls —
 * prisma.artist.deleteMany(), prisma.hotel.deleteMany(), and so on — which
 * delete every row in those tables, not just the rows the test created. Run
 * against a populated database, `npm test` destroys the catalogue: artists,
 * hotels, bookings, credits, transactions and trips all go.
 *
 * That is exactly what happened once already, against the shared Neon
 * instance, because DATABASE_URL in backend/.env points at it and nothing
 * stopped the suite from using it.
 *
 * The database name must therefore say it is disposable. Set DATABASE_URL to
 * an instance whose name contains "test" (for example a Neon branch called
 * travelart_test), or, if you have accepted the consequences, set
 * ALLOW_DESTRUCTIVE_TESTS=1 to override.
 */
import dotenv from 'dotenv';
import path from 'path';

// Same order db.ts uses, so the guard inspects the URL the suites will use.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.DATABASE_URL ?? '';

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== '1') {
  // Compare on the database name and host only; a password could contain
  // anything and must never be part of the decision (or the error message).
  let databaseName = '';
  let host = '';
  try {
    const parsed = new URL(url);
    databaseName = parsed.pathname.replace(/^\//, '');
    host = parsed.hostname;
  } catch {
    // An unparseable URL is not a recognised test target either.
  }

  const looksDisposable =
    /test/i.test(databaseName) ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    url.startsWith('file:');

  if (!looksDisposable) {
    throw new Error(
      [
        'Refusing to run the integration suites against this database.',
        '',
        `  database: ${databaseName || '(unparsed)'}`,
        `  host:     ${host || '(unparsed)'}`,
        '',
        'These suites call deleteMany() with no filter and will empty the',
        'artists, hotels, bookings, credits, transactions and trips tables.',
        '',
        'Point DATABASE_URL at a disposable database whose name contains',
        '"test" (or a local instance), or set ALLOW_DESTRUCTIVE_TESTS=1 to',
        'proceed anyway.',
      ].join('\n')
    );
  }
}
