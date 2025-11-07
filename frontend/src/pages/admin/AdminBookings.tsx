import React, { useState, useEffect } from 'react'
import { adminApi } from '@/utils/api'
import { Calendar, MapPin, User, Building, Download, Filter, Clock, DollarSign } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

interface BookingData {
  id: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  creditsUsed: number
  createdAt: string
  artist: {
    id: string
    discipline: string
    priceRange: string
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
    } catch (err: any) {
      alert('Failed to export bookings')
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    }
    const config = configs[status as keyof typeof configs] || configs.PENDING
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            Booking Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all bookings across the platform.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-blue-600' },
          { 
            label: 'Pending', 
            value: bookings.filter(b => b.status === 'PENDING').length, 
            icon: Clock, 
            color: 'text-yellow-600' 
          },
          { 
            label: 'Confirmed', 
            value: bookings.filter(b => b.status === 'CONFIRMED').length, 
            icon: Calendar, 
            color: 'text-green-600' 
          },
          { 
            label: 'Completed', 
            value: bookings.filter(b => b.status === 'COMPLETED').length, 
            icon: Calendar, 
            color: 'text-purple-600' 
          }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card-luxury">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-navy">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="card-luxury hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Section - Main Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy text-lg">
                        Booking #{booking.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Artist Info */}
                  <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                    <User className="w-5 h-5 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Artist</p>
                      <p className="font-medium text-navy">{booking.artist.user.name}</p>
                      <p className="text-sm text-gray-600">{booking.artist.discipline}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.artist.priceRange}
                      </p>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hotel</p>
                      <p className="font-medium text-navy">{booking.hotel.name}</p>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {parseLocation(booking.hotel.location)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Date & Credits */}
              <div className="lg:w-64 space-y-3">
                <div className="bg-navy/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold text-navy">
                      {calculateDuration(booking.startDate, booking.endDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Start:</span>
                      <span>{formatDate(booking.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>End:</span>
                      <span>{formatDate(booking.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gold/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-sm text-gray-600">Credits Used</span>
                    </div>
                    <span className="font-bold text-gold text-lg">
                      {booking.creditsUsed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && !loading && (
        <div className="card-luxury text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found</p>
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
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminBookings







