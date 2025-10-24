import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Star, Users, CreditCard } from 'lucide-react'

const ArtistDashboard: React.FC = () => {
  const { user } = useAuthStore()

  const stats = [
    { label: 'Total Bookings', value: '12', icon: Calendar, color: 'text-blue-600' },
    { label: 'Hotels Worked With', value: '8', icon: Users, color: 'text-green-600' },
    { label: 'Hotel Rating', value: '4.8', icon: Star, color: 'text-yellow-600' },
    { label: 'Active Bookings', value: '3', icon: CreditCard, color: 'text-purple-600' }
  ]

  const recentBookings = [
    {
      id: '1',
      hotel: 'Hotel Plaza Athénée',
      location: 'Paris',
      date: '2024-01-15',
      status: 'confirmed',
      performanceSpot: 'Rooftop Terrace'
    },
    {
      id: '2',
      hotel: 'Hotel Negresco',
      location: 'Nice',
      date: '2024-01-20',
      status: 'pending',
      performanceSpot: 'Rooftop Jazz Lounge'
    },
    {
      id: '3',
      hotel: 'La Mamounia',
      location: 'Marrakech',
      date: '2024-01-25',
      status: 'completed',
      performanceSpot: 'Atlas Rooftop Bar'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your performances and bookings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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

      {/* Recent Bookings */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Recent Bookings
        </h2>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-navy">{booking.hotel}</h3>
                <p className="text-sm text-gray-600">{booking.location} • {booking.performanceSpot}</p>
                <p className="text-sm text-gray-500">{booking.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {booking.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Update Availability
          </h3>
          <p className="text-gray-600 mb-4">
            Keep your calendar updated so hotels can book you for their rooftop performances.
          </p>
          <button className="btn-primary">
            Manage Calendar
          </button>
        </div>

        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Performance Gallery
          </h3>
          <p className="text-gray-600 mb-4">
            Showcase your rooftop performances and connect with more luxury hotels.
          </p>
          <button className="btn-secondary">
            Upload Media
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArtistDashboard
