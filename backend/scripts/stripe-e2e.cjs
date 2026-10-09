/**
 * End-to-end check of the Stripe credit flow, run against Stripe test mode.
 *
 * 1. opens a real Checkout Session through POST /payments/credits/checkout
 * 2. forges a checkout.session.completed event, signed with the configured
 *    webhook secret, and posts it to /payments/webhook
 * 3. asserts the credits landed, the ledger recorded it and the Payment moved
 *    to SUCCEEDED
 * 4. replays the identical event and asserts nothing is granted twice
 * 5. posts the event with a bad signature and asserts it is refused
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
require('tsx/cjs');
const { app } = require('../src/index.ts');
const { prisma } = require('../src/db.ts');
const { stripe } = require('../src/stripe.ts');
const { config } = require('../src/config.ts');

const EMAIL = `stripe-e2e-${Date.now()}@suite.test`;
const PASSWORD = 'SecureP@ss123';

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  ' + detail : ''));
}

(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: { email: EMAIL, name: 'Stripe E2E', passwordHash, role: 'HOTEL', isActive: true },
  });
  const hotel = await prisma.hotel.create({
    data: {
      userId: user.id,
      name: 'Stripe E2E Hotel',
      description: 'Temporary hotel for the Stripe end-to-end check',
      location: JSON.stringify({ city: 'Paris', country: 'France' }),
    },
  });

  const pkg = await prisma.creditPackage.findFirst({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  const expectedCredits = pkg.credits + pkg.bonusCredits;

  const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  const token = login.body.data.token;

  // 1. real Checkout Session
  const checkout = await request(app)
    .post('/api/payments/credits/purchase')
    .set('Authorization', `Bearer ${token}`)
    .send({ hotelId: hotel.id, packageId: pkg.id });

  check('checkout session created', checkout.status === 200, `status=${checkout.status}`);
  const url = checkout.body?.data?.checkoutUrl || '';
  check('checkout url is a real Stripe URL', url.startsWith('https://checkout.stripe.com/'), url.slice(0, 48));
  const paymentId = checkout.body?.data?.paymentId;
  const sessionId = checkout.body?.data?.sessionId;

  // price must come from the packages table
  const liveSession = await stripe.checkout.sessions.retrieve(sessionId);
  check('Stripe charges the package price', liveSession.amount_total === pkg.priceCents,
    `stripe=${liveSession.amount_total} package=${pkg.priceCents}`);

  const before = await prisma.credit.findUnique({ where: { hotelId: hotel.id } });
  check('no credits granted before payment', (before?.totalCredits ?? 0) === 0,
    `balance=${before?.totalCredits ?? 0}`);

  // 2. signed webhook
  const event = {
    id: 'evt_e2e_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        payment_intent: 'pi_e2e_' + Date.now(),
        client_reference_id: paymentId,
        metadata: { paymentId, hotelId: hotel.id, packageId: pkg.id, credits: String(expectedCredits) },
      },
    },
  };
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: config.stripeWebhookSecret,
  });

  const hook = await request(app)
    .post('/api/payments/webhook')
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
  check('signed webhook accepted', hook.status === 200, `status=${hook.status} body=${JSON.stringify(hook.body)}`);

  // 3. effects
  const after = await prisma.credit.findUnique({ where: { hotelId: hotel.id } });
  check('credits granted from the packages table', after?.totalCredits === expectedCredits,
    `balance=${after?.totalCredits} expected=${expectedCredits}`);

  const ledger = await prisma.creditLedger.findMany({ where: { hotelId: hotel.id } });
  check('one PURCHASE ledger entry', ledger.length === 1 && ledger[0].reason === 'PURCHASE' && ledger[0].delta === expectedCredits,
    `entries=${ledger.length} delta=${ledger[0] && ledger[0].delta}`);

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  check('payment marked SUCCEEDED', payment?.status === 'SUCCEEDED', `status=${payment?.status}`);

  // 4. replay
  const replay = await request(app)
    .post('/api/payments/webhook')
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
  const afterReplay = await prisma.credit.findUnique({ where: { hotelId: hotel.id } });
  check('replay is a no-op', replay.status === 200 && afterReplay?.totalCredits === expectedCredits,
    `status=${replay.status} balance=${afterReplay?.totalCredits}`);

  // 5. forged signature
  const forged = await request(app)
    .post('/api/payments/webhook')
    .set('stripe-signature', 't=1,v1=deadbeef')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ ...event, id: 'evt_forged_' + Date.now() }));
  const afterForged = await prisma.credit.findUnique({ where: { hotelId: hotel.id } });
  check('forged signature refused, nothing granted',
    forged.status === 400 && afterForged?.totalCredits === expectedCredits,
    `status=${forged.status} balance=${afterForged?.totalCredits}`);

  // cleanup
  await prisma.user.deleteMany({ where: { email: { endsWith: '@suite.test' } } }).catch(() => {});
  await prisma.webhookEvent.deleteMany({ where: { stripeEventId: { startsWith: 'evt_e2e_' } } }).catch(() => {});
  await prisma.$disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(async (e) => {
  console.error('ERROR', e);
  await prisma.user.deleteMany({ where: { email: { endsWith: '@suite.test' } } }).catch(() => {});
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
