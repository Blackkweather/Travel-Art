import React, { useState, useEffect } from 'react'
import { adminApi } from '@/utils/api'
import { User, Search, Filter, Download } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/i18n'

interface UserData {
  id: string
  name: string
  email: string
  role: 'ARTIST' | 'HOTEL' | 'ADMIN'
  country?: string
  language: string
  isActive: boolean
  createdAt: string
  artist?: {
    discipline: string
    membershipStatus: string
  }
  hotel?: {
    name: string
    location: string
  }
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page: currentPage,
        limit: 20
      }
      
      if (selectedRole !== 'all') {
        params.role = selectedRole
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await adminApi.getUsers(params)
      setUsers(response.data.data.users)
      setTotalPages(response.data.data.pagination.pages)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, selectedRole])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return
    
    try {
      setProcessing(userId)
      await adminApi.suspendUser(userId, { reason: 'Suspended by admin' })
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Impossible de suspendre cet utilisateur')
    } finally {
      setProcessing(null)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      setProcessing(userId)
      await adminApi.activateUser(userId)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Impossible de réactiver cet utilisateur')
    } finally {
      setProcessing(null)
    }
  }

  const handleExport = async () => {
    try {
      const response = await adminApi.exportData('users')
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'users.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      alert('Échec de l’export des utilisateurs')
    }
  }

  /* A role is not a status. Painting ADMIN in the critical red reserved for
     failures said an administrator account was a problem; all three roles are
     now the neutral chip, and the label carries the distinction. */
  const roleLabel = (role: string) => {
    switch (role) {
      case 'ARTIST':
        return 'Artiste'
      case 'HOTEL':
        return t('Hôtel')
      case 'ADMIN':
        return 'Administrateur'
      default:
        return role
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
    <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
        {t('Gestion des utilisateurs')}
      </h1>
          <p className="text-content-secondary">
            {t('Gérer les utilisateurs, vérifier les comptes et traiter les demandes d’assistance.')}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exporter en CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="search-container">
        <div className="filters-row">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="search-icon-container flex-1">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={t('Rechercher par nom ou par e-mail…')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">
              {t('Rechercher')}
            </button>
          </form>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-content-secondary flex-shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-select"
            >
              <option value="all">{t('Tous les rôles')}</option>
              <option value="ARTIST">Artistes</option>
              <option value="HOTEL">{t('Hôtels')}</option>
              <option value="ADMIN">Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="notice-critical">{error}</div>
      )}

      {/* Users Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Utilisateur</th>
                <th scope="col">{t('Rôle')}</th>
                <th scope="col">{t('Détails')}</th>
                <th scope="col">Statut</th>
                <th scope="col">Inscription</th>
                <th scope="col" className="numeric">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-medium text-content">{user.name}</div>
                    <div className="text-content-secondary">{user.email}</div>
                  </td>
                  <td>
                    <span className="badge-neutral">{roleLabel(user.role)}</span>
                  </td>
                  <td>
                    {user.role === 'ARTIST' && user.artist && (
                      <div className="text-sm">
                        <div className="text-content font-medium">{user.artist.discipline}</div>
                        {user.artist.membershipStatus === 'ACTIVE' && (
                          <div className="mt-1 text-[0.8125rem] text-[var(--state-positive)]">
                            {t('Adhésion active')}
                          </div>
                        )}
                      </div>
                    )}
                    {user.role === 'HOTEL' && user.hotel && (
                      <div className="text-sm">
                        <div className="text-content font-medium">{user.hotel.name}</div>
                        <div className="text-content-secondary text-xs mt-1">
                          {(() => {
                            try {
                              const loc = JSON.parse(user.hotel.location)
                              return `${loc.city}, ${loc.country}`
                            } catch {
                              return user.hotel.location
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {user.role === 'ADMIN' && (
                      <div className="text-content-secondary">{user.country || '—'}</div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={user.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                  <td className="text-content-secondary">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="numeric">
                    {user.role !== 'ADMIN' && (
                      <div className="flex justify-end space-x-2">
                        {user.isActive ? (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            disabled={processing === user.id}
                            className="text-[var(--state-critical)] underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            {processing === user.id ? 'En cours…' : 'Suspendre'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            disabled={processing === user.id}
                            className="text-[var(--state-positive)] underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            {processing === user.id ? 'En cours…' : t('Réactiver')}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="empty-state">
            <User className="h-6 w-6 text-content-secondary" aria-hidden="true" />
            <p className="empty-state__title">Aucun utilisateur</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="btn-secondary disabled:opacity-50"
          >
            {t('Précédent')}
          </button>
          <span className="text-content-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="btn-secondary disabled:opacity-50"
          >
            {t('Suivant')}
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers







