import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, UnauthorizedError } from '@travel-art/shared/utils/errors';
import { JWTPayload } from '@travel-art/shared/types';
import { authenticateToken } from '@travel-art/shared/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ARTIST', 'HOTEL', 'ADMIN']),
  phone: z.string().optional(),
  country: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Refresh token (reuse current token if valid)
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers['authorization'] as string) || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedError('Missing token');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Ensure user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid token');
    }

    const newToken = jwt.sign({ userId: user.id, email: user.email, role: user.role as any }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
});

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        phone: data.phone,
        country: data.country
      }
    });

    // Generate JWT
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          country: user.country
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          country: user.country
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        country: user.country,
        language: user.language,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify token (for other services)
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    res.json({
      success: true,
      data: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
});

// Get user by ID (for other services)
router.get('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        country: user.country,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;









