import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

/**
 * Get all credit packages.
 *
 * These now come from the credit_packages table, which is the only place pack
 * pricing is allowed to live. This handler previously returned a hardcoded
 * array of EUR 49.99 / 129.99 / 399.99 while the pricing page advertised
 * EUR 1,500 / 3,500 / 6,500, so a hotel was quoted thirty times what the API
 * would have charged.
 *
 * priceCents is the stored value; price is derived for display only. Clients
 * should prefer priceCents and must never hardcode either.
 */
router.get('/packages', asyncHandler(async (req, res) => {
  const packages = await prisma.creditPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' }
  });

  res.json({
    success: true,
    data: packages.map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      credits: pkg.credits,
      bonusCredits: pkg.bonusCredits,
      totalCredits: pkg.credits + pkg.bonusCredits,
      priceCents: pkg.priceCents,
      price: pkg.priceCents / 100,
      currency: pkg.currency,
      isActive: pkg.active
    }))
  });
}));

// Purchase credits
router.post('/credits/purchase', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { hotelId, packageId, paymentMethod } = req.body;

  if (!hotelId || !packageId) {
    throw new CustomError('hotelId and packageId are required', 400);
  }

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied', 404);
  }

  // Validate against the packages table rather than a hardcoded map. The map
  // that used to sit here listed EUR 49.99 / 129.99 / 399.99 and its keys
  // ('package-1'...) no longer match any real package id, so a valid request
  // was rejected as "Invalid package ID" before reaching the honest error.
  const selectedPackage = await prisma.creditPackage.findFirst({
    where: { OR: [{ id: packageId }, { slug: packageId }], active: true }
  });

  if (!selectedPackage) {
    throw new CustomError('Unknown credit package', 400);
  }

  // DISABLED: credits must never be created by a request the client controls.
  //
  // What this code used to do: accept a `paymentMethod` field, never use it,
  // increment the hotel's balance, then write a Transaction row recording
  // revenue that was never collected. Any authenticated hotel could call it
  // repeatedly for unlimited free inventory, and the transaction log made the
  // books look settled.
  //
  // The replacement flow is:
  //   1. create a Stripe Checkout Session for the chosen CreditPackage
  //   2. Stripe charges the card
  //   3. the checkout.session.completed webhook, after signature verification,
  //      writes an append-only CreditLedger entry inside one transaction
  //   4. balance is derived from the ledger, never incremented in place
  //
  // A hotel seeing an honest error costs far less than a hotel quietly taking
  // free stock while finance believes it was paid for.
  console.warn(
    `Blocked credit purchase: no payment processor configured (hotel ${hotelId}, package ${packageId})`
  );

  throw new CustomError(
    'Credit purchases are temporarily unavailable while payment processing is being set up. ' +
    'No card has been charged and no credits have been added. Please contact us to arrange a purchase.',
    503
  );
}));

/**
 * Purchase an artist membership.
 *
 * The frontend has always called this endpoint, but it was never implemented,
 * so every upgrade attempt 404'd and the page reported "Membership purchase
 * failed. Please try again." — advice that could never work.
 *
 * It takes the same position as /credits/purchase above: validate everything
 * that can be validated, then refuse honestly rather than granting a paid
 * benefit no one was charged for. Activating a membership here would make an
 * artist ACTIVE, and therefore priority-placed, for free.
 */
router.post('/membership', authenticate, authorize('ARTIST'), asyncHandler(async (req: AuthRequest, res) => {
  const { artistId, membershipType } = req.body;

  if (!artistId || !membershipType) {
    throw new CustomError('artistId and membershipType are required', 400);
  }

  // Tiers are constrained by the MembershipTier enum; anything else is a
  // client bug and should not reach the payment step.
  if (!['ARTIST', 'PROFESSIONAL'].includes(membershipType)) {
    throw new CustomError('Unknown membership tier', 400);
  }

  const artist = await prisma.artist.findFirst({
    where: { id: artistId, userId: req.user!.id }
  });

  if (!artist) {
    throw new CustomError('Artist not found or access denied', 404);
  }

  console.warn(
    `Blocked membership purchase: no payment processor configured (artist ${artistId}, tier ${membershipType})`
  );

  throw new CustomError(
    'Memberships are temporarily unavailable while payment processing is being set up. ' +
    'No card has been charged and your membership has not changed. Please contact us to arrange an upgrade.',
    503
  );
}));

// Get transactions for a user
router.get('/transactions', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '50', page = '1' } = req.query;
  const limitNum = parseInt(limit as string);
  const pageNum = parseInt(page as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  // Filter by user role
  if (req.user!.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({
      where: { userId: req.user!.id }
    });
    if (hotel) {
      where.hotelId = hotel.id;
    }
  } else if (req.user!.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: req.user!.id }
    });
    if (artist) {
      where.artistId = artist.id;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        hotel: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        artist: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      totalRevenue: await prisma.transaction.aggregate({
        where,
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0)
    }
  });
}));

export { router as paymentRoutes };

