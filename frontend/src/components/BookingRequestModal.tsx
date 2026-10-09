import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { BOARD_LABELS, BOARD_TYPES, TRANSPORT_LABELS, TRANSPORT_TERMS, bookingCreateSchema, fieldErrors } from '@shared/validation'
import { bookingsApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * A hotel asks an artist for a residency, with the terms the exchange
 * convention will carry: dates, the stay for two (and the companion's name
 * if known), the board, who pays the journey, the performance expected, and
 * what each side's contribution is worth. Nobody is paid; the stay is the
 * counterpart of the performance.
 *
 * Checked with the same schema the API uses, so a mistake is shown under its
 * field before anything is sent.
 */

interface Props {
  hotelId: string
  artistId: string
  artistName: string
  /** Credits this artist costs, when the API shared it. */
  creditCost?: number
  /** The artist's declared season, to suggest dates inside it. */
  seasonFrom?: string | null
  onClose: () => void
  onCreated?: () => void
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

const BookingRequestModal: React.FC<Props> = ({ hotelId, artistId, artistName, creditCost, seasonFrom, onClose, onCreated }) => {
  const initialStart = useMemo(() => {
    const week = new Date(Date.now() + 7 * 86400000)
    const season = seasonFrom ? new Date(seasonFrom) : null
    return season && season > week ? season : week
  }, [seasonFrom])

  const [form, setForm] = useState({
    start: isoDay(initialStart),
    end: isoDay(new Date(initialStart.getTime() + 5 * 86400000)),
    boardType: '',
    transportTerms: '',
    transportNotes: '',
    companionName: '',
    performanceDescription: '',
    performanceSchedule: '',
    stayValue: '',
    performanceValue: '',
    notes: '',
    roomType: '',
    includedServices: '',
    performanceLocation: '',
    performanceDuration: '',
    technicalConditions: '',
    socialContent: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => {
      const next = { ...errs }
      delete next[key]
      if (key === 'start') delete next.startDate
      if (key === 'end') delete next.endDate
      return next
    })
  }

  const payload = () => ({
    hotelId,
    artistId,
    // Arrival in the afternoon, departure in the morning, as hotels count nights.
    startDate: form.start ? new Date(`${form.start}T15:00:00`).toISOString() : '',
    endDate: form.end ? new Date(`${form.end}T11:00:00`).toISOString() : '',
    boardType: form.boardType || undefined,
    transportTerms: form.transportTerms || undefined,
    transportNotes: form.transportNotes,
    companionName: form.companionName,
    performanceDescription: form.performanceDescription,
    performanceSchedule: form.performanceSchedule,
    stayValue: form.stayValue,
    performanceValue: form.performanceValue,
    notes: form.notes,
    roomType: form.roomType,
    includedServices: form.includedServices,
    performanceLocation: form.performanceLocation,
    performanceDuration: form.performanceDuration,
    technicalConditions: form.technicalConditions,
    socialContent: form.socialContent,
  })

  const submit = async () => {
    const body = payload()
    const check = bookingCreateSchema.safeParse(body)
    if (!check.success) {
      setErrors(fieldErrors(check.error))
      return
    }
    setSending(true)
    try {
      await bookingsApi.create(body as any)
      toast.success(t('Demande envoyée à {name}', { name: artistName }))
      onCreated?.()
      onClose()
    } catch (e: any) {
      const apiError = e?.response?.data?.error
      if (apiError?.fields) setErrors(apiError.fields)
      toast.error(apiError?.message || t('Impossible de créer la réservation'))
    } finally {
      setSending(false)
    }
  }

  const field = (key: string) => (errors[key] ? <p className="form-error mt-1 text-sm text-[var(--state-critical)]">{t(errors[key])}</p> : null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card bg-surface-raised p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="booking-modal-title" className="font-serif text-xl font-semibold text-content">
          {t('Proposer une résidence à {name}', { name: artistName })}
        </h3>
        <p className="mt-1 text-sm text-content-secondary">
          {t('Séjour pour deux personnes, sans rémunération : le séjour est la contrepartie de la prestation.')}
          {creditCost ? ` ${t('Cette demande utilise {n} crédits, restitués si l’artiste refuse.', { n: String(creditCost) })}` : ''}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="bk-start">{t('Arrivée')}</label>
            <input id="bk-start" type="date" className="form-input w-full" value={form.start} onChange={set('start')} />
            {field('startDate')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-end">{t('Départ')}</label>
            <input id="bk-end" type="date" className="form-input w-full" value={form.end} min={form.start} onChange={set('end')} />
            {field('endDate')}
          </div>

          <div>
            <label className="form-label" htmlFor="bk-board">{t('Formule de repas')}</label>
            <select id="bk-board" className="form-input w-full" value={form.boardType} onChange={set('boardType')}>
              <option value="">{t('Choisir…')}</option>
              {BOARD_TYPES.map((b) => (
                <option key={b} value={b}>{t(BOARD_LABELS[b])}</option>
              ))}
            </select>
            {field('boardType')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-transport">{t('Transport')}</label>
            <select id="bk-transport" className="form-input w-full" value={form.transportTerms} onChange={set('transportTerms')}>
              <option value="">{t('Choisir…')}</option>
              {TRANSPORT_TERMS.map((tt) => (
                <option key={tt} value={tt}>{t(TRANSPORT_LABELS[tt])}</option>
              ))}
            </select>
            {field('transportTerms')}
          </div>

          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="bk-perf">{t('Prestation attendue')}</label>
            <textarea
              id="bk-perf"
              rows={3}
              maxLength={2000}
              className="form-input w-full"
              placeholder={t('Ex. : trois sets d’une heure au rooftop, du jeudi au samedi')}
              value={form.performanceDescription}
              onChange={set('performanceDescription')}
            />
            {field('performanceDescription')}
          </div>

          <div>
            <label className="form-label" htmlFor="bk-schedule">{t('Horaires (facultatif)')}</label>
            <input id="bk-schedule" className="form-input w-full" maxLength={500} placeholder="19h – 22h" value={form.performanceSchedule} onChange={set('performanceSchedule')} />
            {field('performanceSchedule')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-companion">{t('Accompagnant (facultatif)')}</label>
            <input id="bk-companion" className="form-input w-full" maxLength={100} placeholder={t('Nom, si connu')} value={form.companionName} onChange={set('companionName')} />
            {field('companionName')}
          </div>

          <div>
            <label className="form-label" htmlFor="bk-stay">{t('Valeur du séjour (€)')}</label>
            <input id="bk-stay" inputMode="decimal" className="form-input w-full" value={form.stayValue} onChange={set('stayValue')} />
            {field('stayValue')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-value">{t('Valeur de la prestation (€)')}</label>
            <input id="bk-value" inputMode="decimal" className="form-input w-full" value={form.performanceValue} onChange={set('performanceValue')} />
            {field('performanceValue')}
          </div>

          <div>
            <label className="form-label" htmlFor="bk-room">{t('Type de chambre (facultatif)')}</label>
            <input id="bk-room" className="form-input w-full" maxLength={100} placeholder={t('Ex. : suite vue mer')} value={form.roomType} onChange={set('roomType')} />
            {field('roomType')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-location">{t('Lieu de la prestation (facultatif)')}</label>
            <input id="bk-location" className="form-input w-full" maxLength={200} placeholder={t('Ex. : rooftop, salle de yoga')} value={form.performanceLocation} onChange={set('performanceLocation')} />
            {field('performanceLocation')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-duration">{t('Durée totale de la prestation (facultatif)')}</label>
            <input id="bk-duration" className="form-input w-full" maxLength={100} placeholder={t('Ex. : 3 × 1 heure')} value={form.performanceDuration} onChange={set('performanceDuration')} />
            {field('performanceDuration')}
          </div>
          <div>
            <label className="form-label" htmlFor="bk-included">{t('Prestations incluses en plus (facultatif)')}</label>
            <input id="bk-included" className="form-input w-full" maxLength={1000} placeholder={t('Séparées par des points-virgules : spa ; transfert aéroport')} value={form.includedServices} onChange={set('includedServices')} />
            {field('includedServices')}
          </div>
          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="bk-technical">{t('Conditions techniques (facultatif)')}</label>
            <input id="bk-technical" className="form-input w-full" maxLength={1000} placeholder={t('Son, micros, éclairage, matériel fourni…')} value={form.technicalConditions} onChange={set('technicalConditions')} />
            {field('technicalConditions')}
          </div>
          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="bk-social">{t('Publications attendues de l’artiste (facultatif)')}</label>
            <input id="bk-social" className="form-input w-full" maxLength={1000} placeholder={t('Ex. : 1 reel et 3 stories mentionnant l’hôtel. Laissez vide si aucune.')} value={form.socialContent} onChange={set('socialContent')} />
            {field('socialContent')}
          </div>

          {form.transportTerms && form.transportTerms !== 'NOT_NEEDED' && (
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="bk-transport-notes">{t('Précisions sur le transport (facultatif)')}</label>
              <input id="bk-transport-notes" className="form-input w-full" maxLength={500} value={form.transportNotes} onChange={set('transportNotes')} />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="bk-notes">{t('Message à l’artiste (facultatif)')}</label>
            <textarea id="bk-notes" rows={2} maxLength={1000} className="form-input w-full" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <p className="mt-4 text-[0.8125rem] text-content-secondary">
          {t('Ces conditions sont reprises telles quelles dans la convention que vous signerez tous les deux. Conseil : demandez à l’artiste de n’acheter aucun billet avant la signature.')}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>{t('Annuler')}</button>
          <button className="btn-primary" disabled={sending} onClick={submit}>
            {sending ? t('Envoi…') : t('Envoyer la demande')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingRequestModal
