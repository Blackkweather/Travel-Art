import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/i18n'

interface Application {
  id: string
  name: string
  email: string
  role: 'ARTIST' | 'HOTEL'
  country?: string | null
  phone?: string | null
  createdAt: string
  emailVerified: boolean
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvalNote?: string | null
  reviewedAt?: string | null
  artist?: { discipline?: string | null; bio?: string | null; priceRange?: string | null } | null
  hotel?: { name?: string | null; location?: string | null; description?: string | null } | null
}

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'PENDING', label: 'À examiner' },
  { key: 'APPROVED', label: 'Admises' },
  { key: 'REJECTED', label: t('Refusées') },
]

/**
 * Admissions: the queue an administrator works through to admit or decline new
 * accounts.
 *
 * Ordered oldest-first by the API, which matters more than it sounds: newest
 * first buries anyone who applied during a busy week under everyone who applied
 * after them, and they are precisely the people who have waited longest.
 */
const AdminAdmissions: React.FC = () => {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [applications, setApplications] = useState<Application[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Application | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async (status: Tab) => {
    try {
      setLoading(true)
      const res = await apiClient.get(`/admin/admissions?status=${status}`)
      setApplications(res.data?.data?.applications ?? [])
      setPendingCount(res.data?.data?.pendingCount ?? 0)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Chargement impossible')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab, load])

  const approve = async (app: Application) => {
    try {
      setBusyId(app.id)
      await apiClient.post(`/admin/admissions/${app.id}/approve`, {})
      toast.success(`${app.name} a été admis`)
      setApplications((prev) => prev.filter((a) => a.id !== app.id))
      setPendingCount((n) => Math.max(0, n - 1))
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Échec de l’admission')
    } finally {
      setBusyId(null)
    }
  }

  const reject = async () => {
    if (!rejecting) return
    try {
      setBusyId(rejecting.id)
      await apiClient.post(`/admin/admissions/${rejecting.id}/reject`, {
        reason: reason.trim(),
      })
      toast.success(`Demande de ${rejecting.name} refusée`)
      setApplications((prev) => prev.filter((a) => a.id !== rejecting.id))
      setPendingCount((n) => Math.max(0, n - 1))
      setRejecting(null)
      setReason('')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Échec du refus')
    } finally {
      setBusyId(null)
    }
  }

  const detail = (app: Application) => {
    if (app.role === 'ARTIST') return app.artist?.discipline || 'Discipline non renseignée'
    let where = ''
    try {
      const loc = app.hotel?.location ? JSON.parse(app.hotel.location) : null
      where = loc ? [loc.city, loc.country].filter(Boolean).join(', ') : ''
    } catch {
      where = app.hotel?.location ?? ''
    }
    return [app.hotel?.name, where].filter(Boolean).join(' — ') || 'Établissement non renseigné'
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Not `.shell`: that centres a 1280px measure, which inside the
          sidebar layout pushed the decision column off the panel. */}
      <div className="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-16">
        <header className="page-head">
          <span className="eyebrow">Administration</span>
          <h1 className="page-head__title">Admissions</h1>
          <p className="page-head__lede">
            {t('Chaque nouvelle inscription attend ici jusqu’à ce qu’elle soit admise ou refusée. Les demandes les plus anciennes apparaissent en premier.')}
          </p>
          <span className="rule-reveal mt-2" />
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-control border px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-line-strong bg-surface-inverse text-content-inverse'
                  : 'border-line text-content-secondary hover:border-line-strong'
              }`}
            >
              {t.label}
              {t.key === 'PENDING' && pendingCount > 0 && (
                <span className="ml-2 tabular-nums">({pendingCount})</span>
              )}
            </button>
          ))}
        </div>

        <section className="panel">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">
                {tab === 'PENDING' ? 'Aucune demande en attente' : 'Aucune demande'}
              </p>
              <p className="empty-state__body">
                {tab === 'PENDING'
                  ? t('Les nouvelles inscriptions apparaîtront ici dès qu’elles seront déposées.')
                  : t('Rien à afficher pour ce filtre.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Candidat</th>
                    <th scope="col">Type</th>
                    <th scope="col">{t('Détails')}</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">{t('Déposée le')}</th>
                    {tab === 'PENDING' && (
                      <th scope="col" className="numeric">
                        {t('Décision')}
                      </th>
                    )}
                    {tab === 'REJECTED' && <th scope="col">Motif</th>}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="font-medium text-content">{app.name}</div>
                        <div className="text-content-secondary">{app.email}</div>
                      </td>
                      <td>
                        <span className="badge-neutral">
                          {app.role === 'ARTIST' ? 'Artiste' : t('Hôtel')}
                        </span>
                      </td>
                      <td className="max-w-[15rem] truncate text-content-secondary" title={detail(app)}>
                        {detail(app)}
                      </td>
                      <td>
                        {/* Whether the applicant proved they own the address is
                            the single most useful signal on this row, so it is
                            a column rather than something to go looking for. */}
                        <StatusBadge status={app.emailVerified ? 'VERIFIED' : 'PENDING'} />
                      </td>
                      <td className="whitespace-nowrap text-content-secondary">
                        {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      {tab === 'PENDING' && (
                        <td className="numeric">
                          <div className="flex flex-col items-stretch gap-2 whitespace-nowrap xl:flex-row xl:items-center xl:justify-end">
                            <button
                              onClick={() => approve(app)}
                              disabled={busyId === app.id}
                              className="btn-primary btn-sm"
                            >
                              Admettre
                            </button>
                            <button
                              onClick={() => {
                                setRejecting(app)
                                setReason('')
                              }}
                              disabled={busyId === app.id}
                              className="btn-danger btn-sm"
                            >
                              {t('Refuser')}
                            </button>
                          </div>
                        </td>
                      )}
                      {tab === 'REJECTED' && (
                        <td className="text-content-secondary">{app.approvalNote || '—'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel w-full max-w-lg p-6">
            <h2 className="font-serif text-xl text-content">{t('Refuser cette demande')}</h2>
            <p className="mt-1 text-sm text-content-secondary">
              {rejecting.name} — {rejecting.email}
            </p>

            <div className="mt-6">
              <label className="form-label" htmlFor="reject-reason">
                Motif (facultatif)
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="form-input w-full"
                placeholder={t('Ce motif est envoyé au candidat par e-mail.')}
              />
              <p className="mt-1 text-[0.8125rem] text-content-secondary">
                {t('Le candidat reçoit ce texte. Laissez vide pour un refus sans motif.')}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRejecting(null)} className="btn-ghost btn-sm">
                {t('Annuler')}
              </button>
              <button
                onClick={reject}
                disabled={busyId === rejecting.id}
                className="btn-danger btn-sm"
              >
                {busyId === rejecting.id ? 'En cours…' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAdmissions
