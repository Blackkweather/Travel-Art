import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import VideoCard from '@/components/VideoCard'
import { normalizeImageUrl } from '@/utils/imageUrl'
import type { MediaItem } from '@/types'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'
import { countryLabel } from '@/i18n/countries'

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
  referredBy?: string | null
  artist?: {
    stageName?: string | null
    discipline?: string | null
    bio?: string | null
    birthDate?: string | null
    mainCategory?: string | null
    specificCategory?: string | null
    tributeTo?: string | null
    languages?: string[]
    audienceTypes?: string[]
    profilePicture?: string | null
    media?: MediaItem[]
    images?: string[]
    videos?: string[]
  } | null
  hotel?: {
    name?: string | null
    city?: string | null
    country?: string | null
    address?: string | null
    description?: string | null
    hotelType?: string | null
    roomCount?: number | null
    website?: string | null
    instagramUrl?: string | null
    profilePicture?: string | null
    spaces?: Array<{ name: string; capacity?: number | null; setting?: string | null }>
  } | null
}

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'PENDING', label: t('À examiner') },
  { key: 'APPROVED', label: t('Admises') },
  { key: 'REJECTED', label: t('Refusées') },
]

const ageFrom = (iso?: string | null) => {
  if (!iso) return null
  const birth = new Date(iso)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1
  return age
}

/**
 * Admissions: the queue an administrator works through, oldest first.
 *
 * An application cannot be admitted until its e-mail is confirmed (the API
 * refuses), so the row says so and offers to resend the link. "Examiner"
 * opens everything needed to decide - discipline, bio, photos and the
 * performance videos - in one panel.
 */
