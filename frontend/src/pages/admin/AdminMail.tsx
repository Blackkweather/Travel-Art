import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Inbox,
  Mail,
  MailOpen,
  Paperclip,
  PenLine,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react'
import { mailApi } from '@/utils/api'
import type { MailAttachment, MailFolder, MailMessage, MailSetup, MailThread, Mailbox } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import SEOHead from '@/components/SEOHead'
import MailBody from '@/components/mail/MailBody'
import { announceMailUnread } from '@/hooks/useMailUnread'
import { t } from '@/i18n'
import { LOCALE, formatDate, formatTime } from '@/utils/i18n'

/**
 * The shared inbox: what hotels, artists and suppliers write to the business's
 * own address, and the answers, in one place.
 *
 * Mail arrives through Resend's webhook the moment it lands, and the page also
 * asks the server to pull from Resend when it opens and on Actualiser - so a
 * webhook that is missing or misconfigured costs immediacy, never a message.
 * A reply goes out from the address the other party wrote to, threaded under
 * their message in their own mail client.
 *
 * The open conversation lives in the URL (?thread=…), which is what lets the
 * "new message" alert link straight to it.
 */

type Detail = { thread: MailThread; messages: MailMessage[]; reply: { to: Mailbox; from: Mailbox | null; subject: string } }

const FOLDERS: { key: MailFolder; label: string; icon: typeof Inbox }[] = [
  { key: 'inbox', label: t('Réception'), icon: Inbox },
  { key: 'sent', label: t('Envoyés'), icon: Send },
  { key: 'archived', label: t('Archivés'), icon: Archive },
]

const STATUS: Record<MailMessage['status'], { label: string; className: string } | null> = {
  RECEIVED: null,
  SENT: { label: t('Envoyé'), className: 'badge-neutral' },
  DELIVERED: { label: t('Distribué'), className: 'badge-positive' },
  BOUNCED: { label: t('Rejeté'), className: 'badge-critical' },
  FAILED: { label: t('Échec de l’envoi'), className: 'badge-critical' },
}

/** What a request to the API can carry; the server says the same. */
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024
const MAX_FILES = 10
const POLL_MS = 60_000

const timeOfDay = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const dayAndMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const numericDate = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' })

/** "14:32" today, "3 nov." this year, "03/11/25" before: the dates a mail list uses. */
function listDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return timeOfDay.format(date)
  if (date.getFullYear() === now.getFullYear()) return dayAndMonth.format(date)
  return numericDate.format(date)
}

const formatMailbox = (m: Mailbox) => (m.name ? `${m.name} <${m.address}>` : m.address)

function sizeLabel(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return t('{n} Ko', { n: Math.max(1, Math.round(bytes / 1024)) })
  return t('{n} Mo', { n: (bytes / 1024 / 1024).toFixed(1).replace('.', LOCALE === 'fr-FR' ? ',' : '.') })
}

const newClientId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const errorMessage = (e: any, fallback: string) => e?.response?.data?.error?.message || fallback

/**
 * Open an attachment's short-lived link in a new tab. The tab is opened inside
 * the click, before the request, because a window.open after an await is a
 * popup the browser blocks.
 */
async function openAttachment(attachment: MailAttachment) {
  const tab = window.open('about:blank', '_blank')
  try {
    const res = await mailApi.attachment(attachment.id)
    const url = res.data.data.url
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.assign(url)
    }
  } catch (e: any) {
    tab?.close()
    toast.error(errorMessage(e, t('Impossible d’ouvrir la pièce jointe pour le moment.')))
  }
}

// ------------------------------------------------------------ attachments

function AttachmentPicker({ files, onChange, disabled }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const total = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${i}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-control border border-line px-2.5 py-1 text-xs text-content"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-content-secondary">{sizeLabel(file.size)}</span>
              <button
                type="button"
                className="shrink-0 text-content-secondary hover:text-content"
                aria-label={t('Retirer {name}', { name: file.name })}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-content-secondary hover:text-content disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || files.length >= MAX_FILES}
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          {t('Joindre un fichier')}
        </button>
        {total > MAX_ATTACHMENT_BYTES && (
          <span className="text-xs font-medium text-[var(--state-critical)]">{t('Pièces jointes trop lourdes : 4 Mo au total.')}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? [])
          // Cleared so picking the same file again still fires a change.
          e.target.value = ''
          onChange([...files, ...picked].slice(0, MAX_FILES))
        }}
      />
    </div>
  )
}

