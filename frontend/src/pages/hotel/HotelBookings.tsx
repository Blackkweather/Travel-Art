import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Star, CheckCircle, XCircle, AlertCircle, Search, User, Music } from 'lucide-react'

const HotelBookings: React.FC = () => {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const bookings = [
    {
      id: '1',
      artist: {
        name: 'Sophie Laurent',
        discipline: 'Classical Pianist',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
        rating: 4.9
      },
      venue: 'Rooftop Terrace',
      date: '2024-02-10',
      time: '19:00',
      duration: '2 hours',
      status: 'confirmed',
      credits: 2,
      guestCount: 25,
      specialRequests: 'Please provide a grand piano and soft lighting for intimate atmosphere',
      performanceType: 'Intimate Concert',
      contactEmail: 'sophie@example.com',
      contactPhone: '+33 6 12 34 56 78'
    },
    {
      id: '2',
      artist: {
        name: 'Marco Silva',
        discipline: 'DJ',
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop',
        rating: 4.8
      },
      venue: 'Rooftop Beach Club',
      date: '2024-02-15',
      time: '20:30',
      duration: '3 hours',
      status: 'pending',
      credits: 3,
      guestCount: 50,
      specialRequests: 'Sunset DJ set with electronic music, need sound system and lighting',
      performanceType: 'DJ Performance',
      contactEmail: 'marco@example.com',
      contactPhone: '+351 91 23 45 67'
    },
    {
      id: '3',
      artist: {
        name: 'Jean-Michel Dubois',
        discipline: 'Jazz Saxophonist',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
        rating: 4.9
      },
      venue: 'Grand Ballroom',
      date: '2024-02-20',
      time: '18:00',
      duration: '2.5 hours',
      status: 'completed',
      credits: 2,
      guestCount: 80,
      specialRequests: 'Jazz ensemble performance, need piano and drum set',
      performanceType: 'Jazz Concert',
      contactEmail: 'jean@example.com',
      contactPhone: '+33 6 98 76 54 32'
    },
    {
      id: '4',
      artist: {
        name: 'Isabella Garcia',
        discipline: 'Flamenco Dancer',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=100&h=100&fit=crop',
        rating: 4.7
      },
      venue: 'Elegant Lounge',
      date: '2024-02-25',
      time: '19:30',
      duration: '1.5 hours',
      status: 'cancelled',
      credits: 1,
      guestCount: 30,
      specialRequests: 'Cancelled due to weather conditions',
      performanceType: 'Cultural Performance',
      contactEmail: 'isabella@example.com',
      contactPhone: '+34 6 11 22 33 44'
    },
    {
      id: '5',
      artist: {
        name: 'Yoga Master Ananda',
        discipline: 'Yoga Instructor',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop',
        rating: 4.8
      },
      venue: 'Rooftop Terrace',
      date: '2024-03-01',
      time: '07:00',
      duration: '1 hour',
      status: 'confirmed',
      credits: 1,
      guestCount: 20,
      specialRequests: 'Sunrise yoga session, need yoga mats and peaceful atmosphere',
      performanceType: 'Wellness Session',
      contactEmail: 'ananda@example.com',
      contactPhone: '+212 6 55 44 33 22'
    }
  ]

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter
    const matchesSearch = booking.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.performanceType.toLowerCase().includes(searchTerm.toLowerCase())
    
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
      <div className="card-luxury">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="form-label">Search Bookings</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by artist, venue, or performance type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <label className="form-label">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
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
      <div className="space-y-6">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
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
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gold font-bold">◆</span>
                    <span className="text-sm text-gray-600">{booking.artist.rating}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-1" />
                    <span>{booking.guestCount} guests expected</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-navy mb-2">Performance Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{booking.time} ({booking.duration})</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{booking.venue}</span>
                      </div>
                      <div className="flex items-center">
                        <Music className="w-4 h-4 mr-2" />
                        <span>{booking.performanceType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-navy mb-2">Booking Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Credits: <span className="font-medium text-gold">{booking.credits}</span></div>
                      <div>Contact: {booking.contactEmail}</div>
                      <div>Phone: {booking.contactPhone}</div>
                    </div>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-navy mb-2">Special Requests</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {booking.specialRequests}
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
                        <button className="btn-primary text-sm">Confirm</button>
                        <button className="btn-secondary text-sm">Decline</button>
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
