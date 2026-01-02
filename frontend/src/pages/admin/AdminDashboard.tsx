import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { adminApi, commonApi, paymentsApi } from '@/utils/api'

type DashboardStats = {
  totalUsers: number
  totalArtists: number
  totalHotels: number
  totalBookings: number
  totalRevenue?: number
}

type ActivityItem = {
  id: string
  message: string
  time: string
  status: 'success' | 'warning'
  timestamp?: number
}

type Performer = {
  id: string
  name: string
  bookings: number
  rating?: number
  specialty?: string
}

type HotelPerformer = {
  id: string
  name: string
  bookings: number
  location?: string
  highlight?: string
}

const extractArray = (payload: any, key: string): any[] => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload[key])) return payload[key]
  if (payload.data) {
    if (Array.isArray(payload.data[key])) return payload.data[key]
    if (Array.isArray(payload.data)) return payload.data
  }
  return []
}

const formatDateTimeRelative = (value: string | Date) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleString()
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [topArtists, setTopArtists] = useState<Performer[]>([])
  const [topHotels, setTopHotels] = useState<HotelPerformer[]>([])

  const totalRevenueFormatted = useMemo(() => {
    if (!stats?.totalRevenue) return '€0'
    return `€${stats.totalRevenue.toLocaleString()}`
  }, [stats?.totalRevenue])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const [dashboardRes, bookingsRes, transactionsRes, topArtistsRes, topHotelsRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getBookings({ limit: 10 }).catch(() => ({ data: { data: [] } })),
          paymentsApi.transactions({ limit: 10 }).catch(() => ({ data: { data: [] } })),
          commonApi.getTopArtists({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          commonApi.getTopHotels({ limit: 5 }).catch(() => ({ data: { data: [] } }))
        ])

        const dashboardData = (dashboardRes.data?.data as any) || {}
        setStats({
          totalUsers: Number(dashboardData?.stats?.totalUsers ?? dashboardData?.totalUsers ?? 0),
          totalArtists: Number(dashboardData?.stats?.totalArtists ?? dashboardData?.totalArtists ?? 0),
          totalHotels: Number(dashboardData?.stats?.totalHotels ?? dashboardData?.totalHotels ?? 0),
          totalBookings: Number(dashboardData?.stats?.activeBookings ?? dashboardData?.totalBookings ?? 0),
          totalRevenue: Number(dashboardData?.stats?.totalRevenue?._sum?.amount ?? dashboardData?.totalRevenue ?? 0)
        })

        const recentBookings = extractArray(bookingsRes.data?.data, 'bookings')
        const recentTransactions = extractArray(transactionsRes.data?.data, 'transactions')

        const bookingActivity: ActivityItem[] = recentBookings.slice(0, 6).map((booking: any) => {
          const status = (booking?.status || 'PENDING').toString().toUpperCase()
          const friendlyStatus = status === 'PENDING' || status === 'CANCELLED' ? 'warning' : 'success'
          const hotelName = booking?.hotel?.name || booking?.hotelId || 'Hotel'
          const artistName = booking?.artist?.name || booking?.artistId || 'Artist'
          const start = booking?.startDate || booking?.createdAt
          const time = start ? formatDateTimeRelative(start) : 'Recently'
          const timestamp = start ? new Date(start).getTime() : 0
          const message = `Booking ${status.toLowerCase()}: ${artistName} → ${hotelName}`
          return {
            id: `booking-${booking?.id ?? Math.random()}`,
            message,
            time,
            status: friendlyStatus,
            timestamp
          }
        })

        const paymentActivity: ActivityItem[] = recentTransactions.slice(0, 4).map((txn: any) => {
          const amount = Number(txn?.amount ?? 0)
          const hotel = txn?.hotel?.name || txn?.hotelId || 'Hotel'
          const label = amount >= 0 ? 'Payment captured' : 'Refund issued'
          const message = `${label}: ${hotel} (${amount >= 0 ? '+' : '-'}€${Math.abs(amount).toLocaleString()})`
          const createdAt = txn?.createdAt
          const time = createdAt ? formatDateTimeRelative(createdAt) : 'Recently'
          const timestamp = createdAt ? new Date(createdAt).getTime() : 0
          return {
            id: `txn-${txn?.id ?? Math.random()}`,
            message,
            time,
            status: amount >= 0 ? 'success' : 'warning',
            timestamp
          }
        })

        const combined = [...bookingActivity, ...paymentActivity]
          .sort((a, b) => {
            // Sort by timestamp descending (most recent first)
            return (b.timestamp || 0) - (a.timestamp || 0)
          })
          .slice(0, 8)

        setActivity(combined)

        const topArtistEntries = extractArray(topArtistsRes.data?.data, 'artists')
        setTopArtists(
          topArtistEntries.slice(0, 4).map((artist: any) => ({
            id: artist?.id ?? artist?.artistId ?? Math.random().toString(36),
            name: artist?.user?.name || artist?.name || 'Unknown Artist',
            bookings: Number(artist?.bookingCount ?? artist?.totalBookings ?? 0),
            rating: Number(artist?.averageRating ?? artist?.rating ?? 0) || undefined,
            specialty: Array.isArray(artist?.mediaUrls) ? artist.mediaUrls[0] : artist?.discipline
          }))
        )

        const topHotelEntries = extractArray(topHotelsRes.data?.data, 'hotels')
        setTopHotels(
          topHotelEntries.slice(0, 4).map((hotel: any) => {
            const location = hotel?.location ? (typeof hotel.location === 'string' ? JSON.parse(hotel.location) : hotel.location) : {}
            return {
              id: hotel?.id ?? Math.random().toString(36),
              name: hotel?.name || 'Hotel',
              bookings: Number(hotel?.bookingCount ?? hotel?.totalBookings ?? 0),
              location: location?.city ? `${location.city}, ${location.country ?? ''}`.trim() : hotel?.location || undefined,
              highlight: Array.isArray(hotel?.performanceSpots) ? hotel.performanceSpots[0]?.name : undefined
            }
          })
        )
      } catch (err: any) {
        console.error(err)
        setError(err?.response?.data?.message || 'Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const statsCards = useMemo(() => {
    if (!stats) return []
    return [
      { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
      { label: 'Active Hotels', value: stats.totalHotels, icon: Building, color: 'text-green-600' },
      { label: 'Registered Artists', value: stats.totalArtists, icon: Users, color: 'text-purple-600' },
      { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-orange-600' }
    ]
  }, [stats])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <div className="card-luxury text-red-700 bg-red-50">{error}</div>
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
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
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card-luxury">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-navy">{stat.value.toLocaleString()}</p>
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
                Recent Activity
              </h2>
              <p className="text-sm text-gray-500">Latest bookings, payments, and platform updates.</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <span className="block font-semibold text-navy">{totalRevenueFormatted}</span>
              <span className="text-xs text-gray-500">Lifetime revenue</span>
            </div>
          </div>
          <div className="space-y-4">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.status === 'success' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {item.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{item.message}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Top Artists */}
        <div className="card-luxury">
          <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
            Top Performing Artists
          </h2>
          <div className="space-y-4">
            {topArtists.length > 0 ? (
              topArtists.map((artist) => (
                <div key={artist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-navy">{artist.name}</h3>
                    <p className="text-sm text-gray-600">{artist.specialty || artist.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-navy">{artist.bookings} bookings</p>
                    {artist.rating && (
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <span className="text-gold font-bold">◆</span>
                        <span>{artist.rating.toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No artist data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Hotels */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Most Active Hotels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topHotels.length > 0 ? (
            topHotels.map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-lg shadow-soft p-4">
                <h3 className="font-semibold text-navy mb-2">{hotel.name}</h3>
                {hotel.location && <p className="text-sm text-gray-600 mb-2">{hotel.location}</p>}
                {hotel.highlight && <p className="text-xs text-gray-500 mb-3">{hotel.highlight}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy">{hotel.bookings} bookings</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">No hotel data available</div>
          )}
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
          <button className="btn-primary" onClick={() => navigate('/dashboard/users')}>
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
          <button className="btn-secondary" onClick={() => navigate('/dashboard/analytics')}>
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
          <button className="btn-secondary" onClick={() => navigate('/dashboard/moderation')}>
            Moderate Content
          </button>
        </div>
      </div>

      {/* Additional Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Referral Tracking
          </h3>
          <p className="text-gray-600 mb-4">
            Monitor referral program performance and track rewards.
          </p>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/referrals')}>
            View Referrals
          </button>
        </div>

        <div className="card-luxury">
          <h3 className="text-lg font-serif font-semibold text-navy mb-4">
            Activity Logs
          </h3>
          <p className="text-gray-600 mb-4">
            View comprehensive activity logs for all platform events, user actions, and system activities.
          </p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/logs')}>
            View Activity Logs
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
