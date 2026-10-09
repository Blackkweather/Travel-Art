import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { privacyApi } from '@/utils/api'
import { getAnalyticsChoice, setAnalyticsChoice } from '@/utils/consent'
import { t } from '@/i18n'

/**
 * The choice, asked once.
 *
 * Refusing is exactly as easy as accepting - same shape, same weight, side by
 * side. That is not decoration: a banner where "accept" is a button and
 * "refuse" is a grey link in the corner is the pattern the CNIL has been
 * fining people over, because a consent that is harder to withhold than to
 * give is not freely given.
 *
 * There is no "essential cookies" toggle because there is nothing to toggle.
 * The session token is required to sign in and is out of scope for consent;
 * measurement is the only thing being asked about, so the banner asks about
 * that and nothing else.
 */
const CookieBanner: React.FC = () => {
  const { user } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Nothing is asked of someone who has already answered.
    if (getAnalyticsChoice() === 'unset') {
      // A beat after load, so it does not fight the intro sequence for the
      // first thing a visitor sees.
      const id = window.setTimeout(() => setVisible(true), 4200)
      return () => window.clearTimeout(id)
    }
  }, [])

  /* A fixed bar at the foot of the page covers whatever the page put there.
     Measured on /about, it hid the newsletter field, its subscribe button and
     two footer links - so the page reserves exactly the bar's height until the
     question is answered. The height is measured rather than hardcoded because
     the copy wraps to two lines on a narrow screen. */
  useEffect(() => {
    if (!visible) return
    const apply = () => {
      const h = barRef.current?.offsetHeight ?? 0
      document.body.style.paddingBottom = h ? `${h}px` : ''
    }
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
      document.body.style.paddingBottom = ''
    }
  }, [visible])

  const answer = (granted: boolean) => {
    setAnalyticsChoice(granted ? 'granted' : 'denied')
    setVisible(false)

    // Signed in, the answer also goes on the server ledger, where it can be
    // shown later. Best-effort: a failure here must not block the choice from
    // taking effect in the browser, which it already has.
    if (user) {
      privacyApi
        .setConsent('COOKIES_ANALYTICS', granted)
        .catch((error) => console.warn('Consent not recorded server-side', error))
    }
  }

  if (!visible) return null

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-[9998] border-t border-line bg-surface-raised shadow-soft"
      role="dialog"
      aria-live="polite"
      aria-label={t('Préférences de mesure d’audience')}
      data-testid="cookie-banner"
    >
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-content-secondary leading-relaxed flex-1">
          {t('Nous aimerions mesurer l’audience du site pour comprendre ce qui est lu. Rien n’est mesuré tant que vous n’avez pas accepté, et vous pouvez changer d’avis à tout moment.')}{' '}
          <Link to="/cookies" className="text-gold underline">
            {t('En savoir plus')}
          </Link>
        </p>

        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => answer(false)}
            className="btn-secondary text-sm"
            data-testid="cookie-refuse"
          >
            {t('Refuser')}
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="btn-primary text-sm"
            data-testid="cookie-accept"
          >
            {t('Accepter')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner
