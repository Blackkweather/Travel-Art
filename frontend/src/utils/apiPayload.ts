import { t } from '@/i18n'
/**
 * Pull an array out of a response whose envelope varies.
 *
 * The API returns collections in four different shapes depending on the route:
 * a bare array, `{ key: [...] }`, `{ data: [...] }`, or `{ data: { key: [...] } }`.
 * Three screens each carried their own copy of this reconciliation - two of them
 * byte-identical, the third the same logic wrapped in useCallback - which meant
 * a fifth envelope shape would have to be handled in three places, and would in
 * practice be handled in one.
 *
 * The right long-term fix is for the API to settle on one envelope. Until it
 * does, this is the single place that knows about the inconsistency.
 */
export function extractArray<T = any>(payload: any, key: string): T[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as T[]
  if (Array.isArray(payload[key])) return payload[key] as T[]
  if (payload.data) {
    if (Array.isArray(payload.data[key])) return payload.data[key] as T[]
    if (Array.isArray(payload.data)) return payload.data as T[]
  }
  return []
}

/**
 * Parse a column that stores JSON as text.
 *
 * Several Prisma models keep structured values (`location`, `images`,
 * `performanceSpots`) in String columns, so every consumer has to cope with
 * receiving either the parsed value or the raw text - and with the text being
 * malformed. Callers were doing this inline with bare try/catch blocks that
 * swallowed the error and returned inconsistent fallbacks.
 */
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  if (typeof value !== 'string') return value as T
  try {
    const parsed = JSON.parse(value)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

/**
 * Resolve a display name from whichever shape the API used.
 *
 * Artists come back as a plain string on some routes, `{ name }` on others, and
 * `{ user: { name }, stageName }` on the rest - where `name` is absent and
 * reading it yields undefined. A stage name wins when present, because that is
 * the name the artist performs under.
 *
 * Never falls back to an id: a missing name should read as missing, not as
 * internal state leaked onto the screen.
 */
export function personName(value: unknown, fallback = 'Artiste'): string {
  if (!value) return fallback
  if (typeof value === 'string') return value || fallback
  const v = value as any
  return v.stageName || v.user?.name || v.name || fallback
}

/** The same problem for venues, which use `{ name }` or a plain string. */
export function venueName(value: unknown, fallback = t('Lieu à confirmer')): string {
  if (!value) return fallback
  if (typeof value === 'string') return value || fallback
  return (value as any).name || fallback
}
