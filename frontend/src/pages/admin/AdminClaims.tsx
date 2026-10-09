import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Paperclip } from 'lucide-react'
import { claimsApi, conventionsApi } from '@/utils/api'
import type { CancellationClaim } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'

/**
 * Every cancellation after signature (convention, article 14): the 89 € the
 * hotel owes the coordinator, and the transport refund it owes the artist.
 * The admin records a fee paid by transfer, waives it (force majeure), and
 * rules on a transport claim the parties disagree about.
 */

const euros = (v: number | null) => (v === null ? '—' : `${formatNumber(v)} €`)
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—')

const FEE_LABEL: Record<string, string> = { DUE: 'À régler', PAID: 'Réglés', WAIVED: 'Annulés' }
const TRANSPORT_LABEL: Record<string, string> = { SUBMITTED: 'Demandé', PAID: 'Remboursé', REJECTED: 'Écarté' }

const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<CancellationClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    claimsApi
      .list(onlyOpen ? { open: '1' } : undefined)
      .then((res) => setClaims(res.data.data.claims ?? []))
      .catch(() => toast.error(t('Impossible de charger les dossiers.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [onlyOpen])

  const act = async (id: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(id)
    try {
      await fn()
      toast.success(done)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || t('L’action a échoué.'))
    } finally {
      setBusy(null)
    }
  }

  const ask = (label: string) => window.prompt(label) ?? undefined

  return (
    <div className="space-y-6">
      <SEOHead title={t('Annulations') + ' — Travel Art'} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-serif font-bold text-content gold-underline">{t('Annulations après signature')}</h1>
          <p className="text-content-secondary">{t('Frais de dossier de 89 € et remboursements de transport (article 14 de la convention).')}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-content">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          {t('Dossiers en cours uniquement')}
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : claims.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <h3 className="empty-state__title">{t('Aucun dossier')}</h3>
            <p className="empty-state__body">{onlyOpen ? t('Rien n’est en attente.') : t('Aucune annulation après signature pour le moment.')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c.id} className="panel space-y-3 p-5 text-sm" data-testid="admin-claim">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-serif text-lg font-semibold text-content">
                    {c.booking.hotel.name} → {c.booking.artist.stageName || c.booking.artist.name}
                  </p>
                  <p className="text-content-secondary">
                    {t('Résidence du {from} au {to}, annulée le {date}', { from: day(c.booking.startDate), to: day(c.booking.endDate), date: day(c.booking.cancelledAt) })}
                    {c.booking.cancellationReason ? ` — « ${c.booking.cancellationReason} »` : ''}
                  </p>
                </div>
                <button type="button" className="btn-ghost btn-sm" onClick={() => conventionsApi.downloadPdf(c.booking.id).catch(() => toast.error(t('Le téléchargement a échoué. Réessayez.')))}>
                  {t('Convention (PDF)')}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-card border border-line p-3">
                  <p className="stat__label">{t('Frais de dossier')}</p>
                  <p className="mt-1 text-content">
                    {euros(c.fee.amount)} · {t(FEE_LABEL[c.fee.status])}
                    {c.fee.status === 'DUE' && ` · ${t('échéance')} ${day(c.fee.dueAt)}`}
                    {c.fee.overdue && <span className="ml-2 font-semibold text-[var(--state-critical)]">{t('en retard')}</span>}
                  </p>
                  {c.fee.note && <p className="mt-1 text-content-secondary">{c.fee.note}</p>}
                  {c.fee.status === 'DUE' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        disabled={busy === c.id}
                        onClick={() => act(c.id, () => claimsApi.settleFee(c.id, 'PAID', ask(t('Référence du virement (facultatif)'))), t('Frais marqués réglés'))}
                      >
                        {t('Reçu par virement')}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        disabled={busy === c.id}
                        onClick={() => act(c.id, () => claimsApi.settleFee(c.id, 'WAIVED', ask(t('Motif (force majeure, geste commercial…)'))), t('Frais annulés'))}
                      >
                        {t('Annuler les frais')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-card border border-line p-3">
                  <p className="stat__label">{t('Transport de l’artiste')}</p>
                  {!c.transport.eligible ? (
                    <p className="mt-1 text-content-secondary">{t('Non concerné : le transport n’était pas à la charge de l’artiste.')}</p>
                  ) : c.transport.status === null ? (
                    <p className="mt-1 text-content-secondary">{t('Aucune demande pour le moment.')}</p>
                  ) : (
                    <>
                      <p className="mt-1 text-content">
                        {euros(c.transport.amount)} · {t(TRANSPORT_LABEL[c.transport.status])}
                        {c.transport.status === 'SUBMITTED' && ` · ${t('échéance')} ${day(c.transport.dueAt)}`}
                        {c.transport.overdue && <span className="ml-2 font-semibold text-[var(--state-critical)]">{t('en retard')}</span>}
                      </p>
                      {c.transport.note && <p className="mt-1 text-content-secondary">« {c.transport.note} »</p>}
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {c.transport.proofs.map((url, i) => (
                          <li key={url}>
                            <a className="inline-flex items-center gap-1 text-gold underline" href={url} target="_blank" rel="noreferrer">
                              <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                              {t('Justificatif {n}', { n: String(i + 1) })}
                            </a>
                          </li>
                        ))}
                      </ul>
                      {c.transport.settleNote && <p className="mt-1 text-content-secondary">{c.transport.settleNote}</p>}
                      {c.transport.status === 'SUBMITTED' && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" className="btn-outline btn-sm" disabled={busy === c.id} onClick={() => act(c.id, () => claimsApi.settleTransport(c.id, 'PAID', ask(t('Précision (facultatif)'))), t('Remboursement enregistré'))}>
                            {t('Marquer remboursé')}
                          </button>
                          <button type="button" className="btn-ghost btn-sm" disabled={busy === c.id} onClick={() => act(c.id, () => claimsApi.settleTransport(c.id, 'REJECTED', ask(t('Motif communiqué à l’artiste'))), t('Demande écartée'))}>
                            {t('Écarter la demande')}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminClaims
