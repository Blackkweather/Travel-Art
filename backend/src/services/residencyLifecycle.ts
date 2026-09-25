/**
 * Closing the loop a residency opens.
 *
 * A booking could reach CONFIRMED and then stay there for ever. Nothing set
 * COMPLETED - not the artist, not the hotel; only an admin, by hand, on a
 * screen nobody visits. So a residency never ended, nobody was ever asked how
 * it went, and three things downstream of that never happened:
 *
 *   - the landing page's "Ce que les hôtels en disent" had nothing to show,
 *     because testimonials are ratings and ratings need a finished residency;
 *   - the Artiste confirmé membership advertises "distinctions et évaluations"
 *     that no artist could ever accumulate;
 *   - /api/stats reported completedBookings as whatever an admin had touched.
 *
 * This is the missing step: a residency whose last night has passed is over,
 * and the house that hosted it is asked to say how it went.
 *
 * Runs as a scheduled job with no user attached, so it uses the privileged
 * client deliberately - there is no caller whose row-level identity could
 * scope it, and the whole point is to sweep every tenant at once.
 */
import { prismaAdmin } from '../db';
import { notify } from './notifications';

export interface SweepResult {
  completed: number;
  prompted: number;
}

/**
 * Marks every confirmed residency whose end date has passed as completed, and
 * asks the hotel for a rating.
 *
 * Idempotent: it only ever looks at CONFIRMED rows, so a residency it has
 * already completed is invisible to the next run. Safe to run hourly, daily,
 * or twice by accident.
 */
export async function completeFinishedResidencies(now = new Date()): Promise<SweepResult> {
  const due = await prismaAdmin.booking.findMany({
    where: { status: 'CONFIRMED', endDate: { lt: now } },
    include: {
      hotel: { include: { user: { select: { id: true } } } },
      artist: {
        select: {
          stageName: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (due.length === 0) return { completed: 0, prompted: 0 };

  const ids = due.map((b) => b.id);
  const { count } = await prismaAdmin.booking.updateMany({
    where: { id: { in: ids } },
    data: { status: 'COMPLETED' },
  });

  /* Ask the house how it went. This is the only prompt to rate that exists,
     and without it the rating route is a form nobody is ever sent to. */
  let prompted = 0;
  for (const booking of due) {
    const hotelUserId = booking.hotel?.user?.id;
    if (!hotelUserId) continue;

    const artistName =
      booking.artist?.stageName || booking.artist?.user?.name || 'votre artiste';

    const result = await notify({
      userId: hotelUserId,
      type: 'RATING_REQUESTED',
      payload: {
        bookingId: booking.id,
        artistName,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
      },
    });
    if (result.stored) prompted += 1;
  }

  console.log(`[residencies] completed ${count}, asked ${prompted} houses to rate`);
  return { completed: count, prompted };
}
