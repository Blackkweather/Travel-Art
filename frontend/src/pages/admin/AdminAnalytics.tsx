import React, { useEffect, useMemo, useState } from 'react'
import { adminApi, paymentsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TrendingUp, Users, Building, Calendar, Euro, BarChart3, PieChart, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

type DashboardStats = {
  totalUsers: number
  totalArtists: number
  totalHotels: number
  totalBookings: number
  totalRevenue?: number
}

type TrendPoint = {
  key: string
  label: string
  value: number
  date: string
}

type BookingStatusData = {
  name: string
  value: number
  color: string
}

const MONTHS_TO_DISPLAY = 6

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'short'
})

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

const buildMonthlySeries = (
  items: any[],
  months: number,
  getDate: (item: any) => string | Date | undefined,
  getValue: (item: any) => number = () => 1
): TrendPoint[] => {
  const now = new Date()
  const buckets: TrendPoint[] = []
  const monthIndex = new Map<string, number>()

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthIndex.set(key, buckets.length)
    buckets.push({
      key,
      label: `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(-2)}`,
      value: 0,
      date: date.toISOString()
    })
  }

  items.forEach((item) => {
    const raw = getDate(item)
    if (!raw) return
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const index = monthIndex.get(key)
    if (index === undefined) return
    const increment = getValue(item)
    if (!Number.isFinite(increment)) return
    buckets[index].value += increment
  })

  return buckets
}

const buildUserGrowthSeries = (users: any[], months: number): TrendPoint[] => {
  const now = new Date()
  const buckets: TrendPoint[] = []
  const monthIndex = new Map<string, number>()

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthIndex.set(key, buckets.length)
    buckets.push({
      key,
      label: `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(-2)}`,
      value: 0,
      date: date.toISOString()
    })
  }

  users.forEach((user) => {
    const createdAt = user?.createdAt || user?.user?.createdAt
    if (!createdAt) return
    const date = new Date(createdAt)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const index = monthIndex.get(key)
    if (index === undefined) return
    buckets[index].value += 1
  })

  // Convert to cumulative
  let cumulative = 0
  return buckets.map(bucket => {
    cumulative += bucket.value
    return { ...bucket, value: cumulative }
  })
}

const trendValueFormatter = (value: number, currency?: string) => {
  if (currency) {
    return `${currency}${value.toLocaleString()}`
  }
  return value.toLocaleString()
}

