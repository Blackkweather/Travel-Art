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

export default { LOCALE, formatDate, formatShortDate, formatTime, formatNumber, plural, initLocale }
