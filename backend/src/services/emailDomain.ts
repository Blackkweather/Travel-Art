import { promises as dns } from 'dns';
import { config } from '../config';

/**
 * Does this domain accept e-mail at all?
 *
 * The format check catches "jean@gmail" but not "jean@gmial.co" or a domain
 * that was typed with confidence and does not exist. A domain receives mail
 * if it publishes MX records, or - the RFC 5321 fallback - an address record.
 *
 * Fails open on anything that is not a definite "no such domain / no records":
 * a DNS timeout or an unreachable resolver must not stop a real person from
 * registering. Answers are cached for an hour; the set of domains people sign
 * up with is small.
 */

const cache = new Map<string, { ok: boolean; at: number }>();
const TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 3000;

const DEFINITELY_MISSING = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN', 'ESERVFAIL_NX']);

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), TIMEOUT_MS)),
  ]);
}

async function hasRecords(lookup: () => Promise<unknown[]>): Promise<boolean | null> {
  try {
    const records = await withTimeout(lookup());
    return records.length > 0;
  } catch (error: any) {
    return DEFINITELY_MISSING.has(error?.code) ? false : null;
  }
}

export async function domainAcceptsMail(domain: string): Promise<boolean> {
  if (!config.verifyEmailDomains) return true;
  const key = domain.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok;

  const mx = await hasRecords(() => dns.resolveMx(key));
  let ok: boolean;
  if (mx === true) {
    ok = true;
  } else if (mx === null) {
    ok = true; // could not tell: let it through
  } else {
    const a = await hasRecords(() => dns.resolve4(key));
    const aaaa = a === true ? true : await hasRecords(() => dns.resolve6(key));
    ok = a !== false || aaaa !== false;
  }

  cache.set(key, { ok, at: Date.now() });
  return ok;
}
