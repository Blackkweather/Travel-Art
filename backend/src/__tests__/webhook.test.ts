/**
 * Stripe webhooks, with events signed locally the way Stripe signs them.
 * A dummy key: the client is built but never calls Stripe.
 */
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests_only';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_tests_only';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { api, makeArtist, prismaAdmin, resetDb } = require('./helpers') as typeof import('./helpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { stripe } = require('../stripe') as typeof import('../stripe');

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

let n = 0;
function signedCheckout(metadata: Record<string, string>) {
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}_${n++}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: `cs_test_${n}`, object: 'checkout.session', payment_status: 'paid', payment_intent: `pi_test_${n}`, metadata } },
  });
  const header = stripe!.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  return api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('stripe-signature', header).send(payload);
}

describe('Stripe webhook', () => {
  it('acknowledges and ignores a checkout from the other app on the same Stripe account', async () => {
    const res = await signedCheckout({ userId: 'someone-elses', plan: 'pro' });
    expect(res.status).toBe(200);
    expect(res.body.ignored).toMatch(/not a Travel Art/);
    expect(await prismaAdmin.webhookEvent.count()).toBe(0);
  });

  it('moves an artist from the 50 € plan to the 100 € plan', async () => {
    const artist = await makeArtist();
    const old = await prismaAdmin.membership.create({
      data: { artistId: artist.artistId, tier: 'ARTIST', priceCents: 5000, status: 'ACTIVE', startsAt: new Date(), endsAt: new Date(Date.now() + 300 * 86400000) },
    });
    const upgrade = await prismaAdmin.membership.create({ data: { artistId: artist.artistId, tier: 'PROFESSIONAL', priceCents: 10000, status: 'PENDING' } });
    const payment = await prismaAdmin.payment.create({
      data: { actorUserId: artist.user.id, amountCents: 10000, status: 'PENDING', membershipId: upgrade.id },
    });

    const res = await signedCheckout({ app: 'travel-art', paymentId: payment.id, membershipId: upgrade.id, artistId: artist.artistId, tier: 'PROFESSIONAL' });
    expect(res.status).toBe(200);

    const rows = await prismaAdmin.membership.findMany({ where: { artistId: artist.artistId }, select: { id: true, status: true } });
    expect(rows.find((r) => r.id === upgrade.id)!.status).toBe('ACTIVE');
    expect(rows.find((r) => r.id === old.id)!.status).toBe('CANCELLED');
    expect((await prismaAdmin.payment.findUnique({ where: { id: payment.id } }))!.status).toBe('SUCCEEDED');

    const me = await prismaAdmin.artist.findUnique({ where: { id: artist.artistId }, select: { membershipStatus: true } });
    expect(me!.membershipStatus).toBe('ACTIVE');
  });

  it('refuses an event without a valid signature', async () => {
    const res = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('stripe-signature', 't=1,v1=bad').send('{}');
    expect(res.status).toBe(400);
  });
});
