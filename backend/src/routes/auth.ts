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
  phone: z.string().optional(),
  locale: z.string().optional().default('en')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
  try {
    const { role, name, email, password, phone, locale } = registerSchema.parse(req.body);

    // Check if user already exists with error handling
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError: any) {
      console.error('Database error during registration check:', dbError);
      throw new CustomError('Database connection error. Please try again later.', 500);
    }

    if (existingUser) {
      throw new CustomError('User with this email already exists.', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with error handling
    let user;
    try {
      user = await prisma.user.create({
        data: {
          role,
          name,
          email,
          passwordHash,
          phone: phone || null,
          language: locale
        },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true
        }
      });
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      throw new CustomError('Failed to create account. Please try again later.', 500);
    }

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
  } catch (error: any) {
    // If it's already a CustomError, re-throw it
    if (error instanceof CustomError) {
      throw error;
    }
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      throw new CustomError('Invalid request data.', 400);
    }
    // Handle other errors
    console.error('Registration error:', error);
    throw new CustomError('Registration failed. Please try again later.', 500);
  }
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user with error handling for database issues
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          artist: true,
          hotel: true
        }
      });
    } catch (dbError: any) {
      console.error('Database error during login:', dbError);
      throw new CustomError('Database connection error. Please try again later.', 500);
    }

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
  } catch (error: any) {
    // If it's already a CustomError, re-throw it
    if (error instanceof CustomError) {
      throw error;
    }
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      throw new CustomError('Invalid request data.', 400);
    }
    // Handle other errors
    console.error('Login error:', error);
    throw new CustomError('Login failed. Please try again later.', 500);
  }
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

// Forgot password - generate reset token
const forgotPasswordSchema = z.object({
  email: z.string().email()
});

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // Always return success for security (don't reveal if email exists)
  if (user) {
    // Generate reset token (JWT with short expiry)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // In production, send email with link: `${config.frontendUrl}/reset-password?token=${resetToken}`
    // Password reset token generated
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, you will receive reset instructions.'
  });
}));

// Reset password with token
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    if (decoded.type !== 'password-reset') {
      throw new CustomError('Invalid token type.', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new CustomError('User not found.', 404);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    res.json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Invalid or expired token.', 400);
    }
    throw error;
  }
}));

export { router as authRoutes };
