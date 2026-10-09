import { Prisma } from '@prisma/client';
import { mediaOrder, mediaSelect, splitMedia } from './media';

/** Editorial experiences. `location` keeps the shape /experiences reads. */
export const tripSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceFrom: true,
  priceTo: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  status: true,
  type: true,
  rating: true,
  date: true,
  duration: true,
  capacity: true,
  schedule: true,
  includes: true,
  artistBio: true,
  venueDetails: true,
  reviews: true,
  createdAt: true,
  artistId: true,
  hotelId: true,
  media: { select: mediaSelect, orderBy: mediaOrder },
  artist: { select: { id: true, stageName: true, discipline: true, profilePicture: true, bio: true, user: { select: { name: true } } } },
  hotel: { select: { id: true, name: true, city: true, country: true, description: true } },
} satisfies Prisma.TripSelect;

export type TripRow = Prisma.TripGetPayload<{ select: typeof tripSelect }>;

export function toTripDTO(row: TripRow) {
  const { media, ...rest } = row;
  return {
    ...rest,
    priceFrom: Number(row.priceFrom),
    priceTo: Number(row.priceTo),
    location: {
      city: row.city,
      country: row.country,
      lat: row.latitude,
      lng: row.longitude,
    },
    ...splitMedia(media),
  };
}
