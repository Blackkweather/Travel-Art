import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building, Calendar, TrendingUp, AlertCircle, CheckCircle, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Eye, Gift } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Platform overview and analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Revenue</div>
                <div className="text-2xl font-semibold text-gray-900">{totalRevenueFormatted}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => {
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
              'text-purple-600': {
                bg: 'bg-purple-50',
                iconColor: 'text-purple-600',
                border: 'border-purple-200'
              },
              'text-orange-600': {
                bg: 'bg-orange-50',
                iconColor: 'text-orange-600',
                border: 'border-orange-200'
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
                  <p className="text-2xl font-semibold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button 
                  onClick={() => navigate('/dashboard/logs')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {activity.length > 0 ? (
                activity.slice(0, 8).map((item) => (
                  <div 
                    key={item.id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                        item.status === 'success' ? 'bg-green-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">{item.message}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Artists */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Artists</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {topArtists.length > 0 ? (
                topArtists.map((artist, idx) => (
                  <div 
                    key={artist.id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{artist.name}</p>
                          <p className="text-xs text-gray-500 truncate">{artist.specialty || 'Artist'}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-gray-900">{artist.bookings}</p>
                        <p className="text-xs text-gray-500">bookings</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Hotels */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Hotels</h2>
              <button 
                onClick={() => navigate('/dashboard/hotels')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topHotels.length > 0 ? (
                  topHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{hotel.location || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hotel.bookings}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No hotel data available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => navigate('/dashboard/users')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Users className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Users</div>
            <div className="text-xs text-gray-500 mt-1">Manage accounts</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/bookings')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Calendar className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Bookings</div>
            <div className="text-xs text-gray-500 mt-1">View all</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/analytics')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <TrendingUp className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Analytics</div>
            <div className="text-xs text-gray-500 mt-1">Platform metrics</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/logs')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Activity className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Logs</div>
            <div className="text-xs text-gray-500 mt-1">Activity history</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/moderation')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <AlertCircle className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Moderation</div>
            <div className="text-xs text-gray-500 mt-1">Review content</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/referrals')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
          >
            <Gift className="w-5 h-5 text-gray-600 mb-2 group-hover:text-gray-900" />
            <div className="text-sm font-medium text-gray-900">Referrals</div>
            <div className="text-xs text-gray-500 mt-1">Track program</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
