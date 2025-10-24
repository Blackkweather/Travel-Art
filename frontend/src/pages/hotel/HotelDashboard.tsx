import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Users, CreditCard, Star, MapPin, Music } from 'lucide-react'

const HotelDashboard: React.FC = () => {
  const { user } = useAuthStore()

  const stats = [
    { label: 'Active Bookings', value: '5', icon: Calendar, color: 'text-blue-600' },
    { label: 'Available Credits', value: '12', icon: CreditCard, color: 'text-green-600' },
    { label: 'Artists Booked', value: '8', icon: Users, color: 'text-purple-600' },
    { label: 'Performance Spots', value: '3', icon: MapPin, color: 'text-orange-600' }
  ]

  const upcomingPerformances = [
    {
      id: '1',
      artist: 'Sophie Laurent',
      discipline: 'Classical Pianist',
      date: '2024-01-15',
      time: '19:00',
      spot: 'Rooftop Terrace',
      status: 'confirmed'
    },
    {
      id: '2',
      artist: 'Marco Silva',
      discipline: 'DJ',
      date: '2024-01-18',
      time: '20:30',
      spot: 'Rooftop Jazz Lounge',
      status: 'pending'
    },
    {
      id: '3',
      artist: 'Jean-Michel Dubois',
      discipline: 'Jazz Saxophonist',
      date: '2024-01-22',
      time: '18:00',
      spot: 'Garden Terrace',
      status: 'confirmed'
    }
  ]

  const performanceSpots = [
    {
      name: 'Rooftop Terrace',
      type: 'lounge',
      capacity: 50,
      description: 'Stunning rooftop with Eiffel Tower views - ideal for intimate acoustic sets',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
    },
    {
      name: 'Grand Ballroom',
      type: 'ballroom',
      capacity: 200,
      description: 'Elegant ballroom perfect for classical concerts and formal performances',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop'
    },
    {
      name: 'Garden Terrace',
      type: 'resto',
      capacity: 80,
      description: 'Elegant garden space ideal for acoustic performances and dinner shows',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Manage your hotel's artist bookings and rooftop performances.
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

      {/* Upcoming Performances */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Upcoming Performances
        </h2>
        <div className="space-y-4">
          {upcomingPerformances.map((performance) => (
            <div key={performance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{performance.artist}</h3>
                  <p className="text-sm text-gray-600">{performance.discipline}</p>
                  <p className="text-sm text-gray-500">{performance.spot} • {performance.date} at {performance.time}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                performance.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {performance.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Spots */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Your Performance Spots
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceSpots.map((spot, index) => (
            <div key={index} className="bg-white rounded-lg shadow-soft overflow-hidden">
              <img 
                src={spot.image} 
                alt={spot.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-navy mb-2">{spot.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{spot.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Capacity: {spot.capacity}</span>
                  <span className="capitalize">{spot.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Browse Artists
          </h3>
          <p className="text-gray-600 mb-4">
            Discover talented artists for your rooftop performances and intimate venues.
          </p>
          <button className="btn-primary">
            Find Artists
          </button>
        </div>

        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Manage Credits
          </h3>
          <p className="text-gray-600 mb-4">
            Purchase credits to book artists for unforgettable rooftop experiences.
          </p>
          <button className="btn-secondary">
            Buy Credits
          </button>
        </div>
      </div>
    </div>
  )
}

export default HotelDashboard
