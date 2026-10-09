/**
 * Scheduled work, triggered from outside.
 *
 * One job today: ending residencies whose last night has passed, and asking
 * the house that hosted them how it went. See services/residencyLifecycle.ts
 * for why that was not happening at all.
 *
 * AUTH. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`, so
 * that is what is checked. It fails closed: with CRON_SECRET unset the route
 * refuses everyone rather than running for anyone, because a sweep that
 * completes residencies is not something an anonymous caller should be able
 * to trigger. An authenticated admin can always run it by hand.
 */
import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { completeFinishedResidencies } from '../services/residencyLifecycle';

const router = Router();

/** Constant-time-ish compare, so the secret is not probed a character at a time. */
function secretMatches(header: string | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const offered = (header ?? '').replace(/^Bearer\s+/i, '');
  if (offered.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ offered.charCodeAt(i);
  }
  return diff === 0;
}

/** GET, because that is what Vercel Cron issues. */
router.get(
  '/residencies',
  asyncHandler(async (req, res) => {
    if (!secretMatches(req.headers.authorization)) {
      throw new CustomError('Unauthorized', 401);
    }
    const result = await completeFinishedResidencies();
    res.json({ success: true, data: result });
  })
);

/** The same sweep, for an admin who does not want to wait for tomorrow. */
router.post(
  '/residencies',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req: AuthRequest, res) => {
    const result = await completeFinishedResidencies();
    res.json({ success: true, data: result });
  })
);

export { router as maintenanceRoutes };
