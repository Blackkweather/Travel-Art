import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Star, Users, CreditCard } from 'lucide-react'
import { bookingsApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Booking {
  id: string
  hotel: {
    name: string
    city: string
    country: string
  }
  startDate: string
  endDate: string
  status: string
  performanceSpot?: string
}

const ArtistDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    hotelsWorkedWith: 0,
    hotelRating: 0,
    activeBookings: 0
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get artist profile
        const artistRes = await artistsApi.getById(user.id)
        const artist = artistRes.data?.data

        // Get bookings for this artist
        const bookingsRes = await bookingsApi.list({ artistId: user.id })
        const bookings = bookingsRes.data?.data || []

        // Calculate stats
        const totalBookings = bookings.length
        const activeBookings = bookings.filter((b: Booking) => 
          ['PENDING', 'CONFIRMED'].includes(b.status)
        ).length

        const uniqueHotels = new Set(
          bookings.map((b: Booking) => b.hotel?.name).filter(Boolean)
        )

        // Calculate average rating (if ratings exist)
        // Note: This would need to come from ratings API or be included in artist profile
        const avgRating = artist?.averageRating || 0

        // Get recent bookings (last 5, sorted by date)
        const recent = bookings
          .sort((a: Booking, b: Booking) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
          .slice(0, 5)
          .map((b: Booking) => ({
            id: b.id,
            hotel: b.hotel?.name || 'Unknown Hotel',
            location: b.hotel?.city || b.hotel?.country || 'Unknown',
            date: new Date(b.startDate).toLocaleDateString(),
            status: b.status.toLowerCase(),
            performanceSpot: b.performanceSpot || 'TBD'
          }))

        setStats({
          totalBookings,
          hotelsWorkedWith: uniqueHotels.size,
          hotelRating: avgRating,
          activeBookings
        })
        setRecentBookings(recent)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  const statsData = [
    { label: 'Total Bookings', value: stats.totalBookings.toString(), icon: Calendar, color: 'text-blue-600' },
    { label: 'Hotels Worked With', value: stats.hotelsWorkedWith.toString(), icon: Users, color: 'text-green-600' },
    { label: 'Hotel Rating', value: stats.hotelRating > 0 ? stats.hotelRating.toFixed(1) : 'N/A', icon: Star, color: 'text-yellow-600' },
    { label: 'Active Bookings', value: stats.activeBookings.toString(), icon: CreditCard, color: 'text-purple-600' }
  ]

  return (
    <div className="space-y-8">
      <div className="fade-in-up">
        <h1 className="dashboard-title mb-3 gold-underline">
          Welcome back, {user?.name}!
        </h1>
        <p className="dashboard-subtitle">
          Here's what's happening with your performances and bookings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className={`dashboard-stat-card ${index === 0 ? 'fade-in-up-delay-0' : index === 1 ? 'fade-in-up-delay-1' : index === 2 ? 'fade-in-up-delay-2' : 'fade-in-up-delay-3'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="section-subtitle mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-navy count-up">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color.replace('text-', 'bg-').replace('-600', '-100')} ${stat.color}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Bookings */}
      <div className="card-luxury fade-in-up-delay-1">
        <h2 className="section-title gold-underline">
          Recent Bookings
        </h2>
        {recentBookings.length > 0 ? (
          <div className="space-y-3">
            {recentBookings.map((booking, idx) => (
            <div 
              key={booking.id} 
              className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gold/30 transition-all duration-300 hover:shadow-md fade-in-up"
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-navy text-lg mb-1">{booking.hotel?.name || 'Hotel'}</h3>
                <p className="text-sm text-gray-600 font-medium mb-1">{booking.hotel?.city && booking.hotel?.country ? `${booking.hotel.city}, ${booking.hotel.country}` : ''} • {booking.performanceSpot || 'TBD'}</p>
                <p className="text-xs text-gray-500">{new Date(booking.startDate).toLocaleDateString()}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {booking.status}
              </span>
            </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12 text-base">No bookings yet. Start connecting with hotels!</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury fade-in-up-delay-2 hover:border-gold/40">
          <h3 className="text-xl font-serif font-semibold text-navy mb-3">
            Update Availability
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Keep your calendar updated so hotels can book you for their rooftop performances.
          </p>
          <Link to="/dashboard/profile" className="btn-primary inline-flex items-center gap-2">
            Manage Calendar <span>→</span>
          </Link>
        </div>

        <div className="card-luxury fade-in-up-delay-3 hover:border-gold/40">
          <h3 className="text-xl font-serif font-semibold text-navy mb-3">
            Performance Gallery
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Showcase your rooftop performances and connect with more luxury hotels.
          </p>
          <Link to="/dashboard/profile" className="btn-secondary inline-flex items-center gap-2">
            Upload Media <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ArtistDashboard
