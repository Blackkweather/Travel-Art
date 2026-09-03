import { Router, Request, Response } from 'express';
import type Stripe from 'stripe';
// Stripe callbacks carry no user, so they use the privileged connection.
// See db.ts: the request-scoped client would resolve to zero rows here.
import { prismaAdmin as prisma } from '../db';
import { config } from '../config';
import { stripe } from '../stripe';

const router = Router();

/** Event types this handler acts on. Everything else is acknowledged and dropped. */
const HANDLED_EVENTS = new Set<string>(['checkout.session.completed']);

/**
 * Stripe webhook. This is the only place credits are ever granted.
 *
 * Three things make that safe:
 *
 *   - The signature is verified against the raw request body. Without it,
 *     anyone who knows the URL could POST a "payment succeeded" event and mint
 *     themselves inventory, which is precisely the hole the old
 *     client-controlled purchase endpoint left open.
 *   - The Stripe event id is recorded first, against a unique column. Stripe
 *     retries deliveries, and a retry must be a no-op rather than a second
 *     grant.
 *   - The ledger entry and the balance update happen in one transaction, so
 *     the append-only history and the running total can never disagree.
 *
 * The amount is read from the CreditPackage, never from the request.
 */
router.post('/', async (req: Request, res: Response) => {
  if (!stripe || !config.stripeWebhookSecret) {
    console.warn('Stripe webhook received but Stripe is not configured');
    return res.status(503).json({ received: false, error: 'Stripe is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ received: false, error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer here: this route is mounted with express.raw()
    // ahead of the JSON parser, because parsing would change the bytes the
    // signature was computed over.
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.warn('Rejected Stripe webhook with an invalid signature:', err?.message);
    return res.status(400).json({ received: false, error: 'Invalid signature' });
  }

  // Ignore event types this handler does not act on, before recording
  // anything. The configured endpoint subscribes to the full Stripe event
  // catalogue, so claiming every delivery would fill webhook_events with
  // hundreds of rows that exist only to be ignored.
  if (!HANDLED_EVENTS.has(event.type)) {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  // Claim the event before doing any work. The unique constraint on
  // stripeEventId turns a redelivery into a conflict, which we answer 200 so
  // Stripe stops retrying.
  try {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: JSON.stringify(event.data?.object ?? {}).slice(0, 10000),
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(200).json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
  } catch (err: any) {
    // Let Stripe retry: the WebhookEvent row is removed so the retry is not
    // mistaken for a duplicate and silently dropped.
    console.error('Failed to process Stripe event', event.id, err?.message);
    await prisma.webhookEvent
      .delete({ where: { stripeEventId: event.id } })
      .catch(() => undefined);
    return res.status(500).json({ received: false });
  }

  res.status(200).json({ received: true });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Only a paid session grants anything.
  if (session.payment_status !== 'paid') {
    console.warn(`Checkout session ${session.id} completed but is not paid; ignoring`);
    return;
  }

  const paymentId = session.metadata?.paymentId ?? session.client_reference_id ?? undefined;
  const hotelId = session.metadata?.hotelId;
  const packageId = session.metadata?.packageId;

  if (!hotelId || !packageId) {
    throw new Error(`Checkout session ${session.id} is missing hotelId or packageId metadata`);
  }

  // Credits come from the packages table, which is the only source of truth
  // for what a pack contains — not from the session metadata, which merely
  // echoes what we sent.
  const creditPackage = await prisma.creditPackage.findUnique({ where: { id: packageId } });
  if (!creditPackage) {
    throw new Error(`Checkout session ${session.id} references unknown package ${packageId}`);
  }

  const credits = creditPackage.credits + creditPackage.bonusCredits;

  await prisma.$transaction(async (tx) => {
    if (paymentId) {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        },
      });
    }

    await tx.creditLedger.create({
      data: {
        hotelId,
        delta: credits,
        reason: 'PURCHASE',
        paymentId: paymentId ?? undefined,
        note: `${creditPackage.name} via Stripe session ${session.id}`,
      },
    });

    // The running total is kept in step with the ledger it summarises.
    await tx.credit.upsert({
      where: { hotelId },
      create: { hotelId, totalCredits: credits, usedCredits: 0 },
      update: { totalCredits: { increment: credits } },
    });
  });

  console.log(`Granted ${credits} credits to hotel ${hotelId} for session ${session.id}`);
}

export { router as webhookRoutes };
