import React, { useState, useEffect } from 'react'
import { adminApi } from '@/utils/api'
import { Calendar, MapPin, User, Building, Download, Filter, DollarSign } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

interface BookingData {
  id: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  creditsUsed: number
  creditCost?: number
  createdAt: string
  artist: {
    id: string
    discipline: string
    user: {
      name: string
      email: string
    }
  }
  hotel: {
    id: string
    name: string
    location: string
    user: {
      name: string
      email: string
    }
  }
}

interface LocationData {
  city: string
  country: string
  coords?: { lat: number; lng: number }
}

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page: currentPage,
        limit: 20
      }
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus
      }

      const response = await adminApi.getBookings(params)
      setBookings(response.data.data.bookings)
      setTotalPages(response.data.data.pagination.pages)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [currentPage, selectedStatus])

  const handleExport = async () => {
    try {
      const response = await adminApi.exportData('bookings')
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'bookings.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      alert('Échec de l’export des réservations')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / 36e5
    return hours < 24 ? `${Math.round(hours)}h` : `${Math.round(hours / 24)}d`
  }

  const parseLocation = (locationString: string): string => {
    try {
      const location: LocationData = JSON.parse(locationString)
      return `${location.city}, ${location.country}`
    } catch {
      return locationString
    }
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SEOHead title={t('Réservations') + ' — Travel Art'} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
            {t('Gestion des réservations')}
          </h1>
          <p className="text-content-secondary">
            {t('Suivre et gérer l’ensemble des réservations de la plateforme.')}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exporter en CSV</span>
        </button>
      </div>

      {/* One rule between four peers, not four boxed cards with four coloured
          icons. The counts are the content; the icons repeated the label. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
        {[
          { label: t('Réservations'), value: bookings.length },
          { label: 'En attente', value: bookings.filter(b => b.status === 'PENDING').length },
          { label: t('Confirmées'), value: bookings.filter(b => b.status === 'CONFIRMED').length },
          { label: t('Terminées'), value: bookings.filter(b => b.status === 'COMPLETED').length }
        ].map((stat) => (
          <div key={stat.label} className="stat rounded-none border-0">
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{formatNumber(stat.value)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-content-secondary flex-shrink-0" />
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Tous les statuts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Tous les statuts')}</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CONFIRMED">{t('Confirmée')}</SelectItem>
                <SelectItem value="COMPLETED">{t('Terminée')}</SelectItem>
                <SelectItem value="CANCELLED">{t('Annulée')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--state-critical-wash)] border border-[var(--state-critical-line)] text-[var(--state-critical)] px-4 py-3 rounded-card">
          {error}
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="panel p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Section - Main Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-content">
                        Réservation {booking.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-content-secondary">
                        Créée le {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Artist Info */}
                  <div className="flex items-start space-x-3 bg-surface p-3 rounded-card">
                    <User className="w-5 h-5 text-gold mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-content-secondary uppercase tracking-wide mb-1">Artiste</p>
                      <p className="font-medium text-content">{booking.artist.user.name}</p>
                      <p className="text-sm text-content-secondary">{booking.artist.discipline}</p>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex items-start space-x-3 bg-surface p-3 rounded-card">
                    <Building className="w-5 h-5 text-[var(--state-info)] mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-content-secondary uppercase tracking-wide mb-1">{t('Hôtel')}</p>
                      <p className="font-medium text-content">{booking.hotel.name}</p>
                      <div className="flex items-center text-sm text-content-secondary mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {parseLocation(booking.hotel.location)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Date & Credits */}
              <div className="lg:w-64 space-y-3">
                <div className="bg-navy/5 p-4 rounded-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-content-secondary">{t('Durée')}</span>
                    <span className="font-semibold text-content">
                      {calculateDuration(booking.startDate, booking.endDate)}
                    </span>
                  </div>
                  <div className="text-xs text-content-secondary space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{t('Début :')}</span>
                      <span>{formatDate(booking.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>End:</span>
                      <span>{formatDate(booking.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gold/10 p-4 rounded-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-sm text-content-secondary">{t('Crédits utilisés')}</span>
                    </div>
                    <span className="font-bold text-gold text-lg">
                      {booking.creditCost ?? booking.creditsUsed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && !loading && (
        <div className="panel text-center py-12">
          <Calendar className="w-12 h-12 text-content-secondary mx-auto mb-4" />
          <p className="text-content-secondary">{t('Aucune réservation')}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="btn-secondary disabled:opacity-50"
          >
            {t('Précédent')}
          </button>
          <span className="text-content-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="btn-secondary disabled:opacity-50"
          >
            {t('Suivant')}
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminBookings







