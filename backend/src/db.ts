// Environment variables must be loaded before PrismaClient is constructed:
// it reads DATABASE_URL at that moment.
import dotenv from 'dotenv';
import path from 'path';

// SKIP_DOTENV=1 runs on the process environment alone: a throwaway test
// server must not pick up the developer's real mail, payment or database keys.
if (process.env.SKIP_DOTENV !== '1') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import { PrismaClient } from '@prisma/client';
import { requestContext, RLS_MODELS } from './rlsContext';

const log: ('error' | 'warn')[] = process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. It must point at a PostgreSQL database.');
}

/**
 * The privileged connection. Owns the schema, bypasses row-level security.
 * Reserved for migrations, the seed, maintenance jobs, Stripe webhooks, and
 * the few cross-tenant reads/writes a route has already authorised (a refund
 * triggered by the artist moves the hotel's balance).
 */
const prismaAdmin = new PrismaClient({ log });

/**
 * The connection the request path uses.
 *
 * With APP_DATABASE_URL set this is travelart_app, which cannot bypass RLS. The
 * extension below stamps the caller's identity onto any query that touches a
 * protected table, inside a transaction so `set_config(..., true)` is scoped to
 * that statement and cannot leak to the next request sharing the connection.
 *
 * Without APP_DATABASE_URL this is the owner connection and the extension is a
 * no-op - the deliberate off switch for the whole mechanism.
 */
const appDbUrl = process.env.APP_DATABASE_URL;

/**
 * Refuse to serve production traffic with row-level security switched off.
 * A deployment that is silently insecure is worse than one that will not
 * start. RLS_OPT_OUT=1 is the escape hatch for doing it knowingly.
 */
if (process.env.NODE_ENV === 'production' && !appDbUrl && process.env.RLS_OPT_OUT !== '1') {
  console.error(
    [
      '',
      'FATAL: APP_DATABASE_URL is not set.',
      'Row-level security is enforced by connecting as the travelart_app role.',
      'Without it every policy is bypassed and hotels can read one another.',
      'Set APP_DATABASE_URL, or RLS_OPT_OUT=1 if that is genuinely intended.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

if (!appDbUrl && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  console.warn('APP_DATABASE_URL is not set: row-level security is INACTIVE in this process.');
}

const baseClient = appDbUrl ? new PrismaClient({ datasources: { db: { url: appDbUrl } }, log }) : prismaAdmin;

/**
 * Relation field names, on unprotected models, whose target is one of
 * RLS_MODELS. `include: { bookings: ... }` on an Artist query never has
 * `model === 'Booking'`, but the join still reads the bookings table, so the
 * identity has to be stamped for it too. Keep in step with schema.prisma.
 */
const RLS_RELATION_FIELDS = new Set(['bookings', 'credits', 'creditLedger', 'payments', 'payment', 'ledgerEntries']);

function touchesProtectedRelation(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== 'object' || depth > 6) return false;
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (RLS_RELATION_FIELDS.has(key)) return true;
    if (touchesProtectedRelation(val, depth + 1)) return true;
  }
  return false;
}

const prisma = appDbUrl
  ? baseClient.$extends({
      query: {
        async $allOperations({ model, args, query }: any) {
          const touchesRls = (!!model && RLS_MODELS.has(model)) || touchesProtectedRelation(args);
          if (!touchesRls) return query(args);

          // No identity: the policies already resolve that to zero rows, which
          // is the safe answer for anonymous paths.
          const identity = requestContext.getStore();
          if (!identity) return query(args);

          const [, result] = await baseClient.$transaction([
            baseClient.$executeRaw`SELECT set_config('app.user_id', ${identity.userId}, true), set_config('app.user_role', ${identity.role}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    })
  : prismaAdmin;

/** A cheap round trip, for health checks. */
export async function pingDatabase(): Promise<void> {
  await prismaAdmin.$queryRaw`SELECT 1`;
}

// The request-scoped client. Use this everywhere in the request path.
export { prisma };

/**
 * The privileged client. Bypasses row-level security. If you are reaching for
 * it inside a route handler, the question to answer first is whose data you
 * are about to read or move, and whether the route has already authorised it.
 */
export { prismaAdmin };
