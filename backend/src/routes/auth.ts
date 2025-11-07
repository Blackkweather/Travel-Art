import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { getUserByEmail, createUser, initializeDatabase } from '../simple-db';

const router = Router();

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

    // Ensure database is initialized
    await initializeDatabase();

    // Check if user already exists with error handling
    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
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
      user = await createUser({
        email,
        name,
        passwordHash,
        role: role as 'ARTIST' | 'HOTEL',
        language: locale || 'en',
        phone: phone || null,
      });
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      throw new CustomError('Failed to create account. Please try again later.', 500);
    }

    // Create Artist or Hotel profile based on role
    try {
      const { prisma } = await import('../db');
      if (role === 'ARTIST') {
        await prisma.artist.create({
          data: {
            userId: user.id,
            bio: '',
            discipline: '',
            priceRange: '',
            membershipStatus: 'INACTIVE',
            mediaUrls: JSON.stringify([]),
            loyaltyPoints: 0
          }
        });
        console.log(`✅ Artist profile created for: ${user.email}`);
      } else if (role === 'HOTEL') {
        await prisma.hotel.create({
          data: {
            userId: user.id,
            name: name,
            description: '',
            location: JSON.stringify({ city: '', country: '', coords: { lat: 0, lng: 0 } }),
            images: JSON.stringify([]),
            performanceSpots: JSON.stringify([]),
            rooms: JSON.stringify([])
          }
        });
        console.log(`✅ Hotel profile created for: ${user.email}`);
      }
    } catch (profileError: any) {
      console.error('Error creating profile:', profileError);
      // Don't fail registration if profile creation fails - user can create it later
    }

    // Fetch user again with profile included
    const userWithProfile = await getUserByEmail(email);

    // Generate JWT token
    const token = (jwt.sign as any)(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userWithProfile!.id,
          role: userWithProfile!.role,
          name: userWithProfile!.name,
          email: userWithProfile!.email,
          phone: userWithProfile!.phone,
          createdAt: userWithProfile!.createdAt,
          artist: userWithProfile!.artist,
          hotel: userWithProfile!.hotel
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
    console.error('Registration error:', error);
    throw new CustomError('Registration failed. Please try again later.', 500);
  }
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Ensure database is initialized
    await initializeDatabase();

    // Find user with error handling for database issues
    let user;
    try {
      user = await getUserByEmail(email);
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
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw new CustomError(`Login failed: ${error.message || 'Unknown error'}. Please try again later.`, 500);
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
  await initializeDatabase();
  const user = await getUserByEmail(req.user!.email);
  
  if (!user) {
    throw new CustomError('User not found.', 404);
  }

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

  await initializeDatabase();
  // Find user
  const user = await getUserByEmail(email);

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

    await initializeDatabase();
    
    // Find user by ID using Prisma
    const { prisma } = await import('../db');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new CustomError('User not found.', 404);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password using Prisma
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
