import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Filter } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { bookingsApi, hotelsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import type { Booking as BookingType } from '@/types'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'
import { countryLabel } from '@/i18n/countries'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'

interface BookingCardData {
  id: string
  hotelId: string
  hotelName: string
  location: string
  startDate: string
  endDate: string
  startTime: string
  status: BookingStatus
  duration: string
  creditsUsed: number
  performanceSpot: string
  image: string
  notes?: string
}

const PLACEHOLDER_IMAGE = '/images/placeholder-experience.webp'

// Pure helpers with no dependency on component state or props - hoisted out
// of the component so they aren't recreated every render, and so the
// useCallback below that calls them doesn't need them in its dependency
// array (their identity never changes).
const extractBookings = (data: any): (BookingType & { notes?: string; performanceSpot?: string })[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.bookings)) return data.bookings
  if (Array.isArray(data.data)) return data.data
  return []
}

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (!value) {
    return fallback
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  return value as T
}

const getLocationString = (location: any): string => {
  const parsed = parseJson<{ city?: string; country?: string }>(location, {})
  const parts = [parsed.city, countryLabel(parsed.country)].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Location TBA'
}

const getHotelImage = (images: any): string => {
  const parsedImages = parseJson<string[]>(images, [])
  return parsedImages[0] || PLACEHOLDER_IMAGE
}

const calculateDuration = (start: string, end: string): string => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  // Past a day, say days: a week-long residency read "168 heures".
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) {
    const rest = diffHours % 24
    if (rest === 0) return t(diffDays >= 2 ? '{n} jours' : '{n} jour', { n: diffDays })
    return t('{d} j {h} h', { d: diffDays, h: rest })
  }

  if (diffHours > 0) {
    return diffMins > 0 ? `${diffHours} h ${diffMins}` : `${diffHours} heure${diffHours >= 2 ? 's' : ''}`
  }

  return `${diffMins} minute${diffMins >= 2 ? 's' : ''}`
}

