import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Edit3, Upload, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { hotelsApi, apiClient } from '@/utils/api'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'
import PrivacyControls from '@/components/PrivacyControls'
import FormField from '@/components/FormField'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'
import SelectWithSearch from '@/components/registration/SelectWithSearch'
import {
  AmbianceSection,
  AudienceField,
  CollaborationSection,
  EquipmentSection,
  FreedomSection,
  HOTEL_TYPES,
  LogisticsSection,
  ProgrammeForm,
  SpaceForm,
  SpacesSection,
  ValidationSection,
  programmeFromApi,
  programmePayload,
  spacesFromApi,
  spacesPayload,
} from '@/components/hotel/HotelFormSections'
import { countryOptions } from '@/i18n/countries'
import { COUNTRY_NAMES } from '@shared/countries'
import { fieldErrors, hotelProfileUpdateSchema } from '@shared/validation'
import { normalizeImageUrl } from '@/utils/imageUrl'
import type { Hotel, MediaItem } from '@/types'

/**
 * The hotel's own profile: what artists see when the hotel proposes a
 * residency, and the programme answers given at registration, all editable.
 * Contact details stay private until a residency is confirmed.
 */

interface Details {
  name: string
  description: string
  city: string
  country: string
  address: string
  hotelType: string
  roomCount: string
  website: string
  instagramUrl: string
  facebookUrl: string
  youtubeUrl: string
  contactPhone: string
  responsibleName: string
  responsiblePhone: string
  responsibleEmail: string
}

const detailsFrom = (h: Hotel): Details => ({
  name: h.name ?? '',
  description: h.description ?? '',
  city: h.city ?? '',
  country: h.country ?? '',
  address: h.address ?? '',
  hotelType: h.hotelType ?? '',
  roomCount: h.roomCount ? String(h.roomCount) : '',
  website: h.website ?? '',
  instagramUrl: h.instagramUrl ?? '',
  facebookUrl: h.facebookUrl ?? '',
  youtubeUrl: h.youtubeUrl ?? '',
  contactPhone: h.contactPhone ?? '',
  responsibleName: h.responsibleName ?? '',
  responsiblePhone: h.responsiblePhone ?? '',
  responsibleEmail: h.responsibleEmail ?? '',
})

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="panel space-y-6 p-6">
    <h2 className="font-serif text-xl text-content">{title}</h2>
    {children}
  </section>
)

