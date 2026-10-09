/**
 * Date and number formatting for the active language.
 *
 * Copy lives in `@/i18n`; this module is only about how dates, times and
 * numbers are written. It follows the same language, so an English reader gets
 * "14 March 2026" and "1,250" rather than French forms in English sentences.
 *
 * The formatters are built once at module load, which is safe because
 * switching language reloads the page - see the note in `@/i18n`.
 */
import { getLocale, t } from '@/i18n'

const TAGS = { fr: 'fr-FR', en: 'en-GB' } as const

export const LOCALE = TAGS[getLocale()]

export type SupportedLanguage = 'fr' | 'en'

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
 * Kept for the default export's shape. The `lang` attribute is set by
 * I18nProvider, which knows the active language; this module used to stamp
 * 'fr' at import time and would have raced it.
 */
export const initLocale = (): void => {}


/**
 * "il y a 3 heures" / "3 hours ago".
 *
 * The admin dashboard and the activity log each had their own copy of this;
 * one spoke French and the other English ("3h ago") on the same French-only
 * site. Singular and plural are separate keys because the two languages break
 * differently at one, and because English puts the unit before "ago".
 */
export const formatRelative = (value: string | Date): string => {
  const date = toDate(value)
  if (!date) return t('Récemment')

  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return t('À l’instant')
  if (minutes < 60) {
    return t(minutes === 1 ? 'il y a {n} minute' : 'il y a {n} minutes', { n: minutes })
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return t(hours === 1 ? 'il y a {n} heure' : 'il y a {n} heures', { n: hours })
  }
  const days = Math.round(hours / 24)
  if (days < 7) {
    return t(days === 1 ? 'il y a {n} jour' : 'il y a {n} jours', { n: days })
  }
  // Past a week a date is more useful than a distance.
  return formatShortDate(date)
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
  all: t('Tous les types'),
  rooftop: t('Toit-terrasse'),
  intimate: t('Intimiste'),
  workshop: t('Atelier'),
  residency: t('Résidence'),
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CREDIT_PURCHASE: t('Achat de crédits'),
  REFUND: t('Remboursement'),
  BOOKING: t('Réservation'),
  BOOKING_PAYMENT: t('Paiement de réservation'),
  ADJUSTMENT: t('Ajustement'),
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
  formatRelative,
  initLocale,
  experienceTypeLabel,
  transactionTypeLabel,
}
