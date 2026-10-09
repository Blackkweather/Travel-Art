/**
 * French month and weekday names, in one place.
 *
 * Both date controls formatted their own: the registration picker carried two
 * private month arrays while the range picker printed date-fns' English
 * defaults inside a French product. Neither imports a date-fns locale, so this
 * keeps that decision in a single file rather than in two components that were
 * already disagreeing.
 *
 * Weeks start on Monday, as they do in France.
 */
export const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

export const MONTHS_FR_FULL = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Single letters, Monday first - the form the calendar grid renders. */
export const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
