import { Prisma } from '@prisma/client';

/** A conversation as the list shows it. No bodies: the list is read far more often than a message. */
export const threadListSelect = {
  id: true,
  subject: true,
  counterpart: true,
  counterpartName: true,
  mailbox: true,
  snippet: true,
  hasAttachments: true,
  unreadCount: true,
  lastMessageAt: true,
  lastInboundAt: true,
  lastOutboundAt: true,
  archivedAt: true,
  _count: { select: { messages: true } },
} satisfies Prisma.MailThreadSelect;

type ThreadRow = Prisma.MailThreadGetPayload<{ select: typeof threadListSelect }>;

export function toThreadDTO({ _count, archivedAt, ...thread }: ThreadRow) {
  return { ...thread, archived: Boolean(archivedAt), messageCount: _count.messages };
}

/** One message, body included. Named fields, so a column added later stays on the server. */
export const messageSelect = {
  id: true,
  direction: true,
  status: true,
  fromAddress: true,
  fromName: true,
  to: true,
  cc: true,
  replyTo: true,
  subject: true,
  text: true,
  html: true,
  error: true,
  sentAt: true,
  readAt: true,
  sentBy: { select: { id: true, name: true } },
  attachments: {
    select: { id: true, filename: true, contentType: true, size: true, inline: true, contentId: true },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.MailMessageSelect;

type MessageRow = Prisma.MailMessageGetPayload<{ select: typeof messageSelect }>;

export function toMessageDTO(message: MessageRow) {
  const { attachments, ...rest } = message;
  return {
    ...rest,
    /* An inline image is already in the HTML as a data: URI, so listing it as
       a file too would show every logo in a signature as an attachment. One
       the HTML still points at by cid: - a body too large to inline, see
       services/mail.ts - is listed, because that is the only way to open it. */
    attachments: attachments
      .filter((a) => !a.inline || !message.html || (a.contentId && message.html.includes(`cid:${a.contentId}`)))
      .map(({ contentId: _contentId, ...a }) => a),
  };
}