const AdminAdmissions: React.FC = () => {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [applications, setApplications] = useState<Application[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<Application | null>(null)

  /** Rule on a video's ownership; the panel and the list both show the result. */
  const ruleOnVideo = async (video: MediaItem, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await adminApi.setVideoVerification(video.id, status)
      const updated = res.data.data as MediaItem
      const patch = (app: Application | null) =>
        app && app.artist
          ? { ...app, artist: { ...app.artist, media: (app.artist.media ?? []).map((m) => (m.id === updated.id ? updated : m)) } }
          : app
      setReviewing((r) => patch(r))
      setApplications((list) => list.map((a) => patch(a) as Application))
      toast.success(status === 'VERIFIED' ? t('Vidéo vérifiée') : t('Vidéo marquée comme n’appartenant pas à l’artiste'))
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('L’action a échoué.'))
    }
  }
  const [rejecting, setRejecting] = useState<Application | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async (status: Tab) => {
    try {
      setLoading(true)
      const res = await adminApi.getAdmissions(status)
      setApplications(res.data?.data?.applications ?? [])
      setPendingCount(res.data?.data?.pendingCount ?? 0)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Chargement impossible'))
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab, load])

  const removeFromList = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id))
    setPendingCount((n) => Math.max(0, n - 1))
    setReviewing((r) => (r?.id === id ? null : r))
  }

  const approve = async (app: Application) => {
    try {
      setBusyId(app.id)
      await adminApi.approve(app.id)
      toast.success(t('{name} a été admis', { name: app.name }))
      removeFromList(app.id)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Échec de l’admission'))
    } finally {
      setBusyId(null)
    }
  }

  const resend = async (app: Application) => {
    try {
      setBusyId(app.id)
      await adminApi.resendVerification(app.id)
      toast.success(t('Lien de confirmation renvoyé à {email}', { email: app.email }))
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Envoi impossible'))
    } finally {
      setBusyId(null)
    }
  }

  const reject = async () => {
    if (!rejecting) return
    try {
      setBusyId(rejecting.id)
      await adminApi.reject(rejecting.id, reason.trim() || undefined)
      toast.success(t('Demande de {name} refusée', { name: rejecting.name }))
      removeFromList(rejecting.id)
      setRejecting(null)
      setReason('')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Échec du refus'))
    } finally {
      setBusyId(null)
    }
  }

  const detail = (app: Application) => {
    if (app.role === 'ARTIST') {
      const a = app.artist
      return [a?.stageName, t(a?.discipline || '') || t('Discipline non renseignée')].filter(Boolean).join(' — ')
    }
    const h = app.hotel
    return [h?.name, [h?.city, countryLabel(h?.country || '')].filter(Boolean).join(', ')].filter(Boolean).join(' — ') || t('Établissement non renseigné')
  }

  const decision = (app: Application, inPanel = false) => (
    <div className="flex flex-col items-stretch gap-2 whitespace-nowrap xl:flex-row xl:items-center xl:justify-end">
      {!inPanel && <button onClick={() => setReviewing(app)} className="btn-secondary btn-sm">{t('Examiner')}</button>}
      {app.emailVerified ? (
        <button onClick={() => approve(app)} disabled={busyId === app.id} className="btn-primary btn-sm">{t('Admettre')}</button>
      ) : (
        <button onClick={() => resend(app)} disabled={busyId === app.id} className="btn-ghost btn-sm" title={t('L’adresse doit être confirmée avant l’admission')}>
          {t('Renvoyer le lien')}
        </button>
      )}
      <button onClick={() => { setRejecting(app); setReason('') }} disabled={busyId === app.id} className="btn-danger btn-sm">{t('Refuser')}</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <SEOHead title={t('Admissions') + ' — Travel Art'} />
      <div className="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-16">
        <header className="page-head">
          <span className="eyebrow">{t('Administration')}</span>
          <h1 className="page-head__title">{t('Admissions')}</h1>
          <p className="page-head__lede">
            {t('Chaque nouvelle inscription attend ici jusqu’à ce qu’elle soit admise ou refusée. Une candidature ne peut être admise qu’une fois l’adresse e-mail confirmée.')}
          </p>
          <span className="rule-reveal mt-2" />
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-control border px-4 py-2 text-sm font-medium transition-colors ${
                tab === tb.key ? 'border-line-strong bg-surface-inverse text-content-inverse' : 'border-line text-content-secondary hover:border-line-strong'
              }`}
            >
              {tb.label}
              {tb.key === 'PENDING' && pendingCount > 0 && <span className="ml-2 tabular-nums">({pendingCount})</span>}
            </button>
          ))}
        </div>

        <section className="panel">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner /></div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">{tab === 'PENDING' ? t('Aucune demande en attente') : t('Aucune demande')}</p>
              <p className="empty-state__body">
                {tab === 'PENDING' ? t('Les nouvelles inscriptions apparaîtront ici dès qu’elles seront déposées.') : t('Rien à afficher pour ce filtre.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t('Candidat')}</th>
                    <th scope="col">{t('Type')}</th>
                    <th scope="col">{t('Détails')}</th>
                    <th scope="col">{t('Médias')}</th>
                    <th scope="col">E-mail</th>
                    <th scope="col">{t('Déposée le')}</th>
                    {tab === 'PENDING' && <th scope="col" className="numeric">{t('Décision')}</th>}
                    {tab === 'REJECTED' && <th scope="col">{t('Motif')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="font-medium text-content">{app.name}</div>
                        <div className="text-content-secondary">{app.email}</div>
                        {app.referredBy && <div className="text-[0.75rem] text-content-secondary">{t('Parrainé par {name}', { name: app.referredBy })}</div>}
                      </td>
                      <td><span className="badge-neutral">{app.role === 'ARTIST' ? t('Artiste') : t('Hôtel')}</span></td>
                      <td className="max-w-[16rem] truncate text-content-secondary" title={detail(app)}>{detail(app)}</td>
                      <td className="whitespace-nowrap text-content-secondary">
                        {app.role === 'ARTIST'
                          ? `${app.artist?.videos?.length ?? 0} ${t('vidéo(s)')} · ${app.artist?.images?.length ?? 0} ${t('photo(s)')}`
                          : `${app.hotel?.spaces?.length ?? 0} ${t('espace(s)')}`}
                      </td>
                      <td><StatusBadge status={app.emailVerified ? 'VERIFIED' : 'PENDING'} /></td>
                      <td className="whitespace-nowrap text-content-secondary">{new Date(app.createdAt).toLocaleDateString('fr-FR')}</td>
                      {tab === 'PENDING' && <td className="numeric">{decision(app)}</td>}
                      {tab === 'REJECTED' && <td className="text-content-secondary">{app.approvalNote || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setReviewing(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="h-full w-full max-w-2xl overflow-y-auto bg-surface-raised p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="review-title" className="font-serif text-2xl text-content">
                  {reviewing.role === 'ARTIST' ? reviewing.artist?.stageName || reviewing.name : reviewing.hotel?.name || reviewing.name}
                </h2>
                <p className="text-sm text-content-secondary">{reviewing.name} · {reviewing.email} · {reviewing.phone || '—'} · {countryLabel(reviewing.country || '')}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="btn-ghost btn-sm" aria-label={t('Fermer')}>×</button>
            </div>

            {!reviewing.emailVerified && (
              <p className="mt-4 rounded-card border border-gold/40 bg-gold/10 p-3 text-sm text-content">
                {t('Adresse e-mail non confirmée : l’admission sera possible une fois le lien de confirmation ouvert.')}
              </p>
            )}

            {reviewing.role === 'ARTIST' && reviewing.artist && (
              <div className="mt-6 space-y-6">
                {reviewing.artist.profilePicture && (
                  <img src={normalizeImageUrl(reviewing.artist.profilePicture)} alt="" className="h-32 w-32 rounded-card object-cover" />
                )}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-content-secondary">{t('Discipline')}</dt><dd className="text-content">{t(reviewing.artist.discipline || '—')}</dd></div>
                  <div><dt className="text-content-secondary">{t('Âge')}</dt><dd className="text-content">{ageFrom(reviewing.artist.birthDate) ?? '—'}</dd></div>
                  <div><dt className="text-content-secondary">{t('Langues')}</dt><dd className="text-content">{(reviewing.artist.languages ?? []).map((l) => t(l)).join(', ') || '—'}</dd></div>
                  <div><dt className="text-content-secondary">{t('Public')}</dt><dd className="text-content">{(reviewing.artist.audienceTypes ?? []).map((a) => t(a)).join(', ') || '—'}</dd></div>
                </dl>
                {reviewing.artist.bio && <p className="text-sm leading-relaxed text-content">{reviewing.artist.bio}</p>}
                <div>
                  <h3 className="mb-3 font-serif text-lg text-content">{t('Vidéos')}</h3>
                  {(reviewing.artist.media ?? []).filter((m) => m.kind === 'VIDEO').length > 0 ? (
                    <div className="space-y-4">
                      {(reviewing.artist.media ?? []).filter((m) => m.kind === 'VIDEO').map((v, i) => (
                        <VideoCard
                          key={v.id}
                          video={v}
                          index={i}
                          showUnverified
                          action={
                            <div className="flex flex-wrap justify-end gap-2">
                              {v.verification !== 'VERIFIED' && (
                                <button type="button" className="btn-outline btn-sm" onClick={() => ruleOnVideo(v, 'VERIFIED')} data-testid="admin-video-verify">
                                  {t('Vérifier')}
                                </button>
                              )}
                              {v.verification !== 'REJECTED' && (
                                <button type="button" className="btn-ghost btn-sm" onClick={() => ruleOnVideo(v, 'REJECTED')}>
                                  {t('Pas la sienne')}
                                </button>
                              )}
                            </div>
                          }
                        />
                      ))}
                      <p className="text-[0.8125rem] text-content-secondary">
                        {t('« Vérifiée » : le code de l’artiste figure dans la description, ou la vidéo vient d’une chaîne déjà prouvée. Pour Instagram, ouvrez le lien et vérifiez que le compte est bien le sien.')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-content-secondary">{t('Aucune vidéo pour le moment.')}</p>
                  )}
                </div>
                {(reviewing.artist.images ?? []).length > 0 && (
                  <div>
                    <h3 className="mb-3 font-serif text-lg text-content">{t('Photos')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {reviewing.artist.images!.map((src) => <img key={src} src={normalizeImageUrl(src)} alt="" className="h-28 w-full rounded-card object-cover" />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {reviewing.role === 'HOTEL' && reviewing.hotel && (
              <div className="mt-6 space-y-4 text-sm">
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-content-secondary">{t('Ville')}</dt><dd className="text-content">{reviewing.hotel.city}, {countryLabel(reviewing.hotel.country || '')}</dd></div>
                  <div><dt className="text-content-secondary">{t('Type')}</dt><dd className="text-content">{t(reviewing.hotel.hotelType || '—')}</dd></div>
                  <div><dt className="text-content-secondary">{t('Chambres')}</dt><dd className="text-content">{reviewing.hotel.roomCount ?? '—'}</dd></div>
                  <div><dt className="text-content-secondary">{t('Adresse')}</dt><dd className="text-content">{reviewing.hotel.address || '—'}</dd></div>
                </dl>
                <p className="flex flex-wrap gap-3">
                  {reviewing.hotel.website && <a className="text-gold underline" href={reviewing.hotel.website} target="_blank" rel="noopener noreferrer">{t('Site web')}</a>}
                  {reviewing.hotel.instagramUrl && <a className="text-gold underline" href={reviewing.hotel.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>}
                </p>
                {reviewing.hotel.description && <p className="leading-relaxed text-content">{reviewing.hotel.description}</p>}
                {(reviewing.hotel.spaces ?? []).length > 0 && (
                  <ul className="list-inside list-disc text-content">
                    {reviewing.hotel.spaces!.map((s) => <li key={s.name}>{s.name}{s.capacity ? ` — ${s.capacity} ${t('personnes')}` : ''}</li>)}
                  </ul>
                )}
              </div>
            )}

            {reviewing.approvalStatus === 'PENDING' && <div className="mt-8">{decision(reviewing, true)}</div>}
          </aside>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel w-full max-w-lg p-6">
            <h2 className="font-serif text-xl text-content">{t('Refuser cette demande')}</h2>
            <p className="mt-1 text-sm text-content-secondary">{rejecting.name} — {rejecting.email}</p>
            <div className="mt-6">
              <label className="form-label" htmlFor="reject-reason">{t('Motif (facultatif)')}</label>
              <textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={500} className="form-input w-full" placeholder={t('Ce motif est envoyé au candidat par e-mail.')} />
              <p className="mt-1 text-[0.8125rem] text-content-secondary">{t('Le candidat reçoit ce texte. Laissez vide pour un refus sans motif.')}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRejecting(null)} className="btn-ghost btn-sm">{t('Annuler')}</button>
              <button onClick={reject} disabled={busyId === rejecting.id} className="btn-danger btn-sm">
                {busyId === rejecting.id ? t('En cours…') : t('Confirmer le refus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAdmissions
