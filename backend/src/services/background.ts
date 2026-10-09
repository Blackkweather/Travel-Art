import { waitUntil } from '@vercel/functions';

/**
 * Work that should finish after the response is sent: e-mails, notifications.
 *
 * These used to be fired with `void promise`. On a long-running server that
 * is fine; on Vercel the function is frozen as soon as the response leaves,
 * so the e-mail was cut off before Resend was even called - no send, no
 * error, nothing in the logs. waitUntil keeps the function alive until the
 * promise settles. Off Vercel it is a no-op and the promise simply runs.
 *
 * Never throws: a failed e-mail must not turn into an unhandled rejection.
 */
export function background(work: Promise<unknown>, label = 'background task'): void {
  const settled = work.catch((error) => console.error(`[background] ${label} failed:`, error?.message ?? error));
  try {
    waitUntil(settled);
  } catch {
    // Outside a Vercel request context: nothing to extend, it runs anyway.
  }
}
