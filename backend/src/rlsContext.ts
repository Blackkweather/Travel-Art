import { AsyncLocalStorage } from 'async_hooks';

/**
 * Who the current request belongs to, carried without threading a parameter
 * through every function between the middleware and the query.
 *
 * WHY ASYNCLOCALSTORAGE RATHER THAN `req.db`
 * The alternative is to hang a scoped client off the request and use `req.db`
 * in the 73 places that touch a protected table. That is more visible, and it
 * is also the design where a route added next month quietly uses the global
 * client instead and silently drops out of the policy. Storage keyed to the
 * async context means a route cannot opt out by forgetting — it has to opt out
 * deliberately, by importing the privileged client by name.
 *
 * The failure mode matters more than the ergonomics. With no context set, the
 * policies match no rows, so a query that should have carried an identity
 * returns empty rather than returning everything.
 */
export interface RequestIdentity {
  userId: string;
  role: string;
}

export const requestContext = new AsyncLocalStorage<RequestIdentity>();

/** Run `fn` with the given identity visible to every query it makes. */
export function runAsUser<T>(identity: RequestIdentity, fn: () => T): T {
  return requestContext.run(identity, fn);
}

export function currentIdentity(): RequestIdentity | undefined {
  return requestContext.getStore();
}

/**
 * The models the database protects with row-level security.
 *
 * Queries against anything else skip the context round trip entirely. That is
 * the reason this list exists: wrapping every query in a transaction to set a
 * variable the policy never reads would add a round trip to the ~90% of traffic
 * that reads public catalogue data.
 *
 * Keep in step with prisma/rls/01_role_and_policies.sql.
 */
export const RLS_MODELS = new Set([
  'Booking',
  'Credit',
  'CreditLedger',
  'Transaction',
  'Payment',
]);
