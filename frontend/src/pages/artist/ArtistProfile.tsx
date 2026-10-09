import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Edit3, MapPin, Calendar, X, Upload, User, Plus, Trash2 } from 'lucide-react'
import { artistsApi, apiClient } from '@/utils/api'
import { normalizeImageUrl } from '@/utils/imageUrl'
import toast from 'react-hot-toast'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'
import DateRangePicker from '@/components/DateRangePicker'
import FormField from '@/components/FormField'
import VideoCard from '@/components/VideoCard'
import CategoryFields, { CategoryValue } from '@/components/registration/CategoryFields'
import CheckboxGroup from '@/components/registration/CheckboxGroup'
import SelectWithSearch from '@/components/registration/SelectWithSearch'
import { t } from '@/i18n'
import { formatShortDate } from '@/utils/i18n'
import { countryOptions } from '@/i18n/countries'
import SEOHead from '@/components/SEOHead'
import PrivacyControls from '@/components/PrivacyControls'
import type { Artist, ArtistAvailability, MediaItem } from '@/types'
import { AUDIENCE_TYPES, LANGUAGES, categoryErrors } from '@shared/categories'
import { COUNTRY_NAMES } from '@shared/countries'
import { artistProfileUpdateSchema, fieldErrors, normalizePhone } from '@shared/validation'
import { parseVideoUrl } from '@shared/media'

const MAX_VIDEOS = 10

interface Form extends CategoryValue {
  stageName: string
  bio: string
  country: string
  phone: string
  audienceTypes: string[]
  languages: string[]
  otherLanguages: string
}

const formFrom = (a: Artist): Form => ({
  stageName: a.stageName || '',
  bio: a.bio || '',
  country: a.user?.country || '',
  phone: a.phone || '',
  mainCategory: a.mainCategory || '',
  categoryType: a.categoryType || '',
  specificCategory: a.specificCategory || '',
  tributeTo: a.tributeTo || '',
  audienceTypes: a.audienceTypes || [],
  languages: a.languages || [],
  otherLanguages: a.otherLanguages || '',
})

const apiError = (e: any, fallback: string) => e?.response?.data?.error?.message || fallback

const ArtistProfile: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState<Artist | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [videoError, setVideoError] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    artistsApi
      .getVerificationCode()
      .then((res) => setVerificationCode(res.data.data.code))
      .catch(() => undefined)
  }, [])

  /* Look for the code in the video's description. A proof by code verifies
     the artist's other videos from the same channel too, so the whole list is
     re-read rather than patched. */
  const verifyVideo = async (item: MediaItem) => {
    setVerifying(item.id)
    try {
      const res = await artistsApi.verifyVideo(item.id)
      const { verified, message } = res.data.data
      if (verified) {
        toast.success(t(message))
        const fresh = await artistsApi.getMyProfile()
        const media = (fresh.data.data as any)?.media
        if (media) setArtist((a) => (a ? { ...a, media } : a))
      } else {
        toast(t(message), { duration: 8000 })
      }
    } catch (e) {
      toast.error(apiError(e, t('La vérification a échoué. Réessayez.')))
    } finally {
      setVerifying(null)
    }
  }
  const [addingVideo, setAddingVideo] = useState(false)

  const [newAvailability, setNewAvailability] = useState({ dateFrom: '', dateTo: '' })
  const [savingAvailability, setSavingAvailability] = useState(false)

  const countries = useMemo(() => countryOptions(COUNTRY_NAMES as string[]), [])

  const load = async () => {
    try {
      const res = await artistsApi.getMyProfile()
      const data: Artist = res.data?.data
      setArtist(data)
      setForm(formFrom(data))
    } catch {
      toast.error(t('Impossible de charger le profil'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const media = artist?.media ?? []
  const photos = media.filter((m) => m.kind === 'IMAGE')
  const videos = media.filter((m) => m.kind === 'VIDEO')
  const availability = (artist?.availability ?? []) as ArtistAvailability[]

  const setField = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f))
    setErrors((e) => {
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  // ------------------------------------------------------------ profile save

  const save = async () => {
    if (!form || !artist) return
    const payload = {
      stageName: form.stageName,
      bio: form.bio,
      country: form.country || undefined,
      phone: form.phone || undefined,
      mainCategory: form.mainCategory,
      categoryType: form.categoryType,
      specificCategory: form.specificCategory || null,
      tributeTo: form.tributeTo || null,
      audienceTypes: form.audienceTypes,
      languages: form.languages,
      otherLanguages: form.otherLanguages || null,
    }

    // The same checks the API makes, so problems show under their fields first.
    const local: Record<string, string> = { ...categoryErrors(payload) }
    const parsed = artistProfileUpdateSchema.safeParse(payload)
    if (!parsed.success) Object.assign(local, fieldErrors(parsed.error))
    if (form.phone && !normalizePhone(form.phone, form.country)) local.phone = 'Numéro de téléphone invalide pour ce pays'
    if (form.languages.length === 0) local.languages = 'Sélectionnez au moins une langue'
    if (Object.keys(local).length) {
      setErrors(local)
      toast.error(t('Vérifiez les champs signalés'))
      return
    }

    setSaving(true)
    try {
      const res = await artistsApi.updateProfile(undefined, payload)
      setArtist(res.data.data)
      setForm(formFrom(res.data.data))
      setIsEditing(false)
      toast.success(t('Profil mis à jour'))
    } catch (e: any) {
      if (e?.response?.data?.error?.fields) setErrors(e.response.data.error.fields)
      toast.error(apiError(e, t('Vos modifications n’ont pas été enregistrées. Veuillez réessayer.')))
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------------ media

  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return
    const body = new FormData()
    files.slice(0, 10).forEach((f) => body.append('media', f))
    setUploadingImages(true)
    try {
      const res = await apiClient.post('/upload/media', body)
      const added: MediaItem[] = res.data?.data?.media ?? []
      setArtist((a) => (a ? { ...a, media: [...(a.media ?? []), ...added] } : a))
      toast.success(t('{n} photo(s) ajoutée(s)', { n: String(added.length) }))
    } catch (e) {
      toast.error(apiError(e, t('Échec du téléversement')))
    } finally {
      setUploadingImages(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const removeMedia = async (item: MediaItem) => {
    try {
      await artistsApi.removeMedia(item.id)
      setArtist((a) => (a ? { ...a, media: (a.media ?? []).filter((m) => m.id !== item.id) } : a))
      toast.success(item.kind === 'VIDEO' ? t('Vidéo retirée') : t('Photo retirée'))
    } catch (e) {
      toast.error(apiError(e, t('Impossible de retirer ce média')))
    }
  }

  const addVideo = async () => {
    const url = newVideoUrl.trim()
    if (!parseVideoUrl(url)) {
      setVideoError(t('Lien non reconnu : utilisez un lien YouTube, Vimeo ou Instagram'))
      return
    }
    setAddingVideo(true)
    try {
      const res = await artistsApi.addVideo(url)
      setArtist((a) => (a ? { ...a, media: [...(a.media ?? []), res.data.data] } : a))
      setNewVideoUrl('')
      setVideoError(null)
      toast.success(t('Vidéo ajoutée'))
    } catch (e: any) {
      setVideoError(e?.response?.data?.error?.fields?.url || apiError(e, t('Impossible d’ajouter cette vidéo')))
    } finally {
      setAddingVideo(false)
    }
  }

  // ----------------------------------------------------------- availability

  const addAvailability = async () => {
    if (!artist || !newAvailability.dateFrom || !newAvailability.dateTo) return
    setSavingAvailability(true)
    try {
      const res = await artistsApi.setAvailability(artist.id, {
        dateFrom: new Date(newAvailability.dateFrom).toISOString(),
        dateTo: new Date(`${newAvailability.dateTo}T23:59:59`).toISOString(),
      })
      setArtist((a) => (a ? { ...a, availability: [...(a.availability ?? []), res.data.data] } : a))
      setNewAvailability({ dateFrom: '', dateTo: '' })
      toast.success(t('Disponibilité ajoutée'))
    } catch (e) {
      toast.error(apiError(e, t('Impossible d’ajouter cette disponibilité')))
    } finally {
      setSavingAvailability(false)
    }
  }

  const removeAvailability = async (id: string) => {
    if (!artist) return
    try {
      await artistsApi.removeAvailability(artist.id, id)
      setArtist((a) => (a ? { ...a, availability: (a.availability ?? []).filter((p) => p.id !== id) } : a))
      toast.success(t('Disponibilité retirée'))
    } catch (e) {
      toast.error(apiError(e, t('Impossible de retirer cette disponibilité')))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-content-secondary">{t('Chargement du profil…')}</p>
      </div>
    )
  }

  if (!artist || !form) {
    return <div className="notice-critical">{t('Impossible de charger le profil')}</div>
  }

  const err = (key: string) => (errors[key] ? t(errors[key]) : undefined)

  return (
    <div className="space-y-8">
      <SEOHead title={t('Mon profil') + ' — Travel Art'} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">{t('Profil de l’artiste')}</h1>
          <p className="text-content-secondary">{t('Gérez votre profil et présentez votre travail aux hôtels d’exception')}</p>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              setForm(formFrom(artist))
              setErrors({})
            }
            setIsEditing(!isEditing)
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? t('Annuler') : t('Modifier le profil')}</span>
        </button>
      </div>

      {/* Identity */}
      <div className="panel p-6">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-shrink-0">
            {isEditing ? (
              <ProfilePictureUpload
                currentImage={artist.profilePicture || undefined}
                onUploadSuccess={(url: string) => setArtist((a) => (a ? { ...a, profilePicture: url } : a))}
              />
            ) : artist.profilePicture ? (
              <img
                decoding="async"
                src={normalizeImageUrl(artist.profilePicture)}
                alt=""
                className="h-48 w-48 rounded-card object-cover ring-2 ring-gold/20"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-card bg-surface-sunken ring-2 ring-gold/20">
                <User className="h-24 w-24 text-content/30" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            {isEditing ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField label={t('Nom de scène')} value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} error={err('stageName')} required maxLength={60} />
                <SelectWithSearch label={t('Pays')} options={countries} value={form.country} onChange={(v) => setField('country', v)} error={err('country')} />
                <FormField label={t('Téléphone')} type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} error={err('phone')} hint={t('Visible des hôtels uniquement une fois une résidence confirmée')} />
                <div className="md:col-span-2">
                  <label className="form-label" htmlFor="artist-bio">{t('Présentation')}</label>
                  <textarea
                    id="artist-bio"
                    value={form.bio}
                    maxLength={2000}
                    onChange={(e) => setField('bio', e.target.value)}
                    className="form-input h-32 resize-none"
                    placeholder={t('Racontez aux hôtels votre parcours et vos spécialités…')}
                  />
                  {err('bio') && <p className="mt-1 text-sm text-[var(--state-critical)]">{err('bio')}</p>}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-2xl font-serif font-semibold text-content">{artist.stageName || artist.user?.name}</p>
                  <p className="mt-1 text-lg text-gold font-medium">{t(artist.discipline || '') || t('Discipline à compléter')}</p>
                  {artist.user?.country && (
                    <p className="mt-2 flex items-center text-content-secondary">
                      <MapPin className="mr-2 h-4 w-4" />
                      {artist.user.country}
                    </p>
                  )}
                </div>
                <p className="text-content-secondary leading-relaxed">
                  {artist.bio || t('Aucune biographie. Utilisez « Modifier le profil » pour en ajouter une.')}
                </p>
              </>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-card bg-surface p-4 text-center">
                <p className="text-lg font-bold text-content">{artist.avgRating ? artist.avgRating.toFixed(1) : '—'}</p>
                <p className="text-sm text-content-secondary">{t('Note moyenne')}</p>
              </div>
              <div className="rounded-card bg-surface p-4 text-center">
                <p className="text-lg font-bold text-content">{artist.totalRatings ?? 0}</p>
                <p className="text-sm text-content-secondary">{t('Évaluations')}</p>
              </div>
              <div className="rounded-card bg-surface p-4 text-center">
                <p className="text-lg font-bold text-content">{t('Membre')}</p>
                <p className="text-sm text-content-secondary">{t('Depuis {date}', { date: formatShortDate((artist as any).createdAt || new Date().toISOString()) })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discipline */}
      <div className="panel p-6">
        <h2 className="mb-6 text-xl font-serif font-semibold text-content gold-underline">{t('Discipline et public')}</h2>
        {isEditing ? (
          <div className="space-y-6">
            <CategoryFields
              value={form}
              onChange={(v) => {
                setForm((f) => (f ? { ...f, ...v } : f))
                setErrors((e) => ({ ...e, mainCategory: '', categoryType: '', specificCategory: '', tributeTo: '' }))
              }}
              errors={errors}
            />
            <CheckboxGroup
              name="audienceTypes"
              label={t('Public')}
              options={AUDIENCE_TYPES.map((v) => ({ value: v, label: t(v) }))}
              values={form.audienceTypes}
              onChange={(v) => setField('audienceTypes', v)}
              error={err('audienceTypes')}
              layout="grid"
            />
            <CheckboxGroup
              name="languages"
              label={t('Langues parlées')}
              options={LANGUAGES.map((v) => ({ value: v, label: t(v) }))}
              values={form.languages}
              onChange={(v) => setField('languages', v)}
              error={err('languages')}
              layout="grid"
            />
            {form.languages.includes('Autre') && (
              <FormField label={t('Autres langues')} value={form.otherLanguages} onChange={(e) => setField('otherLanguages', e.target.value)} error={err('otherLanguages')} maxLength={100} />
            )}
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div><dt className="form-label">{t('Catégorie')}</dt><dd className="text-content">{t(artist.mainCategory || '—')}</dd></div>
            <div><dt className="form-label">{t('Spécialité')}</dt><dd className="text-content">{t(artist.specificCategory || artist.categoryType || '—')}{artist.tributeTo ? ` — ${t('hommage à')} ${artist.tributeTo}` : ''}</dd></div>
            <div><dt className="form-label">{t('Public')}</dt><dd className="text-content">{(artist.audienceTypes ?? []).map((a) => t(a)).join(', ') || '—'}</dd></div>
            <div><dt className="form-label">{t('Langues')}</dt><dd className="text-content">{[...(artist.languages ?? []).filter((l) => l !== 'Autre').map((l) => t(l)), artist.otherLanguages].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt className="form-label">E-mail</dt><dd className="text-content">{artist.user?.email}</dd></div>
            <div><dt className="form-label">{t('Date de naissance')}</dt><dd className="text-content">{artist.birthDate || '—'}</dd></div>
          </dl>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>{saving ? t('Enregistrement…') : t('Enregistrer les modifications')}</span>
          </button>
        </div>
      )}

      {/* Photos: saved as soon as they are uploaded or removed. */}
      <div className="panel p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-serif font-semibold text-content gold-underline">{t('Photos')}</h2>
          <input
            ref={fileInput}
            id="portfolio-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => uploadPhotos(Array.from(e.target.files || []))}
          />
          <button type="button" disabled={uploadingImages} onClick={() => fileInput.current?.click()} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>{uploadingImages ? t('Téléversement…') : t('Ajouter des photos')}</span>
          </button>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <img decoding="async" loading="lazy" src={normalizeImageUrl(photo.url)} alt="" className="h-48 w-full rounded-card object-cover" />
                <button
                  onClick={() => removeMedia(photo)}
                  aria-label={t('Retirer cette photo')}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-content-secondary">{t('Aucune photo pour le moment. JPEG, PNG ou WebP, 5 Mo maximum chacune.')}</p>
        )}
      </div>

      {/* Videos: saved as soon as they are added or removed. */}
      <div className="panel p-6">
        <h2 className="text-xl font-serif font-semibold text-content gold-underline">{t('Vidéos de performances')}</h2>
        <p className="mt-2 text-sm text-content-secondary">
          {t('Ajoutez des liens YouTube, Vimeo ou Instagram de vos propres performances ({n} maximum).', { n: String(MAX_VIDEOS) })}
        </p>

        {videos.length < MAX_VIDEOS && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <FormField
                label={t('Lien de la vidéo')}
                type="url"
                inputMode="url"
                value={newVideoUrl}
                onChange={(e) => {
                  setNewVideoUrl(e.target.value)
                  setVideoError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVideo()
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=…"
                error={videoError || undefined}
              />
            </div>
            <button onClick={addVideo} disabled={addingVideo || !newVideoUrl.trim()} className="btn-primary flex items-center gap-2 self-end">
              <Plus className="w-4 h-4" />
              {addingVideo ? t('Ajout…') : t('Ajouter')}
            </button>
          </div>
        )}

        {verificationCode && videos.some((v) => v.verification !== 'VERIFIED') && (
          <div className="mt-4 rounded-card border border-[var(--state-info-line)] bg-[var(--state-info-wash)] p-4 text-sm text-content" data-testid="video-verification-help">
            <p className="font-semibold">{t('Prouvez que ces vidéos sont les vôtres')}</p>
            <p className="mt-1">
              {t('Votre code personnel')} : <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-base font-semibold" data-testid="verification-code">{verificationCode}</code>
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>{t('Ajoutez ce code dans la description d’une de vos vidéos YouTube ou Vimeo, depuis votre compte.')}</li>
              <li>{t('Cliquez sur « Vérifier » sous cette vidéo. Toutes vos vidéos de la même chaîne sont alors vérifiées.')}</li>
              <li>{t('Vous pouvez ensuite retirer le code de la description.')}</li>
            </ol>
            <p className="mt-2 text-content-secondary">{t('Les liens Instagram sont vérifiés par notre équipe lors de l’examen de votre profil.')}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {videos.length > 0 ? (
            videos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                showUnverified
                action={
                  <div className="flex flex-wrap justify-end gap-2">
                    {video.verification !== 'VERIFIED' && (video.provider === 'YOUTUBE' || video.provider === 'VIMEO') && (
                      <button onClick={() => verifyVideo(video)} disabled={verifying === video.id} className="btn-outline btn-sm" data-testid="video-verify">
                        {verifying === video.id ? t('Vérification…') : t('Vérifier')}
                      </button>
                    )}
                    <button onClick={() => removeMedia(video)} className="flex items-center gap-2 rounded-card px-3 py-2 text-[var(--state-critical)] hover:bg-[var(--state-critical-wash)]">
                      <X className="w-4 h-4" />
                      {t('Retirer')}
                    </button>
                  </div>
                }
              />
            ))
          ) : (
            <p className="text-content-secondary">{t('Aucune vidéo pour le moment.')}</p>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="panel p-6">
        <h2 className="text-xl font-serif font-semibold text-content gold-underline">{t('Calendrier de disponibilités')}</h2>
        <p className="mt-2 text-sm text-content-secondary">{t('Indiquez vos dates disponibles pour les réservations')}</p>

        <div className="my-6 space-y-4 rounded-card border border-[var(--state-info-line)] bg-[var(--state-info-wash)] p-4">
          <DateRangePicker
            startDate={newAvailability.dateFrom}
            endDate={newAvailability.dateTo}
            onStartDateChange={(date) => setNewAvailability((n) => ({ ...n, dateFrom: date }))}
            onEndDateChange={(date) => setNewAvailability((n) => ({ ...n, dateTo: date }))}
            minDate={new Date().toISOString().split('T')[0]}
          />
          <div className="flex justify-end">
            <button
              onClick={addAvailability}
              disabled={savingAvailability || !newAvailability.dateFrom || !newAvailability.dateTo}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {savingAvailability ? t('Ajout…') : t('Ajouter la disponibilité')}
            </button>
          </div>
        </div>

        {availability.length > 0 ? (
          <div className="space-y-3">
            {[...availability]
              .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gold" />
                    <p className="font-medium text-content">
                      {new Date(p.dateFrom).toLocaleDateString('fr-FR')} – {new Date(p.dateTo).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button onClick={() => removeAvailability(p.id)} className="flex items-center gap-2 rounded-card px-3 py-2 text-[var(--state-critical)] hover:bg-[var(--state-critical-wash)]">
                    <Trash2 className="h-4 w-4" />
                    {t('Retirer')}
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-content-secondary">{t('Ajoutez vos dates ci-dessus pour que les hôtels puissent vous solliciter')}</p>
        )}
      </div>

      <PrivacyControls />
    </div>
  )
}

export default ArtistProfile