// ------------------------------------------------------------------ reply

interface Draft {
  body: string
  cc: string
  files: File[]
  clientId: string
}

/** Drafts outlive switching conversations, though not a reload. */
const drafts = new Map<string, Draft>()
const emptyDraft = (): Draft => ({ body: '', cc: '', files: [], clientId: newClientId() })

/** Mounted with key={thread id}, so each conversation starts from its own draft. */
function ReplyBox({ detail, onSent }: { detail: Detail; onSent: () => void }) {
  const threadId = detail.thread.id
  const [draft, setDraft] = useState<Draft>(() => drafts.get(threadId) ?? emptyDraft())
  const [showCc, setShowCc] = useState(Boolean(draft.cc))
  const [sending, setSending] = useState(false)

  const update = (patch: Partial<Draft>) =>
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      drafts.set(threadId, next)
      return next
    })

  const tooHeavy = draft.files.reduce((sum, f) => sum + f.size, 0) > MAX_ATTACHMENT_BYTES

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!draft.body.trim() || sending || tooHeavy) return
    setSending(true)
    const form = new FormData()
    form.append('body', draft.body)
    if (draft.cc.trim()) form.append('cc', draft.cc)
    form.append('clientId', draft.clientId)
    draft.files.forEach((file) => form.append('attachments', file, file.name))
    try {
      await mailApi.reply(threadId, form)
      drafts.delete(threadId)
      setDraft(emptyDraft())
      setShowCc(false)
      toast.success(t('Réponse envoyée'))
      onSent()
    } catch (err: any) {
      toast.error(errorMessage(err, t('L’envoi a échoué. Votre réponse est conservée : réessayez.')))
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-card border border-line-strong bg-surface-raised p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <p className="min-w-0 break-words text-content-secondary">
          {t('Réponse à')} <span className="font-medium text-content">{formatMailbox(detail.reply.to)}</span>
          {detail.reply.from && (
            <>
              {' · '}
              {t('depuis {address}', { address: detail.reply.from.address })}
            </>
          )}
        </p>
        {!showCc && (
          <button type="button" className="text-xs text-content-secondary underline underline-offset-4 hover:text-content" onClick={() => setShowCc(true)}>
            {t('Ajouter une copie (Cc)')}
          </button>
        )}
      </div>

      {showCc && (
        <input
          type="text"
          className="form-input py-2 text-sm"
          placeholder={t('Cc : adresses séparées par des virgules')}
          aria-label={t('Destinataires en copie')}
          value={draft.cc}
          onChange={(e) => update({ cc: e.target.value })}
          disabled={sending}
        />
      )}

      <textarea
        className="form-textarea min-h-[9rem] w-full"
        placeholder={t('Votre réponse…')}
        aria-label={t('Votre réponse')}
        value={draft.body}
        onChange={(e) => update({ body: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
        }}
        disabled={sending}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <AttachmentPicker files={draft.files} onChange={(files) => update({ files })} disabled={sending} />
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={sending || !draft.body.trim() || tooHeavy}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {sending ? t('Envoi…') : t('Envoyer')}
        </button>
      </div>
      <p className="text-xs text-content-secondary">{t('Le message précédent est cité sous votre réponse. Ctrl + Entrée pour envoyer.')}</p>
    </form>
  )
}

// ---------------------------------------------------------------- compose

