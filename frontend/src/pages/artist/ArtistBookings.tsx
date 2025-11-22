import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { bookingsApi, hotelsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import type { Booking as BookingType } from '@/types'

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

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=Hotel'

const ArtistBookings: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingCardData[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingCardData | null>(null)

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
      } catch (error) {
        return fallback
      }
    }

    return value as T
  }

  const getLocationString = (location: any): string => {
    const parsed = parseJson<{ city?: string; country?: string }>(location, {})
    const parts = [parsed.city, parsed.country].filter(Boolean)
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

    if (diffHours > 0) {
      return diffMins > 0 ? `${diffHours}h ${diffMins}m` : `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }

    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`
  }

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
      const startTime = new Date(booking.startDate).toLocaleTimeString([], {
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
        creditsUsed: booking.creditsUsed,
        performanceSpot: booking.performanceSpot || 'TBD',
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
      setError('Unable to load bookings at the moment.')
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
      alert('Failed to update booking status. Please try again.')
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

  const statCards = useMemo(
    () => [
      {
        label: 'Total Bookings',
        value: stats.total,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        Icon: Calendar
      },
      {
        label: 'Confirmed',
        value: stats.confirmed,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        Icon: CheckCircle
      },
      {
        label: 'Pending',
        value: stats.pending,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        Icon: AlertCircle
      }
    ],
    [stats]
  )

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            My Bookings
          </h1>
          <p className="text-gray-600">
            Manage your performance bookings and track your schedule
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookingStatus | 'all')}
              className="form-input w-44"
              data-testid="status-filter"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card-luxury border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(({ label, value, iconBg, iconColor, Icon }) => (
          <div key={label} className="card-luxury text-center">
            <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="text-2xl font-bold text-navy mb-2">{value}</h3>
            <p className="text-gray-600">{label}</p>
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
            className="card-luxury"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Hotel Image */}
              <div className="flex-shrink-0">
                <img
                  src={booking.image}
                  alt={booking.hotelName}
                  className="w-full lg:w-64 h-48 lg:h-40 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>

              {/* Booking Details */}
              <div className="flex-1" data-testid="booking-details">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                      {booking.hotelName}
                    </h3>
                    <p className="text-gray-600 flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {booking.location}
                    </p>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(booking.startDate).toLocaleDateString()} at {booking.startTime}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(booking.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance Spot</p>
                    <p className="text-navy font-medium">{booking.performanceSpot}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-navy font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {booking.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Credits</p>
                    <p className="text-gold font-medium">{booking.creditsUsed} credits</p>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-gray-600 mb-4">{booking.notes}</p>
                )}

                {!booking.notes && (
                  <p className="text-gray-500 mb-4 italic">Awaiting additional notes from the hotel.</p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isUpdating}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isUpdating}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        View Feedback
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
        <div className="card-luxury text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-semibold text-navy mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? "You don't have any bookings yet. Update your availability to get started!"
              : `No ${filter} bookings found.`}
          </p>
          {filter === 'all' && (
            <button 
              onClick={() => navigate('/dashboard/profile')}
              className="btn-primary"
            >
              Update Availability
            </button>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Hotel Info */}
                <div>
                  <h3 className="text-xl font-semibold text-navy mb-2">{selectedBooking.hotelName}</h3>
                  <p className="text-gray-600 flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedBooking.location}
                  </p>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start Date & Time</p>
                    <p className="text-navy font-medium">
                      {new Date(selectedBooking.startDate).toLocaleDateString()} at {selectedBooking.startTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">End Date</p>
                    <p className="text-navy font-medium">
                      {new Date(selectedBooking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-navy font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedBooking.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance Spot</p>
                    <p className="text-navy font-medium">{selectedBooking.performanceSpot}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Credits Used</p>
                    <p className="text-gold font-medium">{selectedBooking.creditsUsed} credits</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        navigate(`/hotel/${selectedBooking.hotelId}`)
                        setSelectedBooking(null)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Hotel Profile
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
