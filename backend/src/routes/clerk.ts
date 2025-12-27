import { Router } from 'express';
import { config } from '../config';
import { CustomError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { getUserByEmail, createUser } from '../simple-db';
import { generateUniqueReferralCode } from '../utils/referralCode';

const router = Router();

// Sync Clerk user with our database
router.post('/sync', asyncHandler(async (req, res) => {
  try {
    const { clerkId, email, name, phone, country, role, stageName } = req.body;

    if (!clerkId || !email) {
      throw new CustomError('Missing required fields: clerkId and email', 400);
    }

    // Check if user already exists
    let user = await getUserByEmail(email).catch(() => null);

    if (!user) {
      // Create new user in our database
      // Note: We don't store password hash since Clerk handles authentication
      const { prisma } = await import('../db');
      
      // Create user record
      user = await createUser({
        email,
        name,
        passwordHash: '', // Clerk handles auth, so we don't need password
        role: (role || 'ARTIST') as 'ARTIST' | 'HOTEL',
        language: 'en',
        phone: phone || null,
        clerkId, // Store Clerk ID for reference
      });

      // Create Artist or Hotel profile based on role
      if (role === 'ARTIST') {
        const referralCode = await generateUniqueReferralCode(name);
        
        await prisma.artist.create({
          data: {
            userId: user.id,
            bio: '',
            discipline: '',
            priceRange: '',
            membershipStatus: 'INACTIVE',
            mediaUrls: JSON.stringify([]),
            loyaltyPoints: 0,
            referralCode: referralCode
          }
        });
      } else if (role === 'HOTEL') {
        await prisma.hotel.create({
          data: {
            userId: user.id,
            name: name,
            description: '',
            location: JSON.stringify({ city: '', country: country || '', coords: { lat: 0, lng: 0 } }),
            images: JSON.stringify([]),
            performanceSpots: JSON.stringify([]),
            rooms: JSON.stringify([])
          }
        });
      }
    } else {
      // Update existing user with Clerk ID if not set
      if (!user.clerkId) {
        const { prisma } = await import('../db');
        await prisma.user.update({
          where: { id: user.id },
          data: { clerkId }
        });
      }
    }

    // Fetch user with profile
    const userWithProfile = await getUserByEmail(email);

    // Generate a token for our API (we'll use Clerk's session token in middleware)
    const token = 'clerk-authenticated'; // Placeholder - actual auth handled by Clerk middleware

    res.json({
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
    console.error('Clerk sync error:', error);
    throw new CustomError(error.message || 'Failed to sync user', 500);
  }
}));

export { router as clerkRoutes };

