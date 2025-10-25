import request from 'supertest'
import { app } from '../index'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

describe('Artist API', () => {
  let authToken: string
  let artistId: string
  let userId: string

  beforeEach(async () => {
    // Create test user and artist
    const passwordHash = await bcrypt.hash('password123', 12)
    const user = await prisma.user.create({
      data: {
        role: 'ARTIST',
        email: 'test@artist.com',
        passwordHash,
        name: 'Test Artist',
        language: 'en'
      }
    })

    const artist = await prisma.artist.create({
      data: {
        userId: user.id,
        bio: 'Test artist bio',
        discipline: 'Musician',
        priceRange: '€100-500',
        membershipStatus: 'ACTIVE',
        images: JSON.stringify(['image1.jpg', 'image2.jpg']),
        videos: JSON.stringify(['video1.mp4']),
        mediaUrls: JSON.stringify(['website.com']),
        loyaltyPoints: 100
      }
    })

    userId = user.id
    artistId = artist.id
    authToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.artist.deleteMany({
      where: { userId }
    })
    await prisma.user.deleteMany({
      where: { id: userId }
    })
  })

  describe('GET /api/artists/:id', () => {
    it('should get artist profile with rating badge', async () => {
      // Create a rating for the artist
      await prisma.rating.create({
        data: {
          bookingId: 'test-booking',
          hotelId: 'test-hotel',
          artistId,
          stars: 5,
          textReview: 'Excellent performance',
          isVisibleToArtist: false
        }
      })

      const response = await request(app)
        .get(`/api/artists/${artistId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(artistId)
      expect(response.body.data.ratingBadge).toBe('Top 10% Performer')
      expect(response.body.data.images).toEqual(['image1.jpg', 'image2.jpg'])
    })

    it('should return 404 for non-existent artist', async () => {
      const response = await request(app)
        .get('/api/artists/non-existent-id')
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/artists', () => {
    it('should create artist profile', async () => {
      const profileData = {
        bio: 'Updated bio',
        discipline: 'Painter',
        priceRange: '€200-800',
        images: JSON.stringify(['new-image.jpg']),
        videos: JSON.stringify(['new-video.mp4'])
      }

      const response = await request(app)
        .post('/api/artists')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(profileData.bio)
      expect(response.body.data.discipline).toBe(profileData.discipline)
    })
  })

  describe('POST /api/artists/:id/availability', () => {
    it('should set artist availability', async () => {
      const availabilityData = {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z'
      }

      const response = await request(app)
        .post(`/api/artists/${artistId}/availability`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(availabilityData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.artistId).toBe(artistId)
    })
  })

  describe('GET /api/artists', () => {
    it('should search artists with filters', async () => {
      const response = await request(app)
        .get('/api/artists')
        .query({
          discipline: 'Musician',
          page: '1',
          limit: '10'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.artists).toBeDefined()
      expect(response.body.data.pagination).toBeDefined()
    })
  })
})





