// Re-export from db.ts to maintain compatibility
export { 
  initializeDatabase, 
  getUserByEmail, 
  createUser, 
  isUsingPrisma, 
  dbQuery, 
  prisma 
} from './db';