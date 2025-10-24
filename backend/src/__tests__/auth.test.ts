import request from 'supertest'
import { app } from '../index'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Auth API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register a new artist', async () => {
      const userData = {
        role: 'ARTIST',
        name: 'Test Artist',
        email: 'test@artist.com',
        password: 'password123',
        locale: 'en'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.role).toBe('ARTIST')
      expect(response.body.data.token).toBeDefined()
    })

    it('should register a new hotel', async () => {
      const userData = {
        role: 'HOTEL',
        name: 'Test Hotel',
        email: 'test@hotel.com',
        password: 'password123',
        locale: 'en'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.role).toBe('HOTEL')
    })

    it('should reject duplicate email', async () => {
      const userData = {
        role: 'ARTIST',
        name: 'Test Artist',
        email: 'test@duplicate.com',
        password: 'password123'
      }

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const passwordHash = await bcrypt.hash('password123', 12)
      await prisma.user.create({
        data: {
          role: 'ARTIST',
          email: 'test@login.com',
          passwordHash,
          name: 'Test User',
          language: 'en'
        }
      })
    })

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@login.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(credentials.email)
      expect(response.body.data.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const credentials = {
        email: 'test@login.com',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Invalid credentials')
    })
  })
})



