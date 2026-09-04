import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building, Calendar, TrendingUp, AlertCircle, Activity, Gift } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { adminApi, commonApi, paymentsApi } from '@/utils/api'
import { extractArray } from '@/utils/apiPayload'
import { t } from '@/i18n'
import { formatNumber, formatRelative } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

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


// One shared implementation now lives in @/utils/i18n; this page and the
// activity log each carried their own, in different languages.
const formatDateTimeRelative = formatRelative

/** Status labels for the activity feed, matching the badge vocabulary. */
const BOOKING_ACTIVITY_LABEL: Record<string, string> = {
  PENDING: t('Réservation en attente'),
  CONFIRMED: t('Réservation confirmée'),
  COMPLETED: t('Résidence terminée'),
  CANCELLED: t('Réservation annulée'),
  REJECTED: t('Réservation refusée'),
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
    return `€${formatNumber(stats.totalRevenue)}`
  }, [stats?.totalRevenue])

  useEffect(() => {
    (async () => {
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
          const hotelName = booking?.hotel?.name || 'Hôtel'
          /* The admin payload carries the artist's name on artist.user.name;
             the artist record itself only has stageName, which is null for most
             rows. Reading `artist.name` therefore fell through to `artistId`
             and printed a raw cuid into the feed. Never fall back to an id -
             a missing name should read as a missing name, not as internal
             state. */
          const artistName =
            booking?.artist?.user?.name ||
            booking?.artist?.stageName ||
            booking?.artist?.name ||
            'Artiste'
          const start = booking?.startDate || booking?.createdAt
          const time = start ? formatDateTimeRelative(start) : t('Récemment')
          const timestamp = start ? new Date(start).getTime() : 0
          const label = BOOKING_ACTIVITY_LABEL[status] ?? t('Réservation')
          const message = `${label} : ${artistName} → ${hotelName}`
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
          const hotel = txn?.hotel?.name || 'Hôtel'
          const label = amount >= 0 ? t('Paiement encaissé') : t('Remboursement émis')
          const message = `${label}: ${hotel} (${amount >= 0 ? '+' : '-'}€${Math.abs(amount).toLocaleString('fr-FR')})`
          const createdAt = txn?.createdAt
          const time = createdAt ? formatDateTimeRelative(createdAt) : t('Récemment')
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
      { label: 'Utilisateurs', value: stats.totalUsers },
      { label: t('Hôtels actifs'), value: stats.totalHotels },
      { label: 'Artistes inscrits', value: stats.totalArtists },
      { label: t('Réservations'), value: stats.totalBookings }
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
    return <div className="notice-critical">{error}</div>
  }

  return (
    <div className="min-h-screen bg-surface" data-testid="dashboard">
      <SEOHead title={t('Tableau de bord') + ' — Travel Art'} />
      <div className="shell py-12 md:py-16 space-y-10">
        <header className="page-head">
          <span className="eyebrow">{t('Administration')}</span>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1 className="page-head__title">{t('Tableau de bord')}</h1>
            <div className="text-right">
              <span className="stat__label">{t('Revenu total')}</span>
              <p className="mt-1 font-serif text-2xl text-content">{totalRevenueFormatted}</p>
            </div>
          </div>
          <p className="page-head__lede">{t('Vue d’ensemble et statistiques de la plateforme.')}</p>
          <span className="rule-reveal mt-2" />
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
          {statsCards.map((stat) => (
            <div key={stat.label} className="stat rounded-none border-0">
              <span className="stat__label">{stat.label}</span>
              <span className="stat__value">{formatNumber(stat.value)}</span>
            </div>
          ))}
        </div>

        {/* Activity is the wider column because a log line is a sentence; the
            artist ranking is a list of names and can hold a narrow measure. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="panel lg:col-span-2">
            <div className="panel-head">
              <h2>{t('Activité récente')}</h2>
              <button
                onClick={() => navigate('/dashboard/logs')}
                className="btn-arrow text-sm text-content-secondary hover:text-content"
              >
                {t('Tout voir')}
              </button>
            </div>
            <div className="divide-y divide-line">
              {activity.length > 0 ? (
                activity.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-6 py-4">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45"
                      style={{
                        backgroundColor:
                          item.status === 'success'
                            ? 'var(--state-positive)'
                            : 'var(--state-caution)'
                      }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-content">{item.message}</p>
                      <p className="mt-1 text-[0.8125rem] text-content-secondary">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Activity className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                  <p className="empty-state__title">{t('Aucune activité récente')}</p>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{t('Artistes à l’honneur')}</h2>
            </div>
            <div className="divide-y divide-line">
              {topArtists.length > 0 ? (
                topArtists.map((artist, idx) => (
                  <div key={artist.id} className="flex items-center gap-3 px-6 py-4">
                    <span className="w-5 shrink-0 font-serif text-base text-content-secondary tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-content">{artist.name}</p>
                      <p className="truncate text-[0.8125rem] text-content-secondary">
                        {artist.specialty || 'Artiste'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-base text-content tabular-nums">{artist.bookings}</p>
                      <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-content-secondary">
                        {t('rés.')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Users className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                  <p className="empty-state__title">{t('Aucune donnée')}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>{t('Hôtels actifs')}</h2>
            <button
              onClick={() => navigate('/dashboard/users')}
              className="btn-arrow text-sm text-content-secondary hover:text-content"
            >
              {t('Tout voir')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t('Hôtel')}</th>
                  <th scope="col">{t('Lieu')}</th>
                  <th scope="col" className="numeric">{t('Réservations')}</th>
                  <th scope="col">{t('Statut')}</th>
                </tr>
              </thead>
              <tbody>
                {topHotels.length > 0 ? (
                  topHotels.map((hotel) => (
                    <tr key={hotel.id}>
                      <td className="font-medium">{hotel.name}</td>
                      <td className="text-content-secondary">{hotel.location || '—'}</td>
                      <td className="numeric">{hotel.bookings}</td>
                      <td>
                        <StatusBadge status="ACTIVE" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <Building className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                        <p className="empty-state__title">{t('Aucune donnée hôtelière')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Six destinations, one shape. These are navigation, not metrics, so
            they stay uniform - the variance elsewhere on the page is what makes
            a uniform row here read as deliberate. */}
        <nav className="grid grid-cols-2 gap-px bg-line border border-line rounded-card overflow-hidden md:grid-cols-3 lg:grid-cols-6">
          {[
            { to: '/dashboard/users', Icon: Users, label: 'Utilisateurs', note: t('Gérer les comptes') },
            { to: '/dashboard/bookings', Icon: Calendar, label: t('Réservations'), note: t('Tout voir') },
            { to: '/dashboard/analytics', Icon: TrendingUp, label: 'Statistiques', note: t('Mesures de la plateforme') },
            { to: '/dashboard/logs', Icon: Activity, label: 'Journaux', note: t('Historique d’activité') },
            { to: '/dashboard/moderation', Icon: AlertCircle, label: t('Modération'), note: t('Vérifier les contenus') },
            { to: '/dashboard/referrals', Icon: Gift, label: 'Parrainage', note: t('Suivre le programme') }
          ].map(({ to, Icon, label, note }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group bg-surface-raised p-5 text-left transition-colors hover:bg-surface-sunken"
            >
              <Icon className="mb-3 h-5 w-5 text-content-secondary transition-colors group-hover:text-gold" aria-hidden="true" />
              <div className="font-serif text-base text-content">{label}</div>
              <div className="mt-1 text-[0.8125rem] text-content-secondary">{note}</div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default AdminDashboard
