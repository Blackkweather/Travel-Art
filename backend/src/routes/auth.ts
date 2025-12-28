import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { getUserByEmail, createUser, initializeDatabase } from '../simple-db';
import { generateUniqueReferralCode } from '../utils/referralCode';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  role: z.enum(['ARTIST', 'HOTEL']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  locale: z.string().optional().default('en'),
  referralCode: z.string().optional(), // Accept referral code during registration
  // Artist-specific fields
  stageName: z.string().optional(),
  birthDate: z.string().optional(),
  country: z.string().optional(),
  artisticProfile: z.object({
    mainCategory: z.string().optional(),
    secondaryCategory: z.string().optional(),
    audienceType: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    categoryType: z.string().optional(),
    specificCategory: z.string().optional(),
    domain: z.string().optional()
  }).optional()
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
    let referralCodeToUse: string | undefined = undefined;
    let inviterUserId: string | null = null;
    
    try {
      const { prisma } = await import('../db');
      
      // Handle referral code if provided
      const referralCode = req.body.referralCode as string | undefined;
      if (referralCode) {
        // Find artist with this referral code
        const referrerArtist = await prisma.artist.findFirst({
          where: { referralCode: referralCode.toUpperCase() },
          include: { user: true }
        });
        
        if (referrerArtist) {
          inviterUserId = referrerArtist.userId;
          console.log(`📝 Referral code found: ${referralCode} (inviter: ${referrerArtist.user.name})`);
        } else {
          console.warn(`⚠️  Invalid referral code provided: ${referralCode}`);
        }
      }
      
      if (role === 'ARTIST') {
        // Generate unique referral code for new artist
        referralCodeToUse = await generateUniqueReferralCode(name);
        
        // Extract artisticProfile data if provided
        const artisticProfile = req.body.artisticProfile;
        const stageName = req.body.stageName || name;
        const birthDate = req.body.birthDate;
        const country = req.body.country;
        
        // Build discipline from artisticProfile if available
        let discipline = '';
        if (artisticProfile?.mainCategory) {
          discipline = artisticProfile.mainCategory;
          if (artisticProfile.specificCategory) {
            discipline += ` - ${artisticProfile.specificCategory}`;
          }
        }
        
        const artist = await prisma.artist.create({
          data: {
            userId: user.id,
            stageName: stageName,
            birthDate: birthDate || null,
            phone: phone || null,
            bio: '',
            discipline: discipline || '',
            priceRange: '',
            membershipStatus: 'INACTIVE',
            images: JSON.stringify([]),
            videos: JSON.stringify([]),
            mediaUrls: JSON.stringify([]),
            profilePicture: null,
            artisticProfile: artisticProfile ? JSON.stringify(artisticProfile) : null,
            loyaltyPoints: 0,
            referralCode: referralCodeToUse
          }
        });
        console.log(`✅ Artist profile created for: ${user.email} with referral code: ${referralCodeToUse}`);
        
        // Create referral record if referral code was used
        if (inviterUserId) {
          try {
            await prisma.referral.create({
              data: {
                inviterUserId: inviterUserId,
                inviteeUserId: user.id,
                rewardPoints: 100 // Default reward points
              }
            });
            
            // Update inviter's loyalty points
            await prisma.artist.update({
              where: { userId: inviterUserId },
              data: {
                loyaltyPoints: {
                  increment: 100
                }
              }
            });
            
            // Set new user's loyalty points too
            await prisma.artist.update({
              where: { id: artist.id },
              data: {
                loyaltyPoints: 100
              }
            });
            
            console.log(`✅ Referral tracked: ${inviterUserId} referred ${user.id}`);
          } catch (refError: any) {
            console.error('Error creating referral record:', refError);
            // Don't fail registration if referral tracking fails
          }
        }
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

    const resetLink = `${config.frontendUrl || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // In development, log the reset link to console and include it in response
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Password Reset Token Generated:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Token: ${resetToken}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return res.json({
        success: true,
        message: 'If an account exists with that email, you will receive reset instructions.',
        // Include reset link in dev mode for testing
        dev: {
          resetLink,
          token: resetToken,
          note: 'This is only visible in development mode'
        }
      });
    }

    // TODO: In production, send email with reset link
    // Example: await sendEmail(user.email, 'Password Reset', { resetLink })
    // For now, log in production too (remove in final version)
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset link: ${resetLink}`);
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
