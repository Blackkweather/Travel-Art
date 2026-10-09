import React, { useEffect, useRef, useState } from 'react'
import { authApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * What both registration forms share: a draft that survives a refresh, live
 * "already taken" checks, the referral code a visitor arrived with, and the
 * optional anti-bot widget.
 */

// -------------------------------------------------------------------- draft

/**
 * Keep the form in sessionStorage so a refresh or an accidental back does not
 * wipe twenty fields. Passwords are never written: `omit` names them.
 */
export function useDraft<T extends object>(key: string, initial: T, omit: (keyof T)[] = []) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key)
      return saved ? { ...initial, ...JSON.parse(saved) } : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      const copy: Record<string, unknown> = { ...(state as any) }
      for (const k of omit) delete copy[k as string]
      sessionStorage.setItem(key, JSON.stringify(copy))
    } catch {
      // Private mode or full storage: the form still works, it just forgets.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state])

  const clear = () => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }

  return [state, setState, clear] as const
}

// ------------------------------------------------------------- live checks

type Probe = { email?: string; phone?: string; country?: string; stageName?: string; hotelName?: string; city?: string }

/**
 * Ask the API, after the person stops typing, whether the identity fields are
 * free. Returns field -> message for whatever is taken or invalid, and the
 * e-mail correction to offer when the domain looks mistyped.
 */
export function useAvailabilityCheck(probe: Probe, enabled = true) {
  const [fields, setFields] = useState<Record<string, string>>({})
  const [suggestion, setSuggestion] = useState<string | undefined>()
  const last = useRef('')

  useEffect(() => {
    if (!enabled) return
    const body: Probe = Object.fromEntries(Object.entries(probe).filter(([, v]) => typeof v === 'string' && v.trim().length >= 2)) as Probe
    const signature = JSON.stringify(body)
    if (signature === last.current || Object.keys(body).length === 0) return
    const timer = setTimeout(async () => {
      last.current = signature
      try {
        const res = await authApi.checkAvailability(body)
        setFields(res.data.data.fields ?? {})
        setSuggestion(res.data.data.suggestion)
      } catch {
        // A failed check is not an error for the person typing; submit re-checks.
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [probe.email, probe.phone, probe.country, probe.stageName, probe.hotelName, probe.city, enabled])

  return { fields, suggestion }
}

// ------------------------------------------------------------------ referral

/** The code from /register?ref=… or from the /ref/:code link that sent them here. */
export function readReferralCode(): string | undefined {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref')
    const code = (fromUrl || sessionStorage.getItem('referralCode') || '').trim().toUpperCase()
    return code || undefined
  } catch {
    return undefined
  }
}

// ------------------------------------------------------------------- errors

/** The per-field messages an API error carries, or {}. */
export const apiFieldErrors = (error: any): Record<string, string> => error?.response?.data?.error?.fields ?? {}

export const apiMessage = (error: any, fallback: string): string => error?.response?.data?.error?.message || fallback

// ------------------------------------------------------------------ captcha

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

const SITE_KEY = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined

export const captchaEnabled = Boolean(SITE_KEY)

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Load Cloudflare's script once, however many widgets ask for it. */
let turnstileReady: Promise<void> | undefined
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  turnstileReady ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TURNSTILE_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      turnstileReady = undefined
      reject(new Error('turnstile script failed to load'))
    }
    document.head.appendChild(script)
  })
  return turnstileReady
}

interface CaptchaProps {
  onToken: (token: string | null) => void
  /** Which form this protects; the API checks the token was issued for it. */
  action: 'register'
  /**
   * Change it to get a fresh challenge. Tokens are single-use: after a
   * submit the API refused (a taken e-mail, say), the old token is spent and
   * the next attempt needs a new one.
   */
  resetKey?: number
}

/**
 * Cloudflare Turnstile, rendered only when the site key is configured (the
 * API requires the token only when its secret is). Calls onToken with the
 * token, or null when it expires, errors or is reset.
 */
export const Captcha: React.FC<CaptchaProps> = ({ onToken, action, resetKey = 0 }) => {
  const box = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!SITE_KEY || !box.current) return
    let cancelled = false
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          action,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current) return
    onToken(null)
    window.turnstile?.reset(widgetId.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (failed) {
    return <p className="text-sm text-[var(--state-critical)]">{t('La vérification anti-robot n’a pas pu se charger. Rechargez la page.')}</p>
  }

  if (!SITE_KEY) return null
  return (
    <div>
      <div ref={box} />
      <p className="mt-2 text-[0.8125rem] text-content-secondary">{t('Vérification anti-robot')}</p>
    </div>
  )
}

/** The "did you mean …?" button under an e-mail field. */
export const EmailSuggestion: React.FC<{ suggestion?: string; onAccept: (email: string) => void }> = ({ suggestion, onAccept }) =>
  suggestion ? (
    <button type="button" onClick={() => onAccept(suggestion)} className="mt-1 text-sm text-gold underline">
      {t('Utiliser {email}', { email: suggestion })}
    </button>
  ) : null
