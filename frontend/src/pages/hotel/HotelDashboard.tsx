import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Users, CreditCard, MapPin, Music } from 'lucide-react'
import { hotelsApi, bookingsApi, artistsApi, apiClient } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ContactSupport from '@/components/ContactSupport'
import StatusBadge from '@/components/StatusBadge'
import toast from 'react-hot-toast'
import { personName } from '@/utils/apiPayload'
import ConfirmDialog from '@/components/ConfirmDialog'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

interface Booking {
  id: string
  artist: {
    name: string
    discipline: string
  }
  startDate: string
  endDate: string
  status: string
  performanceSpot?: string
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  totalPaymentAmount?: number
  weeklyPaymentAmount?: number
  numberOfWeeks?: number
}

interface PerformanceSpot {
  name: string
  type: string
  capacity: number
  description: string
  image?: string
}

interface UpcomingPerformance {
  id: string
  artist: string
  discipline: string
  date: string
  time: string
  spot: string
  status: string
}

const HotelDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalSpent: 0, // Total amount spent on bookings
    artistsBooked: 0,
    performanceSpots: 0,
    pendingPayments: 0 // Total pending payment amount
  })
  const [upcomingPerformances, setUpcomingPerformances] = useState<UpcomingPerformance[]>([])
  const [performanceSpots, setPerformanceSpots] = useState<PerformanceSpot[]>([])
  const [favoriteArtists, setFavoriteArtists] = useState<any[]>([])
  const [hotelId, setHotelId] = useState<string>('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get hotel profile
        const hotelRes = await hotelsApi.getByUser(user.id)
        const hotel = hotelRes.data?.data
        if (!hotel) return
        setHotelId(hotel.id)

        // Get bookings for this hotel
        const bookingsRes = await bookingsApi.list({ hotelId: hotel.id })
        // API returns { bookings: [...], pagination: {...} } or sometimes just [...]
        const bookingsData = bookingsRes.data?.data
        const bookings = Array.isArray(bookingsData) 
          ? bookingsData 
          : (bookingsData?.bookings || [])
        
        // Calculate stats
        const activeBookings = bookings.filter((b: Booking) => 
          ['PENDING', 'CONFIRMED'].includes(b.status)
        ).length

        // Calculate payment stats
        const totalSpent = bookings
          .filter((b: Booking) => b.paymentStatus === 'PAID')
          .reduce((sum: number, b: Booking) => sum + (b.totalPaymentAmount || 0), 0)
        
        const pendingPayments = bookings
          .filter((b: Booking) => b.paymentStatus === 'PENDING' && b.status === 'CONFIRMED')
          .reduce((sum: number, b: Booking) => sum + (b.totalPaymentAmount || 0), 0)

        // b.artist has no `name` - it lives on artist.user.name - so this Set
        // was built entirely from undefined and the dashboard reported zero
        // artists booked beside twenty-four bookings.
        const uniqueArtists = new Set(
          bookings.map((b: Booking) => personName(b.artist, '')).filter(Boolean)
        )

        // Parse performance spots from hotel profile
        let spots: PerformanceSpot[] = []
        if (hotel.performanceSpots) {
          try {
            const spotsData = typeof hotel.performanceSpots === 'string' 
              ? JSON.parse(hotel.performanceSpots) 
              : hotel.performanceSpots
            spots = Array.isArray(spotsData) ? spotsData : []
          } catch {
            // Invalid JSON, use empty array
          }
        }

        // Get upcoming performances (active bookings)
        const upcoming = bookings
          .filter((b: Booking) => ['PENDING', 'CONFIRMED'].includes(b.status))
          .sort((a: Booking, b: Booking) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
          .slice(0, 5)
          .map((b: Booking) => ({
            id: b.id,
            artist: personName(b.artist),
            discipline: b.artist?.discipline || '',
            date: new Date(b.startDate).toLocaleDateString('fr-FR'),
            time: new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            spot: b.performanceSpot || 'Espace à confirmer',
            status: b.status.toLowerCase()
          }))

        setStats({
          activeBookings,
          totalSpent,
          artistsBooked: uniqueArtists.size,
          performanceSpots: spots.length,
          pendingPayments
        })
        setUpcomingPerformances(upcoming)
        setPerformanceSpots(spots)

        // Fetch favorite artists
        try {
          const favoritesRes = await hotelsApi.getFavorites(hotel.id)
          const favorites = (favoritesRes.data?.data as any) || []
          const favoriteIds = Array.isArray(favorites) ? favorites.map((f: any) => f?.artistId || f?.id || f).filter(Boolean) : []
          if (favoriteIds.length > 0) {
            const artistsPromises = favoriteIds.slice(0, 5).map((id: string) => artistsApi.getById(id).catch(() => null))
            const artistsResults = await Promise.all(artistsPromises)
            const artists = artistsResults.filter(Boolean).map((r: any) => r?.data?.data || r?.data).filter(Boolean)
            setFavoriteArtists(artists)
          }
        } catch (err) {
          console.warn('Failed to load favorites', err)
        }
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

  const handleDeleteProfile = async () => {
    if (!hotelId) return
    setDeleting(true)
    try {
      await apiClient.delete(`/hotels/${hotelId}`)
      toast.success(t('Profil hôtel supprimé'))
      navigate('/')
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Échec de la suppression')
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  const statsData = [
    { label: t('Réservations en cours'), value: formatNumber(stats.activeBookings) },
    { label: t('Total dépensé'), value: `€${formatNumber(Math.round(stats.totalSpent))}` },
    { label: t('Artistes réservés'), value: formatNumber(stats.artistsBooked) },
    { label: t('Espaces'), value: formatNumber(stats.performanceSpots) }
  ]

  return (
    <div className="min-h-screen bg-surface" data-testid="dashboard">
      <SEOHead title={t('Tableau de bord') + ' — Travel Art'} />
      <div className="shell py-12 md:py-16 space-y-12">
        <header className="page-head">
          <span className="eyebrow">{t('Espace hôtel')}</span>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="page-head__title">
              {/* A hotel is not a person: taking the first word of
                  "Les Terrasses de Val d’Isère" greeted the user as "Les". */}
              {t('Bon retour, {name}', { name: user?.name ?? '' })}
            </h1>
            {hotelId && (
              <button className="btn-danger btn-sm" onClick={() => setConfirmingDelete(true)}>
                {t('Supprimer le profil')}
              </button>
            )}
          </div>
          <p className="page-head__lede">
            {t('Gérez les résidences d’artistes et la programmation de votre établissement.')}
          </p>
          <span className="rule-reveal mt-2" />
        </header>

        {/* The four counts share a frame rather than floating as four shadowed
            boxes. The progress bar that used to sit under each one is gone: it
            was hardcoded to 75% on every tile, so it charted nothing. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
          {statsData.map((stat) => (
            <div key={stat.label} className="stat rounded-none border-0">
              <span className="stat__label">{stat.label}</span>
              <span className="stat__value">{stat.value}</span>
            </div>
          ))}
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>{t('Prochaines représentations')}</h2>
            <Link to="/dashboard/bookings" className="btn-arrow text-sm text-content-secondary hover:text-content">
              {t('Tout voir')}
            </Link>
          </div>

          {upcomingPerformances.length > 0 ? (
            <div className="divide-y divide-line">
              {upcomingPerformances.map((performance) => (
                <div
                  key={performance.id}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="spark shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-base text-content">{performance.artist}</h3>
                      <p className="mt-1 text-[0.8125rem] text-content-secondary">
                        {performance.discipline} — {performance.spot}
                      </p>
                      <p className="mt-1 text-[0.8125rem] text-content-secondary">
                        {performance.date} à {performance.time}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={performance.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Music className="h-6 w-6 text-content-secondary" aria-hidden="true" />
              <p className="empty-state__title">{t('Aucune représentation à venir')}</p>
              <p className="empty-state__body">
                {t('Invitez des artistes pour voir votre programmation apparaître ici.')}
              </p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>{t('Vos espaces de représentation')}</h2>
          </div>

          {performanceSpots.length > 0 ? (
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {performanceSpots.map((spot, index) => (
                <article key={index} className="group flex flex-col bg-surface-raised">
                  {spot.image && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
                      <img
                        decoding="async"
                        loading="lazy"
                        src={spot.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 ease-entrance group-hover:scale-[1.04]"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-lg text-content">{spot.name}</h3>
                    {spot.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-content-secondary">{spot.description}</p>
                    )}
                    <dl className="mt-auto flex items-baseline gap-6 pt-5 text-sm">
                      <div>
                        <dt className="stat__label">{t('Capacité')}</dt>
                        <dd className="mt-1 font-serif text-lg text-content">{spot.capacity || '—'}</dd>
                      </div>
                      {spot.type && (
                        <div>
                          <dt className="stat__label">Type</dt>
                          <dd className="mt-1 font-serif text-lg text-content">{spot.type}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <MapPin className="h-6 w-6 text-content-secondary" aria-hidden="true" />
              <p className="empty-state__title">{t('Aucun espace configuré')}</p>
              <p className="empty-state__body">
                {t('Complétez le profil de votre hôtel pour ajouter vos espaces de représentation.')}
              </p>
            </div>
          )}
        </section>

        {favoriteArtists.length > 0 && (
          <section className="panel">
            <div className="panel-head">
              <h2>{t('Vos artistes favoris')}</h2>
              <Link to="/dashboard/artists" className="btn-arrow text-sm text-content-secondary hover:text-content">
                {t('Tout voir')}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-5">
              {favoriteArtists.map((artist: any) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="group bg-surface-raised p-5 transition-colors hover:bg-surface-sunken"
                >
                  <h3 className="truncate font-serif text-base text-content">
                    {artist.user?.name || artist.name || 'Artiste'}
                  </h3>
                  <p className="mt-1 text-[0.8125rem] text-content-secondary">
                    {artist.discipline || 'Artiste'}
                  </p>
                  {artist.averageRating && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-content">
                      <span className="spark" aria-hidden="true" />
                      {artist.averageRating.toFixed(1)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* The closing pair. The left card was a navy gradient carrying
            `text-content` - navy type on navy - so on the light theme its
            heading and body were invisible. It is now the one inverse band on
            the page, with the tokens that belong on an inverse surface. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Link
            to="/dashboard/artists"
            className="group rounded-card bg-surface-inverse p-8 text-content-inverse transition-opacity hover:opacity-95 md:col-span-7"
          >
            <Users className="mb-4 h-6 w-6 text-gold" aria-hidden="true" />
            <h3 className="font-serif text-2xl">{t('Parcourir les artistes')}</h3>
            <p className="mt-2 max-w-[42ch] text-sm text-content-inverse/75">
              {t('Découvrez les artistes pour vos toits-terrasses et vos espaces intimistes.')}
            </p>
            <span className="btn-arrow mt-6 inline-flex text-[0.9375rem] font-semibold uppercase tracking-[0.04em] text-gold">
              {t('Trouver un artiste')}
            </span>
          </Link>

          <Link
            to="/dashboard/bookings"
            className="panel-interactive group p-8 md:col-span-5"
          >
            <CreditCard className="mb-4 h-6 w-6 text-gold" aria-hidden="true" />
            <h3 className="font-serif text-2xl text-content">{t('Gérer les réservations')}</h3>
            <p className="mt-2 text-sm text-content-secondary">
              {t('Consultez vos réservations d’artistes et leur statut.')}
            </p>
            <span className="btn-arrow mt-6 inline-flex text-[0.9375rem] font-semibold uppercase tracking-[0.04em] text-content">
              {t('Voir les réservations')}
            </span>
          </Link>
        </div>

        <ContactSupport
          userRole={user?.role || 'HOTEL'}
          userName={user?.name || ''}
          userEmail={user?.email || ''}
        />
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title={t('Supprimer le profil de l’hôtel ?')}
        body={
          <>
            <p>
              <strong>{user?.name}</strong> sera retiré du programme. Ses espaces, ses
              photos et son historique de réservations seront supprimés.
            </p>
            <p>{t('Cette action est définitive.')}</p>
          </>
        }
        confirmLabel={t('Supprimer définitivement')}
        onConfirm={handleDeleteProfile}
        onCancel={() => setConfirmingDelete(false)}
        busy={deleting}
      />
    </div>
  )
}

export default HotelDashboard
