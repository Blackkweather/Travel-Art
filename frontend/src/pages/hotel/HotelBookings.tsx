import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Search } from 'lucide-react'
import { bookingsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import ConventionSummary from '@/components/ConventionSummary'
import ConventionPanel from '@/components/convention/ConventionPanel'
import ClaimPanel from '@/components/convention/ClaimPanel'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { personName, extractArray } from '@/utils/apiPayload'
import type { Booking } from '@/types'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

const apiMessage = (error: any, fallback: string) => error?.response?.data?.error?.message || fallback

const HotelBookings: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Booking['status']>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])

  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [busy, setBusy] = useState(false)

  const [ratingFor, setRatingFor] = useState<Booking | null>(null)
  const [stars, setStars] = useState(5)
  const [review, setReview] = useState('')
  const [shareWithArtist, setShareWithArtist] = useState(true)

  const reload = () =>
    bookingsApi
      .list({ limit: 100 })
      .then((res) => setBookings(extractArray<Booking>(res.data?.data, 'bookings')))
      .catch(() => toast.error(t('Impossible de charger les réservations')))
      .finally(() => setLoading(false))

  useEffect(() => {
    reload()
    // Back from paying the cancellation fee.
    const fee = new URLSearchParams(window.location.search).get('fee')
    if (fee === 'paid') toast.success(t('Paiement reçu. Merci : le dossier sera marqué réglé dans un instant.'))
    if (fee === 'cancelled') toast(t('Paiement interrompu : rien n’a été débité.'))
  }, [])

  const replace = (updated: Booking) => setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)))

  /* A hotel can withdraw a request before the artist answers, and cancel a
     confirmed residency. The second has a cost under the convention, which
     the dialog states before the hotel commits to it. */
  const confirmCancel = async () => {
    if (!cancelling) return
    setBusy(true)
    try {
      const res = await bookingsApi.updateStatus(cancelling.id, 'CANCELLED', cancelReason.trim() || undefined)
      replace(res.data.data)
      toast.success(cancelling.status === 'PENDING' ? t('Demande annulée') : t('Résidence annulée'))
      setCancelling(null)
    } catch (error) {
      toast.error(apiMessage(error, t('Impossible d’annuler cette réservation')))
    } finally {
      setBusy(false)
    }
  }

  const submitRating = async () => {
    if (!ratingFor) return
    setBusy(true)
    try {
      await bookingsApi.rate({ bookingId: ratingFor.id, stars, textReview: review.trim(), isVisibleToArtist: shareWithArtist })
      toast.success(t('Évaluation enregistrée'))
      setBookings((list) =>
        list.map((b) => (b.id === ratingFor.id ? { ...b, ratings: [{ id: 'new', stars, textReview: review, createdAt: new Date().toISOString(), isVisibleToArtist: shareWithArtist }] } : b))
      )
      setRatingFor(null)
    } catch (error) {
      toast.error(apiMessage(error, t('Échec de l’enregistrement')))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  const term = searchTerm.trim().toLowerCase()
  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false
    if (!term) return true
    return [personName(b.artist), b.artist?.discipline, b.notes, b.convention?.performanceDescription]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term))
  })

  const stats = [
    { label: t('Réservations'), value: bookings.length },
    { label: t('Confirmées'), value: bookings.filter((b) => b.status === 'CONFIRMED').length },
    { label: t('En attente'), value: bookings.filter((b) => b.status === 'PENDING').length },
    { label: t('Terminées'), value: bookings.filter((b) => b.status === 'COMPLETED').length },
  ]

  return (
    <div className="space-y-8">
      <SEOHead title={t('Réservations') + ' — Travel Art'} />
      <div>
        <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">{t('Réservations de l’hôtel')}</h1>
        <p className="text-content-secondary">{t('Gérez vos réservations d’artistes et votre programmation')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="stat rounded-none border-0">
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{formatNumber(stat.value)}</span>
          </div>
        ))}
      </div>

      <div className="search-container">
        <div className="filters-row">
          <div className="flex-1">
            <label className="form-label" htmlFor="booking-search">{t('Rechercher une réservation')}</label>
            <div className="search-icon-container">
              <Search className="search-icon" />
              <input
                id="booking-search"
                type="text"
                placeholder={t('Rechercher par artiste ou prestation…')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                data-testid="filter-input"
              />
            </div>
          </div>
          <div className="md:w-48">
            <label className="form-label" htmlFor="booking-status">{t('Filtrer par statut')}</label>
            <select id="booking-status" value={filter} onChange={(e) => setFilter(e.target.value as any)} className="filter-select" data-testid="status-filter">
              <option value="all">{t('Tous les statuts')}</option>
              <option value="PENDING">{t('En attente')}</option>
              <option value="CONFIRMED">{t('Confirmée')}</option>
              <option value="COMPLETED">{t('Terminée')}</option>
              <option value="REJECTED">{t('Refusée')}</option>
              <option value="CANCELLED">{t('Annulée')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6" data-testid="bookings-list">
        {filtered.map((booking, index) => (
          <motion.div
            key={booking.id}
            data-testid="booking-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
            className="panel p-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex items-start gap-4 lg:w-64">
                <img
                  decoding="async"
                  loading="lazy"
                  src={booking.artist?.profilePicture || '/images/placeholder-experience.webp'}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-serif font-semibold text-content">{personName(booking.artist)}</h3>
                  <p className="text-gold font-medium">{booking.artist?.discipline}</p>
                  <p className="mt-2 flex items-center text-sm text-content-secondary">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(booking.startDate).toLocaleDateString('fr-FR')} → {new Date(booking.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex-1" data-testid="booking-details">
                <ConventionSummary booking={booking} viewer="HOTEL" />
                <ConventionPanel booking={booking} viewer="HOTEL" onChanged={reload} />
                <ClaimPanel booking={booking} viewer="HOTEL" onChanged={reload} />
                {booking.notes && <p className="mt-3 rounded-card bg-surface p-3 text-sm text-content-secondary">{booking.notes}</p>}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={booking.status.toLowerCase()} />
                  <div className="flex flex-wrap gap-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <span className="self-center text-sm text-content-secondary">{t('En attente de la réponse de l’artiste')}</span>
                        <button onClick={() => { setCancelling(booking); setCancelReason('') }} className="btn-secondary text-sm" data-testid="withdraw-request">
                          {t('Annuler la demande')}
                        </button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <button onClick={() => { setCancelling(booking); setCancelReason('') }} className="btn-ghost text-sm">
                        {t('Annuler la résidence')}
                      </button>
                    )}
                    {booking.status === 'COMPLETED' && !booking.ratings?.length && (
                      <button onClick={() => { setRatingFor(booking); setStars(5); setReview(''); setShareWithArtist(true) }} className="btn-primary text-sm">
                        {t('Évaluer l’artiste')}
                      </button>
                    )}
                    {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                      <button onClick={() => navigate('/dashboard/artists')} className="btn-secondary text-sm">
                        {t('Reprogrammer')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-serif font-semibold text-content mb-2">{t('Aucune réservation')}</h3>
          <p className="text-content-secondary mb-6">
            {searchTerm || filter !== 'all' ? t('Essayez d’élargir votre recherche ou vos filtres') : t('Vous n’avez encore aucune réservation')}
          </p>
          {(searchTerm || filter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setFilter('all') }} className="btn-primary">
              {t('Réinitialiser les filtres')}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={cancelling?.status === 'CONFIRMED' ? t('Annuler une résidence confirmée ?') : t('Annuler cette demande ?')}
        body={
          <>
            {cancelling?.status === 'CONFIRMED' && cancelling.signing?.finalizedAt ? (
              <p>
                {t('La convention est signée. Son article 14 s’applique : vous réglez des frais de dossier de 89 € au coordinateur et, si le transport était à la charge de l’artiste, vous lui remboursez ses frais non remboursables sur justificatifs, sous 15 jours. Les crédits de cette résidence ne sont pas restitués.')}
              </p>
            ) : cancelling?.status === 'CONFIRMED' ? (
              <p>
                {t('La convention n’est pas encore signée par les deux parties : aucun frais n’est dû. Les crédits de cette résidence ne sont pas restitués.')}
              </p>
            ) : (
              <p>{t('La demande est retirée et vos crédits vous sont restitués.')}</p>
            )}
            <label className="form-label mt-4 block" htmlFor="cancel-reason">{t('Motif (communiqué à l’artiste)')}</label>
            <textarea id="cancel-reason" className="form-input w-full" rows={3} maxLength={500} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </>
        }
        confirmLabel={t('Confirmer l’annulation')}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
        busy={busy}
      />

      {ratingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="rating-title">
          <div className="panel w-full max-w-lg p-6">
            <h3 id="rating-title" className="font-serif text-xl text-content">{t('Évaluer l’artiste')}</h3>
            <p className="mt-1 text-sm text-content-secondary">{personName(ratingFor.artist)}</p>

            <div className="mt-6">
              <span className="stat__label">{t('Note')}</span>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    aria-label={`${n} / 5`}
                    aria-pressed={stars === n}
                    className={`h-10 w-10 rounded-card border text-sm font-semibold transition-colors ${
                      n <= stars ? 'border-gold bg-gold text-[var(--text-on-gold)]' : 'border-line text-content-secondary hover:border-line-strong'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="form-label" htmlFor="rating-review">{t('Commentaire')}</label>
              <textarea
                id="rating-review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                maxLength={1000}
                className="form-input w-full"
                placeholder={t('Ce qui s’est bien passé, ce qui pourrait être amélioré…')}
              />
              <p className="mt-1 text-[0.8125rem] text-content-secondary">
                {review.trim().length < 10 ? t('Encore {n} caractère(s).', { n: String(10 - review.trim().length) }) : `${review.length} / 1000`}
              </p>
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm text-content">
              <input type="checkbox" className="mt-1" checked={shareWithArtist} onChange={(e) => setShareWithArtist(e.target.checked)} />
              <span>{t('Partager cette évaluation avec l’artiste (elle peut alors apparaître sur le site)')}</span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRatingFor(null)} className="btn-ghost btn-sm">{t('Annuler')}</button>
              <button disabled={busy || review.trim().length < 10} onClick={submitRating} className="btn-primary btn-sm">
                {busy ? t('Enregistrement…') : t('Envoyer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HotelBookings
