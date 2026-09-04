import React, { useEffect, useState } from 'react'
import { adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { Users, Download, Search, Filter } from 'lucide-react'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

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
        setError(err?.response?.data?.message || 'Impossible de charger les parrainages')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [page, search, statusFilter])

  const exportToCSV = () => {
    if (referrals.length === 0) {
      alert('Aucun parrainage à exporter')
      return
    }
    
    const headers = ['ID', 'Referrer Name', 'Referrer Type', 'Referred Name', 'Status', 'Created At', 'Reward Earned']
    const rows = referrals.map(r => [
      r.id || '',
      r.referrerName || '',
      r.referrerType || '',
      r.referredName || '',
      r.status || '',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '',
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
      <div className="notice-critical">{error}</div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <SEOHead title={t('Parrainage') + ' — Travel Art'} />
      <div className="shell py-12 md:py-16">
        {/* Header */}
        <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
              <h1 className="page-head__title">
            {t('Suivi des parrainages')}
          </h1>
              <p className="text-sm text-content-secondary">
            {t('Suivre les performances du programme de parrainage et les récompenses')}
          </p>
        </div>
        <button
          onClick={exportToCSV}
              className="flex flex-wrap items-center gap-2 px-4 py-2 bg-surface-raised border border-line-strong rounded-card text-sm font-medium text-content-secondary hover:bg-surface transition-colors"
        >
          <Download className="w-4 h-4" />
              Exporter en CSV
        </button>
          </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden mb-8">
        {[
          { label: 'Parrainages', value: formatNumber(stats.totalReferrals) },
          { label: t('Terminés'), value: formatNumber(stats.completedReferrals) },
          { label: t('Récompenses'), value: `€${formatNumber(stats.totalRewards)}` },
          { label: 'Parrains actifs', value: formatNumber(stats.activeReferrers) }
        ].map((stat) => (
          <div key={stat.label} className="stat rounded-none border-0">
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{stat.value}</span>
          </div>
        ))}
      </div>

        {/* Filters */}
        <div className="bg-surface-raised rounded-card border border-line p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="text"
                placeholder={t('Rechercher par parrain ou par filleul…')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-line-strong rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--state-info)] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-content-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-line-strong rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--state-info)] focus:border-transparent"
              >
                <option value="">{t('Tous les statuts')}</option>
                <option value="COMPLETED">{t('Terminée')}</option>
                <option value="PENDING">En attente</option>
              </select>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
        <div className="panel">
          <div className="panel-head">
            <h2>Parrainages</h2>
          </div>
        {referrals.length > 0 ? (
            <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Parrain</th>
                  <th scope="col">Type</th>
                  <th scope="col">Filleul</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="numeric">{t('Récompense')}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>
                      <div className="font-medium text-content">{referral.referrerName}</div>
                      <div className="text-content-secondary">{referral.referrerEmail}</div>
                    </td>
                    <td>
                      <span className="badge-neutral">
                        {referral.referrerType === 'ARTIST' ? 'Artiste' : t('Hôtel')}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-content">{referral.referredName}</div>
                      <div className="text-content-secondary">{referral.referredEmail}</div>
                    </td>
                    <td>
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="text-content-secondary">
                      {new Date(referral.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="numeric font-medium">€{referral.rewardEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-line flex items-center justify-between">
                  <div className="text-sm text-content-secondary">
                    {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-line-strong rounded-card text-sm font-medium text-content-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('Précédent')}
                    </button>
                    <span className="text-sm text-content-secondary">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-3 py-1 border border-line-strong rounded-card text-sm font-medium text-content-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('Suivant')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="w-8 h-8 text-content-secondary mx-auto mb-2" />
              <p className="text-sm text-content-secondary">{t('Aucun parrainage enregistré pour l’instant.')}</p>
            </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default AdminReferrals

