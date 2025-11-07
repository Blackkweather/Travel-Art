import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '@travel-art/shared/utils/errors';
import { authenticateToken } from '@travel-art/shared/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.string(),
  payload: z.string()
});

// Get user notifications
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { read, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user.userId };
    if (read !== undefined) {
      where.read = read === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: req.user.userId,
          read: false
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// Get notification by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// Create notification (internal service call)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createNotificationSchema.parse(req.body);

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        payload: data.payload
      }
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        read: false
      },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread/count', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        read: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

























