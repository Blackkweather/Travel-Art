import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Users, CreditCard, MapPin, Music, Heart } from 'lucide-react'
import { hotelsApi, bookingsApi, artistsApi, apiClient } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

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
    availableCredits: 0,
    artistsBooked: 0,
    performanceSpots: 0,
    totalCreditsUsed: 0
  })
  const [upcomingPerformances, setUpcomingPerformances] = useState<UpcomingPerformance[]>([])
  const [performanceSpots, setPerformanceSpots] = useState<PerformanceSpot[]>([])
  const [favoriteArtists, setFavoriteArtists] = useState<any[]>([])
  const [hotelId, setHotelId] = useState<string>('')

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
        const bookings = bookingsRes.data?.data || []
        
        // Get credits
        let credits = 0
        try {
          const creditsRes = await hotelsApi.getCredits(hotel.id)
          credits = creditsRes.data?.data?.availableCredits || 0
        } catch (e) {
          // Credits might not exist yet
        }

        // Calculate stats
        const activeBookings = bookings.filter((b: Booking) => 
          ['PENDING', 'CONFIRMED'].includes(b.status)
        ).length

        const totalCreditsUsed = 0 // Credits used would come from booking data if available

        const uniqueArtists = new Set(
          bookings.map((b: Booking) => b.artist?.name).filter(Boolean)
        )

        // Parse performance spots from hotel profile
        let spots: PerformanceSpot[] = []
        if (hotel.performanceSpots) {
          try {
            const spotsData = typeof hotel.performanceSpots === 'string' 
              ? JSON.parse(hotel.performanceSpots) 
              : hotel.performanceSpots
            spots = Array.isArray(spotsData) ? spotsData : []
          } catch (e) {
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
            artist: b.artist?.name || 'Unknown Artist',
            discipline: b.artist?.discipline || '',
            date: new Date(b.startDate).toLocaleDateString(),
            time: new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            spot: b.performanceSpot || 'TBD',
            status: b.status.toLowerCase()
          }))

        setStats({
          activeBookings,
          availableCredits: credits,
          artistsBooked: uniqueArtists.size,
          performanceSpots: spots.length,
          totalCreditsUsed
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
    if (!hotelId) {
      toast.error('No hotel profile to delete')
      return
    }
    const confirmed = window.confirm('Supprimer votre profil hôtel ?')
    if (!confirmed) return
    try {
      await apiClient.delete(`/hotels/${hotelId}`)
      toast.success('Profil hôtel supprimé')
      navigate('/')
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Échec de la suppression')
    }
  }

  const statsData = [
    { label: 'Active Bookings', value: stats.activeBookings.toString(), icon: Calendar, color: 'text-blue-600' },
    { label: 'Available Credits', value: stats.availableCredits.toString(), icon: CreditCard, color: 'text-green-600' },
    { label: 'Artists Booked', value: stats.artistsBooked.toString(), icon: Users, color: 'text-purple-600' },
    { label: 'Performance Spots', value: stats.performanceSpots.toString(), icon: MapPin, color: 'text-orange-600' }
  ]

  return (
    <div className="space-y-8" data-testid="dashboard">
      <div className="fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="dashboard-title mb-3 gold-underline">
              Welcome back, {user?.name}!
            </h1>
            <p className="dashboard-subtitle">
              Manage your hotel&apos;s artist bookings and rooftop performances.
            </p>
          </div>
          {hotelId && (
            <button className="btn-primary" onClick={handleDeleteProfile}>
              Supprimer le profil
            </button>
          )}
        </div>
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

      {/* Upcoming Performances */}
      <div className="card-luxury fade-in-up-delay-1">
        <h2 className="section-title gold-underline">
          Upcoming Performances
        </h2>
        {upcomingPerformances.length > 0 ? (
          <div className="space-y-3">
            {upcomingPerformances.map((performance, idx) => (
            <div 
              key={performance.id} 
              className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gold/30 transition-all duration-300 hover:shadow-md fade-in-up"
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold/80 rounded-xl flex items-center justify-center shadow-sm">
                  <Music className="w-7 h-7 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy text-lg mb-1">{performance.artist}</h3>
                  <p className="text-sm text-gray-600 font-medium mb-1">{performance.discipline}</p>
                  <p className="text-xs text-gray-500">{performance.spot} • {performance.date} at {performance.time}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                performance.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {performance.status}
              </span>
            </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12 text-base">No upcoming performances scheduled.</p>
        )}
      </div>

      {/* Performance Spots */}
      <div className="card-luxury fade-in-up-delay-2">
        <h2 className="section-title gold-underline">
          Your Performance Spots
        </h2>
        {performanceSpots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceSpots.map((spot, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-gold/30 fade-in-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                {spot.image && (
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={spot.image} 
                      alt={spot.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-navy text-lg mb-2">{spot.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{spot.description || 'No description available'}</p>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Capacity: <span className="font-semibold text-navy">{spot.capacity || 'N/A'}</span></span>
                    <span className="px-3 py-1 bg-gold/10 text-gold rounded-full text-xs font-semibold capitalize">{spot.type || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12 text-base">No performance spots configured yet. Update your hotel profile to add spots.</p>
        )}
      </div>

      {/* Favorite Artists */}
      {favoriteArtists.length > 0 && (
        <div className="card-luxury fade-in-up-delay-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title gold-underline">
              Your Favorite Artists
            </h2>
            <Link to="/dashboard/artists" className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1">
              View All <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {favoriteArtists.map((artist: any, idx) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-lg hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 fade-in-up"
                style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                  <h3 className="font-semibold text-navy text-sm truncate">{artist.user?.name || artist.name || 'Artist'}</h3>
                </div>
                <p className="text-xs text-gray-600 mb-2">{artist.discipline || 'Performer'}</p>
                {artist.averageRating && (
                  <p className="text-xs text-gold font-semibold">◆ {artist.averageRating.toFixed(1)}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury fade-in-up-delay-2 hover:border-gold/40">
          <h3 className="text-xl font-serif font-semibold text-navy mb-3">
            Browse Artists
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Discover talented artists for your rooftop performances and intimate venues.
          </p>
          <Link to="/dashboard/artists" className="btn-primary inline-flex items-center gap-2">
            Find Artists <span>→</span>
          </Link>
        </div>

        <div className="card-luxury fade-in-up-delay-3 hover:border-gold/40">
          <h3 className="text-xl font-serif font-semibold text-navy mb-3">
            Manage Credits
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Purchase credits to book artists for unforgettable rooftop experiences.
          </p>
          <Link to="/dashboard/credits" className="btn-secondary inline-flex items-center gap-2">
            Buy Credits <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HotelDashboard
