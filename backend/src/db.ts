// CRITICAL: Load environment variables BEFORE importing PrismaClient
// Prisma validates the schema on import and requires DATABASE_URL to be set
import dotenv from 'dotenv';
import path from 'path';

// Load .env files first (before any Prisma imports)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure DATABASE_URL is set before Prisma Client is imported
// This is required because Prisma schema references env("DATABASE_URL")
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  // Default to the expected database path (absolute path)
  const defaultDbPath = path.resolve(__dirname, '../prisma/dev.db');
  process.env.DATABASE_URL = `file:${defaultDbPath.replace(/\\/g, '/')}`;
}

// Now import PrismaClient - it will use the DATABASE_URL we just set
import { PrismaClient } from '@prisma/client';
import { config } from './config';

// Create Prisma client for SQLite
// Use the DATABASE_URL directly from config or environment
const getDatabaseUrl = () => {
  // Check environment variable first, then config
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('file:')) {
    return envUrl;
  }
  // Fallback to config
  return config.databaseUrl || 'file:./prisma/dev.db';
};

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
    console.log('✅ SQLite database connected via Prisma');
    dbInitialized = true;
  } catch (error: any) {
    console.error('❌ SQLite connection failed:', error.message);
    throw error;
  }
}

// Database query wrapper for SQLite (using Prisma raw queries)
// Note: SQLite uses ? placeholders instead of $1, $2, etc.
export async function dbQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  if (!dbInitialized) {
    await initializeDatabase();
  }

  try {
    // Convert PostgreSQL-style placeholders ($1, $2) to SQLite placeholders (?)
    let sqliteQuery = query;
    if (params && params.length > 0) {
      // Replace $1, $2, etc. with ?
      sqliteQuery = query.replace(/\$(\d+)/g, '?');
    }
    
    // Use Prisma raw query for SQLite
    const result = await prisma.$queryRawUnsafe(sqliteQuery, ...(params || [])) as T[];
    return result;
  } catch (error: any) {
    console.error('Database query error:', error.message);
    console.error('Query:', query.substring(0, 100));
    throw error;
  }
}

// Export usePrisma flag (always true for SQLite)
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

