/**
 * The shared inbox, end to end: Resend's webhook in, the console's answer out.
 *
 * Resend is played by a stand-in for fetch - nothing leaves this machine - and
 * every webhook is signed locally with the scheme Resend uses, so the
 * signature check under test is the real one.
 */
const savedEnv = { ...process.env };
process.env.RESEND_API_KEY = 're_test_inbox_only';
process.env.RESEND_WEBHOOK_SECRET = `whsec_${Buffer.from('inbox-test-secret-not-a-real-one').toString('base64')}`;
process.env.MAIL_ADDRESSES = 'Travel Art <contact@travelarts.live>';
process.env.MAIL_ALERTS = '0';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { api, auth, makeAdmin, makeArtist, prismaAdmin, resetDb } = require('./helpers') as typeof import('./helpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Webhook } = require('standardwebhooks') as {
  Webhook: new (secret: string) => { sign(id: string, at: Date, payload: string): string };
};

// ------------------------------------------------------------- fake Resend

interface ReceivedFixture {
  id: string;
  from: string;
  subject: string;
  message_id: string;
  to?: string[];
  text?: string;
  html?: string | null;
  headers?: Record<string, string>;
  attachments?: Array<Record<string, unknown>>;
}

const received = new Map<string, Record<string, any>>();
const sent: Array<{ body: any; idempotencyKey: string | null }> = [];
let sendCount = 0;

function receivedEmail(e: ReceivedFixture) {
  const to = e.to ?? ['contact@travelarts.live'];
  const email = {
    object: 'email',
    id: e.id,
    to,
    from: e.from,
    created_at: new Date(Date.now() + received.size * 1000).toISOString(),
    subject: e.subject,
    bcc: null,
    cc: null,
    reply_to: null,
    received_for: to,
    html: e.html ?? null,
    text: e.text ?? null,
    headers: e.headers ?? {},
    message_id: e.message_id,
    raw: null,
    attachments: e.attachments ?? [],
  };
  received.set(e.id, email);
  return email;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const realFetch = global.fetch;

beforeAll(() => {
  global.fetch = (async (input: any, init?: any) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.hostname !== 'api.resend.com') return realFetch(input, init);
    const method = String(init?.method ?? 'GET').toUpperCase();
    const path = url.pathname;
    let m: RegExpExecArray | null;

    if (method === 'POST' && path === '/emails') {
      sent.push({ body: JSON.parse(init.body), idempotencyKey: new Headers(init.headers).get('Idempotency-Key') });
      return json({ id: `sent_${++sendCount}` });
    }
    if (method === 'GET' && path === '/emails/receiving') {
      const newestFirst = [...received.values()].reverse();
      return json({ object: 'list', has_more: false, data: newestFirst.map(({ html: _h, text: _t, headers: _x, raw: _r, object: _o, ...rest }) => rest) });
    }
    if (method === 'GET' && (m = /^\/emails\/receiving\/([^/]+)\/attachments\/([^/]+)$/.exec(path))) {
      return json({
        object: 'attachment', id: m[2], filename: 'devis.pdf', size: 12, content_type: 'application/pdf',
        content_disposition: 'attachment', download_url: `https://files.resend.example/${m[2]}`, expires_at: new Date(Date.now() + 3600e3).toISOString(),
      });
    }
    if (method === 'GET' && (m = /^\/emails\/receiving\/([^/]+)$/.exec(path))) {
      const email = received.get(m[1]);
      return email ? json(email) : json({ name: 'not_found', message: 'Email not found', statusCode: 404 }, 404);
    }
    if (method === 'GET' && (m = /^\/emails\/([^/]+)$/.exec(path))) {
      return json({ object: 'email', id: m[1], message_id: `<${m[1]}@eu-west-1.amazonses.com>`, last_event: 'sent' });
    }
    return json({ name: 'not_found', message: `No fake for ${method} ${path}`, statusCode: 404 }, 404);
  }) as typeof fetch;
});

afterAll(async () => {
  global.fetch = realFetch;
  process.env = savedEnv;
  await prismaAdmin.$disconnect();
});

beforeEach(async () => {
  await resetDb();
  received.clear();
  sent.length = 0;
  sendCount = 0;
});

// ---------------------------------------------------------------- webhooks

let delivery = 0;
function deliver(event: Record<string, unknown>, secret = process.env.RESEND_WEBHOOK_SECRET!) {
  const payload = JSON.stringify(event);
  const id = `msg_test_${++delivery}`;
  const at = new Date();
  return api()
    .post('/api/mail/inbound')
    .set('Content-Type', 'application/json')
    .set('svix-id', id)
    .set('svix-timestamp', String(Math.floor(at.getTime() / 1000)))
    .set('svix-signature', new Webhook(secret).sign(id, at, payload))
    .send(payload);
}

