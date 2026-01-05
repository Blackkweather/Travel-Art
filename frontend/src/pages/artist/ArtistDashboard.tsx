import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Star, Users, CreditCard, Music } from 'lucide-react'
import { bookingsApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ContactSupport from '@/components/ContactSupport'

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
        const artistRes = await artistsApi.getMyProfile()
        const artist = artistRes.data?.data

        if (!artist) {
          setLoading(false)
          return
        }

        // Get bookings for this artist (use artist ID, not user ID!)
        const bookingsRes = await bookingsApi.list({ artistId: artist.id })
        // API returns { bookings: [...], pagination: {...} } or sometimes just [...]
        const bookingsData = bookingsRes.data?.data
        const bookings = Array.isArray(bookingsData) 
          ? bookingsData 
          : (bookingsData?.bookings || [])

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
    { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-blue-600' },
    { label: 'Hotels Worked With', value: stats.hotelsWorkedWith, icon: Users, color: 'text-green-600' },
    { label: 'Average Rating', value: stats.hotelRating > 0 ? stats.hotelRating.toFixed(1) : 'N/A', icon: Star, color: 'text-amber-600' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: CreditCard, color: 'text-purple-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name?.split(' ')[0] || 'Artist'}. Here's your performance overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon
            const colorMap: Record<string, { bg: string; iconColor: string; border: string }> = {
              'text-blue-600': {
                bg: 'bg-blue-50',
                iconColor: 'text-blue-600',
                border: 'border-blue-200'
              },
              'text-green-600': {
                bg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                border: 'border-emerald-200'
              },
              'text-amber-600': {
                bg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                border: 'border-amber-200'
              },
              'text-purple-600': {
                bg: 'bg-purple-50',
                iconColor: 'text-purple-600',
                border: 'border-purple-200'
              }
            }
            const colors = colorMap[stat.color] || colorMap['text-blue-600']
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <Link 
                to="/dashboard/bookings" 
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => {
                const statusColor = booking.status === 'CONFIRMED' || booking.status === 'confirmed'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : booking.status === 'PENDING' || booking.status === 'pending'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
                
                const statusText = booking.status === 'CONFIRMED' || booking.status === 'confirmed'
                  ? 'Confirmed'
                  : booking.status === 'PENDING' || booking.status === 'pending'
                  ? 'Pending'
                  : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()
                
                return (
                  <div 
                    key={booking.id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
                            {booking.hotel?.name || 'Hotel'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {booking.hotel?.city && booking.hotel?.country 
                                ? `${booking.hotel.city}, ${booking.hotel.country}`
                                : 'Location TBD'}
                            </span>
                            {booking.performanceSpot && (
                              <>
                                <span>•</span>
                                <span>{booking.performanceSpot}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.startDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No bookings yet</p>
                <p className="text-xs text-gray-400 mt-1">Start connecting with hotels to see your bookings here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            to="/dashboard/profile" 
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Calendar className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Update Availability</div>
            <div className="text-xs text-gray-500 mt-1">Manage your calendar and availability</div>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Star className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Performance Gallery</div>
            <div className="text-xs text-gray-500 mt-1">Upload and manage your media</div>
          </Link>
        </div>

        {/* Contact Support */}
        <div>
          <ContactSupport
            userRole={user?.role || 'ARTIST'}
            userName={user?.name || ''}
            userEmail={user?.email || ''}
          />
        </div>
      </div>
    </div>
  )
}

export default ArtistDashboard
