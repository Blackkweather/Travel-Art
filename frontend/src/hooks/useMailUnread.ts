import { useEffect, useState } from 'react'
import { mailApi } from '@/utils/api'

/** Fired by the inbox whenever it learns the unread count, so the badge does not wait for its next poll. */
const MAIL_UNREAD_EVENT = 'travel-art:mail-unread'

export function announceMailUnread(unread: number) {
  window.dispatchEvent(new CustomEvent(MAIL_UNREAD_EVENT, { detail: unread }))
}

/** Slow enough to cost nothing, often enough that a customer's mail is not left a day. */
const POLL_MS = 60_000

/**
 * Unread messages in the shared inbox, for the sidebar badge. Nothing is
 * fetched unless `enabled` - the inbox is an administrator's - and a failure
 * renders no badge rather than an error, for the reason the bell gives.
 */
export function useMailUnread(enabled: boolean): number {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    const load = () =>
      mailApi
        .unread()
        .then((res) => {
          if (alive) setUnread(res.data.data.unread ?? 0)
        })
        .catch(() => undefined)
    const onAnnounce = (event: Event) => setUnread(Number((event as CustomEvent).detail) || 0)

    load()
    const timer = window.setInterval(load, POLL_MS)
    window.addEventListener(MAIL_UNREAD_EVENT, onAnnounce)
    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener(MAIL_UNREAD_EVENT, onAnnounce)
    }
  }, [enabled])

  return unread
}
