import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Star, Search, Music } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { hotelsApi, bookingsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { personName } from '@/utils/apiPayload'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'

interface Booking {
  id: string
  artist: {
    id: string
    name: string
    discipline: string
    image?: string
    rating?: number
  }
  hotelId: string
  startDate: string
  endDate: string
  status: string
  creditsUsed?: number // Deprecated
  weeklyPaymentAmount?: number
  numberOfWeeks?: number
  totalPaymentAmount?: number
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  performanceSpot?: string
  notes?: string
}

const HotelBookings: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [ratingFor, setRatingFor] = useState<Booking | null>(null)
  const [stars, setStars] = useState(5)
  const [review, setReview] = useState('')
  const [savingRating, setSavingRating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get hotel profile
        const hotelRes = await hotelsApi.getByUser(user.id)
        const hotel = hotelRes.data?.data
        if (!hotel) return

        // Get bookings for this hotel
        const bookingsRes = await bookingsApi.list({ hotelId: hotel.id })
        // API returns { bookings: [...], pagination: {...} } or sometimes just [...]
        const bookingsDataRaw = bookingsRes.data?.data
        const bookingsData = Array.isArray(bookingsDataRaw) 
          ? bookingsDataRaw 
          : (bookingsDataRaw?.bookings || [])
        
        // Transform bookings to match component format
        const transformedBookings = bookingsData.map((b: any) => ({
          id: b.id,
          artist: {
            id: b.artist?.id || '',
            name: personName(b.artist),
            discipline: b.artist?.discipline || '',
            image: b.artist?.image || '/images/placeholder-experience.webp',
            rating: b.artist?.rating || 0
          },
          hotelId: b.hotelId,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status.toLowerCase(),
          creditsUsed: b.creditsUsed || 0,
          performanceSpot: b.performanceSpot || 'TBD',
          notes: b.notes || '',
          // Calculate duration
          duration: calculateDuration(b.startDate, b.endDate),
          // Format date/time
          date: b.startDate,
          time: new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          // Additional fields for display
          guestCount: 0, // Would need to come from booking details
          performanceType: b.performanceType || 'Performance',
          contactEmail: b.artist?.email || '',
          contactPhone: b.artist?.phone || ''
        }))

        setBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user?.id])

  const calculateDuration = (start: string, end: string): string => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return diffMins > 0 ? `${diffHours} h ${diffMins}` : `${diffHours} heure${diffHours >= 2 ? 's' : ''}`
    }
    return `${diffMins} minute${diffMins >= 2 ? 's' : ''}`
  }

  const handleStatusUpdate = async (bookingId: string, status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED') => {
    try {
      await bookingsApi.updateStatus(bookingId, status)
      // Notification
      const statusText = status === 'CONFIRMED' ? 'confirmed' : status === 'REJECTED' ? 'rejected' : 'cancelled'
      console.log(`Booking ${statusText} successfully`)
      alert(`Booking ${statusText} successfully`)
      
      // Refresh bookings - get hotel first
      const hotelRes = await hotelsApi.getByUser(user?.id || '')
      const hotel = hotelRes.data?.data
      if (!hotel) return

      const bookingsRes = await bookingsApi.list({ hotelId: hotel.id })
      // API returns { bookings: [...], pagination: {...} } or sometimes just [...]
      const bookingsDataRaw = bookingsRes.data?.data
      const bookingsData = Array.isArray(bookingsDataRaw) 
        ? bookingsDataRaw 
        : (bookingsDataRaw?.bookings || [])
      
      const transformedBookings = bookingsData.map((b: any) => ({
        id: b.id,
        artist: {
          id: b.artist?.id || '',
          name: personName(b.artist),
          discipline: b.artist?.discipline || '',
          image: b.artist?.image || '/images/placeholder-experience.webp',
          rating: b.artist?.rating || 0
        },
        hotelId: b.hotelId,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status.toLowerCase(),
        creditsUsed: b.creditsUsed || 0,
        performanceSpot: b.performanceSpot || 'TBD',
        notes: b.notes || '',
        duration: calculateDuration(b.startDate, b.endDate),
        date: b.startDate,
        time: new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        guestCount: 0,
        performanceType: b.performanceType || 'Performance',
        contactEmail: b.artist?.email || '',
        contactPhone: b.artist?.phone || ''
      }))
      
      setBookings(transformedBookings)
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('Impossible de mettre à jour le statut de la réservation')
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter
    const matchesSearch = booking.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.performanceSpot || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const stats = [
    { label: t('Réservations'), value: bookings.length },
    { label: t('Confirmées'), value: bookings.filter(b => b.status === 'confirmed').length },
    { label: 'En attente', value: bookings.filter(b => b.status === 'pending').length },
    { label: t('Terminées'), value: bookings.filter(b => b.status === 'completed').length }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
          {t('Réservations de l’hôtel')}
        </h1>
        <p className="text-content-secondary">
          {t('Gérez vos réservations d’artistes et votre programmation')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="stat rounded-none border-0">
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{formatNumber(stat.value)}</span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="flex-1">
            <label className="form-label">{t('Rechercher une réservation')}</label>
            <div className="search-icon-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={t('Rechercher par artiste, lieu ou type de prestation…')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                data-testid="filter-input"
              />
            </div>
          </div>
          <div className="md:w-48">
            <label className="form-label">{t('Filtrer par statut')}</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
              data-testid="status-filter"
            >
              <option value="all">{t('Tous les statuts')}</option>
              <option value="confirmed">{t('Confirmée')}</option>
              <option value="pending">En attente</option>
              <option value="completed">{t('Terminée')}</option>
              <option value="cancelled">{t('Annulée')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6" data-testid="bookings-list">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            data-testid="booking-item"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="panel p-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Artist Info */}
              <div className="flex items-start space-x-4">
                <img decoding="async" loading="lazy"
                  src={booking.artist.image}
                  alt={booking.artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-serif font-semibold text-content mb-1">
                    {booking.artist.name}
                  </h3>
                  <p className="text-gold font-medium mb-2">{booking.artist.discipline}</p>
                  {booking.artist.rating > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-gold" />
                      <span className="text-sm text-content-secondary">{booking.artist.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="flex-1" data-testid="booking-details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-content">{t('Détails de la représentation')}</h4>
                    <div className="space-y-1 text-sm text-content-secondary">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(booking.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{new Date(booking.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{booking.performanceSpot || 'TBD'}</span>
                      </div>
                      <div className="flex items-center">
                        <Music className="w-4 h-4 mr-2" />
                        <span>{booking.artist?.discipline || 'Performance'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {/* Amounts are deliberately not shown on booking cards.
                        The residency length and the settlement state are what a
                        hotel acts on here; the figures live in Credits. */}
                    <h4 className="text-sm font-medium text-content mb-2">{t('Résidence')}</h4>
                    <div className="space-y-1 text-sm text-content-secondary">
                      {booking.numberOfWeeks && (
                        <div className="flex items-center justify-between">
                          <span>{t('Durée :')}</span>
                          <span className="font-medium text-content">
                            {booking.numberOfWeeks} semaine{booking.numberOfWeeks >= 2 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {booking.paymentStatus && (
                        <div className="flex items-center justify-between mt-2">
                          <span>Paiement :</span>
                          <StatusBadge status={booking.paymentStatus} />
                        </div>
                      )}
                      {booking.notes && <div className="mt-2 pt-2 border-t border-line">Notes: {booking.notes}</div>}
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-content mb-2">Notes</h4>
                    <p className="text-sm text-content-secondary bg-surface p-3 rounded-card">
                      {booking.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <StatusBadge status={booking.status} />
                  
                  <div className="flex space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          className="btn-primary text-sm"
                        >
                          {t('Confirmer')}
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                          className="btn-secondary text-sm"
                        >
                          {t('Refuser')}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && booking.artist?.id && (
                      <button
                        onClick={() => navigate(`/artist/${booking.artist.id}`)}
                        className="btn-secondary text-sm"
                      >
                        {t('Voir le détail')}
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button
                        onClick={() => { setRatingFor(booking); setStars(5); setReview('') }}
                        className="btn-primary text-sm"
                      >
                        {t('Évaluer l’artiste')}
                      </button>
                    )}
                    {booking.status === 'cancelled' && (
                      <button
                        onClick={() => navigate('/dashboard/artists')}
                        className="btn-secondary text-sm"
                      >
                        Reprogrammer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-surface-sunken rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-content-secondary" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-content mb-2">
            {t('Aucune réservation')}
          </h3>
          <p className="text-content-secondary mb-6">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search criteria or filters'
              : 'You haven\'t made any bookings yet'
            }
          </p>
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilter('all')
              }}
              className="btn-primary"
            >
              {t('Réinitialiser les filtres')}
            </button>
          )}
        </div>
      )}
    {ratingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel w-full max-w-lg p-6">
            <h3 className="font-serif text-xl text-content">{t('Évaluer l’artiste')}</h3>
            <p className="mt-1 text-sm text-content-secondary">
              {ratingFor.artist?.name || 'Artiste'}
              {ratingFor.performanceSpot ? ` — ${ratingFor.performanceSpot}` : ''}
            </p>

            <div className="mt-6">
              <span className="stat__label">Note</span>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    aria-label={`${n} sur 5`}
                    aria-pressed={stars === n}
                    className={`h-10 w-10 rounded-card border text-sm font-semibold transition-colors ${
                      n <= stars
                        ? 'border-gold bg-gold text-[var(--text-on-gold)]'
                        : 'border-line text-content-secondary hover:border-line-strong'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="form-label" htmlFor="rating-review">Commentaire</label>
              <textarea
                id="rating-review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                maxLength={500}
                className="form-input w-full"
                placeholder={t('Ce qui s’est bien passé, ce qui pourrait être amélioré…')}
              />
              {/* The endpoint requires 10 characters minimum, so the button
                  stays disabled until that is met rather than returning a 400. */}
              <p className="mt-1 text-[0.8125rem] text-content-secondary">
                {review.trim().length < 10
                  ? `Encore ${10 - review.trim().length} caractère(s).`
                  : `${review.length} / 500`}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRatingFor(null)} className="btn-ghost btn-sm">
                {t('Annuler')}
              </button>
              <button
                disabled={savingRating || review.trim().length < 10}
                onClick={async () => {
                  try {
                    setSavingRating(true)
                    await bookingsApi.rate({
                      bookingId: ratingFor.id,
                      hotelId: ratingFor.hotelId,
                      artistId: ratingFor.artist.id,
                      stars,
                      textReview: review.trim(),
                      isVisibleToArtist: true
                    })
                    toast.success(t('Évaluation enregistrée'))
                    setRatingFor(null)
                  } catch (err: any) {
                    toast.error(err?.response?.data?.error?.message || 'Échec de l’enregistrement')
                  } finally {
                    setSavingRating(false)
                  }
                }}
                className="btn-primary btn-sm"
              >
                {savingRating ? 'Enregistrement…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default HotelBookings
