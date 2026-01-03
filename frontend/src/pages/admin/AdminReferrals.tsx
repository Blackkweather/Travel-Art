import React, { useEffect, useState } from 'react'
import { adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TrendingUp, Users, Gift, Download, Search, Filter } from 'lucide-react'

interface Referral {
  id: string
  referrerId: string
  referrerName: string
  referrerEmail: string
  referrerType: 'ARTIST' | 'HOTEL'
  referredId: string
  referredName: string
  referredEmail: string
  status: 'PENDING' | 'COMPLETED'
  createdAt: string
  rewardEarned: number
  inviteeMembershipStatus?: string | null
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  })

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: any = {
          page,
          limit: 50
        }
        if (search) params.search = search
        if (statusFilter) params.status = statusFilter

        const res = await adminApi.getReferrals(params)
        const data = res.data?.data || {}
        
        setReferrals(data.referrals || [])
        setStats(data.stats || {
          totalReferrals: 0,
          completedReferrals: 0,
          totalRewards: 0,
          activeReferrers: 0
        })
        setPagination(data.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          pages: 1
        })
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load referrals')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [page, search, statusFilter])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Referral Tracking
              </h1>
              <p className="text-sm text-gray-500">
                Monitor referral program performance and rewards
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Referrals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReferrals}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedReferrals}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-amber-50">
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Rewards</p>
              <p className="text-2xl font-semibold text-gray-900">€{stats.totalRewards.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Referrers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeReferrers}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by referrer or referred name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Referrals</h2>
          </div>
          {referrals.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{referral.referrerName}</div>
                          <div className="text-xs text-gray-500">{referral.referrerEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            referral.referrerType === 'ARTIST' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {referral.referrerType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{referral.referredName}</div>
                          <div className="text-xs text-gray-500">{referral.referredEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            referral.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          €{referral.rewardEarned}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No referrals tracked yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminReferrals

