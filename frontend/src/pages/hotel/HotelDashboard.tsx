import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Users, CreditCard, MapPin, Music, Heart } from 'lucide-react'
import { hotelsApi, bookingsApi, artistsApi, apiClient } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ContactSupport from '@/components/ContactSupport'
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
            artist: b.artist?.name || 'Unknown Artist',
            discipline: b.artist?.discipline || '',
            date: new Date(b.startDate).toLocaleDateString('fr-FR'),
            time: new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            spot: b.performanceSpot || 'TBD',
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
    if (!hotelId) {
      toast.error('Aucun profil d’hôtel à supprimer')
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
    { label: 'Réservations en cours', value: stats.activeBookings.toString(), icon: Calendar, color: 'text-blue-600' },
    { label: 'Total dépensé', value: `€${stats.totalSpent.toFixed(0)}`, icon: CreditCard, color: 'text-green-600 dark:text-green-400' },
    { label: 'Artistes réservés', value: stats.artistsBooked.toString(), icon: Users, color: 'text-purple-600' },
    { label: 'Espaces de représentation', value: stats.performanceSpots.toString(), icon: MapPin, color: 'text-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-surface" data-testid="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-content mb-2 tracking-tight">
                  Welcome back, <span className="text-gold">{user?.name?.split(' ')[0]}</span>!
                </h1>
                <p className="text-lg text-content-secondary font-medium">
                  Gérez les résidences d’artistes et la programmation de votre établissement.
                </p>
              </div>
            </div>
            {hotelId && (
              <button 
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-card shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDeleteProfile}
              >
                Supprimer le profil
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon
            const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; accent: string }> = {
              'text-blue-600': {
                bg: 'from-blue-500/15 to-transparent',
                iconBg: 'from-blue-500 to-blue-600',
                iconColor: 'text-content',
                accent: 'bg-blue-500'
              },
              'text-green-600 dark:text-green-400': {
                bg: 'from-emerald-500/15 to-transparent',
                iconBg: 'from-emerald-500 to-emerald-600',
                iconColor: 'text-content',
                accent: 'bg-emerald-500'
              },
              'text-purple-600': {
                bg: 'from-purple-500/15 to-transparent',
                iconBg: 'from-purple-500 to-purple-600',
                iconColor: 'text-content',
                accent: 'bg-purple-500'
              },
              'text-orange-600': {
                bg: 'from-orange-500/15 to-transparent',
                iconBg: 'from-orange-500 to-orange-600',
                iconColor: 'text-content',
                accent: 'bg-orange-500'
              }
            }
            const colors = colorMap[stat.color] || colorMap['text-blue-600']
            
            return (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-card bg-gradient-to-br ${colors.bg} border border-line/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-500 hover:-translate-y-2 ${index === 0 ? 'fade-in-up-delay-0' : index === 1 ? 'fade-in-up-delay-1' : index === 2 ? 'fade-in-up-delay-2' : 'fade-in-up-delay-3'}`}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} opacity-80`}></div>
                
                {/* Decorative gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-sunken to-surface-sunken group-hover:from-surface-sunken group-hover:to-transparent transition-all duration-500 pointer-events-none"></div>
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">{stat.label}</p>
                      <p className="text-4xl font-bold text-content count-up leading-none mb-1">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-card bg-gradient-to-br ${colors.iconBg} shadow-lg shadow-gray-400/20 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${colors.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Subtle progress indicator */}
                  <div className="mt-4 h-1 bg-surface-sunken rounded-full overflow-hidden">
                    <div className={`h-full ${colors.accent} rounded-full transition-all duration-1000`} style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Upcoming Performances - Enhanced */}
        <div className="bg-surface-raised/80 backdrop-blur-sm rounded-card border border-line/60 shadow-xl shadow-gray-200/30 p-8 fade-in-up-delay-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
              <h2 className="text-2xl font-serif font-bold text-content">
                Prochaines représentations
              </h2>
            </div>
            <Link 
              to="/dashboard/bookings" 
              className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1 group"
            >
              Tout voir <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          {upcomingPerformances.length > 0 ? (
            <div className="space-y-4">
              {upcomingPerformances.map((performance, idx) => (
                <div 
                  key={performance.id} 
                  className="group relative overflow-hidden flex items-center justify-between p-6 bg-surface-sunken rounded-card border border-line/60 hover:border-gold/40 hover:shadow-lg transition-all duration-300 fade-in-up backdrop-blur-sm"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:via-gold/0 group-hover:to-gold/5 transition-all duration-300"></div>
                  
                  <div className="relative flex items-center gap-5 flex-1">
                    <div className="w-14 h-14 rounded-card bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform duration-300">
                      <Music className="w-7 h-7 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-content text-lg mb-1.5 truncate">{performance.artist}</h3>
                      <div className="flex items-center gap-2 text-sm text-content-secondary mb-1.5">
                        <span className="font-medium">{performance.discipline}</span>
                        <span className="text-content-secondary">•</span>
                        <span className="font-medium">{performance.spot}</span>
                      </div>
                      <p className="text-xs text-content-secondary font-medium">{performance.date} at {performance.time}</p>
                    </div>
                  </div>
                  
                  <span className={`relative px-5 py-2.5 rounded-card text-sm font-bold shadow-md transition-all duration-300 ${
                    performance.status === 'confirmed' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-content hover:shadow-green-500/30' :
                    'bg-gradient-to-r from-amber-500 to-orange-500 text-content hover:shadow-amber-500/30'
                  }`}>
                    {performance.status.charAt(0).toUpperCase() + performance.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-surface-sunken to-surface-sunken flex items-center justify-center">
                <Music className="w-10 h-10 text-content-secondary" />
              </div>
              <p className="text-content-secondary text-lg font-medium mb-2">Aucune représentation à venir</p>
              <p className="text-content-secondary text-sm">Invitez des artistes pour voir votre programmation ici.</p>
            </div>
          )}
        </div>

        {/* Performance Spots - Enhanced */}
        <div className="bg-surface-raised/80 backdrop-blur-sm rounded-card border border-line/60 shadow-xl shadow-gray-200/30 p-8 fade-in-up-delay-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
            <h2 className="text-2xl font-serif font-bold text-content">
              Vos espaces de représentation
            </h2>
          </div>
          
          {performanceSpots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {performanceSpots.map((spot, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden bg-surface-raised rounded-card border border-line/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 fade-in-up"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  {spot.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img decoding="async" loading="lazy" 
                        src={spot.image} 
                        alt={spot.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                      <div className="absolute top-3 right-3 px-3 py-1 bg-gold/90 backdrop-blur-sm text-navy rounded-card text-xs font-bold">
                        {spot.type || 'Spot'}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-content text-xl mb-3">{spot.name}</h3>
                    <p className="text-sm text-content-secondary mb-4 leading-relaxed line-clamp-2">{spot.description || 'No description available'}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-line">
                      <div>
                        <span className="text-xs text-content-secondary font-medium">Capacité</span>
                        <p className="text-lg font-bold text-content">{spot.capacity || 'N/A'}</p>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 rounded-card">
                        <span className="text-gold font-bold text-sm">{spot.type || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-surface-sunken to-surface-sunken flex items-center justify-center">
                <MapPin className="w-10 h-10 text-content-secondary" />
              </div>
              <p className="text-content-secondary text-lg font-medium mb-2">Aucun espace de représentation configuré</p>
              <p className="text-content-secondary text-sm">Complétez le profil de votre hôtel pour ajouter des espaces.</p>
            </div>
          )}
        </div>

        {/* Favorite Artists - Enhanced */}
        {favoriteArtists.length > 0 && (
          <div className="bg-surface-raised/80 backdrop-blur-sm rounded-card border border-line/60 shadow-xl shadow-gray-200/30 p-8 fade-in-up-delay-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
                <h2 className="text-2xl font-serif font-bold text-content">
                  Vos artistes favoris
                </h2>
              </div>
              <Link 
                to="/dashboard/artists" 
                className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1 group"
              >
                Tout voir <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {favoriteArtists.map((artist: any, idx) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="group relative overflow-hidden bg-surface-sunken rounded-card p-5 border border-line/60 hover:shadow-xl hover:border-gold/40 transition-all duration-300 hover:-translate-y-2 fade-in-up"
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-gold/0 transition-all duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-content text-sm truncate">{artist.user?.name || artist.name || 'Artist'}</h3>
                    </div>
                    <p className="text-xs text-content-secondary mb-3 font-medium">{artist.discipline || 'Performer'}</p>
                    {artist.averageRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-gold font-bold text-sm">◆</span>
                        <p className="text-sm text-gold font-bold">{artist.averageRating.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            to="/dashboard/artists" 
            className="group relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-navy rounded-card border border-gold/20 shadow-2xl shadow-navy/20 hover:shadow-gold/10 transition-all duration-500 hover:-translate-y-1 fade-in-up-delay-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/10 group-hover:via-gold/5 group-hover:to-gold/10 transition-all duration-500"></div>
            <div className="relative p-8">
              <div className="w-14 h-14 mb-5 rounded-card bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Users className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-content mb-3 group-hover:text-gold transition-colors">
                Parcourir les artistes
              </h3>
              <p className="text-content-secondary mb-6 leading-relaxed text-base">
                Découvrez les artistes pour vos toits-terrasses et vos espaces intimistes.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-navy font-bold rounded-card hover:bg-gold/90 transition-all duration-300 group-hover:gap-3">
                Find Artists <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link 
            to="/dashboard/bookings" 
            className="group relative overflow-hidden bg-surface-raised rounded-card border-2 border-gold/30 shadow-xl shadow-gray-200/30 hover:shadow-gold/20 transition-all duration-500 hover:-translate-y-1 fade-in-up-delay-3"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:via-gold/0 group-hover:to-gold/5 transition-all duration-500"></div>
            <div className="relative p-8">
              <div className="w-14 h-14 mb-5 rounded-card bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <CreditCard className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-content mb-3 group-hover:text-gold transition-colors">
                Gérer les réservations
              </h3>
              <p className="text-content-secondary mb-6 leading-relaxed text-base">
                Consultez et gérez vos réservations d’artistes et leur statut.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-card hover:bg-navy/90 transition-all duration-300 group-hover:gap-3">
                Voir les réservations <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="fade-in-up-delay-3">
          <ContactSupport
            userRole={user?.role || 'HOTEL'}
            userName={user?.name || ''}
            userEmail={user?.email || ''}
          />
        </div>
      </div>
    </div>
  )
}

export default HotelDashboard
