// CRITICAL: Load environment variables BEFORE importing PrismaClient
// Prisma validates the schema on import and requires DATABASE_URL to be set
import dotenv from 'dotenv';
import path from 'path';

// Load .env files first (before any Prisma imports)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Now import PrismaClient - it will use the DATABASE_URL from environment
import { PrismaClient } from '@prisma/client';
import { config } from './config';

// Create Prisma client for PostgreSQL
// Use the DATABASE_URL directly from environment or config
const getDatabaseUrl = () => {
  // Check environment variable first (required for production)
  let envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    // Increase connection limit if it's too low (remove or increase connection_limit=1)
    // Supabase pooler supports up to 15 connections by default
    if (envUrl.includes('connection_limit=1')) {
      envUrl = envUrl.replace('connection_limit=1', 'connection_limit=10');
    } else if (envUrl.includes('pooler.supabase.com') && !envUrl.includes('connection_limit=')) {
      // Add connection_limit if not present (for pooler connections)
      const separator = envUrl.includes('?') ? '&' : '?';
      envUrl = `${envUrl}${separator}connection_limit=10`;
    }
    
    return envUrl;
  }
  // Fallback to config (for local development)
  return config.databaseUrl;
};

// Validate DATABASE_URL is set
const dbUrl = getDatabaseUrl();
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('For SQLite (dev): file:./prisma/dev.db');
  console.error('For PostgreSQL (prod): postgresql://user:password@localhost:5432/dbname');
} else if (dbUrl.startsWith('file:')) {
  console.log('📦 Using SQLite database for development');
} else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('🐘 Using PostgreSQL database');
} else {
  console.error('⚠️  Invalid DATABASE_URL format. Must start with file: (SQLite) or postgresql:// (PostgreSQL)');
}

import { requestContext, RLS_MODELS } from './rlsContext';

/**
 * The privileged connection. Owns the schema, bypasses row-level security.
 * Reserved for migrations, the seed, maintenance scripts and Stripe webhooks -
 * anything that has no authenticated user to attribute a row to.
 */
const prismaAdmin = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * The connection the request path uses.
 *
 * With APP_DATABASE_URL set this is travelart_app, which cannot bypass RLS. The
 * extension below stamps the caller's identity onto any query that touches a
 * protected table, inside a transaction so `set_config(..., true)` is scoped to
 * that statement and cannot leak to the next request sharing the connection.
 *
 * Without APP_DATABASE_URL this is the owner connection and the extension is a
 * no-op - which is the deliberate off switch for this whole mechanism.
 */
const appDbUrl = process.env.APP_DATABASE_URL;

/**
 * Refuse to serve production traffic with row-level security switched off.
 *
 * Leaving APP_DATABASE_URL out of a deploy environment is not a visible
 * failure: every query still works, every page still renders, and the only
 * difference is that tenant isolation is gone - one hotel can read another's
 * bookings and credits. A deployment that is silently insecure is worse than
 * one that will not start, so this stops rather than warns.
 *
 * RLS_OPT_OUT=1 is the escape hatch for running production on the owner
 * connection knowingly.
 */
