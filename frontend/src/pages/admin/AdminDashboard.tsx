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
  return date.toLocaleString('fr-FR')
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
    return `€${stats.totalRevenue.toLocaleString('fr-FR')}`
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
          const message = `${label}: ${hotel} (${amount >= 0 ? '+' : '-'}€${Math.abs(amount).toLocaleString('fr-FR')})`
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
      { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
      { label: 'Hôtels actifs', value: stats.totalHotels, icon: Building, color: 'text-green-600 dark:text-green-400' },
      { label: 'Artistes inscrits', value: stats.totalArtists, icon: Users, color: 'text-purple-600' },
      { label: 'Réservations', value: stats.totalBookings, icon: Calendar, color: 'text-orange-600' }
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
    return <div className="card-luxury text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10">{error}</div>
  }

  return (
    <div className="min-h-screen bg-surface" data-testid="dashboard">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
      <div>
              <h1 className="text-3xl font-semibold text-content mb-1">
                Tableau de bord
        </h1>
              <p className="text-sm text-content-secondary">
                Vue d’ensemble et statistiques de la plateforme
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-content-secondary uppercase tracking-wide mb-1">Total Revenue</div>
                <div className="text-2xl font-semibold text-content">{totalRevenueFormatted}</div>
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
              'text-green-600 dark:text-green-400': {
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
                className="bg-surface-raised rounded-card border border-line p-6 hover:border-line-strong transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-card ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-content-secondary uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-content">{stat.value.toLocaleString('fr-FR')}</p>
              </div>
            </div>
          )
        })}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity */}
          <div className="lg:col-span-2 bg-surface-raised rounded-card border border-line">
            <div className="px-6 py-4 border-b border-line">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-content">Activité récente</h2>
                <button 
                  onClick={() => navigate('/dashboard/logs')}
                  className="text-sm text-content-secondary hover:text-content flex items-center gap-1"
                >
                  Tout voir <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {activity.length > 0 ? (
                activity.slice(0, 8).map((item) => (
                  <div 
                    key={item.id} 
                    className="px-6 py-4 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                        item.status === 'success' ? 'bg-green-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content mb-1">{item.message}</p>
                        <p className="text-xs text-content-secondary">{item.time}</p>
            </div>
          </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Activity className="w-8 h-8 text-content-secondary mx-auto mb-2" />
                  <p className="text-sm text-content-secondary">Aucune activité récente</p>
                </div>
            )}
          </div>
        </div>

        {/* Top Artists */}
          <div className="bg-surface-raised rounded-card border border-line">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="text-lg font-semibold text-content">Artistes à l’honneur</h2>
            </div>
            <div className="divide-y divide-gray-200">
            {topArtists.length > 0 ? (
                topArtists.map((artist, idx) => (
                  <div 
                    key={artist.id} 
                    className="px-6 py-4 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-card bg-surface-sunken flex items-center justify-center text-xs font-semibold text-content-secondary">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-content truncate">{artist.name}</p>
                          <p className="text-xs text-content-secondary truncate">{artist.specialty || 'Artist'}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-content">{artist.bookings}</p>
                        <p className="text-xs text-content-secondary">réservations</p>
                      </div>
                  </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="w-8 h-8 text-content-secondary mx-auto mb-2" />
                  <p className="text-sm text-content-secondary">Aucune donnée</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Hotels */}
        <div className="bg-surface-raised rounded-card border border-line mb-8">
          <div className="px-6 py-4 border-b border-line">
                <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-content">Hôtels actifs</h2>
              <button 
                onClick={() => navigate('/dashboard/hotels')}
                className="text-sm text-content-secondary hover:text-content flex items-center gap-1"
              >
                Tout voir <ArrowUpRight className="w-4 h-4" />
              </button>
                </div>
              </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">Hôtel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">Lieu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">Réservations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-surface-raised divide-y divide-gray-200">
                {topHotels.length > 0 ? (
                  topHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-content">{hotel.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-content-secondary">{hotel.location || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-content">{hotel.bookings}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400">
                          Actif
                        </span>
                      </td>
                    </tr>
            ))
          ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Building className="w-8 h-8 text-content-secondary mx-auto mb-2" />
                      <p className="text-sm text-content-secondary">Aucune donnée hôtelière</p>
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
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <Users className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Utilisateurs</div>
            <div className="text-xs text-content-secondary mt-1">Gérer les comptes</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/bookings')}
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <Calendar className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Réservations</div>
            <div className="text-xs text-content-secondary mt-1">Tout voir</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/analytics')}
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <TrendingUp className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Statistiques</div>
            <div className="text-xs text-content-secondary mt-1">Platform metrics</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/logs')}
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <Activity className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Logs</div>
            <div className="text-xs text-content-secondary mt-1">Activity history</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/moderation')}
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <AlertCircle className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Modération</div>
            <div className="text-xs text-content-secondary mt-1">Review content</div>
          </button>

          <button 
            onClick={() => navigate('/dashboard/referrals')}
            className="bg-surface-raised border border-line rounded-card p-4 hover:border-line-strong hover:shadow-sm transition-all text-left group"
          >
            <Gift className="w-5 h-5 text-content-secondary mb-2 group-hover:text-content" />
            <div className="text-sm font-medium text-content">Parrainage</div>
            <div className="text-xs text-content-secondary mt-1">Track program</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
