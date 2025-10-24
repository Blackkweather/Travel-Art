import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Users, Building, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore()

  const stats = [
    { label: 'Total Users', value: '156', icon: Users, color: 'text-blue-600' },
    { label: 'Active Hotels', value: '23', icon: Building, color: 'text-green-600' },
    { label: 'Registered Artists', value: '89', icon: Users, color: 'text-purple-600' },
    { label: 'Total Bookings', value: '342', icon: Calendar, color: 'text-orange-600' }
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'booking',
      message: 'New booking: Sophie Laurent at Hotel Plaza Athénée',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'registration',
      message: 'New artist registered: Isabella Garcia (Flamenco Dancer)',
      time: '4 hours ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'payment',
      message: 'Payment issue: Hotel Negresco credit purchase failed',
      time: '6 hours ago',
      status: 'warning'
    },
    {
      id: '4',
      type: 'rating',
      message: 'New rating: Jean-Michel Dubois received 5 stars',
      time: '8 hours ago',
      status: 'success'
    }
  ]

  const topArtists = [
    { name: 'Sophie Laurent', bookings: 24, rating: 4.9, specialty: 'Rooftop Piano' },
    { name: 'Marco Silva', bookings: 18, rating: 4.8, specialty: 'Sunset DJ Sets' },
    { name: 'Jean-Michel Dubois', bookings: 15, rating: 4.9, specialty: 'Jazz Ensembles' },
    { name: 'Isabella Garcia', bookings: 12, rating: 4.7, specialty: 'Flamenco Shows' }
  ]

  const topHotels = [
    { name: 'Hotel Plaza Athénée', bookings: 45, location: 'Paris', rooftop: 'Eiffel Tower Views' },
    { name: 'Hotel Negresco', bookings: 38, location: 'Nice', rooftop: 'Mediterranean Lounge' },
    { name: 'La Mamounia', bookings: 32, location: 'Marrakech', rooftop: 'Atlas Mountain Bar' },
    { name: 'Nobu Hotel Ibiza', bookings: 28, location: 'Ibiza', rooftop: 'Beach Club' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor platform activity and manage the Travel Art community.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card-luxury">
          <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artists */}
        <div className="card-luxury">
          <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
            Top Performing Artists
          </h2>
          <div className="space-y-4">
            {topArtists.map((artist, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-navy">{artist.name}</h3>
                  <p className="text-sm text-gray-600">{artist.specialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">{artist.bookings} bookings</p>
                  <p className="text-xs text-gray-500">⭐ {artist.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Hotels */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Most Active Hotels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topHotels.map((hotel, index) => (
            <div key={index} className="bg-white rounded-lg shadow-soft p-4">
              <h3 className="font-semibold text-navy mb-2">{hotel.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{hotel.location}</p>
              <p className="text-xs text-gray-500 mb-3">{hotel.rooftop}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">{hotel.bookings} bookings</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            User Management
          </h3>
          <p className="text-gray-600 mb-4">
            Manage users, verify accounts, and handle support requests.
          </p>
          <button className="btn-primary">
            Manage Users
          </button>
        </div>

        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Platform Analytics
          </h3>
          <p className="text-gray-600 mb-4">
            View detailed analytics and performance metrics for the platform.
          </p>
          <button className="btn-secondary">
            View Analytics
          </button>
        </div>

        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Content Moderation
          </h3>
          <p className="text-gray-600 mb-4">
            Review artist profiles, hotel listings, and user-generated content.
          </p>
          <button className="btn-secondary">
            Moderate Content
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
