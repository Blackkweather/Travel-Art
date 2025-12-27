import { Router } from 'express';
import { Webhook } from 'svix';
import { config } from '../config';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { prisma } from '../db';

const router = Router();

// Clerk webhook handler
router.post('/webhook', asyncHandler(async (req, res) => {
  const WEBHOOK_SECRET = config.clerkWebhookSecret;

  if (!WEBHOOK_SECRET) {
    throw new CustomError('Webhook secret not configured', 500);
  }

  // Get the Svix headers for verification
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new CustomError('Missing svix headers', 400);
  }

  // Get the raw body - it's already a Buffer from express.raw()
  const payload = req.body.toString();

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    throw new CustomError('Webhook verification failed', 400);
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, first_name, last_name } = evt.data;

  if (eventType === 'user.created') {
    // User created in Clerk - we'll sync when they complete registration
    console.log('Clerk user created:', id);
  } else if (eventType === 'user.updated') {
    // Update user in our database
    const email = email_addresses[0]?.email_address;
    if (email) {
      await prisma.user.updateMany({
        where: { clerkId: id },
        data: {
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || email,
        }
      });
    }
  } else if (eventType === 'user.deleted') {
    // Mark user as inactive (don't delete to preserve data)
    await prisma.user.updateMany({
      where: { clerkId: id },
      data: { isActive: false }
    });
  }

  res.json({ received: true });
}));

export { router as clerkWebhookRoutes };

