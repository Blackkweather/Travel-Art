import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@travel-art/shared/utils/errors';
import { authenticateToken } from '@travel-art/shared/middleware/auth';
import { HttpClient } from '@travel-art/shared/utils/http-client';

const router = Router();
const prisma = new PrismaClient();

// Service clients
const hotelService = new HttpClient('HotelService', process.env.HOTEL_SERVICE_URL || 'http://localhost:3003');
const notificationService = new HttpClient('NotificationService', process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006');

// Validation schemas
const purchaseCreditsSchema = z.object({
  hotelId: z.string(),
  packageId: z.string(),
  paymentMethod: z.string()
});

const membershipPaymentSchema = z.object({
  artistId: z.string(),
  membershipType: z.enum(['PROFESSIONAL', 'ENTERPRISE']),
  paymentMethod: z.string()
});

const createPackageSchema = z.object({
  name: z.string(),
  credits: z.number().positive(),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).optional(),
  description: z.string().optional()
});

// Get all credit packages
router.get('/packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { credits: 'asc' }
    });

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    next(error);
  }
});

// Create credit package (admin only)
router.post('/packages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPackageSchema.parse(req.body);

    const package_ = await prisma.creditPackage.create({
      data: {
        name: data.name,
        credits: data.credits,
        price: data.price,
        discount: data.discount || 0,
        description: data.description
      }
    });

    res.status(201).json({
      success: true,
      data: package_
    });
  } catch (error) {
    next(error);
  }
});

// Purchase credits
router.post('/credits/purchase', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = purchaseCreditsSchema.parse(req.body);

    // Get package details
    const package_ = await prisma.creditPackage.findUnique({
      where: { id: data.packageId }
    });

    if (!package_ || !package_.isActive) {
      throw new NotFoundError('Credit package not found');
    }

    // Check if first-time purchase (50% discount)
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        hotelId: data.hotelId,
        type: 'CREDIT_PURCHASE',
        status: 'COMPLETED'
      }
    });

    const isFirstPurchase = existingTransactions.length === 0;
    const finalPrice = isFirstPurchase ? package_.price * 0.5 : package_.price;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        hotelId: data.hotelId,
        type: 'CREDIT_PURCHASE',
        amount: finalPrice,
        paymentMethod: data.paymentMethod,
        status: 'COMPLETED', // In real scenario, would be PENDING until payment confirmed
        metadata: JSON.stringify({
          packageId: data.packageId,
          credits: package_.credits,
          isFirstPurchase
        })
      }
    });

    // Add bonus credits based on package
    let bonusCredits = 0;
    if (package_.name.includes('Professional')) {
      bonusCredits = 4;
    } else if (package_.name.includes('Enterprise')) {
      bonusCredits = 10;
    }

    const totalCredits = package_.credits + bonusCredits;

    // Update hotel credits
    await hotelService.post(`/api/hotels/${data.hotelId}/credits/add`, {
      amount: totalCredits
    });

    // Send notification
    try {
      await notificationService.post('/api/notifications', {
        userId: data.hotelId,
        type: 'CREDITS_PURCHASED',
        payload: JSON.stringify({
          transactionId: transaction.id,
          credits: totalCredits,
          bonusCredits
        })
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json({
      success: true,
      data: {
        transaction,
        credits: totalCredits,
        bonusCredits
      }
    });
  } catch (error) {
    next(error);
  }
});

// Process membership payment
router.post('/membership', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = membershipPaymentSchema.parse(req.body);

    const amount = data.membershipType === 'PROFESSIONAL' ? 50 : 100;

    const transaction = await prisma.transaction.create({
      data: {
        artistId: data.artistId,
        type: 'MEMBERSHIP',
        amount,
        paymentMethod: data.paymentMethod,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          membershipType: data.membershipType
        })
      }
    });

    // Send notification
    try {
      await notificationService.post('/api/notifications', {
        userId: data.artistId,
        type: 'MEMBERSHIP_ACTIVATED',
        payload: JSON.stringify({
          transactionId: transaction.id,
          membershipType: data.membershipType
        })
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) {
      where.OR = [
        { hotelId: userId },
        { artistId: userId }
      ];
    }
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
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
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction by ID
router.get('/transactions/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Process refund
router.post('/refund/:transactionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!originalTransaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (originalTransaction.status === 'REFUNDED') {
      throw new ValidationError('Transaction already refunded');
    }

    // Create refund transaction
    const refundTransaction = await prisma.transaction.create({
      data: {
        hotelId: originalTransaction.hotelId,
        artistId: originalTransaction.artistId,
        type: 'REFUND',
        amount: originalTransaction.amount,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          originalTransactionId: transactionId
        })
      }
    });

    // Update original transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'REFUNDED' }
    });

    res.json({
      success: true,
      data: refundTransaction
    });
  } catch (error) {
    next(error);
  }
});

export default router;































