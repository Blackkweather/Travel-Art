/**
 * The read side of services/notifications.ts.
 *
 * Everything here is scoped to the authenticated user by userId in the where
 * clause, never by an id passed in the body: a notification is the only record
 * in this app that names both sides of a booking, so one leaking across
 * accounts would leak a residency.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { parseJsonField } from '../utils/parseJsonField';

const router = Router();

/** Deliberately small. The bell is a recent-activity list, not an archive. */
const LIMIT = 30;

const listQuerySchema = z.object({
  unread: z.enum(['0', '1']).optional(),
});

/**
 * GET /notifications - the current user's most recent, newest first, with the
 * unread count alongside so the bell needs one request rather than two.
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { unread } = listQuerySchema.parse(req.query);
    const where = { userId: req.user!.id, ...(unread === '1' ? { read: false } : {}) };

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    res.json({
      success: true,
      data: {
        unreadCount,
        // Parsed here rather than in the client: payload is written as a JSON
        // string by the notifier, and every consumer would otherwise repeat
        // the same try/catch around JSON.parse.
        notifications: rows.map((n) => ({
          id: n.id,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
          payload: parseJsonField<Record<string, unknown>>(n.payload, {}),
        })),
      },
    });
  })
);

/** PATCH /notifications/:id/read - marks one as read. */
router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    // updateMany, not update: scoping by userId in the where clause means a
    // notification belonging to someone else matches nothing instead of
    // throwing a not-found that would confirm the id exists.
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { read: true },
    });

    if (result.count === 0) {
      throw new CustomError('Notification not found', 404);
    }

    res.json({ success: true, data: { read: true } });
  })
);

/** POST /notifications/read-all - clears the badge in one call. */
router.post(
  '/read-all',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ success: true, data: { marked: result.count } });
  })
);

export { router as notificationRoutes };
