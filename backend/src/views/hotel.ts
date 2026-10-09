import { Prisma } from '@prisma/client';
import { mediaOrder, mediaSelect, splitMedia, toMediaDTO } from './media';

/**
 * Hotels as they leave the server.
 *
 * The public shape carries no phone and no contact e-mail: those reach an
 * artist through a confirmed booking (see views/booking.ts), not by browsing.
 * `location` and `performanceSpots` keep the shape the existing pages read,
 * built from the real columns and the hotel_spaces table.
 */

export const listableHotelWhere: Prisma.HotelWhereInput = {
  user: { approvalStatus: 'APPROVED', isActive: true },
};

const spaceSelect = {
  id: true,
  name: true,
  type: true,
  setting: true,
  capacity: true,
  description: true,
  hours: true,
  noiseLevel: true,
  position: true,
  media: { select: mediaSelect, orderBy: mediaOrder },
} satisfies Prisma.HotelSpaceSelect;

export const publicHotelSelect = () =>
  ({
    id: true,
    userId: true,
    name: true,
    description: true,
    city: true,
    country: true,
    latitude: true,
    longitude: true,
    hotelType: true,
    roomCount: true,
    website: true,
    instagramUrl: true,
    facebookUrl: true,
    youtubeUrl: true,
    profilePicture: true,
    createdAt: true,
    user: { select: { name: true, country: true } },
    media: { select: mediaSelect, orderBy: mediaOrder },
    spaces: { select: spaceSelect, orderBy: { position: 'asc' as const } },
    availabilities: {
      where: { dateTo: { gte: new Date() } },
      orderBy: { dateFrom: 'asc' as const },
      select: { id: true, roomId: true, dateFrom: true, dateTo: true, price: true },
    },
  }) satisfies Prisma.HotelSelect;

export type PublicHotelRow = Prisma.HotelGetPayload<{ select: ReturnType<typeof publicHotelSelect> }>;

type SpaceRow = PublicHotelRow['spaces'][number];

export function toSpaceDTO(space: SpaceRow) {
  const { media } = splitMedia(space.media);
  return {
    id: space.id,
    name: space.name,
    type: space.type,
    setting: space.setting,
    capacity: space.capacity,
    description: space.description,
    hours: space.hours,
    noiseLevel: space.noiseLevel,
    media: media.map((m) => m.url),
    mediaItems: media,
  };
}

export function hotelLocation(row: { city: string; country: string; latitude: number | null; longitude: number | null }) {
  return {
    city: row.city,
    country: row.country,
    coords: row.latitude !== null && row.longitude !== null ? { lat: row.latitude, lng: row.longitude } : null,
  };
}

export function toPublicHotel(row: PublicHotelRow, extra: { averageRating?: number | null; ratingCount?: number; bookingCount?: number } = {}) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    city: row.city,
    country: row.country,
    location: hotelLocation(row),
    latitude: row.latitude,
    longitude: row.longitude,
    hotelType: row.hotelType,
    roomCount: row.roomCount,
    website: row.website,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    youtubeUrl: row.youtubeUrl,
    profilePicture: row.profilePicture,
    createdAt: row.createdAt,
    user: row.user,
    ...splitMedia(row.media),
    performanceSpots: row.spaces.map(toSpaceDTO),
    availabilities: row.availabilities,
    ...extra,
  };
}

// ---------------------------------------------------------------- own profile

export const ownHotelSelect = () =>
  ({
    ...publicHotelSelect(),
    address: true,
    contactPhone: true,
    repName: true,
    responsibleName: true,
    responsiblePhone: true,
    responsibleEmail: true,
    user: { select: { id: true, name: true, email: true, phone: true, country: true, createdAt: true } },
    credits: { select: { totalCredits: true, usedCredits: true } },
  }) satisfies Prisma.HotelSelect;

export type OwnHotelRow = Prisma.HotelGetPayload<{ select: ReturnType<typeof ownHotelSelect> }>;

export function toOwnHotel(row: OwnHotelRow) {
  const credits = row.credits[0];
  return {
    ...toPublicHotel(row as unknown as PublicHotelRow),
    user: row.user,
    address: row.address,
    contactPhone: row.contactPhone,
    repName: row.repName,
    responsibleName: row.responsibleName,
    responsiblePhone: row.responsiblePhone,
    responsibleEmail: row.responsibleEmail,
    availableCredits: credits ? credits.totalCredits - credits.usedCredits : 0,
    totalCredits: credits?.totalCredits ?? 0,
    usedCredits: credits?.usedCredits ?? 0,
  };
}

/** The contact block an artist gets once a residency with this hotel is confirmed. */
export const hotelContactSelect = {
  contactPhone: true,
  repName: true,
  responsibleName: true,
  responsiblePhone: true,
  responsibleEmail: true,
} satisfies Prisma.HotelSelect;

export { toMediaDTO };
