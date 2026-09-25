import React from 'react'
import { t } from '@/i18n'

/**
 * One status vocabulary for the whole product.
 *
 * Before this, every screen that showed a booking state carried its own
 * `status === 'CONFIRMED' ? 'bg-green-100 text-green-800 …' : …` ladder, and
 * the ladders disagreed: nine files, four different greens, and an English
 * label ("Confirmed", "Pending") rendering inside an otherwise French page.
 * The mapping lives here so a status looks and reads the same wherever it
 * appears, and so a new state is added in one file rather than nine.
 *
 * The four tones are the semantic states defined in index.css. They are the
 * only place a colour other than gold is allowed on this site, because here
 * the colour carries meaning - and it never carries it alone: every badge
 * renders its French label beside the tint.
 */

type Tone = 'positive' | 'caution' | 'critical' | 'info' | 'neutral'

interface StatusMeta {
  label: string
  tone: Tone
}

/* Keyed on the upper-case wire value. The API is inconsistent about case, so
   every lookup is normalised before it reaches this table. */
const STATUS: Record<string, StatusMeta> = {
  CONFIRMED: { label: t('Confirmée'), tone: 'positive' },
  COMPLETED: { label: t('Terminée'), tone: 'positive' },
  APPROVED: { label: t('Approuvé'), tone: 'positive' },
  ACTIVE: { label: 'Actif', tone: 'positive' },
  PAID: { label: t('Payée'), tone: 'positive' },
  VERIFIED: { label: t('Vérifié'), tone: 'positive' },
  SUCCESS: { label: t('Réussi'), tone: 'positive' },

  PENDING: { label: 'En attente', tone: 'caution' },
  DRAFT: { label: 'Brouillon', tone: 'caution' },
  UNPAID: { label: t('Impayée'), tone: 'caution' },
  EXPIRED: { label: t('Expiré'), tone: 'caution' },

  CANCELLED: { label: t('Annulée'), tone: 'critical' },
  REJECTED: { label: t('Refusée'), tone: 'critical' },
  FAILED: { label: t('Échoué'), tone: 'critical' },
  SUSPENDED: { label: 'Suspendu', tone: 'critical' },
  BANNED: { label: 'Banni', tone: 'critical' },

  INACTIVE: { label: 'Inactif', tone: 'neutral' },
}

const TONE_CLASS: Record<Tone, string> = {
  positive: 'badge-positive',
  caution: 'badge-caution',
  critical: 'badge-critical',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

export function statusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return { label: '—', tone: 'neutral' }
  const key = status.toUpperCase()
  if (STATUS[key]) return STATUS[key]
  /* An unmapped value still has to render, and it renders quietly: sentence
     case, no tint. Inventing a colour for a state we do not recognise would
     tell the user something we do not actually know. */
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    tone: 'neutral',
  }
}

export function statusClass(status: string | null | undefined): string {
  return TONE_CLASS[statusMeta(status).tone]
}

interface StatusBadgeProps {
  status: string | null | undefined
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { label, tone } = statusMeta(status)
  return <span className={`${TONE_CLASS[tone]} ${className}`.trim()}>{label}</span>
}

export default StatusBadge
