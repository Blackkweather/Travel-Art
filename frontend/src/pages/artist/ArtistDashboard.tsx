import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Star, Users, CreditCard, Music } from 'lucide-react'
import { bookingsApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ContactSupport from '@/components/ContactSupport'

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
          .map((b: Booking) => ({
            id: b.id,
            hotel: b.hotel?.name || 'Unknown Hotel',
            location: b.hotel?.city || b.hotel?.country || 'Unknown',
            date: new Date(b.startDate).toLocaleDateString(),
            status: b.status.toLowerCase(),
            performanceSpot: b.performanceSpot || 'TBD'
          }))

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

  const statsData = [
    { label: 'Total Bookings', value: stats.totalBookings.toString(), icon: Calendar, color: 'text-blue-600' },
    { label: 'Hotels Worked With', value: stats.hotelsWorkedWith.toString(), icon: Users, color: 'text-green-600' },
    { label: 'Hotel Rating', value: stats.hotelRating > 0 ? stats.hotelRating.toFixed(1) : 'N/A', icon: Star, color: 'text-amber-600' },
    { label: 'Active Bookings', value: stats.activeBookings.toString(), icon: CreditCard, color: 'text-purple-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream/30 via-white to-cream/20" data-testid="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-12 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-2 tracking-tight">
                Welcome back, <span className="text-gold">{user?.name?.split(' ')[0]}</span>!
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Here's what's happening with your performances and bookings.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon
            const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; accent: string }> = {
              'text-blue-600': {
                bg: 'from-blue-50 via-blue-50/50 to-white',
                iconBg: 'from-blue-500 to-blue-600',
                iconColor: 'text-white',
                accent: 'bg-blue-500'
              },
              'text-green-600': {
                bg: 'from-emerald-50 via-emerald-50/50 to-white',
                iconBg: 'from-emerald-500 to-emerald-600',
                iconColor: 'text-white',
                accent: 'bg-emerald-500'
              },
              'text-amber-600': {
                bg: 'from-amber-50 via-amber-50/50 to-white',
                iconBg: 'from-amber-500 to-amber-600',
                iconColor: 'text-white',
                accent: 'bg-amber-500'
              },
              'text-purple-600': {
                bg: 'from-purple-50 via-purple-50/50 to-white',
                iconBg: 'from-purple-500 to-purple-600',
                iconColor: 'text-white',
                accent: 'bg-purple-500'
              }
            }
            const colors = colorMap[stat.color] || colorMap['text-blue-600']
            
            return (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} border border-gray-100/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-500 hover:-translate-y-2 ${index === 0 ? 'fade-in-up-delay-0' : index === 1 ? 'fade-in-up-delay-1' : index === 2 ? 'fade-in-up-delay-2' : 'fade-in-up-delay-3'}`}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} opacity-80`}></div>
                
                {/* Decorative gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/20 group-hover:to-transparent transition-all duration-500 pointer-events-none"></div>
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">{stat.label}</p>
                      <p className="text-4xl font-bold text-navy count-up leading-none mb-1">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${colors.iconBg} shadow-lg shadow-gray-400/20 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${colors.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Subtle progress indicator */}
                  <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.accent} rounded-full transition-all duration-1000`} style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Bookings - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/30 p-8 fade-in-up-delay-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-gold to-gold/60 rounded-full"></div>
              <h2 className="text-2xl font-serif font-bold text-navy">
                Recent Bookings
              </h2>
            </div>
            <Link 
              to="/dashboard/bookings" 
              className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1 group"
            >
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking, idx) => (
                <div 
                  key={booking.id} 
                  className="group relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 rounded-2xl border border-gray-200/60 hover:border-gold/40 hover:shadow-lg transition-all duration-300 fade-in-up backdrop-blur-sm"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:via-gold/0 group-hover:to-gold/5 transition-all duration-300"></div>
                  
                  <div className="relative flex items-center gap-5 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-7 h-7 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-navy text-lg mb-1.5 truncate">{booking.hotel?.name || 'Hotel'}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                        <span className="font-medium">{booking.hotel?.city && booking.hotel?.country ? `${booking.hotel.city}, ${booking.hotel.country}` : 'Location TBD'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">{booking.performanceSpot || 'TBD'}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <span className={`relative px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-300 ${
                    booking.status === 'confirmed' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/30' :
                    booking.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/30' :
                    'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-blue-500/30'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">No bookings yet</p>
              <p className="text-gray-400 text-sm">Start connecting with hotels to see your bookings here!</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            to="/dashboard/profile" 
            className="group relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-navy rounded-3xl border border-gold/20 shadow-2xl shadow-navy/20 hover:shadow-gold/10 transition-all duration-500 hover:-translate-y-1 fade-in-up-delay-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/10 group-hover:via-gold/5 group-hover:to-gold/10 transition-all duration-500"></div>
            <div className="relative p-8">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Calendar className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-3 group-hover:text-gold transition-colors">
                Update Availability
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-base">
                Keep your calendar updated so hotels can book you for their rooftop performances.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-navy font-bold rounded-xl hover:bg-gold/90 transition-all duration-300 group-hover:gap-3">
                Manage Calendar <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className="group relative overflow-hidden bg-gradient-to-br from-white via-cream/30 to-white rounded-3xl border-2 border-gold/30 shadow-xl shadow-gray-200/30 hover:shadow-gold/20 transition-all duration-500 hover:-translate-y-1 fade-in-up-delay-3"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:via-gold/0 group-hover:to-gold/5 transition-all duration-500"></div>
            <div className="relative p-8">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Star className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-3 group-hover:text-gold transition-colors">
                Performance Gallery
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-base">
                Showcase your rooftop performances and connect with more luxury hotels.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all duration-300 group-hover:gap-3">
                Upload Media <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="fade-in-up-delay-3">
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
