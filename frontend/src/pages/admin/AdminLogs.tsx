import React, { useEffect, useState } from 'react'
import { 
  Activity, 
  UserPlus, 
  Calendar, 
  CreditCard, 
  Star, 
  Shield, 
  Filter, 
  Search,
  Download,
  RefreshCw,
  Clock,
  User,
  Building,
  Music
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { adminApi } from '@/utils/api'
import toast from 'react-hot-toast'
import { t } from '@/i18n'
import { formatNumber, formatRelative } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

type ActivityType = 'ALL' | 'USER_REGISTRATION' | 'BOOKING' | 'TRANSACTION' | 'RATING' | 'ADMIN_ACTION'

interface ActivityLog {
  id: string
  type: string
  action: string
  actor: {
    id: string
    name: string
    email: string
    role: string
  } | null
  target: {
    id: string
    name?: string
    email?: string
    role?: string
  } | null
  details: any
  timestamp: string
}

const AdminLogs: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [selectedType, setSelectedType] = useState<ActivityType>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchActivities()
  }, [page, selectedType])

  useEffect(() => {
    filterActivities()
  }, [activities, searchTerm, selectedType])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 50
      }
      if (selectedType !== 'ALL') {
        params.type = selectedType
      }

      const response = await adminApi.getAllActivities(params)
      const data = response.data?.data

      if (data) {
        setActivities(data.activities || [])
        setTotalPages(data.pagination?.pages || 1)
        setSummary(data.summary)
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error)
      toast.error(t('Impossible de charger le journal d’activité'))
    } finally {
      setLoading(false)
    }
  }

  const filterActivities = () => {
    let filtered = [...activities]

    // Filter by type
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(a => a.type === selectedType)
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(a => {
        const actorName = a.actor?.name?.toLowerCase() || ''
        const actorEmail = a.actor?.email?.toLowerCase() || ''
        const targetName = a.target?.name?.toLowerCase() || ''
        const action = a.action?.toLowerCase() || ''
        const details = JSON.stringify(a.details || {}).toLowerCase()
        
        return actorName.includes(searchLower) ||
               actorEmail.includes(searchLower) ||
               targetName.includes(searchLower) ||
               action.includes(searchLower) ||
               details.includes(searchLower)
      })
    }

    setFilteredActivities(filtered)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return <UserPlus className="w-5 h-5" />
      case 'BOOKING':
        return <Calendar className="w-5 h-5" />
      case 'TRANSACTION':
        return <CreditCard className="w-5 h-5" />
      case 'RATING':
        return <Star className="w-5 h-5" />
      case 'ADMIN_ACTION':
        return <Shield className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  /* An activity type is a category, not a state. The five types used to take
     the four status hues plus gold, which told the reader that a booking was
     good and an administrator action was an error. They are all neutral now -
     the icon and the label say which type it is. */
  const activityLabel = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'Inscription'
      case 'BOOKING':
        return t('Réservation')
      case 'TRANSACTION':
        return 'Transaction'
      case 'RATING':
        return 'Évaluation'
      case 'ADMIN_ACTION':
        return 'Action admin'
      default:
        return type.replace(/_/g, ' ').toLowerCase()
    }
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ARTIST':
        return <Music className="w-4 h-4" />
      case 'HOTEL':
        return <Building className="w-4 h-4" />
      case 'ADMIN':
        return <Shield className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  // Was "3h ago" - English abbreviations on a French-only site, and a second
  // copy of the admin dashboard's version of the same function.
  const formatTimestamp = formatRelative

  const exportLogs = () => {
    const csv = [
      ['Type', 'Action', 'Actor', 'Target', 'Details', 'Timestamp'].join(','),
      ...filteredActivities.map(a => [
        a.type,
        a.action,
        a.actor?.name || a.actor?.email || 'N/A',
        a.target?.name || a.target?.email || 'N/A',
        JSON.stringify(a.details).replace(/,/g, ';'),
        a.timestamp
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(t('Journal d’activité exporté'))
  }

  const activityTypes: { value: ActivityType; label: string; count?: number }[] = [
    { value: 'ALL', label: t('Toutes les activités'), count: summary?.totalActivities },
    { value: 'USER_REGISTRATION', label: 'Inscriptions', count: summary?.byType?.USER_REGISTRATION },
    { value: 'BOOKING', label: t('Réservations'), count: summary?.byType?.BOOKING },
    { value: 'TRANSACTION', label: 'Transactions', count: summary?.byType?.TRANSACTION },
    { value: 'RATING', label: 'Évaluations', count: summary?.byType?.RATING },
    { value: 'ADMIN_ACTION', label: t('Actions d’administration'), count: summary?.byType?.ADMIN_ACTION }
  ]

  return (
    <div className="space-y-6">
      <SEOHead title={t('Journal d’activité') + ' — Travel Art'} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
            {t('Journal d’activité')}
          </h1>
          <p className="text-content-secondary">
            {t('Suivre l’activité de la plateforme, les actions des utilisateurs et les événements système')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchActivities}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('Actualiser')}
          </button>
          <button
            onClick={exportLogs}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter en CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-content">Filtres</h3>
        </div>
        
        {/* Activity Type Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-content mb-2">{t('Type d’activité')}</label>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-card text-sm font-medium transition-all ${
                  selectedType === type.value
                    ? 'bg-gold text-off-black shadow-md'
                    : 'bg-surface-sunken text-content-secondary hover:bg-surface-warm border border-line'
                }`}
              >
                {type.label}
                {type.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedType === type.value
                      ? 'bg-surface-raised/20 text-content'
                      : 'bg-surface-sunken text-content-secondary'
                  }`}>
                    {type.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-content mb-2">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Rechercher par utilisateur, action ou détail…')}
              className="w-full pl-10 pr-4 py-3 border border-line rounded-card focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-content">
            {t('Chronologie d’activité')}
          </h2>
          <span className="text-sm text-content-secondary">
            {filteredActivities.length} sur {activities.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 text-content-secondary mx-auto mb-4" />
            <p className="text-content-secondary text-lg">{t('Aucune activité')}</p>
            <p className="text-content-secondary text-sm mt-2">
              {searchTerm || selectedType !== 'ALL' 
                ? t('Essayez d’élargir vos filtres') 
                : 'Activity logs will appear here as users interact with the platform'}
            </p>
          </div>
        ) : (
          <div>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 border-b border-line py-5 last:border-b-0"
              >
                {/* Icon */}
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-card border border-line bg-surface-raised text-content-secondary">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-neutral">{activityLabel(activity.type)}</span>
                        <span className="font-serif text-base text-content">{activity.action}</span>
                      </div>
                      
                      {/* Actor */}
                      {activity.actor && (
                        <div className="flex items-center gap-2 text-sm text-content-secondary mb-1">
                          {getRoleIcon(activity.actor.role)}
                          <span className="font-medium">{activity.actor.name}</span>
                          <span className="text-content-secondary">({activity.actor.email})</span>
                          {activity.target && (
                            <>
                              <span className="text-content-secondary">→</span>
                              {getRoleIcon(activity.target.role)}
                              <span className="font-medium">{activity.target.name || activity.target.email}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div className="mt-2 p-3 bg-surface-raised rounded-card border border-line text-xs">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="font-semibold text-content-secondary">{key}:</span>
                                <span className="text-content-secondary">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-content-secondary flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-line">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Précédent')}
            </button>
            <span className="text-sm text-content-secondary">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Suivant')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLogs

