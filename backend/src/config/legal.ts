import crypto from 'crypto';
import { config } from '../config';

/**
 * The version stamped on every consent.
 *
 * Bump this whenever the terms or the privacy policy change materially. A
 * stored consent carries the version it was given against, so a later revision
 * cannot silently claim agreement to text nobody has read - which is the whole
 * point of recording a version rather than a boolean.
 *
 * The documents themselves are placeholders written to be replaced by counsel.
 * See `docs/LEGAL.md`.
 */
export const LEGAL_VERSION = '2026-09-19';

export const CONSENT = {
  TERMS: 'TERMS',
  PRIVACY: 'PRIVACY',
  COOKIES_ANALYTICS: 'COOKIES_ANALYTICS',
} as const;

export type ConsentKind = (typeof CONSENT)[keyof typeof CONSENT];

/**
 * An IP address is evidence that a consent came from the account holder's
 * session. It is not needed to identify anyone afterwards, so it is stored as
 * a salted digest and never in the clear: enough to compare against a claimed
 * session, useless as a location record if the table ever leaks.
 */
export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(ip)
    .digest('hex')
    .slice(0, 32);
}

/** The address Express saw, honouring the proxy chain when one is trusted. */
export function clientIp(req: { ip?: string; headers: Record<string, unknown> }): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
}
