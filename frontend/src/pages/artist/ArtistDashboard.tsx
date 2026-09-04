import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Star } from 'lucide-react'
import { bookingsApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ContactSupport from '@/components/ContactSupport'
import StatusBadge from '@/components/StatusBadge'
import { parseJsonField } from '@/utils/apiPayload'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'
import { countryLabel } from '@/i18n/countries'

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

  /* Four numbers, one treatment. Each tile used to carry an icon in a tinted
     square - blue, green, amber, purple, assigned in source order - which
     made the row look like a template and told the reader nothing: the colour
     did not encode the metric, its rank, or its health. The number itself is
     now the only thing on the tile that is large or dark. */
  const statsData = [
    { label: t('Réservations'), value: stats.totalBookings },
    { label: t('Hôtels collaborateurs'), value: stats.hotelsWorkedWith },
    { label: 'Note moyenne', value: stats.hotelRating > 0 ? stats.hotelRating.toFixed(1) : '—' },
    { label: 'En cours', value: stats.activeBookings }
  ]

  return (
    <div className="min-h-screen bg-surface" data-testid="dashboard">
      <SEOHead title={t('Tableau de bord') + ' — Travel Art'} />
      <div className="shell py-12 md:py-16">
        <header className="page-head">
          <span className="eyebrow">Espace artiste</span>
          <h1 className="page-head__title">{t('Tableau de bord')}</h1>
          <p className="page-head__lede">
            {t('Bon retour, {name}. Voici l’essentiel de votre activité.', {
              name: user?.name?.split(' ')[0] || t('Artiste'),
            })}
          </p>
          <span className="rule-reveal mt-2" />
        </header>

        {/* Four equal columns is right here and nowhere else on this page: the
            metrics genuinely are peers, so ranking them by width would be a
            lie. The rest of the page is deliberately not on this grid. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden mb-10">
          {statsData.map((stat) => (
            <div key={stat.label} className="stat rounded-none border-0">
              <span className="stat__label">{stat.label}</span>
              <span className="stat__value">
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </span>
            </div>
          ))}
        </div>

        <section className="panel mb-10">
          <div className="panel-head">
            <h2>{t('Réservations récentes')}</h2>
            <Link to="/dashboard/bookings" className="btn-arrow text-sm text-content-secondary hover:text-content">
              {t('Tout voir')}
            </Link>
          </div>
          <div className="divide-y divide-line">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-surface-sunken">
                  <div className="min-w-0">
                    <h3 className="font-serif text-base text-content truncate">
                      {booking.hotel?.name || 'Hôtel'}
                    </h3>
                    <p className="mt-1 text-[0.8125rem] text-content-secondary">
                      {(() => {
                        /* `location` is a JSON string on the wire, so the flat
                           city/country this used to read never existed. */
                        const loc = parseJsonField<{ city?: string; country?: string }>(
                          (booking.hotel as any)?.location,
                          {}
                        )
                        const city = booking.hotel?.city ?? loc.city
                        const country = booking.hotel?.country ?? loc.country
                        const where = [city, countryLabel(country)].filter(Boolean).join(', ')
                        const spot = booking.performanceSpot
                        return [where || 'Lieu à confirmer', spot].filter(Boolean).join(' — ')
                      })()}
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-content-secondary">
                      {new Date(booking.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Calendar className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                <p className="empty-state__title">{t('Aucune réservation')}</p>
                <p className="empty-state__body">
                  {t('Entrez en relation avec des hôtels pour voir vos résidences apparaître ici.')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Two actions, deliberately unequal: the calendar is the one that
            unblocks a booking, the gallery is housekeeping. */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <Link to="/dashboard/profile" className="panel-interactive group md:col-span-7 p-6">
            <Calendar className="mb-3 h-5 w-5 text-gold" aria-hidden="true" />
            <div className="font-serif text-lg text-content">{t('Mettre à jour vos disponibilités')}</div>
            <p className="mt-1 text-sm text-content-secondary">
              {t('Les hôtels ne peuvent vous proposer que des dates que vous avez ouvertes.')}
            </p>
          </Link>

          <Link to="/dashboard/profile" className="panel-interactive group md:col-span-5 p-6">
            <Star className="mb-3 h-5 w-5 text-gold" aria-hidden="true" />
            <div className="font-serif text-lg text-content">{t('Galerie de performances')}</div>
            <p className="mt-1 text-sm text-content-secondary">
              {t('Déposez et classez vos médias.')}
            </p>
          </Link>
        </div>

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
