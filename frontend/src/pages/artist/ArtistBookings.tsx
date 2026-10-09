import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Filter } from 'lucide-react'
import { bookingsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import ConventionSummary from '@/components/ConventionSummary'
import ConventionPanel from '@/components/convention/ConventionPanel'
import ClaimPanel from '@/components/convention/ClaimPanel'
import type { Booking } from '@/types'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'
import { countryLabel } from '@/i18n/countries'
import { extractArray } from '@/utils/apiPayload'
import toast from 'react-hot-toast'

const PLACEHOLDER_IMAGE = '/images/placeholder-experience.webp'

const place = (b: Booking) =>
  [b.hotel?.city, countryLabel(b.hotel?.country)].filter(Boolean).join(', ') || t('Lieu à confirmer')

const ArtistBookings: React.FC = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Booking['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [busy, setBusy] = useState(false)
  const [declining, setDeclining] = useState<Booking | null>(null)
  const [withdrawing, setWithdrawing] = useState<Booking | null>(null)
  const [reason, setReason] = useState('')

  const reload = () =>
    bookingsApi
      .list({ limit: 100 })
      .then((res) => setBookings(extractArray<Booking>(res.data?.data, 'bookings')))
      .catch(() => setError(t('Impossible de charger les réservations pour le moment.')))
      .finally(() => setLoading(false))

  useEffect(() => {
    reload()
  }, [])

  const update = async (booking: Booking, status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED', why?: string) => {
    setBusy(true)
    try {
      const res = await bookingsApi.updateStatus(booking.id, status, why)
      setBookings((list) => list.map((b) => (b.id === booking.id ? res.data.data : b)))
      toast.success(status === 'CONFIRMED' ? t('Résidence acceptée. Signez maintenant la convention.') : status === 'CANCELLED' ? t('Vous vous êtes désisté. L’hôtel est prévenu.') : t('Demande refusée'))
      setDeclining(null)
      setWithdrawing(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Impossible de mettre à jour le statut. Veuillez réessayer.'))
    } finally {
      setBusy(false)
    }
  }

  const filtered = useMemo(() => (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)), [bookings, filter])

  const statCards = [
    { label: t('Réservations'), value: bookings.length },
    { label: t('Confirmées'), value: bookings.filter((b) => b.status === 'CONFIRMED').length },
    { label: t('En attente'), value: bookings.filter((b) => b.status === 'PENDING').length },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SEOHead title={t('Mes réservations') + ' — Travel Art'} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">{t('Mes réservations')}</h1>
          <p className="text-content-secondary">{t('Gérez vos dates et suivez votre planning')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-content-secondary" aria-hidden="true" />
          <label htmlFor="artist-status-filter" className="sr-only">{t('Filtrer par statut')}</label>
          <select
            id="artist-status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="form-input w-44"
            data-testid="status-filter"
          >
            <option value="all">{t('Toutes les réservations')}</option>
            <option value="PENDING">{t('En attente')}</option>
            <option value="CONFIRMED">{t('Confirmée')}</option>
            <option value="COMPLETED">{t('Terminée')}</option>
            <option value="CANCELLED">{t('Annulée')}</option>
            <option value="REJECTED">{t('Refusée')}</option>
          </select>
        </div>
      </div>

      {error && <div className="notice-critical">{error}</div>}

      <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
        {statCards.map(({ label, value }) => (
          <div key={label} className="stat rounded-none border-0">
            <span className="stat__label">{label}</span>
            <span className="stat__value">{formatNumber(value)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-6" data-testid="bookings-list">
        {filtered.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
            className="panel p-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-shrink-0">
                <img
                  decoding="async"
                  src={booking.hotel?.profilePicture || PLACEHOLDER_IMAGE}
                  alt=""
                  className="h-48 w-full rounded-card object-cover lg:h-40 lg:w-64"
                  loading="lazy"
                />
              </div>

              <div className="flex-1" data-testid="booking-details">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-2 text-xl font-serif font-semibold text-content">{booking.hotel?.name}</h3>
                    <p className="mb-1 flex items-center text-content-secondary">
                      <MapPin className="mr-2 h-4 w-4" />
                      {place(booking)}
                    </p>
                    <p className="flex items-center text-content-secondary">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(booking.startDate).toLocaleDateString('fr-FR')} → {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <StatusBadge status={booking.status.toLowerCase()} />
                </div>

                <ConventionSummary booking={booking} viewer="ARTIST" />
                <ConventionPanel booking={booking} viewer="ARTIST" onChanged={reload} />
                <ClaimPanel booking={booking} viewer="ARTIST" onChanged={reload} />
                {booking.notes && <p className="mt-3 rounded-card bg-surface p-3 text-sm text-content-secondary">{booking.notes}</p>}

                {booking.status === 'PENDING' && (
                  <p className="mt-4 text-[0.8125rem] text-content-secondary">
                    {t('N’achetez aucun billet avant la signature de la convention.')}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {booking.status === 'PENDING' && (
                    <>
                      <button onClick={() => update(booking, 'CONFIRMED')} className="btn-primary btn-sm" disabled={busy}>
                        {t('Accepter')}
                      </button>
                      <button onClick={() => { setDeclining(booking); setReason('') }} className="btn-danger btn-sm" disabled={busy}>
                        {t('Refuser')}
                      </button>
                    </>
                  )}
                  {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                    <button onClick={() => navigate(`/hotel/${booking.hotelId}`)} className="btn-outline btn-sm">
                      {t('Voir la fiche de l’hôtel')}
                    </button>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <button onClick={() => { setWithdrawing(booking); setReason('') }} className="btn-ghost btn-sm" disabled={busy}>
                      {t('Me désister')}
                    </button>
                  )}
                </div>

                {booking.status === 'COMPLETED' && booking.ratings?.[0] && (
                  <div className="mt-4 rounded-card border border-line p-3 text-sm">
                    <p className="stat__label">{t('Évaluation de l’hôtel')} — {booking.ratings[0].stars}/5</p>
                    <p className="mt-1 text-content">{booking.ratings[0].textReview}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="panel">
          <div className="empty-state">
            <Calendar className="h-6 w-6 text-content-secondary" aria-hidden="true" />
            <h3 className="empty-state__title">{t('Aucune réservation')}</h3>
            <p className="empty-state__body">
              {filter === 'all'
                ? t('Vous n’avez pas encore de réservation. Ouvrez vos disponibilités pour que les hôtels puissent vous proposer des dates.')
                : t('Aucune réservation ne correspond à ce filtre.')}
            </p>
            {filter === 'all' && (
              <button onClick={() => navigate('/dashboard/profile')} className="btn-primary mt-3">
                {t('Mettre à jour les disponibilités')}
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(declining)}
        title={t('Refuser cette demande ?')}
        body={
          <>
            <p>{t('L’hôtel est prévenu et récupère ses crédits.')}</p>
            <label className="form-label mt-4 block" htmlFor="decline-reason">{t('Motif (facultatif, communiqué à l’hôtel)')}</label>
            <textarea id="decline-reason" className="form-input w-full" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </>
        }
        confirmLabel={t('Refuser la demande')}
        onConfirm={() => declining && update(declining, 'REJECTED', reason.trim() || undefined)}
        onCancel={() => setDeclining(null)}
        busy={busy}
      />

      <ConfirmDialog
        open={Boolean(withdrawing)}
        title={t('Vous désister de cette résidence ?')}
        body={
          <>
            <p>
              {withdrawing?.signing?.finalizedAt
                ? t('La convention est signée. Son article 13 s’applique : prévenez l’hôtel au plus tôt ; en cas d’empêchement injustifié, il peut demander le remboursement des dépenses qu’il a engagées et ne peut pas récupérer, sur justificatifs.')
                : t('La convention n’est pas encore signée : votre désistement n’entraîne aucun frais. L’hôtel récupère ses crédits.')}
            </p>
            <label className="form-label mt-4 block" htmlFor="withdraw-reason">{t('Motif de votre empêchement (obligatoire, communiqué à l’hôtel)')}</label>
            <textarea id="withdraw-reason" className="form-input w-full" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </>
        }
        confirmLabel={t('Confirmer mon désistement')}
        onConfirm={() => {
          if (!withdrawing) return
          if (reason.trim().length < 3) {
            toast.error(t('Indiquez le motif de votre empêchement.'))
            return
          }
          update(withdrawing, 'CANCELLED', reason.trim())
        }}
        onCancel={() => setWithdrawing(null)}
        busy={busy}
      />
    </div>
  )
}

export default ArtistBookings
