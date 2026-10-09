import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SimpleNavbar from '../SimpleNavbar'
import Footer from '../Footer'
import StepIndicator from './StepIndicator'
import FormField from '../FormField'
import SelectWithSearch from './SelectWithSearch'
import { useAuthStore } from '@/store/authStore'
import { countryOptions } from '@/i18n/countries'
import { COUNTRY_NAMES } from '@shared/countries'
import { fieldErrors, hotelRegistrationSchema } from '@shared/validation'
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
  emptyProgramme,
  programmePayload,
  spacesPayload,
} from '../hotel/HotelFormSections'
import { Captcha, EmailSuggestion, apiFieldErrors, apiMessage, captchaEnabled, useAvailabilityCheck, useDraft } from './registrationKit'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'

/**
 * Hotel registration in seven steps. Step 1 is the account and the
 * establishment; steps 2 to 7 are the programme questions, each saved as its
 * own field (they used to be folded into one paragraph that then became the
 * hotel's public description). Same shared rules as the API, field-level
 * errors, live duplicate checks, and a draft that survives a refresh.
 */

interface General {
  name: string
  country: string
  city: string
  address: string
  hotelType: string
  roomCount: string
  description: string
  website: string
  instagramUrl: string
  facebookUrl: string
  youtubeUrl: string
  contactName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface Draft {
  step: number
  general: General
  spaces: SpaceForm[]
  programme: ProgrammeForm
  acceptTerms: boolean
}

const INITIAL: Draft = {
  step: 1,
  general: {
    name: '', country: '', city: '', address: '', hotelType: '', roomCount: '', description: '',
    website: '', instagramUrl: '', facebookUrl: '', youtubeUrl: '',
    contactName: '', email: '', phone: '', password: '', confirmPassword: '',
  },
  spaces: [],
  programme: emptyProgramme(),
  acceptTerms: false,
}

const GENERAL_FIELDS = ['name', 'country', 'city', 'address', 'hotelType', 'roomCount', 'description', 'website', 'instagramUrl', 'facebookUrl', 'youtubeUrl', 'contactName', 'email', 'phone', 'password', 'confirmPassword', 'programme.audiences']
const PROGRAMME_STEP: Record<string, number> = {
  styles: 2, eventTypes: 2, appreciated: 2, disliked: 2,
  hasStage: 3, stageDimensions: 3, hasSound: 3, soundDetails: 3, lighting: 3, hasScreens: 3, hasCrew: 3,
  collaborationTypes: 4, conditions: 4, durationType: 4, residenceDuration: 4, openDates: 4,
  offersLodging: 5, offersMeals: 5, offersTransport: 5, facilities: 5,
  freedomLevel: 6, expectations: 6, possibilities: 6, otherDetails: 6, artistTypesNeeded: 6, flowDescription: 6, perWeek: 6, perMonth: 6,
  responseDelay: 7, validationProcess: 7, decisionMaker: 7,
}

const stepOf = (field: string): number => {
  if (GENERAL_FIELDS.includes(field)) return 1
  if (field.startsWith('spaces')) return 3
  if (field.startsWith('programme.')) return PROGRAMME_STEP[field.split('.')[1]] ?? 1
  return 7
}

const STEP_TITLES = ['Établissement', 'Ambiance', 'Espaces & équipement', 'Collaboration', 'Logistique', 'Liberté artistique', 'Validation']

const HotelRegistrationFlow: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [draft, setDraft, clearDraft] = useDraft<Draft>('travel-art:register:hotel', INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Bumped after a refused submit: the token it carried is spent.
  const [captchaReset, setCaptchaReset] = useState(0)
  // Passwords are kept out of the stored draft.
  const [secrets, setSecrets] = useState({ password: '', confirmPassword: '' })

  const g = draft.general

  // Passwords are never kept in the saved draft (see the artist flow).
  useEffect(() => {
    if (draft.step > 1) {
      setDraft((d) => ({ ...d, step: 1 }))
      toast(t('Votre saisie a été conservée. Pour votre sécurité, ressaisissez votre mot de passe.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const countries = useMemo(() => countryOptions(COUNTRY_NAMES as string[]), [])
  const live = useAvailabilityCheck({ email: g.email, phone: g.phone, country: g.country, hotelName: g.name, city: g.city }, draft.step === 1)

  const payload = () => ({
    role: 'HOTEL' as const,
    name: g.name,
    contactName: g.contactName,
    city: g.city,
    country: g.country,
    address: g.address || null,
    hotelType: g.hotelType || null,
    roomCount: g.roomCount || null,
    description: g.description || null,
    website: g.website || null,
    instagramUrl: g.instagramUrl || null,
    facebookUrl: g.facebookUrl || null,
    youtubeUrl: g.youtubeUrl || null,
    email: g.email,
    phone: g.phone,
    password: secrets.password,
    spaces: spacesPayload(draft.spaces),
    programme: programmePayload(draft.programme),
    acceptTerms: draft.acceptTerms,
    locale: 'fr',
    captchaToken,
  })

  const allErrors = () => {
    const result = hotelRegistrationSchema.safeParse(payload())
    const errs: Record<string, string> = result.success ? {} : fieldErrors(result.error)
    if (secrets.password && secrets.password !== secrets.confirmPassword) errs.confirmPassword = 'Les deux mots de passe ne correspondent pas'
    if (captchaEnabled && !captchaToken) errs.captchaToken = 'Cochez la vérification anti-robot'
    return errs
  }

  const goTo = (step: number) => {
    setDraft((d) => ({ ...d, step }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setGeneral = (key: keyof General) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setDraft((d) => ({ ...d, general: { ...d.general, [key]: value } }))
    setErrors((errs) => {
      const next = { ...errs }
      delete next[key]
      return next
    })
  }

  const setProgramme = (patch: Partial<ProgrammeForm>) => setDraft((d) => ({ ...d, programme: { ...d.programme, ...patch } }))

  const next = () => {
    const errs = { ...(draft.step === 1 ? live.fields : {}), ...allErrors() }
    const stepErrors = Object.fromEntries(Object.entries(errs).filter(([field]) => stepOf(field) === draft.step && field !== 'acceptTerms'))
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors)
      toast.error(t('Vérifiez les champs signalés'))
      return
    }
    setErrors({})
    goTo(draft.step + 1)
  }

  const submit = async () => {
    const errs = allErrors()
    if (Object.keys(errs).length) {
      setErrors(errs)
      goTo(Math.min(...Object.keys(errs).map(stepOf)))
      toast.error(t('Vérifiez les champs signalés'))
      return
    }
    setSubmitting(true)
    try {
      await register(payload() as any)
      clearDraft()
      navigate('/inscription-envoyee', { state: { role: 'HOTEL', email: g.email.trim().toLowerCase() } })
    } catch (error: any) {
      setCaptchaReset((n) => n + 1)
      const fields = apiFieldErrors(error)
      if (Object.keys(fields).length) {
        setErrors(fields)
        goTo(Math.min(...Object.keys(fields).map(stepOf)))
      }
      toast.error(apiMessage(error, t('Échec de l’inscription')))
    } finally {
      setSubmitting(false)
    }
  }

  const err = (field: string) => {
    const message = errors[field] ?? (draft.step === 1 ? live.fields[field] : undefined)
    return message ? t(message) : undefined
  }

  const nav = (
    <div className="flex justify-between pt-4">
      {draft.step > 1 ? <button type="button" onClick={() => goTo(draft.step - 1)} className="btn-secondary">{t('Retour')}</button> : <span />}
      {draft.step < 7 && <button type="button" onClick={next} className="btn-primary">{t('Continuer')}</button>}
    </div>
  )

  const heading = (title: string, lede: string) => (
    <div>
      <h2 className="mb-2 text-3xl font-bold text-content">{t(title)}</h2>
      <p className="text-content-secondary">{t(lede)}</p>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SimpleNavbar />
      <SEOHead title={t('Inscription hôtel — Travel Art')} description={t('Présentez votre établissement et rejoignez le réseau d’hôtels partenaires Travel Art.')} />
      <main className="container mx-auto flex-1 px-4 pb-12 pt-28 md:pb-16">
        <h1 className="sr-only">{t('Inscription hôtel')}</h1>
        <div className="mx-auto mb-12 max-w-3xl">
          <StepIndicator currentStep={draft.step} totalSteps={7} steps={STEP_TITLES.map((s) => t(s))} />
        </div>
        <motion.div
          key={draft.step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-3xl rounded-card border border-line bg-surface-raised p-6 shadow-2xl md:p-10"
        >
          {draft.step === 1 && (
            <div className="space-y-6">
              {heading('Informations générales sur l’hôtel', 'Ces informations permettent à l’artiste de comprendre le standing et l’ambiance.')}
              <FormField label={t('Nom de l’hôtel')} value={g.name} onChange={setGeneral('name')} error={err('name')} required maxLength={120} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectWithSearch label={t('Pays')} options={countries} value={g.country} onChange={(v) => setDraft((d) => ({ ...d, general: { ...d.general, country: v } }))} error={err('country')} required />
                <FormField label={t('Ville')} value={g.city} onChange={setGeneral('city')} error={err('city')} required maxLength={80} />
              </div>
              <FormField label={t('Adresse')} value={g.address} onChange={setGeneral('address')} error={err('address')} maxLength={200} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectWithSearch label={t('Type d’hôtel')} options={HOTEL_TYPES.map((v) => ({ value: v, label: t(v) }))} value={g.hotelType} onChange={(v) => setDraft((d) => ({ ...d, general: { ...d.general, hotelType: v } }))} />
                <FormField inputMode="numeric" label={t('Nombre de chambres')} placeholder="Ex. : 40" value={g.roomCount} onChange={setGeneral('roomCount')} error={err('roomCount')} />
              </div>
              <AudienceField value={draft.programme} onChange={setProgramme} errors={errors} />
              <div>
                <label className="form-label" htmlFor="hotel-description">{t('Présentation de l’hôtel (visible des artistes)')}</label>
                <textarea id="hotel-description" rows={4} maxLength={2000} className="form-input w-full" value={g.description} onChange={setGeneral('description')} />
                {err('description') && <p className="mt-1 text-sm text-[var(--state-critical)]">{err('description')}</p>}
              </div>
              <FormField inputMode="url" label={t('Site web')} placeholder="https://" value={g.website} onChange={setGeneral('website')} error={err('website')} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField inputMode="url" label="Instagram" placeholder="https://instagram.com/…" value={g.instagramUrl} onChange={setGeneral('instagramUrl')} error={err('instagramUrl')} />
                <FormField inputMode="url" label="Facebook" placeholder="https://facebook.com/…" value={g.facebookUrl} onChange={setGeneral('facebookUrl')} error={err('facebookUrl')} />
                <FormField inputMode="url" label="YouTube" placeholder="https://youtube.com/…" value={g.youtubeUrl} onChange={setGeneral('youtubeUrl')} error={err('youtubeUrl')} />
              </div>

              <div className="border-t border-line pt-6">
                <h3 className="mb-4 text-lg font-semibold text-content">{t('Votre compte')}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label={t('Nom et prénom du responsable')} autoComplete="name" value={g.contactName} onChange={setGeneral('contactName')} error={err('contactName')} required maxLength={100} />
                  <FormField type="tel" autoComplete="tel" label={t('Téléphone')} placeholder="05 24 …" value={g.phone} onChange={setGeneral('phone')} error={err('phone')} required />
                </div>
                <div className="mt-4">
                  <FormField type="email" autoComplete="email" label={t('E-mail de connexion')} placeholder="contact@votre-hotel.com" value={g.email} onChange={setGeneral('email')} error={err('email')} required />
                  <EmailSuggestion suggestion={live.suggestion} onAccept={(email) => setDraft((d) => ({ ...d, general: { ...d.general, email } }))} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    type="password"
                    autoComplete="new-password"
                    showPasswordToggle
                    label={t('Mot de passe')}
                    value={secrets.password}
                    onChange={(e) => { setSecrets((s) => ({ ...s, password: e.target.value })); setErrors((x) => ({ ...x, password: '' })) }}
                    error={err('password') || undefined}
                    hint={t('8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial')}
                    required
                  />
                  <FormField
                    type="password"
                    autoComplete="new-password"
                    showPasswordToggle
                    label={t('Confirmer le mot de passe')}
                    value={secrets.confirmPassword}
                    onChange={(e) => { setSecrets((s) => ({ ...s, confirmPassword: e.target.value })); setErrors((x) => ({ ...x, confirmPassword: '' })) }}
                    error={err('confirmPassword') || undefined}
                    required
                  />
                </div>
              </div>
              {nav}
            </div>
          )}

          {draft.step === 2 && (
            <div className="space-y-6">
              {heading('Ambiance & identité artistique', 'Aidez l’artiste à comprendre ce qui colle ou non.')}
              <AmbianceSection value={draft.programme} onChange={setProgramme} errors={errors} />
              {nav}
            </div>
          )}

          {draft.step === 3 && (
            <div className="space-y-8">
              {heading('Espaces & équipement technique', 'Décrivez les espaces où l’artiste se produira et ce qui est mis à disposition.')}
              <SpacesSection spaces={draft.spaces} onChange={(spaces) => setDraft((d) => ({ ...d, spaces }))} errors={errors} />
              <EquipmentSection value={draft.programme} onChange={setProgramme} errors={errors} />
              {nav}
            </div>
          )}

          {draft.step === 4 && (
            <div className="space-y-6">
              {heading('Conditions de collaboration', 'Le séjour pour deux est la contrepartie de la prestation ; précisez le cadre.')}
              <CollaborationSection value={draft.programme} onChange={setProgramme} errors={errors} />
              {nav}
            </div>
          )}

          {draft.step === 5 && (
            <div className="space-y-6">
              {heading('Logistique pour l’artiste', 'Précisez les éléments qui aident l’artiste à se projeter.')}
              <LogisticsSection value={draft.programme} onChange={setProgramme} errors={errors} />
              {nav}
            </div>
          )}

          {draft.step === 6 && (
            <div className="space-y-6">
              {heading('Liberté artistique & attentes', 'Donnez le cadre pour que l’artiste se sente libre.')}
              <FreedomSection value={draft.programme} onChange={setProgramme} errors={errors} />
              {nav}
            </div>
          )}

          {draft.step === 7 && (
            <div className="space-y-6">
              {heading('Validation et processus', 'Fluidifiez la plateforme avec un process clair.')}
              <ValidationSection value={draft.programme} onChange={setProgramme} errors={errors} />
              <label className="flex cursor-pointer items-start gap-3 pt-4">
                <input
                  type="checkbox"
                  checked={draft.acceptTerms}
                  onChange={(e) => setDraft((d) => ({ ...d, acceptTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 shrink-0 accent-gold"
                  data-testid="hotel-accept-terms"
                />
                <span className="text-sm text-content-secondary">
                  {t('J’ai lu et j’accepte les')}{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gold underline">{t('conditions générales')}</a>{' '}
                  {t('et la')}{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold underline">{t('politique de confidentialité')}</a>.
                </span>
              </label>
              {err('acceptTerms') && <p className="text-sm text-[var(--state-critical)]">{err('acceptTerms')}</p>}
              <Captcha onToken={setCaptchaToken} action="register" resetKey={captchaReset} />
              {err('captchaToken') && <p className="text-sm text-[var(--state-critical)]">{err('captchaToken')}</p>}
              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => goTo(6)} className="btn-secondary">{t('Retour')}</button>
                <button type="button" onClick={submit} className="btn-primary" disabled={submitting || !draft.acceptTerms}>
                  {submitting ? t('Envoi…') : t('Envoyer ma candidature')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-content-secondary">
          {t('Vos coordonnées ne sont communiquées à un artiste qu’une fois une résidence confirmée.')}
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default HotelRegistrationFlow
