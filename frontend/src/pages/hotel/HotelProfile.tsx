import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Edit3, MapPin, Building, Plus, Trash2, AlertCircle } from 'lucide-react'
import { hotelsApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * Hotel profile.
 *
 * This screen previously rendered a hardcoded Plaza Athenee profile and its
 * save handler was an empty function with a "Save profile logic here" comment.
 * Every hotel saw another hotel's details, edited them, and was told the save
 * succeeded while nothing was written.
 *
 * It now loads from GET /hotels/me and writes through PUT /hotels/me, sending
 * only the fields hotelProfileSchema accepts.
 *
 * location, images and performanceSpots are stored as JSON strings server-side,
 * so they are parsed on load and re-serialised on save.
 */

interface PerformanceSpot {
  name: string
  capacity: number
  description: string
}

interface HotelLocation {
  city: string
  country: string
  coords?: { lat: number; lng: number }
}

const emptyLocation: HotelLocation = { city: '', country: '' }

/** Server stores these columns as JSON strings; tolerate bad data rather than crash. */
const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (!value) return fallback
  if (typeof value !== 'string') return (value as T) ?? fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const HotelProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<HotelLocation>(emptyLocation)
  const [contactPhone, setContactPhone] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [responsibleEmail, setResponsibleEmail] = useState('')
  const [spots, setSpots] = useState<PerformanceSpot[]>([])

  const applyProfile = (hotel: any) => {
    setName(hotel?.name ?? '')
    setDescription(hotel?.description ?? '')
    setLocation(parseJson<HotelLocation>(hotel?.location, emptyLocation))
    setContactPhone(hotel?.contactPhone ?? '')
    setResponsibleName(hotel?.responsibleName ?? '')
    setResponsibleEmail(hotel?.responsibleEmail ?? '')
    setSpots(parseJson<PerformanceSpot[]>(hotel?.performanceSpots, []))
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await hotelsApi.getMyProfile()
        if (cancelled) return
        applyProfile(response.data?.data ?? response.data)
        setError(null)
      } catch (err: any) {
        if (cancelled) return
        setError(
          err?.response?.status === 404
            ? 'No hotel profile exists for this account yet. Fill this in and save to create one.'
            : 'Could not load your profile. Please try again.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      // Only the fields the server's schema accepts, with the JSON columns
      // serialised the way it expects them.
      const response = await hotelsApi.updateProfile(undefined, {
        name,
        description,
        location: JSON.stringify(location),
        contactPhone,
        responsibleName,
        responsibleEmail,
        performanceSpots: JSON.stringify(spots),
      })

      applyProfile(response.data?.data ?? response.data)
      setIsEditing(false)
      setNotice('Profile saved.')
    } catch (err: any) {
      // Surface the real reason. The previous implementation reported success
      // unconditionally, which is how a silent failure survives to production.
      const detail =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'Vos modifications n’ont pas été enregistrées. Veuillez réessayer.'
      setError(detail)
    } finally {
      setSaving(false)
    }
  }

  const updateSpot = (index: number, patch: Partial<PerformanceSpot>) => {
    setSpots((current) =>
      current.map((spot, i) => (i === index ? { ...spot, ...patch } : spot))
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="h-10 w-64 rounded-card bg-[var(--surface-sunken)] animate-pulse" />
        <div className="h-64 rounded-card bg-[var(--surface-sunken)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-serif text-[var(--text-primary)] mb-2">{t('Profil de l’hôtel')}</h1>
            <p className="text-[var(--text-secondary)]">
              {t('C’est ce que voient les artistes lorsque vous les sollicitez.')}
            </p>
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="btn-secondary"
              >
                {t('Annuler')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-gold flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={16} strokeWidth={1.5} aria-hidden="true" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsEditing(true); setNotice(null) }}
              className="btn-gold flex items-center gap-2"
            >
              <Edit3 size={16} strokeWidth={1.5} aria-hidden="true" />
              Edit profile
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="notice-critical"
          >
            <AlertCircle size={18} strokeWidth={1.5} className="shrink-0 mt-px" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-200"
          >
            {notice}
          </div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel p-6 space-y-6"
        >
          <h2 className="font-serif text-xl text-[var(--text-primary)] flex items-center gap-2">
            <Building size={18} strokeWidth={1.5} aria-hidden="true" />
            {t('Détails')}
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="hotel-name" className="form-label">{t('Nom de l’hôtel')}</label>
              <input
                id="hotel-name"
                className="form-input"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="hotel-phone" className="form-label">Contact phone</label>
              <input
                id="hotel-phone"
                className="form-input"
                value={contactPhone}
                disabled={!isEditing}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="hotel-city" className="form-label">City</label>
              <input
                id="hotel-city"
                className="form-input"
                value={location.city}
                disabled={!isEditing}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="hotel-country" className="form-label">Country</label>
              <input
                id="hotel-country"
                className="form-input"
                value={location.country}
                disabled={!isEditing}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="hotel-description" className="form-label">Description</label>
            <textarea
              id="hotel-description"
              rows={5}
              className="form-input"
              value={description}
              disabled={!isEditing}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {t('Entre 10 et 1000 caractères.')}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="panel p-6 space-y-6"
        >
          <h2 className="font-serif text-xl text-[var(--text-primary)] flex items-center gap-2">
            <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
            Performance spaces
          </h2>

          {spots.length === 0 && (
            <p className="text-[var(--text-secondary)]">
              {t('Aucun espace renseigné. Les artistes s’appuient dessus pour juger si votre lieu convient à leur travail.')}
            </p>
          )}

          <div className="space-y-5">
            {spots.map((spot, index) => (
              <div
                key={index}
                className="grid gap-4 md:grid-cols-[2fr_1fr_auto] items-end border-t border-[var(--border-subtle)] pt-5 first:border-0 first:pt-0"
              >
                <div>
                  <label htmlFor={`spot-name-${index}`} className="form-label">Nom</label>
                  <input
                    id={`spot-name-${index}`}
                    className="form-input"
                    value={spot.name ?? ''}
                    disabled={!isEditing}
                    onChange={(e) => updateSpot(index, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`spot-capacity-${index}`} className="form-label">{t('Capacité')}</label>
                  <input
                    id={`spot-capacity-${index}`}
                    type="number"
                    min={0}
                    className="form-input"
                    value={spot.capacity ?? 0}
                    disabled={!isEditing}
                    onChange={(e) => updateSpot(index, { capacity: Number(e.target.value) })}
                  />
                </div>
                {isEditing && (
                  <button
                    onClick={() => setSpots(spots.filter((_, i) => i !== index))}
                    aria-label={`Remove ${spot.name || 'space'}`}
                    className="btn-secondary !px-4"
                  >
                    <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <button
              onClick={() => setSpots([...spots, { name: '', capacity: 0, description: '' }])}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
              Add a space
            </button>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="panel p-6 space-y-6"
        >
          <h2 className="font-serif text-xl text-[var(--text-primary)]">Contact principal</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="rep-name" className="form-label">Nom</label>
              <input
                id="rep-name"
                className="form-input"
                value={responsibleName}
                disabled={!isEditing}
                onChange={(e) => setResponsibleName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rep-email" className="form-label">E-mail</label>
              <input
                id="rep-email"
                type="email"
                className="form-input"
                value={responsibleEmail}
                disabled={!isEditing}
                onChange={(e) => setResponsibleEmail(e.target.value)}
              />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default HotelProfile
