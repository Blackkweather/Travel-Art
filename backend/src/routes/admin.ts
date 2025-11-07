import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const suspendUserSchema = z.object({
  reason: z.string().min(5).max(200)
});

// Get admin dashboard data
router.get('/dashboard', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  // Wrap each query in try-catch to handle SQLite-specific issues
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
    prisma.user.count().catch(() => 0),
    prisma.artist.count().catch(() => 0),
    prisma.hotel.count().catch(() => 0),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }).catch(() => 0),
    prisma.transaction.aggregate({
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: null } })),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' } as any,
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
    }).catch(() => []),
    prisma.artist.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' } as any,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }).catch(() => []),
    prisma.hotel.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' } as any,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }).catch(() => [])
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

// Get admin activity logs
router.get('/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { action, actorUserId, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (action) {
    where.action = action;
  }
  if (actorUserId) {
    where.actorUserId = actorUserId;
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.adminLog.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Get hotel activity logs (bookings, transactions, etc.)
router.get('/hotels/:id/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get hotel
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found.', 404);
  }

  // Get bookings
  const [bookings, bookingsTotal] = await Promise.all([
    prisma.booking.findMany({
      where: { hotelId: id },
      include: {
        artist: {
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
    prisma.booking.count({ where: { hotelId: id } })
  ]);

  // Get transactions
  const [transactions, transactionsTotal] = await Promise.all([
    prisma.transaction.findMany({
      where: { hotelId: id },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where: { hotelId: id } })
  ]);

  // Get ratings received
  const [ratings, ratingsTotal] = await Promise.all([
    prisma.rating.findMany({
      where: { hotelId: id },
      include: {
        artist: {
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
    prisma.rating.count({ where: { hotelId: id } })
  ]);

  // Combine all activities
  const activities = [
    ...bookings.map(b => ({
      type: 'BOOKING',
      id: b.id,
      description: `Booking ${b.status.toLowerCase()}: ${b.artist.user.name}`,
      date: b.createdAt,
      data: b
    })),
    ...transactions.map(t => ({
      type: 'TRANSACTION',
      id: t.id,
      description: `${t.type}: €${t.amount}`,
      date: t.createdAt,
      data: t
    })),
    ...ratings.map(r => ({
      type: 'RATING',
      id: r.id,
      description: `Rating received: ${r.stars} stars from ${r.artist.user.name}`,
      date: r.createdAt,
      data: r
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limitNum);

  res.json({
    success: true,
    data: {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        user: hotel.user
      },
      activities,
      summary: {
        totalBookings: bookingsTotal,
        totalTransactions: transactionsTotal,
        totalRatings: ratingsTotal
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: bookingsTotal + transactionsTotal + ratingsTotal,
        pages: Math.ceil((bookingsTotal + transactionsTotal + ratingsTotal) / limitNum)
      }
    }
  });
}));

// Get artist activity logs (bookings, ratings, transactions, etc.)
router.get('/artists/:id/logs', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get artist
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!artist) {
    throw new CustomError('Artist not found.', 404);
  }

  // Get bookings
  const [bookings, bookingsTotal] = await Promise.all([
    prisma.booking.findMany({
      where: { artistId: id },
      include: {
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
    prisma.booking.count({ where: { artistId: id } })
  ]);

  // Get transactions
  const [transactions, transactionsTotal] = await Promise.all([
    prisma.transaction.findMany({
      where: { artistId: id },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where: { artistId: id } })
  ]);

  // Get ratings received
  const [ratings, ratingsTotal] = await Promise.all([
    prisma.rating.findMany({
      where: { artistId: id },
      include: {
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
    prisma.rating.count({ where: { artistId: id } })
  ]);

  // Combine all activities
  const activities = [
    ...bookings.map(b => ({
      type: 'BOOKING',
      id: b.id,
      description: `Booking ${b.status.toLowerCase()}: ${b.hotel.user.name}`,
      date: b.createdAt,
      data: b
    })),
    ...transactions.map(t => ({
      type: 'TRANSACTION',
      id: t.id,
      description: `${t.type}: €${t.amount}`,
      date: t.createdAt,
      data: t
    })),
    ...ratings.map(r => ({
      type: 'RATING',
      id: r.id,
      description: `Rating received: ${r.stars} stars from ${r.hotel.user.name}`,
      date: r.createdAt,
      data: r
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limitNum);

  res.json({
    success: true,
    data: {
      artist: {
        id: artist.id,
        name: artist.user.name,
        discipline: artist.discipline,
        user: artist.user
      },
      activities,
      summary: {
        totalBookings: bookingsTotal,
        totalTransactions: transactionsTotal,
        totalRatings: ratingsTotal
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: bookingsTotal + transactionsTotal + ratingsTotal,
        pages: Math.ceil((bookingsTotal + transactionsTotal + ratingsTotal) / limitNum)
      }
    }
  });
}));

export { router as adminRoutes };



