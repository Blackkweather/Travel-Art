import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = Router();

// Get all hotels (for admin/moderation)
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              country: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' } as any
      }).catch(() => []),
      prisma.hotel.count().catch(() => 0)
    ]);

    // Format hotels for moderation view
    const formattedHotels = hotels.map(hotel => {
      let location = null;
      if (hotel.location) {
        try {
          location = typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location;
        } catch (e) {
          // If parsing fails, use as string
          location = typeof hotel.location === 'string' ? hotel.location : null;
        }
      }
      return {
        id: hotel.id,
        userId: hotel.userId,
        user: hotel.user,
        name: hotel.name,
        location: location
      };
    });

    res.json({
      success: true,
      data: formattedHotels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching hotels:', error);
    throw new CustomError('Failed to fetch hotels', 500);
  }
}));

// Validation schemas
const hotelProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  location: z.string().optional(), // JSON string
  contactPhone: z.string().optional(),
  images: z.string().optional(), // JSON string
  performanceSpots: z.string().optional(), // JSON string
  rooms: z.string().optional(), // JSON string
  repName: z.string().optional(),
  profilePicture: z.string().optional(),
  responsiblePhone: z.string().optional(), // Phone number for WhatsApp contact
  responsibleEmail: z.string().email().optional(), // Email for direct contact
  responsibleName: z.string().optional() // Name of the responsible person
});

const roomAvailabilitySchema = z.object({
  roomId: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  price: z.number().optional()
});

const creditPurchaseSchema = z.object({
  amount: z.number().positive(),
  credits: z.number().positive()
});

const bookingSchema = z.object({
  artistId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  specialRequests: z.string().optional()
});

const ratingSchema = z.object({
  stars: z.number().min(1).max(5),
  textReview: z.string().min(10).max(500)
});

// Get hotel by user ID
router.get('/user/:userId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;

  // Users can only access their own hotel data unless they're admin
  if (req.user!.role !== 'ADMIN' && req.user!.id !== userId) {
    throw new CustomError('Access denied.', 403);
  }

  let hotel = await prisma.hotel.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          createdAt: true
        }
      },
      credits: true,
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  // If hotel doesn't exist and user is a hotel, create a default one
  if (!hotel && req.user!.role === 'HOTEL' && req.user!.id === userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      // Create location JSON string
      const location = JSON.stringify({
        city: '',
        country: user.country || '',
        coords: null
      });
      
      hotel = await prisma.hotel.create({
        data: {
          userId: userId,
          name: user.name,
          description: '',
          location: location,
          contactPhone: user.phone || null,
          repName: null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              country: true,
              createdAt: true
            }
          },
          credits: true,
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              artist: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          },
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    }
  }

  if (!hotel) {
    throw new CustomError('Hotel not found.', 404);
  }

  // Calculate available credits
  const credits = hotel.credits[0];
  const availableCredits = credits ? credits.totalCredits - credits.usedCredits : 0;
  const totalSpent = hotel.transactions
    .filter(t => t.type === 'CREDIT_PURCHASE')
    .reduce((sum, t) => sum + t.amount, 0);

  let location = null;
  let images = [];
  let performanceSpots = [];
  let rooms = [];
  
  if (hotel.location) {
    try {
      location = typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location;
    } catch (e) {
      location = null;
    }
  }
  
  if (hotel.images) {
    try {
      images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
    } catch (e) {
      images = [];
    }
  }
  
  if (hotel.performanceSpots) {
    try {
      performanceSpots = typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : hotel.performanceSpots;
    } catch (e) {
      performanceSpots = [];
    }
  }
  
  if (hotel.rooms) {
    try {
      rooms = typeof hotel.rooms === 'string' ? JSON.parse(hotel.rooms) : hotel.rooms;
    } catch (e) {
      rooms = [];
    }
  }

  res.json({
    success: true,
    data: {
      ...hotel,
      availableCredits,
      totalSpent,
      totalBookings: hotel.bookings.length,
      location: location,
      images: images,
      performanceSpots: performanceSpots,
      rooms: rooms
    }
  });
}));

// Get hotel profile
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          country: true,
          createdAt: true
        }
      },
      availabilities: {
        where: {
          dateFrom: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      }
    }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found.', 404);
  }

  let location = null;
  let images = [];
  let performanceSpots = [];
  let rooms = [];
  
  if (hotel.location) {
    try {
      location = typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location;
    } catch (e) {
      location = null;
    }
  }
  
  if (hotel.images) {
    try {
      images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
    } catch (e) {
      images = [];
    }
  }
  
  if (hotel.performanceSpots) {
    try {
      performanceSpots = typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : hotel.performanceSpots;
    } catch (e) {
      performanceSpots = [];
    }
  }
  
  if (hotel.rooms) {
    try {
      rooms = typeof hotel.rooms === 'string' ? JSON.parse(hotel.rooms) : hotel.rooms;
    } catch (e) {
      rooms = [];
    }
  }

  res.json({
    success: true,
    data: {
      ...hotel,
      location: location,
      images: images,
      performanceSpots: performanceSpots,
      rooms: rooms
    }
  });
}));

// Get current user's hotel profile
router.get('/me', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          createdAt: true
        }
      },
      availabilities: {
        where: {
          dateFrom: { gte: new Date() }
        },
        orderBy: { dateFrom: 'asc' }
      }
    }
  });

  if (!hotel) {
    throw new CustomError('Hotel profile not found', 404);
  }

  // Parse JSON fields
  let location = null;
  let images = [];
  let performanceSpots = [];
  let rooms = [];
  
  if (hotel.location) {
    try {
      location = typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location;
    } catch (e) {
      location = null;
    }
  }
  
  if (hotel.images) {
    try {
      images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
    } catch (e) {
      images = [];
    }
  }
  
  if (hotel.performanceSpots) {
    try {
      performanceSpots = typeof hotel.performanceSpots === 'string' ? JSON.parse(hotel.performanceSpots) : hotel.performanceSpots;
    } catch (e) {
      performanceSpots = [];
    }
  }
  
  if (hotel.rooms) {
    try {
      rooms = typeof hotel.rooms === 'string' ? JSON.parse(hotel.rooms) : hotel.rooms;
    } catch (e) {
      rooms = [];
    }
  }

  res.json({
    success: true,
    data: {
      ...hotel,
      location,
      images,
      performanceSpots,
      rooms
    }
  });
}));

// Update hotel profile (own profile)
router.put('/me', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = hotelProfileSchema.parse(req.body);

  const hotel = await prisma.hotel.findUnique({
    where: { userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel profile not found', 404);
  }

  const updatedHotel = await prisma.hotel.update({
    where: { id: hotel.id },
    data: profileData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedHotel
  });
}));

// Create or update hotel profile (legacy endpoint for backward compatibility)
router.post('/', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const profileData = hotelProfileSchema.parse(req.body);

  const hotel = await prisma.hotel.upsert({
    where: { userId: req.user!.id },
    update: profileData,
    create: {
      userId: req.user!.id,
      ...profileData
    } as any,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          country: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: hotel
  });
}));

// Delete hotel profile
router.delete('/:id', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  await prisma.hotel.delete({ where: { id } });

  res.json({
    success: true,
    data: { id }
  });
}));
// Add room availability
router.post('/:id/rooms', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { roomId, dateFrom, dateTo, price } = roomAvailabilitySchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  const availability = await prisma.availability.create({
    data: {
      hotelId: id,
      roomId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      price
    }
  });

  res.status(201).json({
    success: true,
    data: availability
  });
}));

// Get hotel credits
router.get('/:id/credits', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Get or create credits record
  const credits = await prisma.credit.findUnique({
    where: { hotelId: id }
  });

  const availableCredits = credits ? credits.totalCredits - credits.usedCredits : 0;

  res.json({
    success: true,
    data: {
      availableCredits,
      totalCredits: credits?.totalCredits || 0,
      usedCredits: credits?.usedCredits || 0
    }
  });
}));

// Purchase credits
router.post('/:id/credits/purchase', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { amount, credits } = creditPurchaseSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Update credits
  const creditRecord = await prisma.credit.upsert({
    where: { hotelId: id },
    update: {
      totalCredits: { increment: credits }
    },
    create: {
      hotelId: id,
      totalCredits: credits,
      usedCredits: 0
    }
  });

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      hotelId: id,
      type: 'CREDIT_PURCHASE',
      amount
    }
  });

  res.json({
    success: true,
    data: {
      credits: creditRecord,
      transaction
    }
  });
}));

