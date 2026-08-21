/**
 * Localisation.
 *
 * Travel Art ships in French only. The artists this product recruits are
 * overwhelmingly French-speaking, and the site copy is written in French
 * rather than translated into it, so there is no second locale to fall back
 * to and no language switcher in the UI.
 *
 * This module previously carried five locales (en/fr/es/de/it) and a runtime
 * key-lookup with an English fallback. That was misleading rather than useful:
 * the dictionary only ever covered a dozen nav and button strings, every page
 * in the app hardcoded its copy, and the switcher that drove it was not
 * mounted anywhere. What survives is the part that is actually load-bearing -
 * a single locale tag for `lang`, date and number formatting.
 */

export const LOCALE = 'fr-FR' as const

export type SupportedLanguage = 'fr'

/** Formatters are built once; constructing Intl objects per call is costly. */
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

const toDate = (value: Date | string | number): Date | null => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "14 mars 2026". Returns an em dash for values that are not a real date. */
export const formatDate = (value: Date | string | number): string => {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : '—'
}

/** "14/03/2026", for dense table cells. */
export const formatShortDate = (value: Date | string | number): string => {
  const date = toDate(value)
  return date ? shortDateFormatter.format(date) : '—'
}

/** "20:30". French uses a 24-hour clock. */
export const formatTime = (value: Date | string | number): string => {
  const date = toDate(value)
  return date ? timeFormatter.format(date) : '—'
}

/** "1 250" with a narrow no-break space, as French typography requires. */
export const formatNumber = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? numberFormatter.format(value) : '0'

/**
 * French pluralisation: unlike English, 0 takes the singular.
 * `plural(0, 'artiste')` gives "0 artiste", `plural(2, 'artiste')` gives
 * "2 artistes".
 */
export const plural = (count: number, singular: string, suffix = 's'): string =>
  `${formatNumber(count)} ${singular}${Math.abs(count) >= 2 ? suffix : ''}`

/** Applied once at startup so assistive tech and the browser agree on the language. */
export const initLocale = (): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = 'fr'
  }
}

if (typeof window !== 'undefined') {
  initLocale()
}


/**
 * Labels for enum-ish values the API returns.
 *
 * These values are protocol, not copy: they are compared against API data and
 * must stay exactly as the backend sends them. Only the label is translated.
 * Several screens were printing the raw value through a `capitalize` class -
 * "Rooftop", "Workshop", "CREDIT_PURCHASE" - which is English on a
 * French-only site and, in the transactions case, a database constant shown
 * to a customer.
 */
export const EXPERIENCE_TYPE_LABELS: Record<string, string> = {
  all: 'Tous les types',
  rooftop: 'Toit-terrasse',
  intimate: 'Intimiste',
  workshop: 'Atelier',
  residency: 'Résidence',
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CREDIT_PURCHASE: 'Achat de crédits',
  REFUND: 'Remboursement',
  BOOKING: 'Réservation',
  BOOKING_PAYMENT: 'Paiement de réservation',
  ADJUSTMENT: 'Ajustement',
}

/**
 * Falls back to the raw value rather than to an empty string: an unfamiliar
 * value the backend adds later should still show something the user and
 * support can talk about.
 */
export const labelFor = (map: Record<string, string>, value: string | null | undefined): string =>
  (value && map[value]) || value || ''

export const experienceTypeLabel = (value: string | null | undefined): string =>
  labelFor(EXPERIENCE_TYPE_LABELS, value)

export const transactionTypeLabel = (value: string | null | undefined): string =>
  labelFor(TRANSACTION_TYPE_LABELS, value)

export default {
  LOCALE,
  formatDate,
  formatShortDate,
  formatTime,
  formatNumber,
  plural,
  initLocale,
  experienceTypeLabel,
  transactionTypeLabel,
}
