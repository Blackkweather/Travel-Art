import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Star, CheckCircle, XCircle, AlertCircle, Search, User, Music } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { hotelsApi, bookingsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'

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
  creditsUsed: number
  performanceSpot?: string
  notes?: string
}

const HotelBookings: React.FC = () => {
  const { user } = useAuthStore()
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
        const bookingsData = bookingsRes.data?.data || []
        
        // Transform bookings to match component format
        const transformedBookings = bookingsData.map((b: any) => ({
          id: b.id,
          artist: {
            id: b.artist?.id || '',
            name: b.artist?.name || 'Unknown Artist',
            discipline: b.artist?.discipline || '',
            image: b.artist?.image || 'https://via.placeholder.com/100?text=Artist',
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
          time: new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      return diffMins > 0 ? `${diffHours}h ${diffMins}m` : `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`
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
      const bookingsData = bookingsRes.data?.data || []
      
      const transformedBookings = bookingsData.map((b: any) => ({
        id: b.id,
        artist: {
          id: b.artist?.id || '',
          name: b.artist?.name || 'Unknown Artist',
          discipline: b.artist?.discipline || '',
          image: b.artist?.image || 'https://via.placeholder.com/100?text=Artist',
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
        time: new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        guestCount: 0,
        performanceType: b.performanceType || 'Performance',
        contactEmail: b.artist?.email || '',
        contactPhone: b.artist?.phone || ''
      }))
      
      setBookings(transformedBookings)
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('Failed to update booking status')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Calendar },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: CheckCircle },
    { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: AlertCircle },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: Star }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Hotel Bookings
        </h1>
        <p className="text-gray-600">
          Manage your artist bookings and performance schedules
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury text-center"
            >
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-2">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Search and Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="flex-1">
            <label className="form-label">Search Bookings</label>
            <div className="search-icon-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by artist, venue, or performance type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                data-testid="filter-input"
              />
            </div>
          </div>
          <div className="md:w-48">
            <label className="form-label">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
              data-testid="status-filter"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
            className="card-luxury"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Artist Info */}
              <div className="flex items-start space-x-4">
                <img
                  src={booking.artist.image}
                  alt={booking.artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-serif font-semibold text-navy mb-1">
                    {booking.artist.name}
                  </h3>
                  <p className="text-gold font-medium mb-2">{booking.artist.discipline}</p>
                  {booking.artist.rating > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-4 h-4 text-gold" />
                      <span className="text-sm text-gray-600">{booking.artist.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="flex-1" data-testid="booking-details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-navy mb-2">Performance Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <h4 className="text-sm font-medium text-navy mb-2">Booking Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Credits: <span className="font-medium text-gold">{booking.creditsUsed}</span></div>
                      {booking.notes && <div>Notes: {booking.notes}</div>}
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-navy mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {booking.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="ml-1 capitalize">{booking.status}</span>
                  </span>
                  
                  <div className="flex space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                          className="btn-primary text-sm"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                          className="btn-secondary text-sm"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button className="btn-secondary text-sm">View Details</button>
                    )}
                    {booking.status === 'completed' && (
                      <button className="btn-primary text-sm">Rate Artist</button>
                    )}
                    {booking.status === 'cancelled' && (
                      <button className="btn-secondary text-sm">Re-book</button>
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
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-navy mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-600 mb-6">
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
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default HotelBookings
