import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@travel-art/shared/utils/errors';
import { authenticateToken, requireHotel, requireHotelOrAdmin } from '@travel-art/shared/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createHotelProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  location: z.string(),
  contactPhone: z.string().optional(),
  repName: z.string().optional()
});

const updateHotelProfileSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
  images: z.string().optional(),
  performanceSpots: z.string().optional(),
  rooms: z.string().optional(),
  repName: z.string().optional()
});

// Get all hotels (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      country,
      city,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Note: location is stored as JSON string, would need to parse for filtering
    // For now, simple filtering can be added later

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          credits: true
        },
        orderBy: { totalBookings: 'desc' }
      }),
      prisma.hotel.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        hotels,
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

// Get hotel by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        credits: true,
        availabilities: {
          where: {
            dateFrom: { gte: new Date() },
            isBooked: false
          }
        }
      }
    });

    if (!hotel) {
      throw new NotFoundError('Hotel not found');
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
});

// Get hotel by user ID
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { userId },
      include: {
        credits: true,
        availabilities: true
      }
    });

    if (!hotel) {
      throw new NotFoundError('Hotel profile not found');
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
});

// Create hotel profile
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createHotelProfileSchema.parse(req.body);

    // Check if profile already exists
    const existing = await prisma.hotel.findUnique({
      where: { userId: data.userId }
    });

    if (existing) {
      throw new ValidationError('Hotel profile already exists');
    }

    // Create hotel with initial credits
    const hotel = await prisma.hotel.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        location: data.location,
        contactPhone: data.contactPhone,
        repName: data.repName,
        credits: {
          create: {
            totalCredits: 0,
            usedCredits: 0
          }
        }
      },
      include: {
        credits: true
      }
    });

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
});

// Update hotel profile
router.put('/:id', authenticateToken, requireHotelOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateHotelProfileSchema.parse(req.body);

    const hotel = await prisma.hotel.update({
      where: { id },
      data,
      include: {
        credits: true
      }
    });

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
});

// Get hotel credits
router.get('/:id/credits', authenticateToken, requireHotelOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const credits = await prisma.credit.findUnique({
      where: { hotelId: id }
    });

    if (!credits) {
      throw new NotFoundError('Credits not found');
    }

    res.json({
      success: true,
      data: {
        ...credits,
        availableCredits: credits.totalCredits - credits.usedCredits
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update hotel credits (internal service call)
router.patch('/:id/credits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { totalCredits, usedCredits } = req.body;

    const updateData: any = {};
    if (totalCredits !== undefined) updateData.totalCredits = totalCredits;
    if (usedCredits !== undefined) updateData.usedCredits = usedCredits;

    const credits = await prisma.credit.update({
      where: { hotelId: id },
      data: updateData
    });

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    next(error);
  }
});

// Add credits to hotel (internal service call from payment service)
router.post('/:id/credits/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid credit amount');
    }

    const credits = await prisma.credit.update({
      where: { hotelId: id },
      data: {
        totalCredits: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    next(error);
  }
});

// Use credits (internal service call from booking service)
router.post('/:id/credits/use', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid credit amount');
    }

    // Get current credits
    const currentCredits = await prisma.credit.findUnique({
      where: { hotelId: id }
    });

    if (!currentCredits) {
      throw new NotFoundError('Credits not found');
    }

    const available = currentCredits.totalCredits - currentCredits.usedCredits;

    if (available < amount) {
      throw new ValidationError('Insufficient credits');
    }

    // Update used credits
    const credits = await prisma.credit.update({
      where: { hotelId: id },
      data: {
        usedCredits: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    next(error);
  }
});

export default router;














