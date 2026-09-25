/**
 * Parses a DB column that stores JSON as text (images, videos, location,
 * performanceSpots, schedule, ...). Prisma sometimes hands back the already-
 * parsed value too, so this accepts either. Falls back to `fallback` on a
 * missing value or a parse error, so one corrupt row never 500s a list
 * endpoint - the same behaviour every route was already reimplementing.
 *
 * Pass the raw value itself as `fallback` to keep the "maybe it's a plain
 * string, not JSON" behaviour a couple of call sites relied on.
 */
export function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