if (
  process.env.NODE_ENV === 'production' &&
  !appDbUrl &&
  process.env.RLS_OPT_OUT !== '1'
) {
  console.error(
    [
      '',
      'FATAL: APP_DATABASE_URL is not set.',
      'Row-level security is enforced by connecting as the travelart_app role.',
      'Without it this process uses the owner connection, every policy is',
      'bypassed, and hotels can read one another. Refusing to start.',
      '',
      'Set APP_DATABASE_URL, or RLS_OPT_OUT=1 if that is genuinely intended.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

if (!appDbUrl && process.env.NODE_ENV !== 'production') {
  console.warn(
    'APP_DATABASE_URL is not set: row-level security is INACTIVE in this process.'
  );
}

const baseClient = appDbUrl
  ? new PrismaClient({
      datasources: { db: { url: appDbUrl } },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  : prismaAdmin;

/**
 * Relation field names, on models that are themselves unprotected, whose
 * target model is one of RLS_MODELS. `include: { bookings: {...} }` on an
 * Artist query never has `model === 'Booking'` - the extension below only
 * ever sees 'Artist' - but the join still reads the bookings table, so
 * without this the policy silently filtered it to zero rows regardless of
 * who was asking.
 *
 * Keep in step with prisma/schema.prisma.
 */
const RLS_RELATION_FIELDS = new Set([
  'bookings',
  'transactions',
  'credits',
  'creditLedger',
  'payments',
  'payment',
  'ledgerEntries',
]);

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
          // Unprotected queries skip the round trip entirely. Setting a
          // variable no policy reads would add a transaction to the great
          // majority of traffic - catalogue reads - for nothing.
          const touchesRls = (!!model && RLS_MODELS.has(model)) || touchesProtectedRelation(args);
          if (!touchesRls) {
            return query(args);
          }

          const identity = requestContext.getStore();

          // No identity on a protected table is not an error to throw: the
          // policies already resolve it to zero rows. Throwing here would turn
          // a safe empty result into a 500 on legitimate anonymous paths.
          if (!identity) {
            return query(args);
          }

          const [, result] = await baseClient.$transaction([
            baseClient.$executeRaw`SELECT set_config('app.user_id', ${identity.userId}, true), set_config('app.user_role', ${identity.role}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    })
  : prismaAdmin;

let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    // Test connection
    await prisma.$connect();
    const dbUrl = getDatabaseUrl();
    
    // For SQLite, use a simple query. For PostgreSQL, use raw query
    if (dbUrl?.startsWith('file:')) {
      // SQLite - simple query
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log(`✅ SQLite database connected via Prisma`);
    } else {
      // PostgreSQL - raw query
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log(`✅ PostgreSQL database connected via Prisma`);
    }
    dbInitialized = true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    const dbUrl = getDatabaseUrl();
    
    // Check if it's a pooler authentication error
    if (error.message.includes('Tenant or user not found') || error.message.includes('FATAL')) {
      if (dbUrl?.includes('pooler.supabase.com')) {
        console.error('\n⚠️  Pooler connection failed. Check that DATABASE_URL points at the');
        console.error('   connection string shown in your database provider dashboard.');
        console.error('\nCurrent connection string:', dbUrl.replace(/:[^:@]+@/, ':****@'));
      }
    }
    
    if (error.message.includes('protocol') || error.message.includes('file:')) {
      if (dbUrl?.startsWith('file:')) {
        console.error('⚠️  For SQLite, DATABASE_URL must start with file:');
        console.error('Example: file:./prisma/dev.db');
      } else {
        console.error('⚠️  For PostgreSQL, DATABASE_URL must start with postgresql:// or postgres://');
        console.error('Example: postgresql://user:password@localhost:5432/dbname');
      }
      console.error('Current DATABASE_URL:', dbUrl || 'Not set');
    }
    throw error;
  }
}

// Database query wrapper for PostgreSQL (using Prisma raw queries)
export async function dbQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  if (!dbInitialized) {
    await initializeDatabase();
  }

  try {
    // Use Prisma raw query for PostgreSQL (supports $1, $2, etc. placeholders)
    const result = await prisma.$queryRawUnsafe(query, ...(params || [])) as T[];
    return result;
  } catch (error: any) {
    console.error('Database query error:', error.message);
    console.error('Query:', query.substring(0, 100));
    throw error;
  }
}

// Export usePrisma flag (always true for PostgreSQL)
export function isUsingPrisma(): boolean {
  return true;
}

// Get user by email using Prisma
// Registration stores emails lowercased, so lookups must be case-insensitive -
// otherwise anyone who signed up with capitals can never log back in.
export async function getUserByEmail(email: string) {
  await initializeDatabase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
    include: {
      artist: true,
      hotel: true,
    },
  });
  return user;
}

// Create user using Prisma
export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  language?: string;
  phone?: string | null;
  country?: string | null;
  clerkId?: string | null;
}) {
  await initializeDatabase();
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
      language: data.language || 'fr',
      phone: data.phone || null,
      country: data.country || null,
      clerkId: data.clerkId || null,
      isActive: true,
    },
    include: {
      artist: true,
      hotel: true,
    },
  });
  
  console.log(`✅ User created: ${user.email}`);
  
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    artist: user.artist,
    hotel: user.hotel,
  };
}

// The request-scoped client. Use this everywhere in the request path.
export { prisma };

/**
 * The privileged client. Bypasses row-level security.
 *
 * Only three callers should ever want this: Stripe webhooks, the seed, and
 * maintenance scripts. If you are reaching for it inside a route handler, the
 * question to answer first is whose data you are about to read.
 */
export { prismaAdmin };
export { initializeDatabase };

