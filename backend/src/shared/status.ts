/**
 * Who may move a booking from one status to another.
 *
 * The API accepted any status from any party it otherwise authorised, so an
 * artist could "confirm" a booking the hotel had already cancelled: the
 * cancellation had refunded the hotel's credits, and the confirmation put the
 * residency back on without charging them again. A status change is now a
 * lookup in this table, and anything not listed is refused.
 *
 * SYSTEM is the scheduled job that completes residencies whose dates are past.
 */

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'] as const
export type BookingStatusValue = (typeof BOOKING_STATUSES)[number]

export type Actor = 'ARTIST' | 'HOTEL' | 'ADMIN' | 'SYSTEM'

export const BOOKING_TRANSITIONS: Record<BookingStatusValue, Partial<Record<BookingStatusValue, readonly Actor[]>>> = {
  PENDING: {
    CONFIRMED: ['ARTIST', 'ADMIN'],
    REJECTED: ['ARTIST', 'ADMIN'],
    CANCELLED: ['HOTEL', 'ADMIN'],
  },
  CONFIRMED: {
    // The artist may withdraw too (article 13), with a reason.
    CANCELLED: ['HOTEL', 'ARTIST', 'ADMIN'],
    COMPLETED: ['ADMIN', 'SYSTEM'],
  },
  REJECTED: {},
  CANCELLED: {},
  COMPLETED: {},
}

export function canTransition(from: BookingStatusValue, to: BookingStatusValue, actor: Actor): boolean {
  return BOOKING_TRANSITIONS[from]?.[to]?.includes(actor) ?? false
}

/** The statuses `actor` may move a booking to from `from`. */
export function allowedTransitions(from: BookingStatusValue, actor: Actor): BookingStatusValue[] {
  const next = BOOKING_TRANSITIONS[from] ?? {}
  return (Object.keys(next) as BookingStatusValue[]).filter((to) => next[to]?.includes(actor))
}

/** Statuses after which the hotel's credits are no longer committed. */
export const RELEASES_CREDITS: readonly BookingStatusValue[] = ['REJECTED', 'CANCELLED']

/** A booking that still occupies the artist's calendar. */
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatusValue[] = ['PENDING', 'CONFIRMED']
