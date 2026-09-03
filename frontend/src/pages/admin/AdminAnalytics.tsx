import React, { useEffect, useMemo, useState } from 'react'
import { adminApi, paymentsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { extractArray } from '@/utils/apiPayload'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

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
}

const MONTHS_TO_DISPLAY = 6

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'short'
})


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
    return `${currency}${formatNumber(value)}`
  }
  return formatNumber(value)
}

/* Two hues, each with a job: gold reads money, navy reads volume. Every chart
   below carries a single series whose title names it, so neither hue ever has
   to be told apart from the other inside one plot - which is why one accent
   pair is enough for six charts.

   CHART_GOLD is the 600 step rather than the brand 500. #B99851 measures
   2.67:1 against white, below the 3:1 a chart mark needs to stay visible;
   #9B7C3E clears it at 3.9:1 and still reads as the same gold. */
const CHART_GOLD = '#9B7C3E'
const CHART_NAVY = '#0B1F3F'
const CHART_GRID = '#E7E1D8'
const CHART_AXIS = '#5A6478'

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E7E1D8',
  borderRadius: '3px',
  fontSize: '0.8125rem'
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
      return t('Aucune réservation sur les six derniers mois.')
    }
    const latest = bookingTrend[bookingTrend.length - 1]
    const previous = bookingTrend.length > 1 ? bookingTrend[bookingTrend.length - 2].value : 0
    const diff = latest.value - previous
    // Whole sentences rather than glued fragments: the two languages order
    // "12 more than last month" differently, and a concatenation cannot.
    const directionText = diff === 0
      ? t('stable par rapport au mois précédent')
      : t(diff > 0 ? '{n} de plus que le mois précédent' : '{n} de moins que le mois précédent',
          { n: formatNumber(Math.abs(diff)) })
    return t('{n} réservations en {month} — {trend}.', {
      n: formatNumber(latest.value),
      month: latest.label,
      trend: directionText,
    })
  }, [bookingTrend])

  const revenueSubtitle = useMemo(() => {
    if (!revenueTrend.length) {
      return t('Aucun chiffre d’affaires sur les six derniers mois.')
    }
    const latest = revenueTrend[revenueTrend.length - 1]
    const previous = revenueTrend.length > 1 ? revenueTrend[revenueTrend.length - 2].value : 0
    const diff = latest.value - previous
    const directionText = diff === 0
      ? t('stable par rapport au mois précédent')
      : t(diff > 0 ? '{n} de plus que le mois précédent' : '{n} de moins que le mois précédent',
          { n: trendValueFormatter(Math.abs(diff), '€') })
    return t('{n} en {month} — {trend}.', {
      n: trendValueFormatter(latest.value, '€'),
      month: latest.label,
      trend: directionText,
    })
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
        // Four aggregates over several hundred rows each, against a
        // serverless database: on a cold connection this comfortably passed
        // the client's ten-second default and the page showed only an error.
        const slow = { timeout: 45000 }
        const [dashboardRes, bookingsRes, transactionsRes, usersRes] = await Promise.all([
          adminApi.getDashboard(slow),
          adminApi.getBookings({ limit: 200 }, slow),
          paymentsApi.transactions({ limit: 200 }, slow),
          adminApi.getUsers({ limit: 200 }, slow).catch(() => ({ data: { data: [] } }))
        ])

        const data = (dashboardRes.data?.data as any) || {}
        setStats({
          totalUsers: Number(data?.stats?.totalUsers ?? data?.totalUsers ?? 0),
          totalArtists: Number(data?.stats?.totalArtists ?? data?.totalArtists ?? 0),
          totalHotels: Number(data?.stats?.totalHotels ?? data?.totalHotels ?? 0),
          totalBookings: Number(data?.stats?.activeBookings ?? data?.totalBookings ?? 0),
          totalRevenue: Number(
            data?.stats?.totalRevenue ?? data?.stats?.totalRevenue?._sum?.amount ?? 0
          )
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
          { name: 'En attente', value: statusCounts['PENDING'] || 0 },
          { name: t('Confirmée'), value: statusCounts['CONFIRMED'] || 0 },
          { name: t('Terminée'), value: statusCounts['COMPLETED'] || 0 },
          { name: t('Annulée'), value: statusCounts['CANCELLED'] || 0 },
          { name: t('Refusée'), value: statusCounts['REJECTED'] || 0 }
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
      <div className="notice-critical">{error}</div>
    )
  }

  return (
    <div className="space-y-8">
      <SEOHead title={t('Statistiques') + ' — Travel Art'} />
      <header className="page-head">
        <span className="eyebrow">Administration</span>
        <h1 className="page-head__title">{t('Statistiques de la plateforme')}</h1>
        <p className="page-head__lede">{t('Indicateurs et visualisations de l’activité Travel Art.')}</p>
        <span className="rule-reveal mt-2" />
      </header>

      {/* Five headline numbers. Each was a bordered card pairing the value with
          an icon in its own hue; the hues were assigned per card and encoded
          nothing, so five different colours said five different things about
          measures that are simply five counts. */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-line border border-line rounded-card overflow-hidden">
        {[
          { label: t('Utilisateurs'), value: formatNumber(stats?.totalUsers ?? 0) },
          { label: t('Artistes'), value: (stats?.totalArtists ?? 0).toLocaleString('fr-FR') },
          { label: t('Hôtels'), value: (stats?.totalHotels ?? 0).toLocaleString('fr-FR') },
          { label: t('Réservations'), value: (stats?.totalBookings ?? 0).toLocaleString('fr-FR') },
          { label: t('Chiffre d’affaires'), value: `€${formatNumber(stats?.totalRevenue ?? 0)}` }
        ].map((stat) => (
          <div key={stat.label} className="stat rounded-none border-0">
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Revenue and Bookings Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Chiffre d’affaires — 6 derniers mois')}
            </h3>
            <p className="text-sm text-content-secondary">{revenueSubtitle}</p>
          </div>
          {revenueTrend.length > 0 && ResponsiveContainer && AreaChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_GOLD} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={CHART_GOLD} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`€${formatNumber(value)}`, 'Chiffre d’affaires']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_GOLD}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <div className="empty-state">
                <p className="empty-state__title">{t('Aucune donnée de chiffre d’affaires')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Réservations — 6 derniers mois')}
            </h3>
            <p className="text-sm text-content-secondary">{bookingSubtitle}</p>
          </div>
          {bookingTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Réservations']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="value" fill={CHART_NAVY} radius={[3, 3, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-content-secondary">
              <p>{t('Aucune donnée de réservation')}</p>
            </div>
          )}
        </div>
      </div>

      {/* User Growth and Booking Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Croissance des utilisateurs — 6 derniers mois')}
            </h3>
            <p className="text-sm text-content-secondary">{t('Inscriptions cumulées au fil du temps')}</p>
          </div>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), t('Utilisateurs')]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_NAVY}
                  strokeWidth={2}
                  dot={{ fill: CHART_NAVY, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-content-secondary">
              <p>{t('Aucune donnée de croissance des utilisateurs')}</p>
            </div>
          )}
        </div>

        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Réservations par statut')}
            </h3>
            <p className="text-sm text-content-secondary">{t('Nombre de réservations dans chaque statut.')}</p>
          </div>
          {bookingStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingStatusData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(11, 31, 63, 0.04)' }}
                  formatter={(value: number) => [formatNumber(value), 'Réservations']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="value" fill={CHART_NAVY} radius={[0, 3, 3, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-content-secondary">
              <p>{t('Aucune donnée de statut de réservation')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Artist and Hotel Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Croissance des artistes — 6 derniers mois')}
            </h3>
            <p className="text-sm text-content-secondary">{t('Inscriptions cumulées d’artistes')}</p>
          </div>
          {artistGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={artistGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Artistes']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_NAVY}
                  strokeWidth={2}
                  dot={{ fill: CHART_NAVY, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-content-secondary">
              <p>{t('Aucune donnée de croissance des artistes')}</p>
            </div>
          )}
        </div>

        <div className="panel p-6">
          <div className="mb-4">
            <h3 className="font-serif text-lg text-content mb-1">
              {t('Croissance des hôtels — 6 derniers mois')}
            </h3>
            <p className="text-sm text-content-secondary">{t('Inscriptions cumulées d’hôtels')}</p>
          </div>
          {hotelGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hotelGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Hôtels']}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_NAVY}
                  strokeWidth={2}
                  dot={{ fill: CHART_NAVY, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-content-secondary">
              <p>{t('Aucune donnée de croissance des hôtels')}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default AdminAnalytics
