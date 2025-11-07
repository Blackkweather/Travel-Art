import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// In-memory user storage
let users: any[] = [];

const registerSchema = z.object({
  role: z.enum(['ARTIST', 'HOTEL']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  locale: z.string().optional().default('en')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { role, name, email, password, phone, locale } = registerSchema.parse(req.body);

  // Check if user exists
  if (users.find(u => u.email === email)) {
    throw new CustomError('User with this email already exists.', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email,
    name,
    passwordHash,
    role,
    phone: phone || null,
    language: locale || 'en',
    isActive: true,
    createdAt: new Date()
  };

  users.push(user);
  console.log(`✅ User registered: ${email}`);

  // Generate token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const user = users.find(u => u.email === email);
  if (!user || !user.isActive) {
    throw new CustomError('Invalid credentials.', 401);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new CustomError('Invalid credentials.', 401);
  }

  // Generate token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  console.log(`✅ User logged in: ${email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        artist: user.role === 'ARTIST' ? {} : null,
        hotel: user.role === 'HOTEL' ? {} : null
      },
      token
    }
  });
}));

export { router as quickAuthRoutes };