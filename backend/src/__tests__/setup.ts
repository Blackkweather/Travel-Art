import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Setup test database
})

afterAll(async () => {
  await prisma.$disconnect()
})

afterEach(async () => {
  // Clean up test data
})


