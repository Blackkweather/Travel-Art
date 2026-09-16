import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { notificationsApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * What happened to your residencies, in the one place a signed-in person
 * always passes.
 *
 * Until the notifications service existed there was nothing to show here: a
 * hotel could ask an artist for a week and the artist would only find out by
 * opening the bookings page on the off chance. The email covers whoever is not
 * looking; this covers whoever is.
 *
 * It fails quiet. A bell that renders an error where a count should be is
 * worse than a bell that renders nothing, because the failure is on every page
 * of the app rather than on the one the request belonged to.
 */

interface Notification {
  id: string
  type: string
  read: boolean
  createdAt: string
  payload: {
    bookingId?: string
    startDate?: string
    endDate?: string
    hotelName?: string | null
    artistName?: string | null
  }
}

/** Poll rather than push: the backend has no socket, and a residency is not
 *  an instant-message. Slow enough to be free, often enough to feel live. */
const POLL_MS = 60_000

function stay(from?: string, to?: string): string {
  if (!from || !to) return ''
  const a = new Date(from)
  const b = new Date(to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return ''
  const day = (d: Date) => d.getUTCDate()
  const month = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' })
  return month(a) === month(b)
    ? `${day(a)}–${day(b)} ${month(b)} ${b.getUTCFullYear()}`
    : `${day(a)} ${month(a)} – ${day(b)} ${month(b)} ${b.getUTCFullYear()}`
}

/** One line, in the voice of the person reading it. */
function describe(n: Notification): string {
  const who = n.payload.hotelName || n.payload.artistName || ''
  const when = stay(n.payload.startDate, n.payload.endDate)
  switch (n.type) {
    case 'BOOKING_REQUESTED':
      return t('{who} vous propose une résidence', { who }) + (when ? ` · ${when}` : '')
    case 'BOOKING_CONFIRMED':
      return t('{who} accepte la résidence', { who }) + (when ? ` · ${when}` : '')
    case 'BOOKING_REJECTED':
      return t('{who} ne retient pas ces dates', { who }) + (when ? ` · ${when}` : '')
    case 'BOOKING_CANCELLED':
      return t('{who} annule la résidence', { who }) + (when ? ` · ${when}` : '')
    case 'RATING_RECEIVED':
      return t('{who} a laissé une évaluation', { who })
    default:
      return t('Mise à jour')
  }
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list()
      if (!res.data?.success) return
      setItems(res.data.data.notifications ?? [])
      setUnread(res.data.data.unreadCount ?? 0)
    } catch {
      // Quiet on purpose - see the note at the top of this file.
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  // Close on an outside click and on Escape, the two ways anyone dismisses a
  // panel without thinking about it.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const markAllRead = async () => {
    // Optimistic: the badge is the thing the click was about, so it clears now
    // and the request catches up. A failure restores it on the next poll.
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await notificationsApi.readAll()
    } catch {
      load()
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-control text-content-secondary transition-colors hover:text-content"
        aria-label={
          unread > 0
            ? t('Notifications, {n} non lues', { n: unread })
            : t('Notifications')
        }
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-gold px-1 text-[0.65rem] font-semibold leading-[1.05rem] text-content-inverse"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-[var(--surface)] shadow-xl"
          role="dialog"
          aria-label={t('Notifications')}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-content">{t('Notifications')}</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-content-secondary underline underline-offset-4 hover:text-content"
              >
                {t('Tout marquer comme lu')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-content-secondary">
              {t('Rien de neuf pour le moment.')}
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-line last:border-b-0">
                  <Link
                    to="/dashboard/bookings"
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-warm)] ${
                      n.read ? '' : 'bg-[var(--surface-warm)]'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.read ? 'bg-transparent' : 'bg-gold'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-snug text-content">{describe(n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
