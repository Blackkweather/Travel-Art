import { Prisma } from '@prisma/client';

/**
 * The signed-in user as their own client sees it. Named fields, so a column
 * added to User later (a hash, a token, a review note) cannot reach a browser
 * by default.
 */
export const sessionUserSelect = {
  id: true,
  role: true,
  email: true,
  name: true,
  phone: true,
  country: true,
  language: true,
  isActive: true,
  createdAt: true,
  approvalStatus: true,
  approvalNote: true,
  emailVerified: true,
  artist: { select: { id: true, stageName: true, discipline: true, profilePicture: true, membershipStatus: true } },
  hotel: { select: { id: true, name: true, profilePicture: true } },
} satisfies Prisma.UserSelect;

/** What an administrator sees in the users table and in admin responses. */
export const adminUserSelect = {
  id: true,
  role: true,
  email: true,
  name: true,
  phone: true,
  country: true,
  language: true,
  isActive: true,
  createdAt: true,
  approvalStatus: true,
  approvalNote: true,
  reviewedAt: true,
  emailVerified: true,
  artist: { select: { id: true, stageName: true, discipline: true, membershipStatus: true, profilePicture: true } },
  hotel: { select: { id: true, name: true, city: true, country: true, profilePicture: true } },
} satisfies Prisma.UserSelect;