function ComposeDialog({ mailboxes, onClose, onSent }: { mailboxes: Mailbox[]; onClose: () => void; onSent: (threadId: string) => void }) {
  const [from, setFrom] = useState(mailboxes[0]?.address ?? '')
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [clientId] = useState(newClientId)
  const toRef = useRef<HTMLInputElement>(null)

  const dirty = Boolean(to.trim() || subject.trim() || body.trim() || files.length)
  const tooHeavy = files.reduce((sum, f) => sum + f.size, 0) > MAX_ATTACHMENT_BYTES

  const close = useCallback(() => {
    if (sending) return
    if (dirty && !window.confirm(t('Abandonner ce message ?'))) return
    onClose()
  }, [dirty, onClose, sending])

  // Escape reads the latest close through a ref, so the listener is set once
  // and typing - which changes `dirty` - never re-runs the focus below.
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    toRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || tooHeavy) return
    setSending(true)
    setFieldErrors({})
    const form = new FormData()
    if (from) form.append('from', from)
    form.append('to', to)
    if (cc.trim()) form.append('cc', cc)
    form.append('subject', subject)
    form.append('body', body)
    form.append('clientId', clientId)
    files.forEach((file) => form.append('attachments', file, file.name))
    try {
      const res = await mailApi.send(form)
      toast.success(t('Message envoyé'))
      onSent(res.data.data.threadId)
    } catch (err: any) {
      setFieldErrors(err?.response?.data?.error?.fields ?? {})
      toast.error(errorMessage(err, t('L’envoi a échoué. Votre message est conservé : réessayez.')))
    } finally {
      setSending(false)
    }
  }

  const fieldError = (name: string) =>
    fieldErrors[name] ? <p className="mt-1 text-xs font-medium text-[var(--state-critical)]">{fieldErrors[name]}</p> : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,31,63,0.55)] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        onSubmit={submit}
        className="max-h-[100dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-card border border-line bg-surface-raised p-5 shadow-2xl sm:rounded-card"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="compose-title" className="text-lg font-semibold text-content">
            {t('Nouveau message')}
          </h2>
          <button type="button" onClick={close} className="text-content-secondary hover:text-content" aria-label={t('Fermer')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {mailboxes.length > 1 ? (
          <label className="block">
            <span className="form-label">{t('De')}</span>
            <select className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} disabled={sending}>
              {mailboxes.map((m) => (
                <option key={m.address} value={m.address}>
                  {formatMailbox(m)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          mailboxes[0] && <p className="text-sm text-content-secondary">{t('De : {address}', { address: formatMailbox(mailboxes[0]) })}</p>
        )}

        <label className="block">
          <span className="form-label">{t('À')}</span>
          <input
            ref={toRef}
            type="text"
            inputMode="email"
            autoComplete="off"
            className="form-input"
            placeholder={t('nom@exemple.com, plusieurs adresses séparées par des virgules')}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={sending}
          />
          {fieldError('to')}
        </label>

        {showCc ? (
          <label className="block">
            <span className="form-label">{t('Cc')}</span>
            <input type="text" inputMode="email" autoComplete="off" className="form-input" value={cc} onChange={(e) => setCc(e.target.value)} disabled={sending} />
            {fieldError('cc')}
          </label>
        ) : (
          <button type="button" className="text-xs text-content-secondary underline underline-offset-4 hover:text-content" onClick={() => setShowCc(true)}>
            {t('Ajouter une copie (Cc)')}
          </button>
        )}

        <label className="block">
          <span className="form-label">{t('Objet')}</span>
          <input type="text" className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} maxLength={300} />
          {fieldError('subject')}
        </label>

        <label className="block">
          <span className="form-label">{t('Message')}</span>
          <textarea className="form-textarea min-h-[12rem] w-full" value={body} onChange={(e) => setBody(e.target.value)} disabled={sending} />
          {fieldError('body')}
        </label>

        <AttachmentPicker files={files} onChange={setFiles} disabled={sending} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost btn-sm" onClick={close} disabled={sending}>
            {t('Annuler')}
          </button>
          <button type="submit" className="btn-primary btn-sm" disabled={sending || !to.trim() || !subject.trim() || !body.trim() || tooHeavy}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {sending ? t('Envoi…') : t('Envoyer')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- message

function MessageCard({ message }: { message: MailMessage }) {
  const outbound = message.direction === 'OUTBOUND'
  const status = STATUS[message.status]
  const author = outbound
    ? message.sentBy
      ? t('{name}, depuis {address}', { name: message.sentBy.name, address: message.fromAddress })
      : message.fromAddress
    : message.fromName || message.fromAddress

  return (
    <article className={`rounded-card border border-line p-4 ${outbound ? 'bg-surface-sunken' : 'bg-surface-raised'}`}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-content">{author}</p>
          <p className="break-all text-xs text-content-secondary">
            {!outbound && message.fromName ? `${message.fromAddress} · ` : ''}
            {t('À : {list}', { list: message.to.join(', ') })}
            {message.cc.length > 0 && ` · ${t('Cc : {list}', { list: message.cc.join(', ') })}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status && <span className={status.className}>{status.label}</span>}
          <time dateTime={message.sentAt} className="text-xs text-content-secondary">
            {formatDate(message.sentAt)} · {formatTime(message.sentAt)}
          </time>
        </div>
      </header>

      {message.error && <p className="notice-critical mb-3 text-xs">{message.error}</p>}

      <MailBody html={message.html} text={message.text} />

      {message.attachments.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {message.attachments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => openAttachment(a)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-control border border-line px-2.5 py-1.5 text-xs text-content transition-colors hover:border-gold hover:text-gold"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{a.filename}</span>
                {a.size > 0 && <span className="shrink-0 text-content-secondary">{sizeLabel(a.size)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

// ------------------------------------------------------------------- page

const AdminMail: React.FC = () => {
  const [params, setParams] = useSearchParams()
  const folder = (['inbox', 'sent', 'archived'].includes(params.get('folder') ?? '') ? params.get('folder') : 'inbox') as MailFolder
  const selectedId = params.get('thread')

  const [setup, setSetup] = useState<MailSetup | null>(null)
  const [threads, setThreads] = useState<MailThread[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [unread, setUnread] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [composing, setComposing] = useState(false)
  const [busy, setBusy] = useState(false)

  const setParam = useCallback(
    (changes: Record<string, string | null>) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => (value === null ? next.delete(key) : next.set(key, value)))
        return next
      }),
    [setParams]
  )

  const learnUnread = (count: number) => {
    setUnread(count)
    announceMailUnread(count)
  }

  const loadList = useCallback(
    async (quiet = false) => {
      if (!quiet) setListLoading(true)
      try {
        const res = await mailApi.threads({ folder, q: search || undefined, page })
        const data = res.data.data
        // "Plus anciens" adds a page under the ones already shown.
        setThreads((prev) => (page > 1 ? [...prev.filter((p) => !data.threads.some((n) => n.id === p.id)), ...data.threads] : data.threads))
        setPages(data.pagination.pages)
        learnUnread(data.unread)
      } catch (e: any) {
        if (!quiet) toast.error(errorMessage(e, t('Impossible de charger les conversations.')))
      } finally {
        setListLoading(false)
      }
    },
    [folder, search, page]
  )

  const loadDetail = useCallback(async (id: string, quiet = false) => {
    if (!quiet) setDetailLoading(true)
    try {
      const res = await mailApi.thread(id)
      const { unread: total, ...data } = res.data.data
      setDetail(data)
      // The server read it on opening; the list and the badges catch up without a request.
      setThreads((prev) => prev.map((th) => (th.id === id ? { ...th, unreadCount: 0 } : th)))
      setUnread(total)
      announceMailUnread(total)
    } catch (e: any) {
      if (!quiet) toast.error(errorMessage(e, t('Impossible d’ouvrir cette conversation.')))
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const sync = useCallback(async (force: boolean) => {
    setSyncing(true)
    try {
      const res = await mailApi.sync(force)
      return res.data.data
    } catch {
      return null
    } finally {
      setSyncing(false)
    }
  }, [])

  // Setup first, then a pull from Resend, so the list opens on everything there is.
  useEffect(() => {
    let alive = true
    mailApi
      .setup()
      .then(async (res) => {
        if (!alive) return
        const data = res.data.data
        setSetup(data)
        learnUnread(data.unread)
        if (data.configured) {
          const pulled = await sync(false)
          if (alive && pulled?.imported) loadList(true)
        }
      })
      .catch(() => setSetup({ configured: false, webhook: false, mailboxes: [], unread: 0 }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  // Kept current while open. Without the webhook, each tick also asks the
  // server to pull from Resend - which it does at most every few seconds.
  useEffect(() => {
    if (!setup?.configured) return
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      if (!setup.webhook) await sync(false)
      loadList(true)
      if (selectedId) loadDetail(selectedId, true)
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [setup, selectedId, sync, loadList, loadDetail])

  const refresh = async () => {
    const pulled = await sync(true)
    if (pulled?.error) toast.error(t('Resend n’a pas répondu : {reason}', { reason: pulled.error }))
    else if (pulled?.imported) toast.success(pulled.imported === 1 ? t('1 nouveau message') : t('{n} nouveaux messages', { n: pulled.imported }))
    await loadList(true)
    if (selectedId) await loadDetail(selectedId, true)
  }

  const chooseFolder = (key: MailFolder) => {
    setPage(1)
    setParam({ folder: key === 'inbox' ? null : key, thread: null })
  }

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(query.trim())
  }

  const change = async (id: string, patch: { archived?: boolean; unread?: boolean }, done: string) => {
    setBusy(true)
    try {
      const res = await mailApi.update(id, patch)
      learnUnread(res.data.data.unread)
      toast.success(done)
      // An archived or re-unread conversation leaves the view it was read in.
      setParam({ thread: null })
      await loadList(true)
    } catch (e: any) {
      toast.error(errorMessage(e, t('L’action a échoué.')))
    } finally {
      setBusy(false)
    }
  }

  const afterReply = async () => {
    if (selectedId) await loadDetail(selectedId, true)
    loadList(true)
  }

  const afterCompose = (threadId: string) => {
    setComposing(false)
    setPage(1)
    setParam({ folder: 'sent', thread: threadId })
  }

  const thread = detail?.thread

  return (
    <div className="space-y-6">
      <SEOHead title={t('Messagerie') + ' — Travel Art'} />

      {/* Side by side only from lg: below it the sidebar leaves too little room for the title and both buttons. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-3xl font-serif font-bold text-content gold-underline">{t('Messagerie')}</h1>
          <p className="break-words text-content-secondary">
            {setup?.mailboxes.length
              ? t('Les messages écrits à {address}, et vos réponses, au même endroit.', { address: setup.mailboxes.map((m) => m.address).join(', ') })
              : t('Les messages écrits à l’adresse de Travel Art, et vos réponses, au même endroit.')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={refresh} disabled={syncing || !setup?.configured}>
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('Actualiser')}
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={() => setComposing(true)} disabled={!setup?.configured}>
            <PenLine className="h-4 w-4" aria-hidden="true" />
            {t('Nouveau message')}
          </button>
        </div>
      </div>

      {setup && !setup.configured && (
        <div className="notice-caution" role="status">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {t('La messagerie n’est pas encore branchée : il manque sur le serveur la clé Resend (RESEND_API_KEY) du compte qui gère le domaine. Les messages reçus d’ici là ne sont pas perdus : ils apparaîtront ici dès qu’elle sera ajoutée.')}
          </span>
        </div>
      )}
      {setup?.configured && !setup.webhook && (
        <div className="notice-info" role="status">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {t('Les nouveaux messages arrivent quand la page est ouverte ou actualisée. Pour les recevoir à l’instant et suivre la distribution de vos envois, ajoutez le webhook Resend (RESEND_WEBHOOK_SECRET).')}
          </span>
        </div>
      )}

      {/* Two panes from lg up. Below it, beside the sidebar, they cannot both fit: the list, then the conversation with a way back.
          inline-size containment keeps the one-line previews from widening the page: they truncate at the panel's edge. */}
      <div className="panel overflow-hidden [contain:inline-size] lg:grid lg:h-[calc(100vh-15rem)] lg:min-h-[34rem] lg:grid-cols-[minmax(16rem,20rem)_1fr] xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        {/* ---- the list ---- */}
        <section className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-line lg:border-r`} aria-label={t('Conversations')}>
          <div className="space-y-3 border-b border-line p-3">
            <div role="tablist" aria-label={t('Dossiers')} className="flex gap-1">
              {FOLDERS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={folder === key}
                  onClick={() => chooseFolder(key)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-2 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                    folder === key ? 'bg-surface-inverse text-content-inverse' : 'text-content-secondary hover:bg-surface-sunken hover:text-content'
                  }`}
                >
                  {/* Dropped where the list column is at its narrowest, so the three labels always fit. */}
                  <Icon className="hidden h-3.5 w-3.5 xl:block" aria-hidden="true" />
                  {label}
                  {key === 'inbox' && unread > 0 && (
                    <span className="grid min-w-[1.1rem] place-items-center rounded-full bg-gold px-1 text-[0.65rem] leading-[1.1rem] text-off-black">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <form onSubmit={applySearch} className="relative" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" aria-hidden="true" />
              <input
                type="search"
                className="form-input py-2 pl-9 text-sm"
                placeholder={t('Nom, adresse, mot-clé…')}
                aria-label={t('Rechercher dans la messagerie')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (!e.target.value && search) {
                    setPage(1)
                    setSearch('')
                  }
                }}
              />
            </form>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading && threads.length === 0 ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : threads.length === 0 ? (
              <div className="empty-state">
                <Inbox className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                <p className="empty-state__title">
                  {search ? t('Aucun résultat') : folder === 'sent' ? t('Rien d’envoyé pour le moment') : folder === 'archived' ? t('Aucune conversation archivée') : t('Aucun message')}
                </p>
                {!search && folder === 'inbox' && (
                  <p className="empty-state__body">{t('Les messages écrits à l’adresse du domaine apparaîtront ici.')}</p>
                )}
              </div>
            ) : (
              <ul>
                {threads.map((th) => {
                  const isOpen = th.id === selectedId
                  const isUnread = th.unreadCount > 0
                  const name = th.counterpartName || th.counterpart
                  return (
                    <li key={th.id}>
                      <button
                        type="button"
                        onClick={() => setParam({ thread: th.id })}
                        aria-current={isOpen ? 'true' : undefined}
                        className={`block w-full border-b border-line px-4 py-3 text-left transition-colors ${
                          isOpen ? 'bg-[var(--surface-warm)]' : 'hover:bg-surface-sunken'
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm text-content ${isUnread ? 'font-semibold' : ''}`}>
                            {folder === 'sent' ? t('À : {list}', { list: name }) : name}
                          </span>
                          <span className="shrink-0 text-xs text-content-secondary">{listDate(folder === 'sent' && th.lastOutboundAt ? th.lastOutboundAt : th.lastMessageAt)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-label={t('Non lu')} />}
                          <span className={`truncate text-sm text-content ${isUnread ? 'font-semibold' : ''}`}>{th.subject}</span>
                          {th.messageCount > 1 && <span className="shrink-0 text-xs text-content-secondary">{th.messageCount}</span>}
                          {th.hasAttachments && <Paperclip className="h-3.5 w-3.5 shrink-0 text-content-secondary" aria-label={t('Pièce jointe')} />}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-content-secondary">{th.snippet}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {page < pages && (
              <div className="p-3 text-center">
                <button type="button" className="text-sm text-content-secondary underline underline-offset-4 hover:text-content" onClick={() => setPage((p) => p + 1)} disabled={listLoading}>
                  {t('Conversations plus anciennes')}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---- the conversation ---- */}
        <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`} aria-label={t('Conversation')}>
          {!selectedId ? (
            <div className="empty-state m-auto">
              <Mail className="h-6 w-6 text-content-secondary" aria-hidden="true" />
              <p className="empty-state__title">{t('Choisissez une conversation')}</p>
              <p className="empty-state__body">{t('Ou écrivez un nouveau message : il partira de l’adresse du domaine.')}</p>
            </div>
          ) : detailLoading && !detail ? (
            <div className="flex flex-1 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : detail && thread ? (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
                <div className="flex min-w-0 items-start gap-2">
                  <button
                    type="button"
                    className="mt-1 text-content-secondary hover:text-content lg:hidden"
                    onClick={() => setParam({ thread: null })}
                    aria-label={t('Retour aux conversations')}
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="break-words font-serif text-xl text-content">{thread.subject}</h2>
                    <p className="truncate text-sm text-content-secondary">
                      {thread.counterpartName ? `${thread.counterpartName} · ${thread.counterpart}` : thread.counterpart}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {thread.lastInboundAt && (
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-control text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content disabled:opacity-50"
                      onClick={() => change(thread.id, { unread: true }, t('Marquée comme non lue'))}
                      disabled={busy}
                      title={t('Marquer comme non lue')}
                      aria-label={t('Marquer comme non lue')}
                    >
                      <MailOpen className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-control text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content disabled:opacity-50"
                    onClick={() =>
                      change(thread.id, { archived: !thread.archived }, thread.archived ? t('Conversation remise dans la boîte de réception') : t('Conversation archivée'))
                    }
                    disabled={busy}
                    title={thread.archived ? t('Remettre dans la boîte de réception') : t('Archiver')}
                    aria-label={thread.archived ? t('Remettre dans la boîte de réception') : t('Archiver')}
                  >
                    {thread.archived ? <ArchiveRestore className="h-5 w-5" aria-hidden="true" /> : <Archive className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
                {detail.messages.map((m) => (
                  <MessageCard key={m.id} message={m} />
                ))}
                {setup?.configured ? (
                  <ReplyBox key={thread.id} detail={detail} onSent={afterReply} />
                ) : (
                  <p className="text-sm text-content-secondary">{t('Répondre sera possible une fois la messagerie branchée.')}</p>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>

      {composing && setup && (
        <ComposeDialog mailboxes={setup.mailboxes} onClose={() => setComposing(false)} onSent={afterCompose} />
      )}
    </div>
  )
}

export default AdminMail
