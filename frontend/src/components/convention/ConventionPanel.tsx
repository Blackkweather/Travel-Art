import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Download, FileSignature } from 'lucide-react'
import { conventionsApi } from '@/utils/api'
import type { Booking } from '@/types'
import { t } from '@/i18n'
import ConventionModal from './ConventionModal'

/**
 * Where a booking's convention stands, on the booking card: who has signed,
 * whose turn it is, and the buttons to read, sign and download it.
 */

interface Props {
  booking: Booking
  viewer: 'HOTEL' | 'ARTIST' | 'ADMIN'
  /** Called after a signature, so the list can refresh the card. */
  onChanged?: () => void
}

const ConventionPanel: React.FC<Props> = ({ booking, viewer, onChanged }) => {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const signing = booking.signing
  const finalized = Boolean(signing?.finalizedAt)
  const viewable = booking.status === 'CONFIRMED' || ((booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (finalized || (signing?.signedBy.length ?? 0) > 0))
  if (!viewable) return null

  const mine = viewer === 'HOTEL' ? 'HOTEL' : viewer === 'ARTIST' ? 'PARTICIPANT' : null
  const signedBy = new Set(signing?.signedBy.map((s) => s.party) ?? [])
  const myTurn = !finalized && booking.status === 'CONFIRMED' && mine !== null && !signedBy.has(mine)
  const other = viewer === 'HOTEL' ? 'PARTICIPANT' : 'HOTEL'

  let line: string
  if (finalized) line = t('Convention signée par toutes les parties le {date}.', { date: new Date(signing!.finalizedAt!).toLocaleDateString('fr-FR') })
  else if (booking.status !== 'CONFIRMED') line = t('Convention non finalisée.')
  else if (myTurn) line = t('La convention attend votre signature.')
  else if (mine && !signedBy.has(other)) line = viewer === 'HOTEL' ? t('Vous avez signé. En attente de la signature de l’artiste.') : t('Vous avez signé. En attente de la signature de l’hôtel.')
  else line = t('Convention en cours de signature.')

  const download = async () => {
    setDownloading(true)
    try {
      await conventionsApi.downloadPdf(booking.id)
    } catch {
      toast.error(t('Le téléchargement a échoué. Réessayez.'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className={`mt-4 flex flex-col gap-3 rounded-card border p-3 sm:flex-row sm:items-center sm:justify-between ${myTurn ? 'border-gold bg-gold/5' : 'border-line bg-surface'}`}
      data-testid="convention-panel"
    >
      <p className="flex items-start gap-2 text-sm text-content">
        {finalized ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--state-positive)]" aria-hidden="true" />
        ) : (
          <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
        )}
        <span>{line}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={myTurn ? 'btn-primary btn-sm' : 'btn-outline btn-sm'} onClick={() => setOpen(true)} data-testid="convention-open">
          {myTurn ? t('Lire et signer') : t('Voir la convention')}
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={download} disabled={downloading}>
          <Download className="mr-1 h-4 w-4" aria-hidden="true" />
          PDF
        </button>
      </div>
      {open && (
        <ConventionModal
          bookingId={booking.id}
          onClose={() => setOpen(false)}
          onSigned={() => onChanged?.()}
        />
      )}
    </div>
  )
}

export default ConventionPanel
