import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Paperclip, Receipt } from 'lucide-react'
import { transportClaimSchema } from '@shared/validation'
import { claimsApi } from '@/utils/api'
import type { Booking } from '@/types'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'

/**
 * What a hotel's cancellation after signature left owing, on the booking card
 * (convention, article 14): the coordinator's 89 € for the hotel to pay, and
 * the participant's transport refund, claimed with proofs and repaid by the
 * hotel within 15 days.
 */

interface Props {
  booking: Booking
  viewer: 'HOTEL' | 'ARTIST'
  onChanged?: () => void
}

const euros = (v: number | null | undefined) => (v === null || v === undefined ? '' : `${formatNumber(v)} €`)
const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '')

const ClaimPanel: React.FC<Props> = ({ booking, viewer, onChanged }) => {
  const claim = booking.claim
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  if (!claim) return null
  const fee = claim.fee
  const tr = claim.transport

  const payFee = async () => {
    setBusy(true)
    try {
      const res = await claimsApi.payFee(claim.id)
      window.location.href = res.data.data.checkoutUrl
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || t('Le paiement n’a pas pu démarrer.'))
      setBusy(false)
    }
  }

  const markRepaid = async () => {
    setBusy(true)
    try {
      await claimsApi.settleTransport(claim.id, 'PAID')
      toast.success(t('Remboursement enregistré. L’artiste est prévenu.'))
      onChanged?.()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || t('Impossible d’enregistrer le remboursement.'))
    } finally {
      setBusy(false)
    }
  }

  const submitTransport = async () => {
    setError(null)
    const check = transportClaimSchema.safeParse({ amount, note })
    if (!check.success) {
      setError(t(check.error.issues[0].message))
      return
    }
    if (!files.length) {
      setError(t('Joignez au moins un justificatif (billet, facture).'))
      return
    }
    const form = new FormData()
    form.append('amount', amount)
    if (note.trim()) form.append('note', note.trim())
    files.forEach((f) => form.append('proofs', f))
    setBusy(true)
    try {
      await claimsApi.submitTransport(claim.id, form)
      toast.success(t('Demande envoyée. L’hôtel a 15 jours pour vous rembourser.'))
      onChanged?.()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || t('L’envoi a échoué.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-card border border-[var(--state-warning,#b7791f)]/40 bg-surface p-3 text-sm" data-testid="claim-panel">
      <p className="flex items-center gap-2 font-semibold text-content">
        <Receipt className="h-4 w-4 text-gold" aria-hidden="true" />
        {t('Annulation après signature (article 14 de la convention)')}
      </p>

      {viewer === 'HOTEL' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-content">
            {t('Frais de dossier dus au coordinateur')} : <strong>{euros(fee.amount)}</strong>
            {' — '}
            {fee.status === 'DUE'
              ? t('à régler avant le {date}', { date: day(fee.dueAt) })
              : fee.status === 'PAID'
                ? t('réglés')
                : t('annulés par notre équipe')}
          </p>
          {fee.status === 'DUE' && (
            <button type="button" className="btn-primary btn-sm" onClick={payFee} disabled={busy} data-testid="claim-pay-fee">
              {t('Payer {amount}', { amount: euros(fee.amount) })}
            </button>
          )}
        </div>
      )}

      {tr.eligible ? (
        <div className="space-y-2">
          {tr.status === 'SUBMITTED' && (
            <>
              <p className="text-content">
                {viewer === 'HOTEL'
                  ? t('L’artiste demande le remboursement de son transport : {amount}, à rembourser avant le {date}.', { amount: euros(tr.amount), date: day(tr.dueAt) })
                  : t('Demande envoyée : {amount}. L’hôtel doit vous rembourser avant le {date}.', { amount: euros(tr.amount), date: day(tr.dueAt) })}
              </p>
              {tr.proofs.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tr.proofs.map((url, i) => (
                    <li key={url}>
                      <a className="inline-flex items-center gap-1 text-gold underline" href={url} target="_blank" rel="noreferrer">
                        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('Justificatif {n}', { n: String(i + 1) })}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {viewer === 'HOTEL' && (
                <button type="button" className="btn-outline btn-sm" onClick={markRepaid} disabled={busy} data-testid="claim-mark-repaid">
                  {t('J’ai remboursé l’artiste')}
                </button>
              )}
            </>
          )}
          {tr.status === 'PAID' && <p className="text-content">{t('Transport remboursé : {amount}.', { amount: euros(tr.amount) })}</p>}
          {tr.status === 'REJECTED' && (
            <p className="text-content">
              {t('Demande de remboursement non retenue.')}
              {tr.settleNote ? ` ${tr.settleNote}` : ''}
            </p>
          )}
          {viewer === 'HOTEL' && tr.status === null && <p className="text-content-secondary">{t('L’artiste peut vous demander le remboursement de ses frais de transport non remboursables, sur justificatifs.')}</p>}

          {viewer === 'ARTIST' && (tr.status === null || tr.status === 'REJECTED') && (
            <div className="space-y-3" data-testid="claim-transport-form">
              <p className="text-content-secondary">
                {t('L’hôtel a annulé après la signature : vos frais de transport effectivement engagés et non remboursables vous sont remboursés sur justificatifs, sous 15 jours.')}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor={`claim-amount-${claim.id}`}>{t('Montant à rembourser (€)')}</label>
                  <input id={`claim-amount-${claim.id}`} inputMode="decimal" className="form-input w-full" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" htmlFor={`claim-files-${claim.id}`}>{t('Justificatifs (PDF ou photo, 5 max.)')}</label>
                  <input
                    id={`claim-files-${claim.id}`}
                    type="file"
                    multiple
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="form-input w-full"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor={`claim-note-${claim.id}`}>{t('Précisions (facultatif)')}</label>
                  <textarea id={`claim-note-${claim.id}`} rows={2} maxLength={1000} className="form-input w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Ex. : billet d’avion non remboursable, conditions du tarif en pièce jointe')} />
                </div>
              </div>
              {error && <p className="text-[var(--state-critical)]">{error}</p>}
              <div className="flex justify-end">
                <button type="button" className="btn-primary btn-sm" onClick={submitTransport} disabled={busy} data-testid="claim-transport-submit">
                  {busy ? t('Envoi…') : t('Demander le remboursement')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        viewer === 'ARTIST' && <p className="text-content-secondary">{t('Le transport n’étant pas à votre charge dans cette convention, aucun remboursement n’est prévu.')}</p>
      )}
    </div>
  )
}

export default ClaimPanel
