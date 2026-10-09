import { Prisma } from '@prisma/client';
import { hotelContactSelect, hotelLocation } from './hotel';

/**
 * Bookings as they leave the server.
 *
 * Each party sees the other's name and picture from the first request, and
 * their phone and e-mail only once the residency is confirmed - that is the
 * moment the two of them genuinely need to talk, and not before. Handing the
 * contact details over with the request let a hotel take the artist's number
 * from a booking it then cancelled.
 */

export const bookingSelect = {
  id: true,
  artistId: true,
  hotelId: true,
  startDate: true,
  endDate: true,
  status: true,
  creditCost: true,
  notes: true,
  createdAt: true,
  companionName: true,
  boardType: true,
  transportTerms: true,
  transportNotes: true,
  performanceDescription: true,
  performanceSchedule: true,
  stayValueCents: true,
  performanceValueCents: true,
  currency: true,
  roomType: true,
  includedServices: true,
  performanceLocation: true,
  performanceDuration: true,
  technicalConditions: true,
  socialContent: true,
  conventionFinalizedAt: true,
  signatures: { select: { party: true, signedAt: true } },
  claim: {
    select: {
      id: true,
      feeCents: true,
      feeStatus: true,
      feeDueAt: true,
      transportEligible: true,
      transportStatus: true,
      transportAmountCents: true,
      transportProofUrls: true,
      transportDueAt: true,
      transportSettleNote: true,
    },
  },
  respondedAt: true,
  cancelledAt: true,
  cancelledByRole: true,
  cancellationReason: true,
  artist: {
    select: {
      id: true,
      stageName: true,
      discipline: true,
      profilePicture: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  },
  hotel: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      profilePicture: true,
      ...hotelContactSelect,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  ratings: { select: { id: true, stars: true, textReview: true, isVisibleToArtist: true, createdAt: true } },
} satisfies Prisma.BookingSelect;

export type BookingRow = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>;

const CONTACT_VISIBLE = new Set(['CONFIRMED', 'COMPLETED']);

export function toBookingDTO(row: BookingRow, viewerRole: string) {
  const isAdmin = viewerRole === 'ADMIN';
  const contactsOpen = isAdmin || CONTACT_VISIBLE.has(row.status);

  const artistContact =
    contactsOpen && (isAdmin || viewerRole === 'HOTEL')
      ? { email: row.artist.user.email, phone: row.artist.user.phone }
      : null;

  const hotelContact =
    contactsOpen && (isAdmin || viewerRole === 'ARTIST')
      ? {
          email: row.hotel.responsibleEmail || row.hotel.user.email,
          phone: row.hotel.responsiblePhone || row.hotel.contactPhone,
          name: row.hotel.responsibleName || row.hotel.repName,
        }
      : null;

  // A rating marked private is the hotel's note to itself.
  const ratings = row.ratings.filter((r) => viewerRole !== 'ARTIST' || r.isVisibleToArtist);

  return {
    id: row.id,
    artistId: row.artistId,
    hotelId: row.hotelId,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    creditCost: row.creditCost,
    notes: row.notes,
    createdAt: row.createdAt,
    // The convention's terms, visible to both parties from the request on:
    // the artist decides on exactly what the hotel is offering.
    convention: {
      companionName: row.companionName,
      boardType: row.boardType,
      transportTerms: row.transportTerms,
      transportNotes: row.transportNotes,
      performanceDescription: row.performanceDescription,
      performanceSchedule: row.performanceSchedule,
      stayValue: row.stayValueCents === null ? null : row.stayValueCents / 100,
      performanceValue: row.performanceValueCents === null ? null : row.performanceValueCents / 100,
      currency: row.currency,
      roomType: row.roomType,
      includedServices: row.includedServices,
      performanceLocation: row.performanceLocation,
      performanceDuration: row.performanceDuration,
      technicalConditions: row.technicalConditions,
      socialContent: row.socialContent,
    },
    // Who has signed the convention, and since when it is final.
    signing: {
      finalizedAt: row.conventionFinalizedAt,
      signedBy: row.signatures.map((s) => ({ party: s.party, signedAt: s.signedAt })),
    },
    // What a cancellation after signature left owing (article 14).
    claim: row.claim
      ? {
          id: row.claim.id,
          fee: { amount: row.claim.feeCents / 100, status: row.claim.feeStatus, dueAt: row.claim.feeDueAt },
          transport: {
            eligible: row.claim.transportEligible,
            status: row.claim.transportStatus,
            amount: row.claim.transportAmountCents === null ? null : row.claim.transportAmountCents / 100,
            proofs: row.claim.transportProofUrls,
            dueAt: row.claim.transportDueAt,
            settleNote: row.claim.transportSettleNote,
          },
        }
      : null,
    respondedAt: row.respondedAt,
    cancelledAt: row.cancelledAt,
    cancelledByRole: row.cancelledByRole,
    cancellationReason: row.cancellationReason,
    artist: {
      id: row.artist.id,
      stageName: row.artist.stageName,
      discipline: row.artist.discipline,
      profilePicture: row.artist.profilePicture,
      user: { id: row.artist.user.id, name: row.artist.user.name },
      contact: artistContact,
      ...(artistContact ? { phone: artistContact.phone } : {}),
    },
    hotel: {
      id: row.hotel.id,
      name: row.hotel.name,
      city: row.hotel.city,
      country: row.hotel.country,
      location: hotelLocation(row.hotel),
      profilePicture: row.hotel.profilePicture,
      user: { id: row.hotel.user.id, name: row.hotel.user.name },
      contact: hotelContact,
    },
    ratings,
  };
}

export type BookingDTO = ReturnType<typeof toBookingDTO>;
