import Stripe from 'stripe';
import { config } from './config';

/**
 * Stripe is optional. Without a secret key the payment routes refuse with a
 * 503 rather than pretending a purchase happened, which is the behaviour the
 * credit and membership endpoints have had since the unpaid-grant hole was
 * closed. Nothing here should ever fall back to granting a benefit for free.
 */
export const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2026-07-29.dahlia' })
  : null;

export const isStripeConfigured = (): boolean =>
  Boolean(stripe && config.stripeWebhookSecret);

/** Human-readable reason the payment routes are unavailable, for the 503 body. */
export const stripeUnavailableReason = (): string => {
  if (!config.stripeSecretKey) return 'STRIPE_SECRET_KEY is not set';
  if (!config.stripeWebhookSecret) return 'STRIPE_WEBHOOK_SECRET is not set';
  return 'Stripe is not configured';
};
