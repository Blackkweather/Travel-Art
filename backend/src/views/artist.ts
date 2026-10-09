import { Prisma } from '@prisma/client';
import { mediaOrder, mediaSelect, splitMedia } from './media';

/**
 * Artists as they leave the server.
 *
 * Two shapes and nothing else:
 *   - the card, for anyone browsing (other artists, hotels, admins). No phone,
 *     no birth date, no referral code, no loyalty balance. The phone was on
 *     every card, which handed a hotel everything it needed to book the artist
 *     directly and never come back.
 *   - the own profile, for the artist themself.
 *
 * Routes never spread a Prisma row into a response; they call one of these.
 */

/** Only admitted, active accounts appear anywhere another user can find them. */
export const listableArtistWhere: Prisma.ArtistWhereInput = {
  user: { approvalStatus: 'APPROVED', isActive: true },
};

const futureAvailability = () => ({
  where: { dateTo: { gte: new Date() } },
  orderBy: { dateFrom: 'asc' as const },
  select: { id: true, dateFrom: true, dateTo: true },
});

export const artistCardSelect = () =>
  ({
    id: true,
    userId: true,
    stageName: true,
    bio: true,
    discipline: true,
    mainCategory: true,
    secondaryCategory: true,
    categoryType: true,
    specificCategory: true,
    tributeTo: true,
    audienceTypes: true,
    languages: true,
    otherLanguages: true,
    profilePicture: true,
    membershipStatus: true,
    bookingCreditCost: true,
    createdAt: true,
    user: { select: { name: true, country: true } },
    media: { select: mediaSelect, orderBy: mediaOrder },
    availability: futureAvailability(),
  }) satisfies Prisma.ArtistSelect;

export type ArtistCardRow = Prisma.ArtistGetPayload<{ select: ReturnType<typeof artistCardSelect> }>;

export interface RatingSummary {
  average: number | null;
  count: number;
}

export function ratingBadge(average: number | null): string | null {
  if (average === null) return null;
  if (average >= 4.5) return 'Top 10 % des artistes';
  if (average >= 4.0) return 'Artiste confirmé';
  if (average >= 3.5) return 'Artiste recommandé';
  return null;
}

export function summariseRatings(stars: number[]): RatingSummary {
  if (stars.length === 0) return { average: null, count: 0 };
  const avg = stars.reduce((s, n) => s + n, 0) / stars.length;
  return { average: Math.round(avg * 10) / 10, count: stars.length };
}

interface CardOptions {
  ratings?: RatingSummary;
  bookingCount?: number;
  /** The credit price is shown to the people who pay it, not to other artists. */
  viewerRole?: string;
}

export function toArtistCard(row: ArtistCardRow, opts: CardOptions = {}) {
  const ratings = opts.ratings ?? { average: null, count: 0 };
  const showCost = opts.viewerRole === 'HOTEL' || opts.viewerRole === 'ADMIN';
  return {
    id: row.id,
    userId: row.userId,
    stageName: row.stageName,
    bio: row.bio,
    discipline: row.discipline,
    mainCategory: row.mainCategory,
    secondaryCategory: row.secondaryCategory,
    categoryType: row.categoryType,
    specificCategory: row.specificCategory,
    tributeTo: row.tributeTo,
    audienceTypes: row.audienceTypes,
    languages: row.languages,
    otherLanguages: row.otherLanguages,
    profilePicture: row.profilePicture,
    membershipStatus: row.membershipStatus,
    createdAt: row.createdAt,
    user: { name: row.user.name, country: row.user.country },
    availability: row.availability,
    ...splitMedia(row.media),
    ...(showCost ? { bookingCreditCost: row.bookingCreditCost } : {}),
    ratingBadge: ratingBadge(ratings.average),
    averageRating: ratings.average,
    avgRating: ratings.average,
    ratingCount: ratings.count,
    ...(opts.bookingCount !== undefined ? { bookingCount: opts.bookingCount } : {}),
  };
}

export type ArtistCard = ReturnType<typeof toArtistCard>;

// ---------------------------------------------------------------- own profile

export const ownArtistSelect = () =>
  ({
    ...artistCardSelect(),
    birthDate: true,
    priceRange: true,
    referralCode: true,
    loyaltyPoints: true,
    membershipRenewal: true,
    user: {
      select: { id: true, name: true, email: true, phone: true, country: true, createdAt: true },
    },
    memberships: {
      where: { status: 'ACTIVE' as const },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { id: true, tier: true, status: true, startsAt: true, endsAt: true },
    },
  }) satisfies Prisma.ArtistSelect;

export type OwnArtistRow = Prisma.ArtistGetPayload<{ select: ReturnType<typeof ownArtistSelect> }>;

/** "1996-02-29" (a Date) -> "29/02/1996", the format the form uses. */
export function formatFrenchDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getUTCFullYear()}`;
}

export function toOwnArtist(row: OwnArtistRow, ratings: RatingSummary) {
  return {
    ...toArtistCard(row as unknown as ArtistCardRow, { ratings, viewerRole: 'ADMIN' }),
    user: row.user,
    phone: row.user.phone,
    birthDate: formatFrenchDate(row.birthDate),
    priceRange: row.priceRange,
    referralCode: row.referralCode,
    loyaltyPoints: row.loyaltyPoints,
    membershipRenewal: row.membershipRenewal,
    membershipTier: row.memberships[0]?.tier ?? null,
    totalRatings: ratings.count,
  };
}
