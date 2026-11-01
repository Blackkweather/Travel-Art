/**
 * The shared inbox: the business's own mail, read and answered from the admin
 * console.
 *
 * Resend carries the mail both ways - its webhook says a message arrived, its
 * API hands over the content, and it delivers what the console sends. The
 * tables are the copy that matters: every message, the conversation it belongs
 * to, who answered it. If the provider changes, the history does not move.
 *
 * Four things this module is deliberate about.
 *
 * A MESSAGE IS STORED ONCE. The webhook and the sync can both meet the same
 * email - a redelivery, or a sync running while the webhook is in flight.
 * Resend's id is unique in the table and each message is written in one
 * transaction with its thread, so the second arrival is a no-op rather than a
 * duplicate or a conversation with nothing in it.
 *
 * THREADS FOLLOW THE HEADERS. A reply carries In-Reply-To and References
 * naming the messages it answers, and that - not the subject - is what joins
 * it to its conversation. The subject is only the fallback for clients that
 * drop the headers, and only for a "Re:" from the same person within a
 * fortnight, so two unrelated "Question" mails from one sender stay apart.
 *
 * THE BODY IS A STRANGER'S HTML. It is stored as received and shown only
 * inside a sandboxed iframe with scripts off (see AdminMail.tsx). Nothing here
 * pretends to sanitise it, because a sanitiser is a promise this file cannot
 * keep, and the sandbox is one the browser does.
 *
 * IT REPORTS INSTEAD OF PRETENDING. Unlike services/email.ts, a person is
 * waiting on every send here. Unconfigured, the console says so and a send is
 * refused with the reason; a refusal from Resend comes back to the screen it
 * was typed on, with the draft still in it.
 */
import { Resend, type GetReceivingEmailResponseSuccess } from 'resend';
import { Prisma } from '@prisma/client';
import { prismaAdmin } from '../db';
import { config } from '../config';
import { CustomError } from '../middleware/errorHandler';
import { newMailAlertEmail } from './email';
import { background } from './background';
import { messageSelect } from '../views/mail';

// ------------------------------------------------------------ configuration

let cached: { key: string; client: Resend } | null = null;

/** Built on first use, and again if the key changes, so a test can set it late. */
export function mailClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached?.key !== key) cached = { key, client: new Resend(key) };
  return cached.client;
}

export interface Mailbox {
  name: string | null;
  address: string;
}

const domainOf = (address: string) => address.split('@')[1]?.toLowerCase() ?? '';

/** `Salma Bennani <salma@example.com>` or a bare address. The address is lower-cased. */
export function parseAddress(raw: string): Mailbox {
  const value = String(raw ?? '').trim();
  const angled = /^(.*?)\s*<([^<>]+)>\s*$/.exec(value);
  if (angled) {
    const name = angled[1].trim().replace(/^"(.*)"$/, '$1').replace(/\\(.)/g, '$1').trim();
    return { name: name || null, address: angled[2].trim().toLowerCase() };
  }
  return { name: null, address: value.replace(/^mailto:/i, '').toLowerCase() };
}

/**
 * Addresses as people type them: commas or semicolons between, and commas
 * allowed inside a quoted name ("Hôtel Atlas, Marrakech" <resa@atlas.ma>).
 */
export function parseAddressList(raw: string | string[] | null | undefined): Mailbox[] {
  const items = Array.isArray(raw) ? raw : splitAddresses(String(raw ?? ''));
  return items.map(parseAddress).filter((m) => m.address);
}

function splitAddresses(raw: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  let angled = false;
  for (const ch of raw) {
    if (ch === '"') quoted = !quoted;
    else if (ch === '<' && !quoted) angled = true;
    else if (ch === '>' && !quoted) angled = false;
    if ((ch === ',' || ch === ';') && !quoted && !angled) {
      if (current.trim()) out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** `Name <address>`, the name quoted only when it holds something that needs it. */
export function formatAddress({ name, address }: Mailbox): string {
  if (!name) return address;
  const display = /^[\p{L}\p{N} .'-]+$/u.test(name) ? name : `"${name.replace(/(["\\])/g, '\\$1')}"`;
  return `${display} <${address}>`;
}

/**
 * The addresses the console writes from. MAIL_ADDRESSES names them -
 * "Travel Art <contact@travelarts.live>, Réservations <resa@travelarts.live>" -
 * and the first is the default for a new message.
 *
 * Unset, the site's own domain gets contact@. Only a real domain, though: on
 * localhost or *.vercel.app there is nothing Resend would agree to send from.
 */
export function mailboxes(): Mailbox[] {
  const configured = parseAddressList(process.env.MAIL_ADDRESSES).filter((m) => m.address.includes('@'));
  if (configured.length) return configured;

  let host = '';
  try {
    host = new URL(config.frontendUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return [];
  }
  if (!host.includes('.') || host.endsWith('.vercel.app') || /^[\d.]+$/.test(host)) return [];
  return [{ name: 'Travel Art', address: `contact@${host}` }];
}

/** The domains the console may send from: those of its mailboxes. */
const ownDomains = () => new Set(mailboxes().map((m) => domainOf(m.address)));

/**
 * Our address for a conversation: the one the other party wrote to, when it
 * is on one of our domains - so a mail to resa@ is answered from resa@ - and
 * otherwise the default mailbox.
 */
export function senderFor(address?: string | null): Mailbox | null {
  const boxes = mailboxes();
  if (!boxes.length) return null;
  const wanted = address?.toLowerCase();
  if (wanted) {
    const known = boxes.find((b) => b.address === wanted);
    if (known) return known;
    if (ownDomains().has(domainOf(wanted))) return { name: boxes[0].name, address: wanted };
  }
  return boxes[0];
}

/** What the console shows about its own setup, so a missing key is a sentence, not a mystery. */
export function mailSetup() {
  return {
    /** Sending works, and so does the sync that pulls received mail. */
    configured: Boolean(mailClient()) && mailboxes().length > 0,
    /** Received mail also arrives the moment it lands, not only when the console asks. */
    webhook: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    mailboxes: mailboxes(),
  };
}

// ------------------------------------------------------------------- text

/** Re:, RE :, Fwd:, TR: (French for forwarded), AW: and the like, however many. */
const REPLY_PREFIX = /^\s*(?:(?:re|aw|sv|antw|fwd?|tr|wg|rv|enc)\s*(?:\[\d+\])?\s*:\s*)+/i;

export const baseSubject = (subject: string) => subject.replace(REPLY_PREFIX, '').trim();
const isReplySubject = (subject: string) => REPLY_PREFIX.test(subject);
export const replySubject = (subject: string) => (/^\s*re\s*:/i.test(subject) ? subject.trim() : `Re: ${subject.trim()}`);

/**
 * `<CAH1@mail.gmail.com>` becomes `CAH1@mail.gmail.com`, the form stored and
 * compared. The case stays: a Message-ID's local part is case-sensitive, and a
 * reply quoting a lower-cased id is one a strict client cannot thread.
 */
export function normalizeMessageId(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim().replace(/^<+|>+$/g, '').trim();
  return value || null;
}

/** Every id in a References or In-Reply-To header, in order, once each. */
export function parseMessageIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const found = String(raw).match(/<[^<>]+>/g) ?? String(raw).split(/[\s,]+/);
  return [...new Set(found.map(normalizeMessageId).filter((id): id is string => Boolean(id)))];
}

/** Header names are case-insensitive, and providers disagree on their case. */
function header(headers: Record<string, unknown> | null | undefined, name: string): string | null {
  if (!headers) return null;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return Array.isArray(value) ? value.join(' ') : String(value);
  }
  return null;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntity(whole: string, code: string): string {
  const c = code.toLowerCase();
  try {
    if (c.startsWith('#x')) return String.fromCodePoint(parseInt(c.slice(2), 16));
    if (c.startsWith('#')) return String.fromCodePoint(parseInt(c.slice(1), 10));
  } catch {
    return whole;
  }
  return ENTITIES[c] ?? whole;
}

/** Enough to search, preview and quote an HTML-only message - not to render one. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script|head|title)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, decodeEntity)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The new part of a reply: everything above the first quoted line, or above
 * the "Le … a écrit :" / "On … wrote:" line that mail clients put over the
 * history. Used for the preview, so the list shows what is new.
 */
export function newPart(text: string): string {
  const lines = text.split(/\r?\n/);
  const cut = lines.findIndex(
    (line) =>
      /^\s*>/.test(line) ||
      /^\s*(le|on)\s.{0,300}(a écrit|wrote)\s*:\s*$/i.test(line) ||
      /^\s*-{2,}\s*(original message|message d['’]origine)/i.test(line)
  );
  return (cut === -1 ? lines : lines.slice(0, cut)).join('\n').trim();
}

export function snippetOf(text: string | null | undefined, html: string | null | undefined): string {
  const body = text?.trim() ? text : html ? htmlToText(html) : '';
  return (newPart(body) || body).replace(/\s+/g, ' ').trim().slice(0, 200);
}

const validDate = (value: string | null | undefined) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

// ---------------------------------------------------------------- inbound

/** Above this the inline images are left as cid: references (see importReceivedEmail). */
const MAX_HTML_CHARS = 1_500_000;
/** How far back a "Re:" without headers may join a conversation by its subject. */
const SUBJECT_MATCH_DAYS = 14;

type Tx = Prisma.TransactionClient;

export interface ImportResult {
  imported: boolean;
  threadId?: string;
}

/**
 * Store one received email, by Resend id. Safe to call any number of times
 * for the same id: every call after the first finds the row and returns it.
 */
export async function importReceivedEmail(resendId: string): Promise<ImportResult> {
  const known = await prismaAdmin.mailMessage.findUnique({ where: { resendId }, select: { threadId: true } });
  if (known) return { imported: false, threadId: known.threadId };

  const resend = mailClient();
  if (!resend) throw new CustomError('La messagerie n’est pas configurée (RESEND_API_KEY).', 503, { code: 'MAIL_NOT_CONFIGURED' });

  const first = await resend.emails.receiving.get(resendId);
  if (first.error || !first.data) {
    throw new Error(`Resend did not return received email ${resendId}: ${first.error?.message ?? 'no data'}`);
  }
  let email = first.data;

  /* Resend writes embedded images into the HTML as data: URIs, which is what
     lets them display under the app's Content-Security-Policy. A newsletter
     full of them can run to megabytes, though, so past a ceiling the body is
     fetched again with the images left as cid: references, and they are
     listed as attachments instead. */
  if (email.html && email.html.length > MAX_HTML_CHARS) {
    const lean = await resend.emails.receiving.get(resendId, { html_format: 'cid' });
    if (lean.data) email = lean.data;
  }

  let stored: StoredInbound;
  try {
    stored = await storeInbound(email);
  } catch (err: any) {
    // The webhook and the sync met this message at the same moment and the
    // other one stored it; its transaction won, this one rolled back whole.
    if (err?.code === 'P2002') {
      const row = await prismaAdmin.mailMessage.findUnique({ where: { resendId }, select: { threadId: true } });
      return { imported: false, threadId: row?.threadId };
    }
    throw err;
  }

  if (stored.firstUnread) alertNewMail(stored);
  return { imported: true, threadId: stored.threadId };
}

interface StoredInbound {
  threadId: string;
  /** The conversation had nothing unread before this message. */
  firstUnread: boolean;
  from: Mailbox;
  subject: string;
  snippet: string;
}

async function storeInbound(email: GetReceivingEmailResponseSuccess): Promise<StoredInbound> {
  const from = parseAddress(email.from);
  const addresses = (list: string[] | null | undefined) => (list ?? []).map((a) => parseAddress(a).address);
  const to = addresses(email.to);
  const cc = addresses(email.cc);
  const replyTo = addresses(email.reply_to);

  // Which of our addresses it was written to: what an answer should come from.
  const domains = ownDomains();
  const recipients = [...addresses(email.received_for), ...to, ...cc];
  const mailbox = recipients.find((a) => domains.has(domainOf(a))) ?? recipients[0] ?? from.address;

  const html = email.html || null;
  const text = email.text?.trim() ? email.text : html ? htmlToText(html) : null;
  const snippet = snippetOf(text, html);
  const subject = (email.subject ?? '').trim();
  const sentAt = validDate(email.created_at) ?? new Date();

  const messageId = normalizeMessageId(email.message_id || header(email.headers, 'message-id'));
  const inReplyTo = parseMessageIds(header(email.headers, 'in-reply-to'))[0] ?? null;
  const references = parseMessageIds(header(email.headers, 'references'));

  const attachments = (email.attachments ?? []).map((a) => ({
    resendId: a.id,
    filename: a.filename || 'piece-jointe',
    contentType: a.content_type || 'application/octet-stream',
    size: a.size ?? 0,
    contentId: a.content_id ? a.content_id.replace(/^<|>$/g, '') : null,
    inline: /inline/i.test(a.content_disposition ?? '') && Boolean(a.content_id),
  }));
  const hasFiles = attachments.some((a) => !a.inline);

  return prismaAdmin.$transaction(async (tx) => {
    const existing = await threadFor(tx, [inReplyTo, ...references], from.address, subject);

    const thread = existing
      ? await tx.mailThread.update({
          where: { id: existing.id },
          data: {
            // A message older than the latest one - the sync catching up - must
            // not move the conversation's date backwards or replace its preview.
            ...(sentAt >= existing.lastMessageAt ? { lastMessageAt: sentAt, snippet } : {}),
            ...(!existing.lastInboundAt || sentAt > existing.lastInboundAt ? { lastInboundAt: sentAt } : {}),
            unreadCount: { increment: 1 },
            // New mail brings an archived conversation back, as it would anywhere.
            archivedAt: null,
            ...(hasFiles ? { hasAttachments: true } : {}),
            ...(!existing.counterpartName && from.name ? { counterpartName: from.name } : {}),
          },
        })
      : await tx.mailThread.create({
          data: {
            subject: subject || '(sans objet)',
            counterpart: from.address,
            counterpartName: from.name,
            mailbox,
            snippet,
            hasAttachments: hasFiles,
            unreadCount: 1,
            lastMessageAt: sentAt,
            lastInboundAt: sentAt,
          },
        });

    await tx.mailMessage.create({
      data: {
        threadId: thread.id,
        direction: 'INBOUND',
        status: 'RECEIVED',
        resendId: email.id,
        messageId,
        inReplyTo,
        references,
        fromAddress: from.address,
        fromName: from.name,
        to,
        cc,
        replyTo,
        subject,
        text,
        html,
        snippet,
        sentAt,
        attachments: { create: attachments },
      },
    });

    return { threadId: thread.id, firstUnread: !existing || existing.unreadCount === 0, from, subject, snippet };
  });
}

/**
 * The conversation a message belongs to: the thread of any message it names
 * in In-Reply-To or References, else - for a "Re:" whose client dropped those
 * headers - the same person's recent conversation with the same subject.
 */
async function threadFor(tx: Tx, ids: (string | null)[], counterpart: string, subject: string) {
  const named = ids.filter((id): id is string => Boolean(id));
  if (named.length) {
    // The id stored for a message we sent is whatever Resend reported, which
    // may be the bare local part of the header a reply quotes, so both forms
    // are tried.
    const candidates = [...new Set(named.flatMap((id) => [id, id.split('@')[0]]))];
    const hit = await tx.mailMessage.findFirst({
      where: { messageId: { in: candidates } },
      orderBy: { sentAt: 'desc' },
      select: { thread: true },
    });
    if (hit) return hit.thread;
  }

  if (!isReplySubject(subject)) return null;
  const base = baseSubject(subject).toLowerCase();
  const recent = await tx.mailThread.findMany({
    where: { counterpart, lastMessageAt: { gte: new Date(Date.now() - SUBJECT_MATCH_DAYS * 86400000) } },
    orderBy: { lastMessageAt: 'desc' },
    take: 20,
  });
  return recent.find((t) => baseSubject(t.subject).toLowerCase() === base) ?? null;
}

/**
 * Tell the coordinator a message arrived, over the platform's ordinary mail:
 * the console is not something anyone keeps open. Once per conversation until
 * it is read, so a back-and-forth does not become a stream of alerts.
 *
 * Never when the alert itself would land in this inbox. ADMIN_NOTIFY_EMAIL on
 * one of our own domains, or a message sent by the platform's own address,
 * would otherwise alert about the alert, forever.
 */
function alertNewMail({ threadId, from, subject, snippet }: StoredInbound) {
  if (process.env.MAIL_ALERTS === '0') return;
  const target = process.env.ADMIN_NOTIFY_EMAIL;
  if (!target) return;
  const domains = ownDomains();
  if (domains.has(domainOf(parseAddress(target).address))) return;
  const platformSenders = [process.env.SMTP_USER, process.env.SMTP_FROM, process.env.RESEND_FROM]
    .filter(Boolean)
    .map((a) => parseAddress(a as string).address);
  if (platformSenders.includes(from.address)) return;

  // A subject is typed by a stranger and ends up in a mail header.
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  background(
    newMailAlertEmail(
      oneLine(from.name || from.address),
      oneLine(subject) || '(sans objet)',
      snippet,
      `${config.frontendUrl}/dashboard/mail?thread=${threadId}`
    ),
    'new mail alert'
  );
}

// ------------------------------------------------------------------- sync

/** Pages of 50, newest first. */
const SYNC_PAGES = 3;
/** Past this, the rest waits for the next sync rather than holding the request. */
const SYNC_IMPORT_LIMIT = 25;
/** A sync the console asked for seconds ago is not repeated. */
const SYNC_INTERVAL_MS = 15_000;
/**
 * Space between the sync's calls to Resend. Its API allows about two requests a
 * second per team, and a catch-up of 25 messages fired back to back would hit
 * that limit after the second and leave the rest for the next pass.
 */
const SYNC_PACE_MS = process.env.NODE_ENV === 'test' ? 0 : 600;
const pace = () => (SYNC_PACE_MS ? new Promise((resolve) => setTimeout(resolve, SYNC_PACE_MS)) : Promise.resolve());

let syncing: Promise<SyncResult> | null = null;
let lastSyncAt = 0;

export interface SyncResult {
  imported: number;
  /** More was waiting than one sync imports. */
  more: boolean;
  skipped?: 'not-configured' | 'recent';
  error?: string;
}

/**
 * Pull what the webhook may have missed: Resend's list of received mail,
 * imported where the table does not have it yet.
 *
 * The webhook is the fast path; this is the one that cannot be misconfigured.
 * A deploy at the wrong moment, a webhook nobody has set up yet, a secret
 * pasted wrong - the console still shows every message the next time it is
 * opened.
 */
export function syncInbox(options: { force?: boolean } = {}): Promise<SyncResult> {
  if (!mailClient()) return Promise.resolve({ imported: 0, more: false, skipped: 'not-configured' });
  // One at a time per instance: a second caller shares the run in progress.
  if (syncing) return syncing;
  if (!options.force && Date.now() - lastSyncAt < SYNC_INTERVAL_MS) {
    return Promise.resolve({ imported: 0, more: false, skipped: 'recent' });
  }
  syncing = runSync().finally(() => {
    syncing = null;
    lastSyncAt = Date.now();
  });
  return syncing;
}

async function runSync(): Promise<SyncResult> {
  const resend = mailClient();
  if (!resend) return { imported: 0, more: false, skipped: 'not-configured' };

  const missing: string[] = [];
  let after: string | undefined;
  for (let page = 0; page < SYNC_PAGES; page++) {
    const { data, error } = await resend.emails.receiving.list(after ? { limit: 50, after } : { limit: 50 });
    if (error || !data) return { imported: 0, more: false, error: error?.message ?? 'Resend returned no list' };

    const ids = data.data.map((e) => e.id);
    if (!ids.length) break;
    const stored = await prismaAdmin.mailMessage.findMany({ where: { resendId: { in: ids } }, select: { resendId: true } });
    const known = new Set(stored.map((r) => r.resendId));
    missing.push(...ids.filter((id) => !known.has(id)));

    // Newest first: once a page holds messages already stored, everything
    // older was stored by the pass that stored those.
    if (known.size > 0 || !data.has_more) break;
    after = ids[ids.length - 1];
    await pace();
  }

  // Oldest first, so a conversation is assembled in the order it was written:
  // a reply imported before its original would open a thread of its own.
  const batch = missing.reverse().slice(0, SYNC_IMPORT_LIMIT);
  let imported = 0;
  for (const [index, id] of batch.entries()) {
    if (index > 0) await pace();
    try {
      if ((await importReceivedEmail(id)).imported) imported++;
    } catch (err: any) {
      // Rate-limited or Resend unwell: what is done stays done, the rest waits.
      console.error(`[mail] sync stopped at ${id}:`, err?.message);
      return { imported, more: true, error: err?.message };
    }
  }
  return { imported, more: missing.length > batch.length };
}

// --------------------------------------------------------------- delivery

/**
 * What the receiving server did with a message the console sent. Events for
 * Resend ids that are not ours - the platform's own notification mail, when
 * that goes through Resend - match no row and change nothing.
 */
export async function recordDelivery(resendId: string, status: 'DELIVERED' | 'BOUNCED' | 'FAILED', reason?: string | null) {
  await prismaAdmin.mailMessage.updateMany({
    where: {
      resendId,
      direction: 'OUTBOUND',
      // Events can arrive out of order; a late "delivered" must not paper over a bounce.
      ...(status === 'DELIVERED' ? { status: 'SENT' as const } : {}),
    },
    data: { status, error: reason ? reason.slice(0, 500) : null },
  });
}

// --------------------------------------------------------------- outbound

/** What a function request can carry: Vercel refuses bodies over 4.5 MB. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_RECIPIENTS = 20;

export interface OutgoingAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface Outgoing {
  /** The administrator sending it. */
  senderId: string;
  /** What the administrator typed. Any quoted history is added here. */
  body: string;
  cc: Mailbox[];
  attachments: OutgoingAttachment[];
  /** From the client, so a double click or a retried request sends once. */
  idempotencyKey?: string;
  /** A reply: the envelope comes from the conversation. */
  threadId?: string;
  /** A new message. */
  from?: string | null;
  to?: Mailbox[];
  subject?: string;
}

type ThreadEnvelopeSource = { subject: string; mailbox: string; counterpart: string; counterpartName: string | null };
type LastInbound = { fromAddress: string; fromName: string | null; replyTo: string[] } | null;

/**
 * Who a reply goes to and comes from: the Reply-To of the last message the
 * other party wrote, or its sender, answered from the address they wrote to.
 */
export function replyEnvelope(thread: ThreadEnvelopeSource, lastInbound: LastInbound) {
  const to: Mailbox = lastInbound
    ? lastInbound.replyTo[0]
      ? parseAddress(lastInbound.replyTo[0])
      : { name: lastInbound.fromName, address: lastInbound.fromAddress }
    : { name: thread.counterpartName, address: thread.counterpart };
  return { to, from: senderFor(thread.mailbox), subject: replySubject(thread.subject) };
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// The server clock is UTC; the person reading the quote is not.
const dateLine = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: process.env.MAIL_TIMEZONE || 'Africa/Casablanca',
});

/** The previous message under a reply, the way mail clients quote it. */
function quoteOf(previous: { fromAddress: string; fromName: string | null; sentAt: Date; text: string | null; html: string | null }) {
  const who = previous.fromName ? `${previous.fromName} <${previous.fromAddress}>` : previous.fromAddress;
  const intro = `Le ${dateLine.format(previous.sentAt)}, ${who} a écrit :`;
  const body = (previous.text?.trim() ? previous.text : previous.html ? htmlToText(previous.html) : '').slice(0, 8000).trim();
  return {
    text: `${intro}\n${body.split('\n').map((line) => `> ${line}`).join('\n')}`,
    html:
      `<p style="margin:24px 0 8px;color:#5A6478;font-size:13px;">${esc(intro)}</p>` +
      `<blockquote style="margin:0;padding:0 0 0 12px;border-left:3px solid #E7E1D8;color:#5A6478;">` +
      `${esc(body).replace(/\n/g, '<br>')}</blockquote>`,
  };
}

/** Plain paragraphs, inline-styled: what was typed, and nothing a client can misread. */
function renderBody(body: string, quotedHtml?: string) {
  const paragraphs = esc(body.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return (
    `<!doctype html><html><head><meta charset="utf-8"></head>` +
    `<body style="margin:0;padding:16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0B1F3F;">` +
    `${paragraphs}${quotedHtml ?? ''}</body></html>`
  );
}

/**
 * Resend's Message-ID for a message it accepted, so the other party's answer
 * finds its conversation by header. Best effort: without it the answer still
 * joins by its References chain or its "Re:" subject.
 */
async function sentMessageId(resend: Resend, id: string): Promise<string | null> {
  try {
    const { data } = await resend.emails.get(id);
    return normalizeMessageId(data?.message_id);
  } catch {
    return null;
  }
}

/** Send a reply or a new message, then store it with its conversation. */
export async function sendMail(out: Outgoing) {
  const resend = mailClient();
  if (!resend) {
    throw new CustomError('La messagerie n’est pas configurée : RESEND_API_KEY manque sur le serveur.', 503, { code: 'MAIL_NOT_CONFIGURED' });
  }

  const thread = out.threadId ? await prismaAdmin.mailThread.findUnique({ where: { id: out.threadId } }) : null;
  if (out.threadId && !thread) throw new CustomError('Conversation introuvable.', 404);

  // The message being answered: the last one the other party wrote.
  const previous = thread
    ? await prismaAdmin.mailMessage.findFirst({
        where: { threadId: thread.id, direction: 'INBOUND' },
        orderBy: { sentAt: 'desc' },
      })
    : null;
  // What the answer points back at: the latest message of either side.
  const latest = thread
    ? await prismaAdmin.mailMessage.findFirst({ where: { threadId: thread.id }, orderBy: { sentAt: 'desc' } })
    : null;

  let from: Mailbox | null;
  let to: Mailbox[];
  let subject: string;
  if (thread) {
    const envelope = replyEnvelope(thread, previous);
    from = envelope.from;
    to = [envelope.to];
    subject = envelope.subject;
  } else {
    if (out.from && !ownDomains().has(domainOf(parseAddress(out.from).address))) {
      throw new CustomError('Cette adresse d’expédition n’appartient pas au domaine de la messagerie.', 400, { fields: { from: 'Adresse non autorisée.' } });
    }
    from = senderFor(out.from ? parseAddress(out.from).address : null);
    to = out.to ?? [];
    subject = (out.subject ?? '').trim();
  }
  if (!from) {
    throw new CustomError('Aucune adresse d’expédition : renseignez MAIL_ADDRESSES sur le serveur.', 503, { code: 'MAIL_NOT_CONFIGURED' });
  }
  if (!to.length) throw new CustomError('Indiquez au moins un destinataire.', 400, { fields: { to: 'Indiquez au moins un destinataire.' } });
  if (to.length + out.cc.length > MAX_RECIPIENTS) {
    throw new CustomError(`${MAX_RECIPIENTS} destinataires au plus par message.`, 400, { fields: { to: `${MAX_RECIPIENTS} destinataires au plus.` } });
  }
  const totalBytes = out.attachments.reduce((sum, a) => sum + a.content.length, 0);
  if (totalBytes > MAX_ATTACHMENT_BYTES) {
    throw new CustomError('Pièces jointes trop lourdes : 4 Mo au total.', 400, { fields: { attachments: '4 Mo au total.' } });
  }

  const quote = thread && previous ? quoteOf(previous) : null;
  const body = out.body.trim();
  const text = quote ? `${body}\n\n${quote.text}` : body;
  const html = renderBody(body, quote?.html);

  // Only well-formed ids go into headers; a bare id stored for one of our own
  // messages is still useful for matching, but not as a header.
  const inReplyTo = latest?.messageId ?? null;
  const references = latest
    ? [...new Set([...latest.references, ...(latest.messageId ? [latest.messageId] : [])])].slice(-20)
    : [];
  const headers: Record<string, string> = {};
  if (inReplyTo?.includes('@')) headers['In-Reply-To'] = `<${inReplyTo}>`;
  const headerRefs = references.filter((id) => id.includes('@'));
  if (headerRefs.length) headers['References'] = headerRefs.map((id) => `<${id}>`).join(' ');

  const { data, error } = await resend.emails.send(
    {
      from: formatAddress(from),
      to: to.map(formatAddress),
      ...(out.cc.length ? { cc: out.cc.map(formatAddress) } : {}),
      subject,
      text,
      html,
      ...(Object.keys(headers).length ? { headers } : {}),
      ...(out.attachments.length
        ? { attachments: out.attachments.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })) }
        : {}),
    },
    out.idempotencyKey ? { idempotencyKey: `inbox-${out.idempotencyKey}` } : undefined
  );
  if (error || !data) {
    console.error('[mail] Resend refused the send:', error?.message);
    throw new CustomError(`L’envoi a été refusé : ${error?.message ?? 'Resend n’a rien répondu'}`, 502, { code: 'MAIL_SEND_FAILED' });
  }

  const messageId = await sentMessageId(resend, data.id);
  const now = new Date();
  const snippet = snippetOf(body, null);
  const hasFiles = out.attachments.length > 0;

  try {
    return await prismaAdmin.$transaction(async (tx) => {
      const saved = thread
        ? await tx.mailThread.update({
            where: { id: thread.id },
            // Answering a conversation reads it.
            data: { lastMessageAt: now, lastOutboundAt: now, snippet, unreadCount: 0, ...(hasFiles ? { hasAttachments: true } : {}) },
          })
        : await tx.mailThread.create({
            data: {
              subject: subject || '(sans objet)',
              counterpart: to[0].address,
              counterpartName: to[0].name,
              mailbox: from.address,
              snippet,
              hasAttachments: hasFiles,
              lastMessageAt: now,
              lastOutboundAt: now,
            },
          });
      if (thread) {
        await tx.mailMessage.updateMany({ where: { threadId: thread.id, direction: 'INBOUND', readAt: null }, data: { readAt: now } });
      }
      const message = await tx.mailMessage.create({
        data: {
          threadId: saved.id,
          direction: 'OUTBOUND',
          status: 'SENT',
          resendId: data.id,
          messageId,
          inReplyTo,
          references,
          fromAddress: from.address,
          fromName: from.name,
          to: to.map((m) => m.address),
          cc: out.cc.map((m) => m.address),
          subject,
          text,
          html,
          snippet,
          sentById: out.senderId,
          sentAt: now,
          attachments: {
            create: out.attachments.map((a) => ({ filename: a.filename, contentType: a.contentType, size: a.content.length })),
          },
        },
        select: messageSelect,
      });
      return { threadId: saved.id, message };
    });
  } catch (err: any) {
    // A retried request with the same idempotency key: Resend answered with
    // the id it already sent, and that message is already stored.
    if (err?.code === 'P2002') {
      const message = await prismaAdmin.mailMessage.findUnique({ where: { resendId: data.id }, select: { ...messageSelect, threadId: true } });
      if (message) {
        const { threadId, ...rest } = message;
        return { threadId, message: rest };
      }
    }
    throw err;
  }
}

// ------------------------------------------------------------ attachments

/**
 * A short-lived link to an attachment's bytes, which stay with Resend. The link
 * goes to the administrator's browser rather than the bytes going through the
 * API: a function response is capped at 4.5 MB, and a scanned contract is not.
 */
export async function attachmentLink(attachmentId: string): Promise<{ url: string; filename: string; expiresAt: string | null }> {
  const resend = mailClient();
  if (!resend) throw new CustomError('La messagerie n’est pas configurée.', 503, { code: 'MAIL_NOT_CONFIGURED' });

  const attachment = await prismaAdmin.mailAttachment.findUnique({
    where: { id: attachmentId },
    include: { message: { select: { resendId: true, direction: true } } },
  });
  if (!attachment?.message.resendId) throw new CustomError('Pièce jointe introuvable.', 404);
  const emailId = attachment.message.resendId;
  const unavailable = () => new CustomError('Resend ne fournit pas cette pièce jointe pour le moment. Réessayez dans un instant.', 502);

  if (attachment.message.direction === 'INBOUND' && attachment.resendId) {
    const { data, error } = await resend.emails.receiving.attachments.get({ emailId, id: attachment.resendId });
    if (error || !data) throw unavailable();
    return { url: data.download_url, filename: attachment.filename, expiresAt: data.expires_at ?? null };
  }

  // A file the console sent: Resend keeps it under the sent email, by name.
  const { data, error } = await resend.emails.attachments.list({ emailId });
  const match = data?.data.find((a) => a.filename === attachment.filename);
  if (error || !match) throw unavailable();
  return { url: match.download_url, filename: attachment.filename, expiresAt: match.expires_at ?? null };
}

/** The sidebar badge: unread messages in conversations that are not archived. */
export async function unreadTotal(): Promise<number> {
  const { _sum } = await prismaAdmin.mailThread.aggregate({ where: { archivedAt: null }, _sum: { unreadCount: true } });
  return _sum.unreadCount ?? 0;
}
