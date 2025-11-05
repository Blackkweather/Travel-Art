import React, { useEffect, useState } from 'react'
import { adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TrendingUp, Users, Building, Calendar, Euro } from 'lucide-react'

type DashboardStats = {
  totalUsers: number
  totalArtists: number
  totalHotels: number
  totalBookings: number
  totalRevenue?: number
}

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminApi.getDashboard()
        const data = (res.data?.data as any) || {}
        setStats({
          totalUsers: Number(data?.stats?.totalUsers ?? data?.totalUsers ?? 0),
          totalArtists: Number(data?.stats?.totalArtists ?? data?.totalArtists ?? 0),
          totalHotels: Number(data?.stats?.totalHotels ?? data?.totalHotels ?? 0),
          totalBookings: Number(data?.stats?.activeBookings ?? data?.totalBookings ?? 0),
          totalRevenue: Number(data?.stats?.totalRevenue?._sum?.amount ?? data?.totalRevenue ?? 0)
        })
      } catch (e: any) {
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
        <p className="text-gray-600">Key metrics aggregated from the platform.</p>
      </div>

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

      {/* Placeholder charts (can be replaced by real charts later) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-luxury h-64 flex items-center justify-center text-gray-400">
          Chart: Bookings per month (coming soon)
        </div>
        <div className="card-luxury h-64 flex items-center justify-center text-gray-400">
          Chart: Revenue per month (coming soon)
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics


