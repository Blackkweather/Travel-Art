import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import { t, getLocale } from '@/i18n'

/**
 * "Continue with Google", on the sign-in page and the registration picker.
 *
 * Google's button hands us an ID token; the API checks it. An existing
 * account signs straight in. A new address chooses artist or hotel on the
 * registration page, which opens an INCOMPLETE account: signed in, but only
 * to fill in its profile (/complete-profile). The profile then goes to an
 * administrator, so Google alone never makes an account anyone can see.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
        }
      }
    }
  }
}

const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined

export const googleEnabled = Boolean(CLIENT_ID)

// ------------------------------------------------------- signup hand-off

export interface GoogleSignup {
  signupToken: string
  email: string
  firstName: string
  lastName: string
  name: string
}

const SIGNUP_KEY = 'travel-art:google-signup'

/** The Google identity a registration form should finish, if there is one. */
export function readGoogleSignup(): GoogleSignup | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_KEY)
    return raw ? (JSON.parse(raw) as GoogleSignup) : null
  } catch {
    return null
  }
}

export function clearGoogleSignup() {
  try {
    sessionStorage.removeItem(SIGNUP_KEY)
  } catch {
    /* ignore */
  }
}

function saveGoogleSignup(signup: GoogleSignup) {
  try {
    sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(signup))
  } catch {
    /* the form simply starts empty */
  }
}

/**
 * Satisfies the shared password rule in the browser's own check. The API
 * ignores it for a Google account and keeps its random password.
 */
export const GOOGLE_PLACEHOLDER_PASSWORD = 'Google-signup-1'

/** Where a signed-in account belongs: its profile form until it is filled in. */
export const homeFor = (user: { approvalStatus?: string } | null) =>
  user?.approvalStatus === 'INCOMPLETE' ? '/complete-profile' : '/dashboard'

/** Open the account as an artist or a hotel and sign it in. */
export async function startWithGoogle(signup: GoogleSignup, role: 'ARTIST' | 'HOTEL') {
  const res = await authApi.googleStart({ signupToken: signup.signupToken, role, acceptTerms: true, locale: getLocale() })
  const { user, token } = res.data.data
  clearGoogleSignup()
  useAuthStore.setState({ user, token, isAuthenticated: true, sessionEndReason: null })
  return user
}

/** The name and address a profile form starts from, for an account opened with Google. */
export interface ProfileAccount {
  email: string
  name: string
  firstName: string
  lastName: string
}

export function profileAccount(user: { email: string; name: string }): ProfileAccount {
  const [firstName, ...rest] = user.name.trim().split(/\s+/)
  return { email: user.email, name: user.name, firstName: firstName ?? '', lastName: rest.join(' ') }
}

// ------------------------------------------------------------------ button

let scriptReady: Promise<void> | undefined
function loadGoogle(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()
  scriptReady ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptReady = undefined
      reject(new Error('google script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptReady
}

interface Props {
  /** Google's wording on the button. */
  text?: 'continue_with' | 'signup_with' | 'signin_with'
  /** Already on the registration page: hand the new identity over instead of navigating there. */
  onSignup?: (signup: GoogleSignup) => void
}

const GoogleSignIn: React.FC<Props> = ({ text = 'continue_with', onSignup }) => {
  const box = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID || !box.current) return
    let cancelled = false

    const onCredential = async ({ credential }: { credential: string }) => {
      setBusy(true)
      try {
        const res = await authApi.google(credential)
        const data = res.data.data
        if (data.status === 'SIGNED_IN') {
          clearGoogleSignup()
          useAuthStore.setState({ user: data.user, token: data.token, isAuthenticated: true, sessionEndReason: null })
          toast.success(t('Bon retour'))
          navigate(homeFor(data.user), { replace: true })
        } else {
          saveGoogleSignup(data)
          toast(t('Aucun compte pour {email}. Choisissez artiste ou hôtel pour le créer.', { email: data.email }))
          if (onSignup) onSignup(data)
          else navigate('/register')
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.error?.message || t('La connexion avec Google a échoué. Réessayez.'))
      } finally {
        setBusy(false)
      }
    }

    loadGoogle()
      .then(() => {
        if (cancelled || !box.current || !window.google) return
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCredential })
        window.google.accounts.id.renderButton(box.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          locale: getLocale(),
          width: Math.min(box.current.offsetWidth || 320, 400),
        })
      })
      .catch(() => {
        /* No button: the e-mail form below still works. */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!CLIENT_ID) return null
  return (
    <div className={busy ? 'pointer-events-none opacity-60' : undefined}>
      <div ref={box} className="flex min-h-[44px] w-full justify-center" />
    </div>
  )
}

/** "or", between the Google button and the e-mail form. */
export const OrDivider: React.FC = () =>
  googleEnabled ? (
    <div className="flex items-center gap-3 text-sm text-content-secondary" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      {t('ou')}
      <span className="h-px flex-1 bg-line" />
    </div>
  ) : null

export default GoogleSignIn
