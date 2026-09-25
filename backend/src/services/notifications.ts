/**
 * In-app notifications, and the emails that go with them.
 *
 * The Notification model has existed since the first schema, with its types
 * already spelled out in a comment - BOOKING_CONFIRMED, BOOKING_CANCELLED,
 * RATING_RECEIVED - and nothing in the application had ever written a row to
 * it. So a hotel could ask an artist for a week in Marrakech and the artist
 * would only find out by happening to open the dashboard; an artist could
 * accept and the hotel would never hear. On a marketplace whose entire product
 * is the introduction, that was the introduction missing.
 *
 * TWO CHANNELS, ONE CALL. notify() writes the row and sends the mail. The row
 * is what the bell in the dashboard reads; the mail is what reaches someone
 * who is not looking at the dashboard, which on this platform is nearly
 * everyone nearly all of the time.
 *
 * IT CANNOT FAIL THE THING IT DESCRIBES. Every path is caught and logged. A
 * booking that was accepted stays accepted even if Resend is down and the
 * database write for the notification fails - the alternative, a 500 on a
 * confirmed residency because a mail provider had a bad afternoon, is far
 * worse than a missed notification. Same posture as services/email.ts.
 */
import { prisma } from '../db';
import type { SendResult } from './email';

export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'RATING_REQUESTED'
  | 'RATING_RECEIVED'
  | 'MEMBERSHIP_EXPIRING'
  | 'REFERRAL_REWARD'
  | 'ADMIN_NOTIFICATION';

interface NotifyParams {
  /** The User to notify - not the Artist or Hotel id. */
  userId: string;
  type: NotificationType;
  /** Rendered by the client; keep it flat and already-formatted. */
  payload: Record<string, unknown>;
  /**
   * The matching email, passed as a thunk so it is only built when we get
   * this far, and so this module never has to know a template's arguments.
   */
  email?: () => Promise<SendResult>;
}

/**
 * Never throws, never rejects. Returns what happened so a caller that cares
 * can log it; most callers do not await it at all.
 */
export async function notify({
  userId,
  type,
  payload,
  email,
}: NotifyParams): Promise<{ stored: boolean; mailed: boolean }> {
  let stored = false;
  let mailed = false;

  try {
    await prisma.notification.create({
      data: { userId, type, payload: JSON.stringify(payload) },
    });
    stored = true;
  } catch (err: any) {
    console.error(`[notify] could not store ${type} for ${userId}:`, err?.message);
  }

  if (email) {
    try {
      const result = await email();
      mailed = result.sent;
    } catch (err: any) {
      console.error(`[notify] could not mail ${type} to ${userId}:`, err?.message);
    }
  }

  return { stored, mailed };
}

/**
 * Notify several people about the same event. Used where both sides of a
 * booking need to hear, and where one failing must not silence the other.
 */
export async function notifyAll(items: NotifyParams[]): Promise<void> {
  await Promise.all(items.map((item) => notify(item)));
}

/** A residency, described the way every notification payload describes one. */
export function bookingPayload(booking: {
  id: string;
  startDate: Date;
  endDate: Date;
  hotel?: { name?: string | null } | null;
  artist?: { stageName?: string | null; user?: { name?: string | null } | null } | null;
}) {
  return {
    bookingId: booking.id,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    hotelName: booking.hotel?.name ?? null,
    artistName: booking.artist?.stageName || booking.artist?.user?.name || null,
  };
}