const receivedEvent = (email: { id: string; from: string; to: string[]; subject: string; message_id: string }) => ({
  type: 'email.received',
  created_at: new Date().toISOString(),
  data: {
    email_id: email.id, created_at: new Date().toISOString(), from: email.from, to: email.to, bcc: [], cc: [],
    received_for: email.to, message_id: email.message_id, subject: email.subject, attachments: [],
  },
});

const first = () =>
  receivedEmail({
    id: 'rcv_1',
    from: 'Salma Bennani <salma@hotel-atlas.ma>',
    subject: 'Résidence en décembre',
    text: 'Bonjour,\nAvez-vous un pianiste disponible en décembre ?',
    message_id: '<CAH-first@mail.gmail.com>',
  });

// ------------------------------------------------------------------- tests

describe('receiving', () => {
  it('stores a received message once, as a new unread conversation', async () => {
    const email = first();
    expect((await deliver(receivedEvent(email))).status).toBe(200);
    // Resend redelivers; the second arrival must change nothing.
    expect((await deliver(receivedEvent(email))).status).toBe(200);

    const threads = await prismaAdmin.mailThread.findMany({ include: { messages: true } });
    expect(threads).toHaveLength(1);
    expect(threads[0]).toMatchObject({
      counterpart: 'salma@hotel-atlas.ma',
      counterpartName: 'Salma Bennani',
      mailbox: 'contact@travelarts.live',
      unreadCount: 1,
      snippet: 'Bonjour, Avez-vous un pianiste disponible en décembre ?',
    });
    expect(threads[0].messages).toHaveLength(1);
    // Angle brackets dropped, case kept: a Message-ID's local part is case-sensitive.
    expect(threads[0].messages[0].messageId).toBe('CAH-first@mail.gmail.com');
  });

  it('refuses a delivery that is unsigned or signed with another secret', async () => {
    const email = first();
    const forged = await deliver(receivedEvent(email), `whsec_${Buffer.from('somebody-else-entirely').toString('base64')}`);
    expect(forged.status).toBe(400);
    const unsigned = await api().post('/api/mail/inbound').set('Content-Type', 'application/json').send(JSON.stringify(receivedEvent(email)));
    expect(unsigned.status).toBe(400);
    expect(await prismaAdmin.mailMessage.count()).toBe(0);
  });

  it('joins a reply to its conversation by its headers, not by its subject', async () => {
    await deliver(receivedEvent(first()));
    // A different subject, but it answers the first message.
    await deliver(receivedEvent(receivedEmail({
      id: 'rcv_2', from: 'salma@hotel-atlas.ma', subject: 'Et pour janvier ?', text: 'Et en janvier ?',
      message_id: '<CAH-second@mail.gmail.com>',
      headers: { 'In-Reply-To': '<CAH-first@mail.gmail.com>', References: '<CAH-first@mail.gmail.com>' },
    })));
    // The same subject as the first, but not a reply to anything: its own conversation.
    await deliver(receivedEvent(receivedEmail({
      id: 'rcv_3', from: 'salma@hotel-atlas.ma', subject: 'Résidence en décembre', text: 'Autre demande.',
      message_id: '<CAH-third@mail.gmail.com>',
    })));

    const threads = await prismaAdmin.mailThread.findMany({ include: { _count: { select: { messages: true } } }, orderBy: { createdAt: 'asc' } });
    expect(threads.map((t) => t._count.messages)).toEqual([2, 1]);
    expect(threads[0].unreadCount).toBe(2);
  });

  it('pulls from Resend what the webhook never delivered', async () => {
    const admin = await makeAdmin();
    first();
    receivedEmail({ id: 'rcv_2', from: 'resa@riad-mogador.ma', subject: 'Disponibilités', text: 'Bonjour', message_id: '<riad-1@mogador.ma>' });

    const res = await api().post('/api/admin/mail/sync').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ imported: 2, unread: 2 });

    const list = await api().get('/api/admin/mail/threads').set(auth(admin.token));
    expect(list.body.data.threads.map((t: any) => t.counterpart).sort()).toEqual(['resa@riad-mogador.ma', 'salma@hotel-atlas.ma']);
  });

  it('hands out a link to a received attachment, not the bytes', async () => {
    const admin = await makeAdmin();
    await deliver(receivedEvent(receivedEmail({
      id: 'rcv_1', from: 'salma@hotel-atlas.ma', subject: 'Devis', text: 'Ci-joint.', message_id: '<devis@atlas.ma>',
      attachments: [{ id: 'att_1', filename: 'devis.pdf', size: 12, content_type: 'application/pdf', content_id: null, content_disposition: 'attachment' }],
    })));
    const thread = await prismaAdmin.mailThread.findFirstOrThrow();
    expect(thread.hasAttachments).toBe(true);

    const opened = await api().get(`/api/admin/mail/threads/${thread.id}`).set(auth(admin.token));
    const attachment = opened.body.data.messages[0].attachments[0];
    expect(attachment).toMatchObject({ filename: 'devis.pdf', contentType: 'application/pdf' });

    const link = await api().get(`/api/admin/mail/attachments/${attachment.id}`).set(auth(admin.token));
    expect(link.status).toBe(200);
    expect(link.body.data.url).toBe('https://files.resend.example/att_1');
  });
});

