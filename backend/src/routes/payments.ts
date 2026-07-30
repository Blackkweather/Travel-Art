import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Get all credit packages
router.get('/packages', asyncHandler(async (req, res) => {
  // For now, return default packages since CreditPackage model doesn't exist
  // In production, these should come from a database table
  const packages = [
    {
      id: 'package-1',
      name: 'Starter Package',
      credits: 5,
      price: 49.99,
      discount: 0,
      description: 'Perfect for small hotels getting started',
      isActive: true
    },
    {
      id: 'package-2',
      name: 'Professional Package',
      credits: 15,
      price: 129.99,
      discount: 10,
      description: 'Best value for regular bookings',
      isActive: true
    },
    {
      id: 'package-3',
      name: 'Enterprise Package',
      credits: 50,
      price: 399.99,
      discount: 20,
      description: 'Maximum savings for high-volume hotels',
      isActive: true
    }
  ];

  res.json({
    success: true,
    data: packages
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

  // Get package details (matching the packages from GET /packages)
  const packageMap: Record<string, { credits: number; price: number; name: string }> = {
    'package-1': { credits: 5, price: 49.99, name: 'Starter Package' },
    'package-2': { credits: 15, price: 129.99, name: 'Professional Package' },
    'package-3': { credits: 50, price: 399.99, name: 'Enterprise Package' }
  };

  const selectedPackage = packageMap[packageId];
  if (!selectedPackage) {
    throw new CustomError('Invalid package ID', 400);
  }

  // Check if first-time purchase (50% discount)
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      hotelId: hotelId,
      type: 'CREDIT_PURCHASE'
    }
  });

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