const HotelProfile: React.FC = () => {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [details, setDetails] = useState<Details | null>(null)
  const [spaces, setSpaces] = useState<SpaceForm[]>([])
  const [programme, setProgramme] = useState<ProgrammeForm | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const countries = useMemo(() => countryOptions(COUNTRY_NAMES as string[]), [])

  const apply = (h: Hotel) => {
    setHotel(h)
    setDetails(detailsFrom(h))
    setSpaces(spacesFromApi(h.performanceSpots))
    setProgramme(programmeFromApi(h.programme))
  }

  useEffect(() => {
    hotelsApi
      .getMyProfile()
      .then((res) => apply(res.data.data))
      .catch(() => setLoadError(t('Votre profil n’a pas pu être chargé. Veuillez réessayer.')))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setDetails((d) => (d ? { ...d, [key]: value } : d))
    setErrors((errs) => {
      const next = { ...errs }
      delete next[key]
      return next
    })
  }

  const save = async () => {
    if (!details || !programme) return
    const payload = {
      ...Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()])),
      name: details.name,
      city: details.city,
      country: details.country || undefined,
      spaces: spacesPayload(spaces),
      programme: programmePayload(programme),
    }
    const check = hotelProfileUpdateSchema.safeParse(payload)
    if (!check.success) {
      setErrors(fieldErrors(check.error))
      toast.error(t('Vérifiez les champs signalés'))
      return
    }
    setSaving(true)
    try {
      const res = await hotelsApi.updateProfile(undefined, payload)
      apply(res.data.data)
      setIsEditing(false)
      setErrors({})
      toast.success(t('Profil mis à jour'))
    } catch (e: any) {
      if (e?.response?.data?.error?.fields) setErrors(e.response.data.error.fields)
      toast.error(e?.response?.data?.error?.message || t('Vos modifications n’ont pas été enregistrées. Veuillez réessayer.'))
    } finally {
      setSaving(false)
    }
  }

  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return
    const body = new FormData()
    files.slice(0, 10).forEach((f) => body.append('media', f))
    setUploading(true)
    try {
      const res = await apiClient.post('/upload/media', body)
      const added: MediaItem[] = res.data?.data?.media ?? []
      setHotel((h) => (h ? { ...h, media: [...(h.media ?? []), ...added] } : h))
      toast.success(t('{n} photo(s) ajoutée(s)', { n: String(added.length) }))
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || t('Échec du téléversement'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const removePhoto = async (item: MediaItem) => {
    try {
      await hotelsApi.removeMedia(item.id)
      setHotel((h) => (h ? { ...h, media: (h.media ?? []).filter((m) => m.id !== item.id) } : h))
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || t('Impossible de retirer cette photo'))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="h-10 w-64 animate-pulse rounded-card bg-[var(--surface-sunken)]" />
        <div className="h-64 animate-pulse rounded-card bg-[var(--surface-sunken)]" />
      </div>
    )
  }

  if (!hotel || !details || !programme) {
    return (
      <div role="alert" className="notice-critical m-8">
        <AlertCircle size={18} aria-hidden="true" />
        <span>{loadError}</span>
      </div>
    )
  }

  const e = (key: string) => (errors[key] ? t(errors[key]) : undefined)
  const disabled = !isEditing || saving
  const photos = (hotel.media ?? []).filter((m) => m.kind === 'IMAGE')

  return (
    <div className="min-h-screen">
      <SEOHead title={t('Profil de l’hôtel') + ' — Travel Art'} />
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 font-serif text-3xl text-content">{t('Profil de l’hôtel')}</h1>
            <p className="text-content-secondary">{t('C’est ce que voient les artistes lorsque vous les sollicitez.')}</p>
          </div>
          {isEditing ? (
            <div className="flex gap-3">
              <button onClick={() => { apply(hotel); setIsEditing(false); setErrors({}) }} disabled={saving} className="btn-secondary">
                {t('Annuler')}
              </button>
              <button onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 disabled:opacity-60">
                <Save size={16} aria-hidden="true" />
                {saving ? t('Enregistrement…') : t('Enregistrer les modifications')}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-gold flex items-center gap-2">
              <Edit3 size={16} aria-hidden="true" />
              {t('Modifier le profil')}
            </button>
          )}
        </div>

        <Section title={t('L’établissement')}>
          <div className="flex flex-col gap-6 md:flex-row">
            <ProfilePictureUpload
              currentImage={hotel.profilePicture || undefined}
              onUploadSuccess={(url: string) => setHotel((h) => (h ? { ...h, profilePicture: url } : h))}
            />
            <div className="grid flex-1 gap-6 md:grid-cols-2">
              <FormField label={t('Nom de l’hôtel')} value={details.name} onChange={set('name')} error={e('name')} required disabled={disabled} maxLength={120} />
              <SelectWithSearch label={t('Type d’hôtel')} options={HOTEL_TYPES.map((v) => ({ value: v, label: t(v) }))} value={details.hotelType} onChange={(v) => setDetails({ ...details, hotelType: v })} disabled={disabled} />
              <FormField label={t('Ville')} value={details.city} onChange={set('city')} error={e('city')} required disabled={disabled} maxLength={80} />
              <SelectWithSearch label={t('Pays')} options={countries} value={details.country} onChange={(v) => setDetails({ ...details, country: v })} error={e('country')} disabled={disabled} />
              <FormField label={t('Adresse')} value={details.address} onChange={set('address')} error={e('address')} disabled={disabled} maxLength={200} />
              <FormField inputMode="numeric" label={t('Nombre de chambres')} value={details.roomCount} onChange={set('roomCount')} error={e('roomCount')} disabled={disabled} />
            </div>
          </div>
          <div>
            <label htmlFor="hotel-description" className="form-label">{t('Présentation')}</label>
            <textarea id="hotel-description" rows={5} maxLength={2000} className="form-input w-full" value={details.description} disabled={disabled} onChange={set('description')} />
            {e('description') && <p className="mt-1 text-sm text-[var(--state-critical)]">{e('description')}</p>}
          </div>
          <AudienceField value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>

        <Section title={t('En ligne')}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField inputMode="url" label={t('Site web')} placeholder="https://" value={details.website} onChange={set('website')} error={e('website')} disabled={disabled} />
            <FormField inputMode="url" label="Instagram" placeholder="https://instagram.com/…" value={details.instagramUrl} onChange={set('instagramUrl')} error={e('instagramUrl')} disabled={disabled} />
            <FormField inputMode="url" label="Facebook" placeholder="https://facebook.com/…" value={details.facebookUrl} onChange={set('facebookUrl')} error={e('facebookUrl')} disabled={disabled} />
            <FormField inputMode="url" label="YouTube" placeholder="https://youtube.com/…" value={details.youtubeUrl} onChange={set('youtubeUrl')} error={e('youtubeUrl')} disabled={disabled} />
          </div>
        </Section>

        <Section title={t('Photos')}>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(ev) => uploadPhotos(Array.from(ev.target.files || []))} />
          <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="btn-secondary flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? t('Téléversement…') : t('Ajouter des photos')}
          </button>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {photos.map((p) => (
                <div key={p.id} className="group relative">
                  <img decoding="async" loading="lazy" src={normalizeImageUrl(p.url)} alt="" className="h-36 w-full rounded-card object-cover" />
                  <button onClick={() => removePhoto(p)} aria-label={t('Retirer cette photo')} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white md:opacity-0 md:group-hover:opacity-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-content-secondary">{t('Aucune photo pour le moment.')}</p>
          )}
        </Section>

        <Section title={t('Espaces de représentation')}>
          <SpacesSection spaces={spaces} onChange={setSpaces} errors={errors} disabled={disabled} />
        </Section>

        <Section title={t('Ambiance & identité')}>
          <AmbianceSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>
        <Section title={t('Équipement technique')}>
          <EquipmentSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>
        <Section title={t('Conditions de collaboration')}>
          <CollaborationSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>
        <Section title={t('Logistique pour l’artiste')}>
          <LogisticsSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>
        <Section title={t('Liberté artistique & attentes')}>
          <FreedomSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>
        <Section title={t('Validation et processus')}>
          <ValidationSection value={programme} onChange={(p) => setProgramme({ ...programme, ...p })} errors={errors} disabled={disabled} />
        </Section>

        <Section title={t('Contact principal')}>
          <p className="text-sm text-content-secondary">{t('Communiqué à l’artiste uniquement une fois une résidence confirmée.')}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label={t('Nom')} value={details.responsibleName} onChange={set('responsibleName')} error={e('responsibleName')} disabled={disabled} />
            <FormField type="email" label="E-mail" value={details.responsibleEmail} onChange={set('responsibleEmail')} error={e('responsibleEmail')} disabled={disabled} />
            <FormField type="tel" label={t('Téléphone (WhatsApp)')} value={details.responsiblePhone} onChange={set('responsiblePhone')} error={e('responsiblePhone')} disabled={disabled} />
            <FormField type="tel" label={t('Téléphone de l’établissement')} value={details.contactPhone} onChange={set('contactPhone')} error={e('contactPhone')} disabled={disabled} />
          </div>
        </Section>

        {isEditing && (
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn-gold flex items-center gap-2">
              <Save size={16} aria-hidden="true" />
              {saving ? t('Enregistrement…') : t('Enregistrer les modifications')}
            </button>
          </div>
        )}

        <PrivacyControls />
      </div>
    </div>
  )
}

export default HotelProfile