describe('answering', () => {
  it('replies from the address written to, threaded and quoted, and reads the conversation', async () => {
    const admin = await makeAdmin();
    await deliver(receivedEvent(first()));
    const thread = await prismaAdmin.mailThread.findFirstOrThrow();

    const inbox = await api().get('/api/admin/mail/threads').set(auth(admin.token));
    expect(inbox.body.data).toMatchObject({ unread: 1 });

    const opened = await api().get(`/api/admin/mail/threads/${thread.id}`).set(auth(admin.token));
    expect(opened.status).toBe(200);
    expect(opened.body.data.reply).toMatchObject({
      to: { address: 'salma@hotel-atlas.ma', name: 'Salma Bennani' },
      from: { address: 'contact@travelarts.live', name: 'Travel Art' },
      subject: 'Re: Résidence en décembre',
    });
    expect((await prismaAdmin.mailThread.findUniqueOrThrow({ where: { id: thread.id } })).unreadCount).toBe(0);
    // The new total comes back with it, so the badges drop at once.
    expect(opened.body.data.unread).toBe(0);

    const res = await api()
      .post(`/api/admin/mail/threads/${thread.id}/reply`)
      .set(auth(admin.token))
      .send({ body: 'Bonjour Salma,\n\nOui, deux pianistes sont disponibles.', clientId: 'draft-1' });
    expect(res.status).toBe(201);

    expect(sent).toHaveLength(1);
    const mail = sent[0].body;
    expect(mail.from).toBe('Travel Art <contact@travelarts.live>');
    expect(mail.to).toEqual(['Salma Bennani <salma@hotel-atlas.ma>']);
    expect(mail.subject).toBe('Re: Résidence en décembre');
    expect(mail.headers).toEqual({ 'In-Reply-To': '<CAH-first@mail.gmail.com>', References: '<CAH-first@mail.gmail.com>' });
    expect(mail.text).toContain('Oui, deux pianistes sont disponibles.');
    expect(mail.text).toContain('> Avez-vous un pianiste disponible en décembre ?');
    expect(mail.html).toContain('<blockquote');
    expect(sent[0].idempotencyKey).toBe('inbox-draft-1');

    const stored = await prismaAdmin.mailMessage.findFirstOrThrow({ where: { direction: 'OUTBOUND' } });
    expect(stored).toMatchObject({ threadId: thread.id, status: 'SENT', resendId: 'sent_1', messageId: 'sent_1@eu-west-1.amazonses.com', sentById: admin.user.id });

    // Her answer quotes our message's id, and lands in the same conversation.
    await deliver(receivedEvent(receivedEmail({
      id: 'rcv_2', from: 'salma@hotel-atlas.ma', subject: 'Re: Résidence en décembre', text: 'Parfait, merci !',
      message_id: '<CAH-thanks@mail.gmail.com>',
      headers: { 'In-Reply-To': '<sent_1@eu-west-1.amazonses.com>', References: '<CAH-first@mail.gmail.com> <sent_1@eu-west-1.amazonses.com>' },
    })));
    expect(await prismaAdmin.mailThread.count()).toBe(1);
    expect(await prismaAdmin.mailMessage.count({ where: { threadId: thread.id } })).toBe(3);
  });

  it('sends attachments with their real names', async () => {
    const admin = await makeAdmin();
    await deliver(receivedEvent(first()));
    const thread = await prismaAdmin.mailThread.findFirstOrThrow();

    const res = await api()
      .post(`/api/admin/mail/threads/${thread.id}/reply`)
      .set(auth(admin.token))
      .field('body', 'Voici notre devis.')
      .attach('attachments', Buffer.from('%PDF-1.4 devis'), { filename: 'devis-été.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    expect(res.body.data.message.attachments).toEqual([expect.objectContaining({ filename: 'devis-été.pdf', size: 14 })]);
    expect(sent[0].body.attachments[0]).toMatchObject({ filename: 'devis-été.pdf' });
  });

  it('writes a new message, filed in Sent and not in the inbox', async () => {
    const admin = await makeAdmin();
    const res = await api()
      .post('/api/admin/mail/send')
      .set(auth(admin.token))
      .send({ to: '"Riad Mogador, Essaouira" <resa@riad-mogador.ma>', subject: 'Proposition de résidence', body: 'Bonjour,\nNous aimerions vous présenter le programme.' });
    expect(res.status).toBe(201);
    expect(sent[0].body).toMatchObject({ from: 'Travel Art <contact@travelarts.live>', to: ['"Riad Mogador, Essaouira" <resa@riad-mogador.ma>'], subject: 'Proposition de résidence' });
    expect(sent[0].body.headers).toBeUndefined();

    const inbox = await api().get('/api/admin/mail/threads?folder=inbox').set(auth(admin.token));
    const sentFolder = await api().get('/api/admin/mail/threads?folder=sent').set(auth(admin.token));
    expect(inbox.body.data.threads).toHaveLength(0);
    expect(sentFolder.body.data.threads).toEqual([expect.objectContaining({ counterpart: 'resa@riad-mogador.ma', counterpartName: 'Riad Mogador, Essaouira' })]);
  });

  it('refuses a sender off the domain and a malformed recipient, and sends nothing', async () => {
    const admin = await makeAdmin();
    const offDomain = await api().post('/api/admin/mail/send').set(auth(admin.token))
      .send({ from: 'someone@gmail.com', to: 'resa@riad-mogador.ma', subject: 'x', body: 'y' });
    expect(offDomain.status).toBe(400);

    const badTo = await api().post('/api/admin/mail/send').set(auth(admin.token))
      .send({ to: 'resa@riad-mogador.ma, not-an-address', subject: 'x', body: 'y' });
    expect(badTo.status).toBe(400);
    expect(badTo.body.error.fields.to).toMatch(/not-an-address/);
    expect(sent).toHaveLength(0);
  });

  it('records a bounce, and a late "delivered" does not paper over it', async () => {
    const admin = await makeAdmin();
    await api().post('/api/admin/mail/send').set(auth(admin.token)).send({ to: 'nobody@riad-mogador.ma', subject: 'Bonjour', body: 'Bonjour' });

    const base = { created_at: new Date().toISOString(), email_id: 'sent_1', message_id: '<sent_1@x>', from: 'contact@travelarts.live', to: ['nobody@riad-mogador.ma'], subject: 'Bonjour' };
    await deliver({ type: 'email.bounced', created_at: base.created_at, data: { ...base, bounce: { message: 'Mailbox does not exist', type: 'Permanent', subType: 'General' } } });
    await deliver({ type: 'email.delivered', created_at: base.created_at, data: base });

    const message = await prismaAdmin.mailMessage.findFirstOrThrow({ where: { resendId: 'sent_1' } });
    expect(message).toMatchObject({ status: 'BOUNCED', error: 'Mailbox does not exist' });
  });

  it('archives a conversation, and new mail brings it back', async () => {
    const admin = await makeAdmin();
    await deliver(receivedEvent(first()));
    const thread = await prismaAdmin.mailThread.findFirstOrThrow();

    const archived = await api().patch(`/api/admin/mail/threads/${thread.id}`).set(auth(admin.token)).send({ archived: true });
    expect(archived.body.data.thread.archived).toBe(true);
    expect((await api().get('/api/admin/mail/threads').set(auth(admin.token))).body.data.threads).toHaveLength(0);

    await deliver(receivedEvent(receivedEmail({
      id: 'rcv_2', from: 'salma@hotel-atlas.ma', subject: 'Re: Résidence en décembre', text: 'Une relance.',
      message_id: '<CAH-again@mail.gmail.com>', headers: { 'In-Reply-To': '<CAH-first@mail.gmail.com>' },
    })));
    expect((await api().get('/api/admin/mail/threads').set(auth(admin.token))).body.data.threads).toHaveLength(1);
  });
});

describe('access', () => {
  it('is closed to everyone but admins', async () => {
    const artist = await makeArtist();
    expect((await api().get('/api/admin/mail/threads').set(auth(artist.token))).status).toBe(403);
    expect((await api().get('/api/admin/mail/threads')).status).toBe(401);
    expect((await api().post('/api/admin/mail/send').set(auth(artist.token)).send({ to: 'a@b.ma', subject: 'x', body: 'y' })).status).toBe(403);
    expect(sent).toHaveLength(0);
  });
});
