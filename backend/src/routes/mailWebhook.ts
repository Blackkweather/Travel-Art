import { Router, Request, Response } from 'express';
import type { WebhookEventPayload } from 'resend';
import { importReceivedEmail, mailClient, recordDelivery } from '../services/mail';

const router = Router();

/**
 * Resend's webhook for the shared inbox: a message arrived, or one the console
 * sent was delivered, bounced or failed.
 *
 * Two things make it safe, the same two as the Stripe webhook beside it:
 *
 *   - The signature is checked against the raw body, which is why this route
 *     is mounted with express.raw() ahead of the JSON parser. Without the check
 *     anyone who knows the URL could post a "message received" for any id.
 *     Even then the content comes from Resend's API, never from the request.
 *   - Every handler is safe to repeat (see importReceivedEmail). Resend retries
 *     a delivery that is not answered 2xx, so a failure answers 500 and the
 *     retry finishes the job instead of the message being lost.
 */
router.post('/', async (req: Request, res: Response) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const resend = mailClient();
  if (!secret || !resend) {
    console.warn('Resend webhook received but the inbox is not configured');
    return res.status(503).json({ received: false, error: 'Mail is not configured' });
  }

  // Resend signs the way Svix does; the standard-webhooks names are accepted too.
  const id = req.header('svix-id') ?? req.header('webhook-id');
  const timestamp = req.header('svix-timestamp') ?? req.header('webhook-timestamp');
  const signature = req.header('svix-signature') ?? req.header('webhook-signature');
  if (!id || !timestamp || !signature) {
    return res.status(400).json({ received: false, error: 'Missing signature headers' });
  }

  let event: WebhookEventPayload;
  try {
    event = resend.webhooks.verify({
      payload: Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '',
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
  } catch (err: any) {
    console.warn('Rejected Resend webhook with an invalid signature:', err?.message);
    return res.status(400).json({ received: false, error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'email.received':
        await importReceivedEmail(event.data.email_id);
        break;
      case 'email.delivered':
        await recordDelivery(event.data.email_id, 'DELIVERED');
        break;
      case 'email.bounced':
        await recordDelivery(event.data.email_id, 'BOUNCED', event.data.bounce?.message);
        break;
      case 'email.failed':
        await recordDelivery(event.data.email_id, 'FAILED', event.data.failed?.reason);
        break;
      default:
        // Subscribed to more than this handles: acknowledged so Resend stops asking.
        return res.status(200).json({ received: true, ignored: event.type });
    }
  } catch (err: any) {
    console.error('Failed to process Resend event', event.type, err?.message);
    return res.status(500).json({ received: false });
  }

  res.status(200).json({ received: true });
});

export { router as mailWebhookRoutes };
