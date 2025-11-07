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
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback to config (for local development)
  return config.databaseUrl;
};

// Validate DATABASE_URL is set
if (!getDatabaseUrl()) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL to a PostgreSQL connection string.');
  console.error('Example: postgresql://user:password@localhost:5432/dbname');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    // Test connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    const dbUrl = getDatabaseUrl();
    const dbType = dbUrl?.startsWith('postgresql://') || dbUrl?.startsWith('postgres://') ? 'PostgreSQL' : 'Database';
    console.log(`✅ ${dbType} connected via Prisma`);
    dbInitialized = true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('protocol')) {
      console.error('⚠️  DATABASE_URL must start with postgresql:// or postgres://');
      console.error('Current DATABASE_URL:', process.env.DATABASE_URL ? 'Set but invalid format' : 'Not set');
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
export async function getUserByEmail(email: string) {
  await initializeDatabase();
  const user = await prisma.user.findUnique({
    where: { email },
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
}) {
  await initializeDatabase();
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
      language: data.language || 'en',
      phone: data.phone || null,
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

// Export prisma for other operations that need it
export { prisma };
export { initializeDatabase };

