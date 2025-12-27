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
    // If using Supabase direct connection (IPv6-only), try to use pooler instead
    if (envUrl.includes('db.rtvtzyjlbtgnvzzqxzxv.supabase.co')) {
      // Extract password from original URL
      const urlMatch = envUrl.match(/postgres(ql)?:\/\/postgres:([^@]+)@/);
      const password = urlMatch ? encodeURIComponent(decodeURIComponent(urlMatch[2])) : 'Trvael69120Arts%3B';
      const projectRef = 'rtvtzyjlbtgnvzzqxzxv';
      
      // Try Session Pooler (port 5432) - supports prepared statements
      // Try different regions - user can override with POOLER_REGION env var
      const region = process.env.POOLER_REGION || 'us-east-1';
      // Session mode pooler (port 5432) - IPv4 compatible
      return `postgres://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`;
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
        console.error('\n⚠️  Pooler connection failed. Possible issues:');
        console.error('1. Wrong region - Try setting POOLER_REGION env var (e.g., eu-west-1, ap-southeast-1)');
        console.error('2. Pooler not enabled - Enable Session Pooler in Supabase Dashboard');
        console.error('3. Get exact connection string from: https://supabase.com/dashboard/project/rtvtzyjlbtgnvzzqxzxv/settings/database');
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
  clerkId?: string | null;
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

// Export prisma for other operations that need it
export { prisma };
export { initializeDatabase };

