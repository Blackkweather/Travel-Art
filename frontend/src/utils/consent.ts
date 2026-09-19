/**
 * Whether this visitor has agreed to be measured.
 *
 * Today `analytics.ts` dispatches to `window.gtag` and `window.plausible`, and
 * neither is ever loaded - so nothing currently leaves the browser. That is
 * luck, not design: the moment a tag is added, tracking would begin on the
 * first page view with nobody having been asked. Under the ePrivacy directive
 * and the CNIL's reading of it, non-essential measurement needs prior consent,
 * and prior means before the first event, not after the first page.
 *
 * So the gate goes in first and the tag goes in behind it.
 *
 * The choice lives in localStorage because it must survive a page load and
 * applies to a browser rather than an account - a visitor who has not signed
 * in still has the right to refuse. For anyone signed in, the choice is also
 * written to the server ledger, which is what makes it provable.
 */

const KEY = 'travel-art:consent:analytics'

export type AnalyticsChoice = 'granted' | 'denied' | 'unset'

type Listener = (choice: AnalyticsChoice) => void
const listeners = new Set<Listener>()

/** Reads the stored choice. Absent storage is a refusal, never an assumption. */
export function getAnalyticsChoice(): AnalyticsChoice {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === 'granted' || raw === 'denied') return raw
    return 'unset'
  } catch {
    // Private windows and blocked storage throw on read. Failing closed is the
    // only defensible default: an unreadable choice is not a yes.
    return 'unset'
  }
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsChoice() === 'granted'
}

export function setAnalyticsChoice(choice: Exclude<AnalyticsChoice, 'unset'>): void {
  try {
    window.localStorage.setItem(KEY, choice)
  } catch {
    // The banner still disappears for this session; the visitor is simply
    // asked again next time, which is the harmless failure.
  }
  listeners.forEach((listener) => listener(choice))
}

export function onAnalyticsChoice(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
