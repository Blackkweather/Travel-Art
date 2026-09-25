import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Confirmation for an action that cannot be undone.
 *
 * The two "delete my profile" buttons used window.confirm, which gives a native
 * grey box with OS buttons, no room to say what is actually destroyed, and a
 * default action one Enter away. This says what will be lost, names the thing
 * being deleted, and makes the destructive choice the one you have to reach for.
 *
 * Escape and the backdrop both cancel; focus opens on Cancel, not on Delete.
 */

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What is destroyed. Shown as the body - be specific, not reassuring. */
  body: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    // The page behind must not scroll while a decision is pending.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(11,31,63,0.55)]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md bg-surface-raised border border-line rounded-card shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 flex-shrink-0 mt-1 text-[var(--state-critical)]"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold text-content">
              {title}
            </h2>
            <div className="mt-2 text-sm text-content-secondary space-y-2">{body}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="btn-outline btn-sm"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