// Browse artists with filters
router.get('/:id/artists', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { discipline, location, dateFrom, dateTo, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (discipline) {
    where.discipline = { contains: discipline as string };
  }

  if (dateFrom && dateTo) {
    where.availability = {
      some: {
        dateFrom: { lte: new Date(dateTo as string) },
        dateTo: { gte: new Date(dateFrom as string) }
      }
    };
  }

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            country: true
          }
        },
        availability: {
          where: {
            dateFrom: { gte: new Date() }
          },
          orderBy: { dateFrom: 'asc' },
          take: 1
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' } as any
    }),
    prisma.artist.count({ where })
  ]);

  let filteredArtists = artists;
  if (location) {
    const loc = String(location).toLowerCase();
    filteredArtists = artists.filter(a => a.user?.country?.toLowerCase().includes(loc));
  }

  // Add rating badges for each artist
  const artistsWithBadges = await Promise.all(
    filteredArtists.map(async (artist) => {
      const ratings = await prisma.rating.findMany({
        where: { artistId: artist.id },
        select: { stars: true }
      });

      let ratingBadge = null;
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
        if (avgRating >= 4.5) {
          ratingBadge = 'Top 10% Performer';
        } else if (avgRating >= 4.0) {
          ratingBadge = 'Excellent Performer';
        } else if (avgRating >= 3.5) {
          ratingBadge = 'Good Performer';
        }
      }

      let images = [];
      let videos = [];
      let mediaUrls = [];
      
      if (artist.images) {
        try {
          images = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
        } catch (e) {
          images = [];
        }
      }
      
      if (artist.videos) {
        try {
          videos = typeof artist.videos === 'string' ? JSON.parse(artist.videos) : artist.videos;
        } catch (e) {
          videos = [];
        }
      }
      
      if (artist.mediaUrls) {
        try {
          mediaUrls = typeof artist.mediaUrls === 'string' ? JSON.parse(artist.mediaUrls) : artist.mediaUrls;
        } catch (e) {
          mediaUrls = [];
        }
      }

      return {
        ...artist,
        ratingBadge,
        images: images,
        videos: videos,
        mediaUrls: mediaUrls
      };
    })
  );

  res.json({
    success: true,
    data: {
      artists: artistsWithBadges,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// Request booking
router.post('/:id/bookings', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { artistId, startDate, endDate } = bookingSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Check if artist has active membership
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { user: true }
  });

  if (!artist) {
    throw new CustomError('Artist not found.', 404);
  }

  if (artist.membershipStatus !== 'ACTIVE') {
    throw new CustomError('Artist must have active membership to be booked.', 400);
  }

  // Check artist availability
  const isAvailable = await prisma.artistAvailability.findFirst({
    where: {
      artistId,
      dateFrom: { lte: new Date(startDate) },
      dateTo: { gte: new Date(endDate) }
    }
  });

  if (!isAvailable) {
    throw new CustomError('Artist is not available for the selected dates.', 400);
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      hotelId: id,
      artistId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PENDING',
      creditsUsed: 1 // Assuming 1 credit per booking
    },
    include: {
      artist: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: booking
  });
}));

// Confirm booking (consumes credits)
router.post('/:id/bookings/:bookingId/confirm', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id, bookingId } = req.params;

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Get booking
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, hotelId: id, status: 'PENDING' }
  });

  if (!booking) {
    throw new CustomError('Booking not found or already processed.', 404);
  }

  // Check available credits
  const credits = await prisma.credit.findUnique({
    where: { hotelId: id }
  });

  if (!credits || (credits.totalCredits - credits.usedCredits) < booking.creditsUsed) {
    throw new CustomError('Insufficient credits to confirm booking.', 400);
  }

  // Update booking status and consume credits
  const [updatedBooking, updatedCredits] = await Promise.all([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    }),
    prisma.credit.update({
      where: { hotelId: id },
      data: { usedCredits: { increment: booking.creditsUsed } }
    })
  ]);

  res.json({
    success: true,
    data: {
      booking: updatedBooking,
      remainingCredits: updatedCredits.totalCredits - updatedCredits.usedCredits
    }
  });
}));

// Rate artist after stay
router.post('/:id/bookings/:bookingId/rate', authenticate, authorize('HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const { id, bookingId } = req.params;
  const { stars, textReview } = ratingSchema.parse(req.body);

  // Verify hotel belongs to user
  const hotel = await prisma.hotel.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!hotel) {
    throw new CustomError('Hotel not found or access denied.', 404);
  }

  // Get booking
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, hotelId: id, status: 'COMPLETED' }
  });

  if (!booking) {
    throw new CustomError('Booking not found or not completed.', 404);
  }

  // Check if already rated
  const existingRating = await prisma.rating.findFirst({
    where: { bookingId }
  });

  if (existingRating) {
    throw new CustomError('Artist has already been rated for this booking.', 400);
  }

  // Create rating
  const rating = await prisma.rating.create({
    data: {
      bookingId,
      hotelId: id,
      artistId: booking.artistId,
      stars,
      textReview,
      isVisibleToArtist: false // Artists cannot see numeric ratings
    }
  });

  res.status(201).json({
    success: true,
    data: rating
  });
}));

export { router as hotelRoutes };