const ArtistBookings: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingCardData[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingCardData | null>(null)

  const loadBookings = useCallback(async () => {
    if (!user?.id) return []

    const response = await bookingsApi.list({ artistId: user.id })
    const rawBookings = extractBookings(response.data?.data)

    const hotelIds = Array.from(new Set(rawBookings.map((booking) => booking.hotelId).filter(Boolean)))
    const hotelMap = new Map<string, any>()

    await Promise.all(
      hotelIds.map(async (hotelId) => {
        try {
          const hotelRes = await hotelsApi.getById(hotelId)
          const hotelData = hotelRes.data?.data
          if (hotelData) {
            hotelMap.set(hotelId, hotelData)
          }
        } catch (err) {
          console.error('Failed to fetch hotel', hotelId, err)
        }
      })
    )

    return rawBookings.map((booking) => {
      const hotel = hotelMap.get(booking.hotelId) || {}
      const status = (booking.status || 'PENDING').toLowerCase() as BookingStatus
      const startTime = new Date(booking.startDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })

      return {
        id: booking.id,
        hotelId: booking.hotelId,
        hotelName: hotel.name || 'Unknown Hotel',
        location: getLocationString(hotel.location),
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime,
        status,
        duration: calculateDuration(booking.startDate, booking.endDate),
        // creditCost is the frozen price; creditsUsed is the deprecated
        // column the API always writes as 0.
        creditsUsed: booking.creditCost ?? booking.creditsUsed ?? 0,
        performanceSpot: booking.performanceSpot || t('À préciser'),
        image: getHotelImage(hotel.images),
        notes: booking.notes
      }
    })
  }, [user?.id])

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await loadBookings()
      setBookings(data)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(t('Impossible de charger les réservations pour le moment.'))
    } finally {
      setLoading(false)
    }
  }, [loadBookings, user?.id])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleStatusUpdate = async (bookingId: string, status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED') => {
    try {
      setIsUpdating(true)
      await bookingsApi.updateStatus(bookingId, status)
      const data = await loadBookings()
      setBookings(data)
    } catch (err) {
      console.error('Error updating booking status:', err)
      alert('Impossible de mettre à jour le statut. Veuillez réessayer.')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings
    return bookings.filter((booking) => booking.status === filter)
  }, [bookings, filter])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      pending: bookings.filter((booking) => booking.status === 'pending').length
    }
  }, [bookings])

  /* Three peers, one treatment. Each tile used to pair an icon with a tinted
     square in its own hue - info, positive, caution - which read as a status
     the tile did not have: t('Réservations') is a count, not a healthy state. */
  const statCards = useMemo(
    () => [
      { label: t('Réservations'), value: stats.total },
      { label: t('Confirmées'), value: stats.confirmed },
      { label: 'En attente', value: stats.pending }
    ],
    [stats]
  )

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
            {t('Mes réservations')}
          </h1>
          <p className="text-content-secondary">
            {t('Gérez vos dates et suivez votre planning')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-content-secondary" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookingStatus | 'all')}
              className="form-input w-44"
              data-testid="status-filter"
            >
              <option value="all">{t('Toutes les réservations')}</option>
              <option value="confirmed">{t('Confirmée')}</option>
              <option value="pending">{t('En attente')}</option>
              <option value="completed">{t('Terminée')}</option>
              <option value="cancelled">{t('Annulée')}</option>
              <option value="rejected">{t('Refusée')}</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="notice-critical">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
        {statCards.map(({ label, value }) => (
          <div key={label} className="stat rounded-none border-0">
            <span className="stat__label">{label}</span>
            <span className="stat__value">{formatNumber(value)}</span>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-6" data-testid="bookings-list">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="panel p-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Hotel Image */}
              <div className="flex-shrink-0">
                <img decoding="async"
                  src={booking.image}
                  alt={booking.hotelName}
                  className="w-full lg:w-64 h-48 lg:h-40 object-cover rounded-card"
                  loading="lazy"
                />
              </div>

              {/* Booking Details */}
              <div className="flex-1" data-testid="booking-details">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-content mb-2">
                      {booking.hotelName}
                    </h3>
                    <p className="text-content-secondary flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {booking.location}
                    </p>
                    <p className="text-content-secondary flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(booking.startDate).toLocaleDateString('fr-FR')} à {booking.startTime}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Espace de représentation')}</p>
                    <p className="text-content font-medium">{booking.performanceSpot}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Durée')}</p>
                    <p className="text-content font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {booking.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Crédits')}</p>
                    <p className="text-gold font-medium">
                      {t('{n} crédits', { n: booking.creditsUsed })}
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-content-secondary mb-4">{booking.notes}</p>
                )}

                {!booking.notes && booking.status === 'pending' && (
                  <p className="text-content-secondary mb-4 italic">{t('En attente de précisions de l’hôtel.')}</p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          className="btn-primary btn-sm"
                          disabled={isUpdating}
                        >
                          {t('Accepter')}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                          className="btn-danger btn-sm"
                          disabled={isUpdating}
                        >
                          {t('Refuser')}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="btn-outline btn-sm"
                      >
                        {t('Voir le détail')}
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="px-4 py-2 bg-surface-inverse text-white rounded-card hover:opacity-90 transition-colors cursor-pointer"
                      >
                        {t('Voir les retours')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
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
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="btn-primary mt-3"
              >
                {t('Mettre à jour les disponibilités')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-raised rounded-card shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-content">{t('Détail de la réservation')}</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-content-secondary hover:text-content text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Hotel Info */}
                <div>
                  <h3 className="text-xl font-semibold text-content mb-2">{selectedBooking.hotelName}</h3>
                  <p className="text-content-secondary flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedBooking.location}
                  </p>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Date et heure de début')}</p>
                    <p className="text-content font-medium">
                      {new Date(selectedBooking.startDate).toLocaleDateString('fr-FR')} at {selectedBooking.startTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Date de fin')}</p>
                    <p className="text-content font-medium">
                      {new Date(selectedBooking.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Durée')}</p>
                    <p className="text-content font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedBooking.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Espace de représentation')}</p>
                    <p className="text-content font-medium">{selectedBooking.performanceSpot}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Statut')}</p>
                    <StatusBadge status={selectedBooking.status} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content-secondary">{t('Crédits utilisés')}</p>
                    <p className="text-gold font-medium">{selectedBooking.creditsUsed} crédits</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-2">Notes</p>
                    <p className="text-content-secondary bg-surface p-4 rounded-card">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 bg-surface-sunken text-content-secondary rounded-card hover:bg-surface-warm hover:text-content transition-colors"
                  >
                    {t('Fermer')}
                  </button>
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        navigate(`/hotel/${selectedBooking.hotelId}`)
                        setSelectedBooking(null)
                      }}
                      className="px-4 py-2 bg-[var(--state-info)] text-white rounded-card hover:bg-[var(--state-info)] transition-colors"
                    >
                      {t('Voir la fiche de l’hôtel')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ArtistBookings
