import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { prismaAdmin } from '../db';

/**
 * A rate-limit counter that lives in Postgres instead of process memory.
 *
 * express-rate-limit's default store is a Map in the running process. On a
 * serverless host every instance has its own Map and instances come and go,
 * so "10 failed logins per 15 minutes" was 10 per instance per lifetime - an
 * attacker spread across instances simply never met the limit. One row per
 * key, incremented atomically, gives every instance the same count.
 *
 * Fails open: if the counter cannot be read the request goes through. The
 * limiter protects against abuse; it must not become the thing that takes
 * the site down when the database hiccups.
 */
export class PostgresRateLimitStore implements Store {
  private windowMs = 60_000;
  /** Keys are namespaced per limiter, so one limiter's count never leaks into another's. */
  readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string) {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    try {
      const windowSeconds = Math.ceil(this.windowMs / 1000);
      const rows = await prismaAdmin.$queryRaw<Array<{ hits: number; resetAt: Date }>>`
        INSERT INTO "rate_limit_buckets" ("key", "hits", "resetAt")
        VALUES (${this.key(key)}, 1, now() + make_interval(secs => ${windowSeconds}))
        ON CONFLICT ("key") DO UPDATE SET
          "hits" = CASE WHEN "rate_limit_buckets"."resetAt" <= now() THEN 1 ELSE "rate_limit_buckets"."hits" + 1 END,
          "resetAt" = CASE WHEN "rate_limit_buckets"."resetAt" <= now()
                           THEN now() + make_interval(secs => ${windowSeconds})
                           ELSE "rate_limit_buckets"."resetAt" END
        RETURNING "hits", "resetAt"`;

      // Opportunistic cleanup, so expired rows do not accumulate for ever.
      if (Math.random() < 0.01) {
        void prismaAdmin.$executeRaw`DELETE FROM "rate_limit_buckets" WHERE "resetAt" < now() - interval '1 day'`.catch(() => undefined);
      }

      return { totalHits: Number(rows[0].hits), resetTime: rows[0].resetAt };
    } catch (error) {
      console.error('rate limit store unavailable, allowing request', error);
      return { totalHits: 0, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    await prismaAdmin.$executeRaw`
      UPDATE "rate_limit_buckets" SET "hits" = GREATEST("hits" - 1, 0) WHERE "key" = ${this.key(key)}`.catch(() => undefined);
  }

  async resetKey(key: string): Promise<void> {
    await prismaAdmin.$executeRaw`DELETE FROM "rate_limit_buckets" WHERE "key" = ${this.key(key)}`.catch(() => undefined);
  }
}
