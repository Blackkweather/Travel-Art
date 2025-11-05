import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'

const ArtistBookings: React.FC = () => {
  const [filter, setFilter] = useState('all')
  
  const bookings = [
    {
      id: '1',
      hotel: 'Hotel Plaza Athénée',
      location: 'Paris, France',
      date: '2024-02-10',
      time: '19:00',
      performanceSpot: 'Rooftop Terrace',
      status: 'confirmed',
      duration: '2 hours',
      credits: 2,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      description: 'Intimate piano performance on the rooftop terrace with Eiffel Tower views'
    },
    {
      id: '2',
      hotel: 'Hotel Negresco',
      location: 'Nice, France',
      date: '2024-02-15',
      time: '20:30',
      performanceSpot: 'Rooftop Jazz Lounge',
      status: 'pending',
      duration: '1.5 hours',
      credits: 1,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      description: 'Jazz ensemble performance in the elegant rooftop lounge'
    },
    {
      id: '3',
      hotel: 'La Mamounia',
      location: 'Marrakech, Morocco',
      date: '2024-02-20',
      time: '18:00',
      performanceSpot: 'Atlas Rooftop Bar',
      status: 'completed',
      duration: '2 hours',
      credits: 2,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      description: 'Sunset piano performance with Atlas Mountain views'
    },
    {
      id: '4',
      hotel: 'Palácio Belmonte',
      location: 'Lisbon, Portugal',
      date: '2024-02-25',
      time: '19:30',
      performanceSpot: 'Terrace Bar',
      status: 'cancelled',
      duration: '1 hour',
      credits: 1,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      description: 'Cancelled due to weather conditions'
    },
    {
      id: '5',
      hotel: 'Nobu Hotel Ibiza',
      location: 'Ibiza, Spain',
      date: '2024-03-01',
      time: '21:00',
      performanceSpot: 'Rooftop Beach Club',
      status: 'confirmed',
      duration: '2.5 hours',
      credits: 3,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
      description: 'Evening piano performance at the beach club'
    }
  ]

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    return booking.status === filter
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
              onChange={(e) => setFilter(e.target.value)}
              className="form-input w-40"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-luxury text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-2">12</h3>
          <p className="text-gray-600">Total Bookings</p>
        </div>
        <div className="card-luxury text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-2">8</h3>
          <p className="text-gray-600">Confirmed</p>
        </div>
        <div className="card-luxury text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-navy mb-2">2</h3>
          <p className="text-gray-600">Pending</p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
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
                  alt={booking.hotel}
                  className="w-full lg:w-64 h-48 lg:h-40 object-cover rounded-lg"
                />
              </div>

              {/* Booking Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                      {booking.hotel}
                    </h3>
                    <p className="text-gray-600 flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {booking.location}
                    </p>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(booking.date).toLocaleDateString()} at {booking.time}
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
                    <p className="text-gold font-medium">{booking.credits} credits</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{booking.description}</p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          Accept
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                          Decline
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
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
              : `No ${filter} bookings found.`
            }
          </p>
          {filter === 'all' && (
            <button className="btn-primary">
              Update Availability
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ArtistBookings
