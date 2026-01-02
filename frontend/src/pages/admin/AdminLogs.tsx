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
      toast.error('Failed to load activity logs')
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'BOOKING':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'TRANSACTION':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'RATING':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'ADMIN_ACTION':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleString()
  }

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
    toast.success('Activity logs exported')
  }

  const activityTypes: { value: ActivityType; label: string; count?: number }[] = [
    { value: 'ALL', label: 'All Activities', count: summary?.totalActivities },
    { value: 'USER_REGISTRATION', label: 'Registrations', count: summary?.byType?.USER_REGISTRATION },
    { value: 'BOOKING', label: 'Bookings', count: summary?.byType?.BOOKING },
    { value: 'TRANSACTION', label: 'Transactions', count: summary?.byType?.TRANSACTION },
    { value: 'RATING', label: 'Ratings', count: summary?.byType?.RATING },
    { value: 'ADMIN_ACTION', label: 'Admin Actions', count: summary?.byType?.ADMIN_ACTION }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            Activity Logs
          </h1>
          <p className="text-gray-600">
            Monitor all platform activities, user actions, and system events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchActivities}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-luxury">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-navy">Filters</h3>
        </div>
        
        {/* Activity Type Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy mb-2">Activity Type</label>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedType === type.value
                    ? 'bg-gold text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {type.label}
                {type.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedType === type.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-700'
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
          <label className="block text-sm font-medium text-navy mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, action, or details..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-navy">
            Activity Timeline
          </h2>
          <span className="text-sm text-gray-500">
            Showing {filteredActivities.length} of {activities.length} activities
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No activities found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || selectedType !== 'ALL' 
                ? 'Try adjusting your filters' 
                : 'Activity logs will appear here as users interact with the platform'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gold/30 hover:shadow-md transition-all"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getActivityColor(activity.type)} flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActivityColor(activity.type)}`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-navy">{activity.action}</span>
                      </div>
                      
                      {/* Actor */}
                      {activity.actor && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          {getRoleIcon(activity.actor.role)}
                          <span className="font-medium">{activity.actor.name}</span>
                          <span className="text-gray-400">({activity.actor.email})</span>
                          {activity.target && (
                            <>
                              <span className="text-gray-300">→</span>
                              {getRoleIcon(activity.target.role)}
                              <span className="font-medium">{activity.target.name || activity.target.email}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 text-xs">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="font-semibold text-gray-600">{key}:</span>
                                <span className="text-gray-700">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
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
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLogs

