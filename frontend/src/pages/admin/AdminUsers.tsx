import React, { useState, useEffect, useRef } from 'react'
import { adminApi } from '@/utils/api'
import { User, Search, Filter, UserPlus, X } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'
import toast from 'react-hot-toast'
import { formatShortDate } from '@/utils/i18n'
import ExportButtons from '@/components/ExportButtons'
import { useAuthStore } from '@/store/authStore'

// The server sends its reason as error.message; reading data.message showed
// the generic fallback every time.
const errorMessage = (err: any, fallback: string) => err?.response?.data?.error?.message || fallback

interface UserData {
  id: string
  name: string
  email: string
  role: 'ARTIST' | 'HOTEL' | 'ADMIN'
  country?: string
  language: string
  isActive: boolean
  approvalStatus?: 'INCOMPLETE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  artist?: {
    discipline: string
    membershipStatus: string
  }
  hotel?: {
    name: string
    city?: string
    country?: string
  }
}

/**
 * A login of its own for an address - support@, billing@ - with the password
 * it will sign in with. An address that was blocked is reopened the same way.
 */
function AddAdminDialog({ email: initialEmail, onClose, onAdded }: { email: string; onClose: () => void; onAdded: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const res = await adminApi.addAdmin({ email, password })
      toast.success(t('{email} peut maintenant se connecter au panneau admin.', { email: res.data.data.email }))
      onAdded()
    } catch (err: any) {
      setFieldErrors(err?.response?.data?.error?.fields ?? {})
      toast.error(errorMessage(err, t('Impossible d’ajouter cet administrateur')))
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (name: string) =>
    fieldErrors[name] ? <p className="mt-1 text-xs font-medium text-[var(--state-critical)]">{fieldErrors[name]}</p> : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,31,63,0.55)] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-admin-title"
        onSubmit={submit}
        className="max-h-[100dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-card border border-line bg-surface-raised p-5 shadow-2xl sm:rounded-card"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="add-admin-title" className="text-lg font-semibold text-content">
            {t('Ajouter un administrateur')}
          </h2>
          <button type="button" onClick={onClose} className="text-content-secondary hover:text-content" aria-label={t('Fermer')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <label className="block">
          <span className="form-label">{t('E-mail')}</span>
          <input
            ref={firstRef}
            type="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="form-input"
            placeholder="support@travelarts.live"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            required
          />
          {fieldError('email')}
        </label>

        <div>
          <label htmlFor="add-admin-password" className="form-label">
            {t('Mot de passe')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="add-admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="form-input min-w-0 flex-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
              required
              aria-describedby="add-admin-password-hint"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="shrink-0 text-sm text-content underline-offset-4 hover:underline"
              aria-pressed={showPassword}
            >
              {showPassword ? t('Masquer') : t('Afficher')}
            </button>
          </div>
          <p id="add-admin-password-hint" className="mt-1 text-xs text-content-secondary">
            {t('8 caractères au moins, avec une minuscule, une majuscule, un chiffre et un caractère spécial.')}
          </p>
          {fieldError('password')}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
            {t('Annuler')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('En cours…') : t('Créer l’accès')}
          </button>
        </div>
      </form>
    </div>
  )
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Which row is busy, and with what: a row now has more than one action, and
  // only the one clicked should read "En cours…".
  const [processing, setProcessing] = useState<{ id: string; action: string } | null>(null)
  const working = (id: string, action: string) => processing?.id === id && processing.action === action
  const { user: me } = useAuthStore()
  // The address the "Ajouter un administrateur" dialog opens with; null while it is closed.
  const [adding, setAdding] = useState<string | null>(null)

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
      setError(errorMessage(err, t('Impossible de charger les utilisateurs')))
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
    // The backend stores this and shows it to the user the next time they try
    // to sign in, so it's worth asking for rather than sending the same
    // placeholder string every time.
    const reason = prompt('Pourquoi suspendre ce compte ? (visible par l’utilisateur)')
    if (reason === null) return
    if (reason.trim().length < 5) {
      toast.error('Le motif doit contenir au moins 5 caractères.')
      return
    }

    try {
      setProcessing({ id: userId, action: 'suspend' })
      await adminApi.suspendUser(userId, { reason: reason.trim() })
      fetchUsers()
    } catch (err: any) {
      toast.error(errorMessage(err, 'Impossible de suspendre cet utilisateur'))
    } finally {
      setProcessing(null)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      setProcessing({ id: userId, action: 'activate' })
      await adminApi.activateUser(userId)
      fetchUsers()
    } catch (err: any) {
      toast.error(errorMessage(err, t('Impossible de réactiver cet utilisateur')))
    } finally {
      setProcessing(null)
    }
  }

  // The question names the person: access to everything, the inbox included,
  // is not something to grant by habit.
  const handleGrantAdmin = async (target: UserData) => {
    if (!window.confirm(t('Donner à {name} un accès administrateur ? Cette personne pourra tout voir et tout modifier, y compris la messagerie.', { name: target.name }))) return

    try {
      setProcessing({ id: target.id, action: 'grant' })
      await adminApi.grantAdmin(target.id)
      toast.success(t('{name} a maintenant un accès administrateur. Cette personne doit se reconnecter.', { name: target.name }))
      fetchUsers()
    } catch (err: any) {
      toast.error(errorMessage(err, t('Impossible de changer le rôle de ce compte')))
    } finally {
      setProcessing(null)
    }
  }

  const handleRevokeAdmin = async (target: UserData) => {
    if (!window.confirm(t('Retirer l’accès administrateur de {name} ? Cette personne sera déconnectée et n’aura plus accès à ce panneau.', { name: target.name }))) return

    try {
      setProcessing({ id: target.id, action: 'revoke' })
      await adminApi.revokeAdmin(target.id)
      toast.success(t('{name} n’a plus d’accès administrateur.', { name: target.name }))
      fetchUsers()
    } catch (err: any) {
      toast.error(errorMessage(err, t('Impossible de changer le rôle de ce compte')))
    } finally {
      setProcessing(null)
    }
  }

  const handleBlockAdmin = async (target: UserData) => {
    if (!window.confirm(t('Bloquer {email} ? Plus personne ne pourra se connecter avec cette adresse. Pour la rouvrir, il faudra lui donner un nouveau mot de passe.', { email: target.email }))) return

    try {
      setProcessing({ id: target.id, action: 'block' })
      await adminApi.blockAdmin(target.id)
      toast.success(t('{email} est bloqué.', { email: target.email }))
      fetchUsers()
    } catch (err: any) {
      toast.error(errorMessage(err, t('Impossible de bloquer cet accès')))
    } finally {
      setProcessing(null)
    }
  }

  /* A role is not a status. Painting ADMIN in the critical red reserved for
     failures said an administrator account was a problem; all three roles are
     now the neutral chip, and the label carries the distinction. */
  const roleLabel = (role: string) => {
    switch (role) {
      case 'ARTIST':
        return t('Artiste')
      case 'HOTEL':
        return t('Hôtel')
      case 'ADMIN':
        return t('Administrateur')
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
      <SEOHead title={t('Utilisateurs') + ' — Travel Art'} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
        {t('Gestion des utilisateurs')}
      </h1>
          <p className="text-content-secondary">
            {t('Gérer les utilisateurs, vérifier les comptes et traiter les demandes d’assistance.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setAdding('')} className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t('Ajouter un administrateur')}
          </button>
          <ExportButtons type="users" />
        </div>
      </div>

      {adding !== null && (
        <AddAdminDialog
          email={adding}
          onClose={() => setAdding(null)}
          onAdded={() => {
            setAdding(null)
            fetchUsers()
          }}
        />
      )}

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
              <option value="ARTIST">{t('Artistes')}</option>
              <option value="HOTEL">{t('Hôtels')}</option>
              <option value="ADMIN">{t('Administrateurs')}</option>
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
                <th scope="col">{t('Utilisateur')}</th>
                <th scope="col">{t('Rôle')}</th>
                <th scope="col">{t('Détails')}</th>
                <th scope="col">{t('Statut')}</th>
                <th scope="col">{t('Inscription')}</th>
                <th scope="col" className="numeric">{t('Actions')}</th>
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
                          {[user.hotel.city, user.hotel.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    )}
                    {user.role === 'ADMIN' && (
                      <div className="text-content-secondary">{user.country || '—'}</div>
                    )}
                  </td>
                  <td>
                    {/* Not suspended is not the same as admitted: an application
                        still waiting showed "Actif" while its owner could not sign in. */}
                    <StatusBadge
                      status={
                        !user.isActive
                          ? 'SUSPENDED'
                          : user.role !== 'ADMIN' && user.approvalStatus && user.approvalStatus !== 'APPROVED'
                            ? user.approvalStatus
                            : 'ACTIVE'
                      }
                    />
                  </td>
                  <td className="text-content-secondary">
                    {formatShortDate(user.createdAt)}
                  </td>
                  <td className="numeric">
                    <div className="flex justify-end gap-4">
                      {/* Not for a suspended account: it is reactivated first. */}
                      {user.role !== 'ADMIN' && user.isActive && (
                        <button
                          onClick={() => handleGrantAdmin(user)}
                          disabled={processing?.id === user.id}
                          className="text-content underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {working(user.id, 'grant') ? t('En cours…') : t('Rendre admin')}
                        </button>
                      )}
                      {user.role !== 'ADMIN' && (user.isActive ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          disabled={processing?.id === user.id}
                          className="text-[var(--state-critical)] underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {working(user.id, 'suspend') ? t('En cours…') : t('Suspendre')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          disabled={processing?.id === user.id}
                          className="text-[var(--state-positive)] underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {working(user.id, 'activate') ? t('En cours…') : t('Réactiver')}
                        </button>
                      ))}
                      {/* Never on your own row, so the platform always keeps an administrator. */}
                      {user.role === 'ADMIN' && user.id !== me?.id && (user.isActive ? (
                        <>
                          <button
                            onClick={() => handleRevokeAdmin(user)}
                            disabled={processing?.id === user.id}
                            className="text-content underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            {working(user.id, 'revoke') ? t('En cours…') : t('Retirer l’accès admin')}
                          </button>
                          <button
                            onClick={() => handleBlockAdmin(user)}
                            disabled={processing?.id === user.id}
                            className="text-[var(--state-critical)] underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            {working(user.id, 'block') ? t('En cours…') : t('Bloquer')}
                          </button>
                        </>
                      ) : (
                        // Blocked: its password is one nobody knows, so it opens again only with a new one.
                        <button
                          onClick={() => setAdding(user.email)}
                          disabled={processing?.id === user.id}
                          className="text-[var(--state-positive)] underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          {t('Rouvrir')}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="empty-state">
            <User className="h-6 w-6 text-content-secondary" aria-hidden="true" />
            <p className="empty-state__title">{t('Aucun utilisateur')}</p>
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
            {t('Page {current} sur {total}', { current: currentPage, total: totalPages })}
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







