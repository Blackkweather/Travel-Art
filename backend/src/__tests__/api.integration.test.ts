/**
 * API Integration Tests
 * Tests API endpoints end-to-end
 */

import request from 'supertest';
import { app } from '../index';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        name: 'Test User',
        role: 'ARTIST',
      },
    });
    testUserId = user.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
          role: 'ARTIST',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      // Clean up
      await prisma.user.delete({
        where: { email: 'newuser@example.com' },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Artists API', () => {
    it('should get all artists', async () => {
      const response = await request(app)
        .get('/api/artists')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/artists');
      expect(response.status).toBe(401);
    });
  });

  describe('Hotels API', () => {
    it('should get all hotels', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});






