/**
 * The shared inbox, for administrators: the conversations, one conversation,
 * answering it, writing a new message, and the attachments. The mail itself
 * moves through services/mail.ts.
 *
 * Every route is ADMIN only, and the guard sits on the router rather than on
 * each route, so a route added here later cannot be opened by forgetting it.
 * This is the business's correspondence with hotels, artists and suppliers.
 */
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import {
  MAX_ATTACHMENT_BYTES,
  Mailbox,
  OutgoingAttachment,
  attachmentLink,
  mailSetup,
  parseAddressList,
  replyEnvelope,
  sendMail,
  syncInbox,
  unreadTotal,
} from '../services/mail';
import { messageSelect, threadListSelect, toMessageDTO, toThreadDTO } from '../views/mail';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

const PAGE_SIZE = 30;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 10 },
});

const handleUploadError = (err: any, _req: any, _res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Pièce jointe trop lourde : 4 Mo au total.' : err.code === 'LIMIT_FILE_COUNT' ? '10 pièces jointes au plus.' : 'Envoi impossible.';
    return next(new CustomError(message, 400, { fields: { attachments: message } }));
  }
  next(err);
};

function attachmentsOf(req: AuthRequest): OutgoingAttachment[] {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  return files.map((file) => ({
    // multer reads the multipart filename as Latin-1, which turns "devis-été.pdf"
    // into mojibake; the bytes were UTF-8.
    filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    content: file.buffer,
    contentType: file.mimetype || 'application/octet-stream',
  }));
}

const emailCheck = z.string().email();

/** "a@b.ma, Salma <s@c.ma>" as mailboxes, every address checked, the first bad one named. */
function recipients(raw: string | undefined, field: string): Mailbox[] {
  const list = parseAddressList(raw ?? '');
  const bad = list.find((m) => !emailCheck.safeParse(m.address).success);
  if (bad) {
    const message = `Adresse invalide : ${bad.address}`;
    throw new CustomError(message, 400, { fields: { [field]: message } });
  }
  return list;
}

/** GET /setup - what is configured, the addresses to write from, and the unread count. */
router.get('/setup', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { ...mailSetup(), unread: await unreadTotal() } });
}));

/** GET /unread - the sidebar badge, polled. */
router.get('/unread', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { unread: await unreadTotal() } });
}));

