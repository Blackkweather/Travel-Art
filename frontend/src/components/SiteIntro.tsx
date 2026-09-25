import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@/i18n'

/**
 * The few seconds before the site.
 *
 * Rules it has to obey, because an intro is the easiest thing on a site to get
 * wrong:
 *
 *  - It never blocks entry. The whole sequence is 3.2s and the panel is removed
 *    from the DOM afterwards. If the video never loads, the sequence plays over
 *    the navy field and looks deliberate rather than broken.
 *  - It plays once per session, not once per navigation. Watching the same
 *    four seconds on every visit to the homepage is an insult to a returning
 *    hotelier.
 *  - Anyone can leave immediately: a click, any key, or the skip control.
 *  - `prefers-reduced-motion` skips it outright. This is decoration, and for
 *    some people decoration of this kind is a symptom trigger.
 *  - The mark is drawn as SVG and the wordmark is set in live type, so neither
 *    can go soft the way the exported PNG does at large sizes.
 */

const SEEN_KEY = 'travel-art:intro-seen'
const TOTAL_MS = 3200

type Props = {
  /** The generated courtyard plate. Optional on purpose - see the notes above. */
  videoSrc?: string
  posterSrc?: string
}

const SiteIntro: React.FC<Props> = ({ videoSrc, posterSrc }) => {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const dismiss = useCallback(() => {
    clearTimers()
    setLeaving(true)
    // Matches the 1s .intro--leaving lift, with a little slack so the node is
    // never removed mid-travel. It goes away afterwards so it can never sit on
    // top of the page swallowing clicks.
    timers.current.push(window.setTimeout(() => setVisible(false), 1100))
  }, [])

  useEffect(() => {
    let seen = false
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      // Private windows and blocked storage throw on read. Treating that as
      // "already seen" is the quiet choice: better a missing intro than one
      // that repeats on every page for someone whose browser won't remember.
      seen = true
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (seen || reducedMotion) return

    try {
      window.sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Not fatal - the intro simply may play again next time.
    }

    setVisible(true)
    document.body.style.overflow = 'hidden'
    timers.current.push(window.setTimeout(dismiss, TOTAL_MS))

    return () => {
      clearTimers()
      document.body.style.overflow = ''
    }
  }, [dismiss])

  useEffect(() => {
    if (!visible) {
      document.body.style.overflow = ''
      return
    }
    const onKey = () => dismiss()
    window.addEventListener('keydown', onKey, { once: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      className={`intro${leaving ? ' intro--leaving' : ''}`}
      onClick={dismiss}
      role="presentation"
      data-testid="site-intro"
    >
      {videoSrc && (
        <video
          className="intro__plate"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
tabIndex={-1}
        />
      )}
      <div className="intro__veil" aria-hidden="true" />
      <div className="intro__hem" aria-hidden="true" />

      <div className="intro__stage">
        <svg
          className="intro__mark"
          viewBox="0 0 48 48"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="2.5" fill="currentColor" />
          <path d="M24 7 L28 21 L24 24 L20 21 Z" fill="currentColor" />
          <path d="M24 41 L20 27 L24 24 L28 27 Z" fill="currentColor" opacity="0.45" />
        </svg>

        <p className="intro__wordmark">TRAVEL ART</p>
        <span className="intro__rule" aria-hidden="true" />
        <p className="intro__line">{t('Une semaine. Une maison. Un artiste.')}</p>
      </div>

      <button type="button" className="intro__skip" onClick={dismiss}>
        {t('Passer')}
      </button>
    </div>
  )
}

export default SiteIntro
