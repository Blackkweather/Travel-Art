import { Router } from 'express';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import {
  verificationEmail,
  passwordResetEmail,
  newRegistrationAdminAlert,
} from '../services/email';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { getUserByEmail, createUser, initializeDatabase } from '../simple-db';
// Imported statically. These three call sites each used `await import('../db')`,
// which the serverless bundler does not trace, so on Vercel the import threw and
// the surrounding catch reported "Database connection error" — registration,
// referral attribution and /auth/me all failed against a perfectly healthy
// database.
import { prisma } from '../db';
import { generateUniqueReferralCode } from '../utils/referralCode';

const router = Router();

// Short, non-reversible marker of a password hash, used to make reset tokens
// single-use without adding a table.
const passwordFingerprint = (passwordHash: string): string =>
  createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);

// Validation schemas
const registerSchema = z.object({
  role: z.enum(['ARTIST', 'HOTEL']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  // The registration form asks for length, a letter and a digit and scores the
  // result; the API accepted `min(8)`, so "password" passed. The two now agree.
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
    .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  phone: z.string().optional(),
  // The product is French; the form has no language picker, so every account
  // was being stamped 'en' and the admin export reported it for all of them.
  locale: z.string().optional().default('fr'),
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
  }).optional(),
  // Hotel-specific fields. The seven-step form used to register, then POST the
  // profile to an authenticated endpoint - which stopped working the moment
  // registration stopped returning a session: the account was created and
  // every answer after step 1 was dropped, with an error shown to someone whose
  // account had in fact been made. The answers now arrive with the
  // registration and are written in the same request.
  hotelProfile: z.object({
    description: z.string().optional(),
    city: z.string().optional(),
    performanceSpots: z.string().optional(),
    rooms: z.string().optional(),
    repName: z.string().optional(),
  }).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
  try {
    const { role, name, email, password, phone, locale, country, hotelProfile } = registerSchema.parse(req.body);

    // Ensure database is initialized
    await initializeDatabase();

    // Normalize email to lowercase for case-insensitive check
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists with error handling
    let existingUser;
    try {
      // Check with normalized email (case-insensitive)
      existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          }
        }
      });
    } catch (dbError: any) {
      console.error('Database error during registration check:', dbError);
      throw new CustomError('Database connection error. Please try again later.', 500);
    }

    if (existingUser) {
      throw new CustomError('An account with this email address already exists. Please use a different email or try logging in.', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with error handling
    // Use normalized email (lowercase) for storage
    let user;
    try {
      user = await createUser({
        email: normalizedEmail,
        name,
        passwordHash,
        role: role as 'ARTIST' | 'HOTEL',
        language: locale || 'fr',
        phone: phone || null,
        country: country || null,
      });
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      throw new CustomError('Failed to create account. Please try again later.', 500);
    }

    // Create Artist or Hotel profile based on role
    let referralCodeToUse: string | undefined = undefined;
    let inviterUserId: string | null = null;
    
    try {
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
            description: hotelProfile?.description || '',
            // Coordinates stay absent rather than 0,0 - the form never asks for
            // them, and 0,0 is a real place in the Atlantic that would put every
            // new hotel on the map there.
            location: JSON.stringify({
              city: hotelProfile?.city || '',
              country: country || '',
            }),
            contactPhone: phone || null,
            repName: hotelProfile?.repName || null,
            images: JSON.stringify([]),
            performanceSpots: hotelProfile?.performanceSpots || JSON.stringify([]),
            rooms: hotelProfile?.rooms || JSON.stringify([])
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

    // A confirmation link, valid for a day. It is bound to the user id and to
    // this purpose, so it cannot be replayed against any other endpoint that
    // accepts a signed token.
    const verifyToken = (jwt.sign as any)(
      { userId: user.id, type: 'email-verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );
    const verifyLink = `${config.frontendUrl}/verify-email?token=${verifyToken}`;

    // Deliberately not awaited, as the comment has always claimed: an account
    // that exists with an unsent confirmation is recoverable, a registration
    // the applicant was told had failed is not. Awaiting it put the mail
    // round-trip inside the request, which is most of why registration took
    // long enough for the browser to time out on it.
    void verificationEmail(user.email, user.name, verifyLink).catch((err) => {
      console.error('verification email failed for', user.email, err);
    });

    void newRegistrationAdminAlert({
      name: user.name,
      email: user.email,
      role: user.role as 'ARTIST' | 'HOTEL',
      country,
    }).catch((err) => {
      console.error('admin registration alert failed for', user.email, err);
    });

    // Deliberately no token. The account is PENDING until an administrator
    // admits it, so issuing a session here would leave the client believing it
    // is signed in while every authenticated call is refused.
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userWithProfile!.id,
          role: userWithProfile!.role,
          name: userWithProfile!.name,
          email: userWithProfile!.email,
          approvalStatus: userWithProfile!.approvalStatus,
          emailVerified: userWithProfile!.emailVerified
        },
        status: 'PENDING_REVIEW',
        message:
          'Votre demande a bien été enregistrée. Confirmez votre adresse e-mail, puis attendez la validation de votre compte par notre équipe.'
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

    if (!user) {
      throw new CustomError('Identifiants invalides.', 401);
    }

    // The password is verified before any account-state message is returned, so
    // the endpoint cannot be used to enumerate which addresses are registered:
    // without the correct password every branch below is unreachable.
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new CustomError('Identifiants invalides.', 401);
    }

    // Past this point the caller has proved they own the account, so telling
    // them why they cannot get in reveals nothing to an attacker and saves an
    // applicant from trying to "fix" a pending review with a password reset.
    if (user.approvalStatus === 'PENDING') {
      throw new CustomError(
        'Votre demande d’inscription est en cours d’examen. Vous recevrez un e-mail dès qu’elle aura été traitée.',
        403
      );
    }

    if (user.approvalStatus === 'REJECTED') {
      throw new CustomError(
        user.approvalNote
          ? `Votre demande d’inscription n’a pas été retenue. Motif : ${user.approvalNote}`
          : 'Votre demande d’inscription n’a pas été retenue.',
        403
      );
    }

    if (!user.isActive) {
      throw new CustomError(
        'Ce compte a été suspendu. Contactez l’administrateur du programme.',
        403
      );
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
    // Handle other errors - never surface internal details to the client
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
  await initializeDatabase();
  const user = await getUserByEmail(req.user!.email);
  
  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  // getUserByEmail returns the whole row, passwordHash included, and this
  // handler used to serialise it straight to the client — so every session
  // handed the browser the bcrypt hash of its own password, ready to be taken
  // offline and attacked at leisure.
  //
  // Naming the fields rather than deleting the one known to be secret: with a
  // denylist, the next column added to User ships to the client by default.
  // clerkId, sessionsValidFrom and reviewedById were reaching it that way.
  const u = user as Record<string, unknown>;
  const safeUser = {
    id: u.id,
    role: u.role,
    email: u.email,
    name: u.name,
    phone: u.phone,
    country: u.country,
    language: u.language,
    isActive: u.isActive,
    createdAt: u.createdAt,
    approvalStatus: u.approvalStatus,
    approvalNote: u.approvalNote,
    emailVerified: u.emailVerified,
    artist: u.artist,
    hotel: u.hotel,
  };

  res.json({
    success: true,
    data: { user: safeUser }
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
    // Generate reset token (JWT with short expiry). Binding the token to the
    // current password hash makes it single-use: resetting the password
    // changes the hash and invalidates any outstanding token.
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset', pwh: passwordFingerprint(user.passwordHash) },
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

    // The link is deliberately NOT logged - anyone with log access could use it
    // to take over the account. A send failure is swallowed on purpose: the
    // response is identical either way, so a caller cannot learn whether the
    // address exists by watching for an error.
    //
    // Not awaited, for the same reason registration no longer awaits its
    // confirmation mail: the round trip put the provider's latency inside the
    // request, and a slow send became a failure reported for a reset that had
    // actually been issued.
    void passwordResetEmail(user.email, user.name, resetLink).catch((err) => {
      console.error('password reset email failed for user', user.id, err);
    });
    console.log(`Password reset requested for user ${user.id}`);
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, you will receive reset instructions.'
  });
}));

/**
 * End every session for the current user, including this one.
 *
 * Sets the revocation cutoff to now, so every token issued up to this moment is
 * refused on its next request. The caller has to sign in again, which is the
 * point: this is what you press when a laptop goes missing.
 */
router.post('/logout-all', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { sessionsValidFrom: new Date() }
  });

  res.json({
    success: true,
    message: 'Toutes vos sessions ont été fermées. Reconnectez-vous.'
  });
}));

// Confirm an email address from the link sent at registration.
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = z.object({ token: z.string() }).parse(req.body);

  let payload: any;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new CustomError('Ce lien de confirmation est invalide ou a expiré.', 400);
  }

  // A signed token is not enough - it has to be a token minted for this
  // purpose, or a session token would also pass verification here.
  if (payload?.type !== 'email-verification' || !payload?.userId) {
    throw new CustomError('Ce lien de confirmation est invalide.', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new CustomError('Ce lien de confirmation est invalide.', 400);
  }

  // Idempotent: following the link twice is a normal thing for a person to do.
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() }
    });
  }

  res.json({
    success: true,
    data: {
      email: user.email,
      approvalStatus: user.approvalStatus,
      message:
        user.approvalStatus === 'APPROVED'
          ? 'Adresse confirmée. Vous pouvez vous connecter.'
          : 'Adresse confirmée. Votre demande est en cours d’examen par notre équipe.'
    }
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new CustomError('User not found.', 404);
    }

    // Reject tokens that were already used (the password has changed since the
    // token was issued) or that predate this check.
    if (decoded.pwh !== passwordFingerprint(user.passwordHash)) {
      throw new CustomError('Invalid or expired token.', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password using Prisma
    await prisma.user.update({
      where: { id: user.id },
      // Resetting a password ends every session opened with the old one. The
      // reset token was already single-use (it is bound to a fingerprint of the
      // old hash), but tokens handed out *before* the reset stayed valid until
      // they expired - so an attacker who had signed in kept their session
      // through the victim's password change. This closes that.
      data: { passwordHash, sessionsValidFrom: new Date() }
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
