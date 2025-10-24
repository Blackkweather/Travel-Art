import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const suspendUserSchema = z.object({
  reason: z.string().min(5).max(200)
});

// Get admin dashboard data
router.get('/dashboard', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalUsers,
    totalArtists,
    totalHotels,
    activeBookings,
    totalRevenue,
    recentBookings,
    topArtists,
    topHotels
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.hotel.count(),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.transaction.aggregate({
      _sum: { amount: true }
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        hotel: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    }),
    prisma.artist.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }),
    prisma.hotel.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalArtists,
        totalHotels,
        activeBookings,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      recentBookings,
      topArtists,
      topHotels
    }
  });
}));

// Suspend user
router.post('/users/:id/suspend', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = suspendUserSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  if (user.role === 'ADMIN') {
    throw new CustomError('Cannot suspend admin users.', 403);
  }

  // Update user status
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      action: 'SUSPEND_USER',
      actorUserId: req.user!.id,
      targetId: id
    }
  });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Activate user
router.post('/users/:id/activate', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  // Update user status
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: true }
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      action: 'ACTIVATE_USER',
      actorUserId: req.user!.id,
      targetId: id
    }
  });

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Export data
router.get('/export', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { type } = req.query;

  if (type === 'bookings') {
    const bookings = await prisma.booking.findMany({
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        hotel: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    const csvData = [
      'Booking ID,Hotel Name,Artist Name,Start Date,End Date,Status,Credits Used,Created At',
      ...bookings.map(booking => 
        `${booking.id},"${booking.hotel.user.name}","${booking.artist.user.name}",${booking.startDate.toISOString()},${booking.endDate.toISOString()},${booking.status},${booking.creditsUsed},${booking.createdAt.toISOString()}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csvData);
  } else if (type === 'users') {
    const users = await prisma.user.findMany({
      include: {
        artist: true,
        hotel: true
      }
    });

    const csvData = [
      'User ID,Name,Email,Role,Country,Language,Is Active,Created At',
      ...users.map(user => 
        `${user.id},"${user.name}","${user.email}",${user.role},"${user.country || ''}","${user.language}",${user.isActive},${user.createdAt.toISOString()}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csvData);
  } else {
    throw new CustomError('Invalid export type. Use "bookings" or "users".', 400);
  }
}));

// Get all users with pagination
router.get('/users', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', role, search } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        artist: true,
        hotel: true
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Get all bookings with pagination
router.get('/bookings', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', status } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        hotel: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.booking.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

export { router as adminRoutes };