const listSchema = z.object({
  folder: z.enum(['inbox', 'sent', 'archived', 'all']).default('inbox'),
  q: z.string().trim().max(200).optional(),
  unread: z.enum(['0', '1']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

/**
 * GET /threads - one folder of conversations, latest first.
 *
 * The inbox is what the other party has written to and nobody has archived;
 * a conversation the console opened and nobody has answered is in Sent only,
 * the way every mail client files it.
 */
router.get('/threads', asyncHandler(async (req, res) => {
  const { folder, q, unread, page } = listSchema.parse(req.query);

  const where: Prisma.MailThreadWhereInput = {
    ...(folder === 'inbox' ? { archivedAt: null, lastInboundAt: { not: null } } : {}),
    ...(folder === 'sent' ? { lastOutboundAt: { not: null } } : {}),
    ...(folder === 'archived' ? { archivedAt: { not: null } } : {}),
    ...(unread === '1' ? { unreadCount: { gt: 0 } } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: 'insensitive' } },
            { counterpart: { contains: q, mode: 'insensitive' } },
            { counterpartName: { contains: q, mode: 'insensitive' } },
            { messages: { some: { text: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.MailThreadOrderByWithRelationInput[] =
    folder === 'sent' ? [{ lastOutboundAt: 'desc' }, { id: 'desc' }] : [{ lastMessageAt: 'desc' }, { id: 'desc' }];

  const [rows, total, unreadCount] = await Promise.all([
    prisma.mailThread.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: threadListSelect }),
    prisma.mailThread.count({ where }),
    unreadTotal(),
  ]);

  res.json({
    success: true,
    data: {
      threads: rows.map(toThreadDTO),
      pagination: { page, limit: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
      unread: unreadCount,
    },
  });
}));

/**
 * GET /threads/:id - every message, oldest first, and who an answer would go
 * to. Opening a conversation reads it.
 */
router.get('/threads/:id', asyncHandler(async (req, res) => {
  const thread = await prisma.mailThread.findUnique({ where: { id: req.params.id }, select: threadListSelect });
  if (!thread) throw new CustomError('Conversation introuvable.', 404);

  const [messages, lastInbound] = await Promise.all([
    prisma.mailMessage.findMany({ where: { threadId: thread.id }, orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }], select: messageSelect }),
    prisma.mailMessage.findFirst({
      where: { threadId: thread.id, direction: 'INBOUND' },
      orderBy: { sentAt: 'desc' },
      select: { fromAddress: true, fromName: true, replyTo: true },
    }),
  ]);

  if (thread.unreadCount > 0) {
    const now = new Date();
    await Promise.all([
      prisma.mailThread.update({ where: { id: thread.id }, data: { unreadCount: 0 } }),
      prisma.mailMessage.updateMany({ where: { threadId: thread.id, direction: 'INBOUND', readAt: null }, data: { readAt: now } }),
    ]);
  }

  res.json({
    success: true,
    data: {
      thread: toThreadDTO({ ...thread, unreadCount: 0 }),
      messages: messages.map(toMessageDTO),
      reply: replyEnvelope(thread, lastInbound),
      // Reading it changed the total; the badges take it from here, not from the next poll.
      unread: await unreadTotal(),
    },
  });
}));

const updateSchema = z
  .object({ archived: z.boolean().optional(), unread: z.boolean().optional() })
  .refine((v) => v.archived !== undefined || v.unread !== undefined, { message: 'Rien à modifier.' });

/** PATCH /threads/:id - archive or bring back, mark read or unread. */
router.patch('/threads/:id', asyncHandler(async (req: AuthRequest, res) => {
  const change = updateSchema.parse(req.body);
  const thread = await prisma.mailThread.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!thread) throw new CustomError('Conversation introuvable.', 404);

  if (change.unread === true) {
    // Unread again from the last message the other party wrote, as a mail client does.
    const last = await prisma.mailMessage.findFirst({
      where: { threadId: thread.id, direction: 'INBOUND' },
      orderBy: { sentAt: 'desc' },
      select: { id: true },
    });
    if (last) await prisma.mailMessage.update({ where: { id: last.id }, data: { readAt: null } });
  }
  if (change.unread === false) {
    await prisma.mailMessage.updateMany({ where: { threadId: thread.id, direction: 'INBOUND', readAt: null }, data: { readAt: new Date() } });
  }

  const updated = await prisma.mailThread.update({
    where: { id: thread.id },
    data: {
      ...(change.archived !== undefined ? { archivedAt: change.archived ? new Date() : null } : {}),
      ...(change.unread !== undefined ? { unreadCount: change.unread ? 1 : 0 } : {}),
    },
    select: threadListSelect,
  });

  res.json({ success: true, data: { thread: toThreadDTO(updated), unread: await unreadTotal() } });
}));

const replySchema = z.object({
  body: z.string().trim().min(1, 'Écrivez votre réponse.').max(50_000, 'Message trop long.'),
  cc: z.string().max(4000).optional(),
  clientId: z.string().max(100).optional(),
});

/** POST /threads/:id/reply - multipart, so files can ride along. */
router.post('/threads/:id/reply', upload.array('attachments', 10), handleUploadError, asyncHandler(async (req: AuthRequest, res) => {
  const input = replySchema.parse(req.body);
  const result = await sendMail({
    senderId: req.user!.id,
    threadId: req.params.id,
    body: input.body,
    cc: recipients(input.cc, 'cc'),
    attachments: attachmentsOf(req),
    idempotencyKey: input.clientId,
  });
  res.status(201).json({ success: true, data: { threadId: result.threadId, message: toMessageDTO(result.message) } });
}));

const composeSchema = z.object({
  from: z.string().trim().max(320).optional(),
  to: z.string().trim().min(1, 'Indiquez au moins un destinataire.').max(4000),
  cc: z.string().max(4000).optional(),
  subject: z.string().trim().min(1, 'Indiquez un objet.').max(300, 'Objet trop long.'),
  body: z.string().trim().min(1, 'Le message est vide.').max(50_000, 'Message trop long.'),
  clientId: z.string().max(100).optional(),
});

/** POST /send - a new conversation. */
router.post('/send', upload.array('attachments', 10), handleUploadError, asyncHandler(async (req: AuthRequest, res) => {
  const input = composeSchema.parse(req.body);
  const result = await sendMail({
    senderId: req.user!.id,
    from: input.from,
    to: recipients(input.to, 'to'),
    cc: recipients(input.cc, 'cc'),
    subject: input.subject,
    body: input.body,
    attachments: attachmentsOf(req),
    idempotencyKey: input.clientId,
  });
  res.status(201).json({ success: true, data: { threadId: result.threadId, message: toMessageDTO(result.message) } });
}));

const syncSchema = z.object({ force: z.boolean().optional() });

/**
 * POST /sync - pull from Resend whatever the webhook has not delivered. A
 * click on Actualiser forces it; the console's own polling does not, so two
 * administrators with the page open share one sync every few seconds.
 */
router.post('/sync', asyncHandler(async (req, res) => {
  const { force } = syncSchema.parse(req.body ?? {});
  const result = await syncInbox({ force: force ?? true });
  res.json({ success: true, data: { ...result, unread: await unreadTotal() } });
}));

/** GET /attachments/:id - a short-lived link to the file. */
router.get('/attachments/:id', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await attachmentLink(req.params.id) });
}));

export { router as mailRoutes };
