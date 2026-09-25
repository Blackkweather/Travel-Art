import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './en'

/**
 * Translation, keyed by the French source text.
 *
 * WHY THE KEY IS THE SENTENCE
 * The usual scheme - t('dashboard.hotel.stats.bookings') - needs two files kept
 * in step for every string, and a key that drifts renders as itself: the
 * visitor sees "dashboard.hotel.stats.bookings" on the page. Here the key IS
 * the French copy, so French needs no dictionary and an untranslated string
 * falls back to good French rather than to a broken-looking identifier. In a
 * product whose first language is French, the failure mode of a missed string
 * is "not translated yet", never "visibly broken".
 *
 * WHY t() IS A PLAIN FUNCTION, NOT A HOOK
 * 400-odd strings live in 52 files, several of which declare more than one
 * component. A hook would have to be threaded into each component body by hand;
 * a module function only needs an import. The provider keeps the module-level
 * locale in step and remounts the tree when it changes, which is the right
 * trade for an action a person takes deliberately and rarely.
 */

export type Locale = 'fr' | 'en'

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
]

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  fr: {}, // the key is already French
  en,
}

const STORAGE_KEY = 'travel-art-locale'

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    /* private windows and blocked site data both land here */
  }
  // French is the product's language; only an explicit choice moves off it.
  return 'fr'
}

let currentLocale: Locale = readStoredLocale()

/** Fills {name} placeholders so a translation can reorder them. */
function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in vars ? String(vars[key]) : whole
  )
}

/** Translate French source copy into the active language. */
export function t(text: string, vars?: Record<string, string | number>): string {
  return interpolate(DICTIONARIES[currentLocale][text] ?? text, vars)
}

export function getLocale(): Locale {
  return currentLocale
}

interface I18nValue {
  locale: Locale
  setLocale: (next: Locale) => void
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale] = useState<Locale>(currentLocale)

  useEffect(() => {
    // Screen readers, hyphenation and translation prompts all read this.
    document.documentElement.lang = locale
  }, [locale])

  /**
   * Switching language reloads the page.
   *
   * Not laziness: a good deal of copy lives in module-level constants - the
   * status vocabulary, the sidebar's menus, the pricing tiers - which are
   * evaluated once when their module is imported. Re-rendering, or even
   * remounting the whole tree, would leave every one of those frozen in the
   * language the tab started in, so the page would end up half translated in a
   * way that is hard to see and harder to test for. A reload re-evaluates the
   * modules too, which is the only way to be sure the page is in one language.
   *
   * The cost is one navigation on an action a person takes deliberately and
   * rarely, which is the right side of that trade.
   */
  const setLocale = useCallback((next: Locale) => {
    if (next === currentLocale) return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* Without storage the choice cannot survive the reload, so do not do one:
         reloading here would land the visitor back in the language they left. */
      currentLocale = next
      return
    }
    window.location.reload()
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
