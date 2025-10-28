import React, { useState, useEffect } from 'react'
import { adminApi } from '@/utils/api'
import { User, CheckCircle, XCircle, Search, Filter, Download, Calendar } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

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
      alert(err.response?.data?.message || 'Failed to suspend user')
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
      alert(err.response?.data?.message || 'Failed to activate user')
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
    } catch (err: any) {
      alert('Failed to export users')
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      ARTIST: 'bg-purple-100 text-purple-800',
      HOTEL: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-red-100 text-red-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
        User Management
      </h1>
          <p className="text-gray-600">
            Manage users, verify accounts, and handle support requests.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card-luxury">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="ARTIST">Artists</option>
              <option value="HOTEL">Hotels</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-gold" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-navy">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'ARTIST' && user.artist && (
                      <div className="text-sm">
                        <div className="text-navy font-medium">{user.artist.discipline}</div>
                        {user.artist.membershipStatus === 'ACTIVE' && (
                          <div className="text-green-600 text-xs flex items-center mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active Member
                          </div>
                        )}
                      </div>
                    )}
                    {user.role === 'HOTEL' && user.hotel && (
                      <div className="text-sm">
                        <div className="text-navy font-medium">{user.hotel.name}</div>
                        <div className="text-gray-600 text-xs mt-1">
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
                      <div className="text-sm text-gray-500">
                        {user.country || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.role !== 'ADMIN' && (
                      <div className="flex justify-end space-x-2">
                        {user.isActive ? (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            disabled={processing === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processing === user.id ? 'Processing...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            disabled={processing === user.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processing === user.id ? 'Processing...' : 'Activate'}
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
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
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
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers







