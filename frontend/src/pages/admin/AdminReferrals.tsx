import React, { useEffect, useState } from 'react'
import { adminApi, commonApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TrendingUp, Users, Gift, Download } from 'lucide-react'

interface Referral {
  id: string
  referrerId: string
  referrerName: string
  referrerType: 'ARTIST' | 'HOTEL'
  referredId: string
  referredName: string
  status: 'PENDING' | 'COMPLETED' | 'REWARDED'
  createdAt: string
  rewardEarned?: number
}

const AdminReferrals: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    totalRewards: 0,
    activeReferrers: 0
  })

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // In a real app, this would call adminApi.getReferrals()
        // For now, we'll simulate with commonApi
        const res = await commonApi.createReferral({}).catch(() => ({ data: { data: [] } }))
        const data = (res.data?.data as any) || []
        
        // Calculate stats
        const totalReferrals = data.length || 0
        const completedReferrals = data.filter((r: any) => r.status === 'COMPLETED' || r.status === 'REWARDED').length
        const totalRewards = data.reduce((sum: number, r: any) => sum + (r.rewardEarned || 0), 0)
        const uniqueReferrers = new Set(data.map((r: any) => r.referrerId).filter(Boolean))

        setStats({
          totalReferrals,
          completedReferrals,
          totalRewards,
          activeReferrers: uniqueReferrers.size
        })
        
        setReferrals(data.slice(0, 50)) // Limit for display
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load referrals')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [])

  const exportToCSV = () => {
    if (referrals.length === 0) {
      alert('No referrals to export')
      return
    }
    
    const headers = ['ID', 'Referrer Name', 'Referrer Type', 'Referred Name', 'Status', 'Created At', 'Reward Earned']
    const rows = referrals.map(r => [
      r.id || '',
      r.referrerName || '',
      r.referrerType || '',
      r.referredName || '',
      r.status || '',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
      r.rewardEarned || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `referrals-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            Referral Tracking
          </h1>
          <p className="text-gray-600">
            Monitor referral program performance and rewards
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 btn-secondary"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-navy">{stats.totalReferrals}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-navy">{stats.completedReferrals}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rewards</p>
              <p className="text-2xl font-bold text-navy">€{stats.totalRewards.toLocaleString()}</p>
            </div>
            <Gift className="w-8 h-8 text-gold" />
          </div>
        </div>
        <div className="card-luxury">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Referrers</p>
              <p className="text-2xl font-bold text-navy">{stats.activeReferrers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Recent Referrals
        </h2>
        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Referrer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Referred</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-navy">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{referral.referrerName}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.referrerType === 'ARTIST' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {referral.referrerType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{referral.referredName}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'COMPLETED' || referral.status === 'REWARDED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gold">
                      {referral.rewardEarned ? `€${referral.rewardEarned}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No referrals tracked yet.</p>
        )}
      </div>
    </div>
  )
}

export default AdminReferrals