const COLORS = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  rejected: '#6b7280'
}

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bookingTrend, setBookingTrend] = useState<TrendPoint[]>([])
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([])
  const [userGrowth, setUserGrowth] = useState<TrendPoint[]>([])
  const [bookingStatusData, setBookingStatusData] = useState<BookingStatusData[]>([])
  const [artistGrowth, setArtistGrowth] = useState<TrendPoint[]>([])
  const [hotelGrowth, setHotelGrowth] = useState<TrendPoint[]>([])

  const bookingSubtitle = useMemo(() => {
    if (!bookingTrend.length) {
      return 'No bookings recorded in the last six months.'
    }
    const latest = bookingTrend[bookingTrend.length - 1]
    const previous = bookingTrend.length > 1 ? bookingTrend[bookingTrend.length - 2].value : 0
    const diff = latest.value - previous
    const directionText = diff === 0
      ? 'unchanged compared with the previous month'
      : `${Math.abs(diff).toLocaleString()} ${diff > 0 ? 'more' : 'fewer'} than the previous month`
    return `${latest.value.toLocaleString()} bookings in ${latest.label} • ${directionText}.`
  }, [bookingTrend])

  const revenueSubtitle = useMemo(() => {
    if (!revenueTrend.length) {
      return 'No revenue recorded in the last six months.'
    }
    const latest = revenueTrend[revenueTrend.length - 1]
    const previous = revenueTrend.length > 1 ? revenueTrend[revenueTrend.length - 2].value : 0
    const diff = latest.value - previous
    const directionText = diff === 0
      ? 'unchanged compared with the previous month'
      : `${trendValueFormatter(Math.abs(diff), '€')} ${diff > 0 ? 'increase' : 'decrease'} vs previous month`
    return `${trendValueFormatter(latest.value, '€')} in ${latest.label} • ${directionText}.`
  }, [revenueTrend])

  useEffect(() => {
    console.log('📊 AdminAnalytics component mounted - loading charts...')
    console.log('Recharts components available:', {
      LineChart: !!LineChart,
      BarChart: !!BarChart,
      AreaChart: !!AreaChart,
      ResponsiveContainer: !!ResponsiveContainer
    })
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const [dashboardRes, bookingsRes, transactionsRes, usersRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getBookings({ limit: 200 }),
          paymentsApi.transactions({ limit: 200 }),
          adminApi.getUsers({ limit: 200 }).catch(() => ({ data: { data: [] } }))
        ])

        const data = (dashboardRes.data?.data as any) || {}
        setStats({
          totalUsers: Number(data?.stats?.totalUsers ?? data?.totalUsers ?? 0),
          totalArtists: Number(data?.stats?.totalArtists ?? data?.totalArtists ?? 0),
          totalHotels: Number(data?.stats?.totalHotels ?? data?.totalHotels ?? 0),
          totalBookings: Number(data?.stats?.activeBookings ?? data?.totalBookings ?? 0),
          totalRevenue: Number(data?.stats?.totalRevenue?._sum?.amount ?? data?.totalRevenue ?? 0)
        })

        const bookingsArray = extractArray(bookingsRes.data?.data, 'bookings')
        const transactionsArray = extractArray(transactionsRes.data?.data, 'transactions')
        const usersArray = extractArray(usersRes.data?.data, 'users')
        
        // Extract artists and hotels from users array
        const artistsArray = usersArray.filter((user: any) => user?.role === 'ARTIST' || user?.artist)
        const hotelsArray = usersArray.filter((user: any) => user?.role === 'HOTEL' || user?.hotel)

        // Booking trends
        setBookingTrend(
          buildMonthlySeries(bookingsArray, MONTHS_TO_DISPLAY, (item: any) => item?.startDate || item?.createdAt)
        )

        // Revenue trends
        setRevenueTrend(
          buildMonthlySeries(
            transactionsArray,
            MONTHS_TO_DISPLAY,
            (item: any) => item?.createdAt,
            (item: any) => Number(item?.amount ?? 0)
          )
        )

        // User growth
        setUserGrowth(
          buildUserGrowthSeries(usersArray, MONTHS_TO_DISPLAY)
        )

        // Artist growth
        setArtistGrowth(
          buildUserGrowthSeries(artistsArray, MONTHS_TO_DISPLAY)
        )

        // Hotel growth
        setHotelGrowth(
          buildUserGrowthSeries(hotelsArray, MONTHS_TO_DISPLAY)
        )

        // Booking status breakdown
        const statusCounts: Record<string, number> = {}
        bookingsArray.forEach((booking: any) => {
          const status = (booking?.status || 'PENDING').toUpperCase()
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })

        const statusData: BookingStatusData[] = [
          { name: 'Pending', value: statusCounts['PENDING'] || 0, color: COLORS.pending },
          { name: 'Confirmed', value: statusCounts['CONFIRMED'] || 0, color: COLORS.confirmed },
          { name: 'Completed', value: statusCounts['COMPLETED'] || 0, color: COLORS.completed },
          { name: 'Cancelled', value: statusCounts['CANCELLED'] || 0, color: COLORS.cancelled },
          { name: 'Rejected', value: statusCounts['REJECTED'] || 0, color: COLORS.rejected }
        ].filter(item => item.value > 0)

        setBookingStatusData(statusData)
        console.log('✅ Analytics data loaded:', {
          bookingTrend: bookingTrend.length,
          revenueTrend: revenueTrend.length,
          userGrowth: userGrowth.length,
          bookingStatus: bookingStatusData.length
        })
      } catch (e: any) {
        console.error('❌ Analytics error:', e)
        setError(e?.response?.data?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-luxury text-red-700 bg-red-50">{error}</div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">Platform Analytics</h1>
        <p className="text-gray-600">📊 CHARTS ENABLED - Comprehensive metrics and visualizations for the Travel Art platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-navy">{stats?.totalUsers ?? 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Artists</p>
              <p className="text-2xl font-bold text-navy">{stats?.totalArtists ?? 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hotels</p>
              <p className="text-2xl font-bold text-navy">{stats?.totalHotels ?? 0}</p>
            </div>
            <Building className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bookings</p>
              <p className="text-2xl font-bold text-navy">{stats?.totalBookings ?? 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-navy">€{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
            <Euro className="w-8 h-8 text-gold" />
          </div>
        </div>
      </div>

      {/* TEST CHART - Simple Bar Chart */}
      <div className="card-luxury p-6">
        <h3 className="text-lg font-serif font-semibold text-navy mb-4">TEST CHART (Should Always Show)</h3>
        {ResponsiveContainer && BarChart && Bar ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Jan', value: 10 },
              { name: 'Feb', value: 20 },
              { name: 'Mar', value: 15 },
              { name: 'Apr', value: 25 },
              { name: 'May', value: 30 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1f3c88" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="p-8 bg-red-100 border-2 border-red-500 rounded">
            <p className="text-red-700 font-bold">❌ RECHARTS NOT LOADED!</p>
            <p className="text-sm mt-2">ResponsiveContainer: {ResponsiveContainer ? '✅' : '❌'}</p>
            <p className="text-sm">BarChart: {BarChart ? '✅' : '❌'}</p>
            <p className="text-sm">Bar: {Bar ? '✅' : '❌'}</p>
            <p className="text-xs mt-4">Check browser console for import errors</p>
          </div>
        )}
      </div>

      {/* Revenue and Bookings Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Revenue Trend (Last 6 Months)
            </h3>
            <p className="text-sm text-gray-500">{revenueSubtitle}</p>
          </div>
          {revenueTrend.length > 0 && ResponsiveContainer && AreaChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b68b2e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#b68b2e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#b68b2e" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <p className="font-semibold mb-2">No revenue data available</p>
                <p className="text-xs">Recharts: {ResponsiveContainer ? '✅ Loaded' : '❌ Not loaded'}</p>
                <p className="text-xs">Data points: {revenueTrend.length}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Bookings Trend (Last 6 Months)
            </h3>
            <p className="text-sm text-gray-500">{bookingSubtitle}</p>
          </div>
          {bookingTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Bookings']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#1f3c88" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No booking data available</p>
            </div>
          )}
        </div>
      </div>

      {/* User Growth and Booking Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Growth (Last 6 Months)
            </h3>
            <p className="text-sm text-gray-500">Cumulative user registration over time</p>
          </div>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Total Users']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No user growth data available</p>
            </div>
          )}
        </div>

        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Booking Status Distribution
            </h3>
            <p className="text-sm text-gray-500">Breakdown of bookings by status</p>
          </div>
          {bookingStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Bookings']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No booking status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Artist and Hotel Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Artist Growth (Last 6 Months)
            </h3>
            <p className="text-sm text-gray-500">Cumulative artist registrations</p>
          </div>
          {artistGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={artistGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Total Artists']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No artist growth data available</p>
            </div>
          )}
        </div>

        <div className="card-luxury p-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Hotel Growth (Last 6 Months)
            </h3>
            <p className="text-sm text-gray-500">Cumulative hotel registrations</p>
          </div>
          {hotelGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hotelGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Total Hotels']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No hotel growth data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Combined Revenue and Bookings Line Chart */}
      <div className="card-luxury p-6">
        <div className="mb-4">
          <h3 className="text-lg font-serif font-semibold text-navy mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Revenue vs Bookings Comparison
          </h3>
          <p className="text-sm text-gray-500">Monthly revenue and booking trends side by side</p>
        </div>
        {bookingTrend.length > 0 || revenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={bookingTrend.map((booking, index) => ({
              ...booking,
              revenue: revenueTrend[index]?.value || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'value') return [value.toLocaleString(), 'Bookings']
                  if (name === 'revenue') return [`€${value.toLocaleString()}`, 'Revenue']
                  return [value, name]
                }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                stroke="#1f3c88" 
                strokeWidth={3}
                name="Bookings"
                dot={{ fill: '#1f3c88', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#b68b2e" 
                strokeWidth={3}
                name="Revenue (€)"
                dot={{ fill: '#b68b2e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <p>No comparison data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
