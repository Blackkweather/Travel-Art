import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  role: z.enum(['ARTIST', 'HOTEL']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.string().optional().default('en')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
  const { role, name, email, password, locale } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new CustomError('User with this email already exists.', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      role,
      name,
      email,
      passwordHash,
      language: locale
    },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  // Generate JWT token
  const token = (jwt.sign as any)(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      artist: true,
      hotel: true
    }
  });

  if (!user || !user.isActive) {
    throw new CustomError('Invalid credentials.', 401);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new CustomError('Invalid credentials.', 401);
  }

  // Generate JWT token
  const token = (jwt.sign as any)(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        artist: user.artist,
        hotel: user.hotel
      },
      token
    }
  });
}));

// Refresh token
router.post('/refresh', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const token = (jwt.sign as any)(
    { userId: req.user!.id, role: req.user!.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    success: true,
    data: { token }
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      artist: true,
      hotel: true
    }
  });

  res.json({
    success: true,
    data: { user }
  });
}));

export { router as authRoutes };
