import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Edit2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import SimpleNavbar from '../SimpleNavbar'
import Footer from '../Footer'
import FormField from '../FormField'
import StepIndicator from './StepIndicator'
import DatePicker from './DatePicker'
import SelectWithSearch from './SelectWithSearch'
import CheckboxGroup from './CheckboxGroup'
import CategoryFields from './CategoryFields'
import { Captcha, EmailSuggestion, apiFieldErrors, apiMessage, captchaEnabled, readReferralCode, useAvailabilityCheck, useDraft } from './registrationKit'
import { countryLabel, countryOptions } from '@/i18n/countries'
import { COUNTRY_NAMES } from '@shared/countries'
import { AUDIENCE_TYPES, LANGUAGES, MAIN_CATEGORIES, disciplineLabel } from '@shared/categories'
import { MAX_SIGNUP_VIDEOS, artistRegistrationSchema, fieldErrors } from '@shared/validation'
import { parseVideoUrl } from '@shared/media'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'

/**
 * Artist registration: who you are, what you do, and a last look.
 *
 * Every rule comes from the shared schema the API enforces, so a mistake is
 * shown under its own field, on its own step, before anything is sent - and
 * the API answers in the same terms if it still finds one (a stage name taken
 * a second ago, say). The form survives a refresh; passwords are never kept.
 */

interface Draft {
  step: number
  firstName: string
  lastName: string
  stageName: string
  birthDate: string
  country: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  mainCategory: string
  categoryType: string
  specificCategory: string
  tributeTo: string
  secondaryCategory: string
  audienceTypes: string[]
  languages: string[]
  otherLanguages: string
  /** Links to the artist's own performances; one to three. */
  videoUrls: string[]
  acceptTerms: boolean
}

const INITIAL: Draft = {
  step: 1,
  firstName: '',
  lastName: '',
  stageName: '',
  birthDate: '',
  country: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  mainCategory: '',
  categoryType: '',
  specificCategory: '',
  tributeTo: '',
  secondaryCategory: '',
  audienceTypes: [],
  languages: [],
  otherLanguages: '',
  videoUrls: [''],
  acceptTerms: false,
}

const STEP_FIELDS: Record<number, string[]> = {
  1: ['firstName', 'lastName', 'stageName', 'birthDate', 'country', 'phone', 'email', 'password', 'confirmPassword'],
  2: ['mainCategory', 'categoryType', 'specificCategory', 'tributeTo', 'secondaryCategory', 'audienceTypes', 'languages', 'otherLanguages', 'videoUrls'],
  3: ['acceptTerms', 'captchaToken'],
}

const stepOf = (field: string) => Number(Object.keys(STEP_FIELDS).find((s) => STEP_FIELDS[Number(s)].includes(field.split('.')[0])) ?? 3)

const ArtistRegistrationFlow: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [draft, setDraft, clearDraft] = useDraft<Draft>('travel-art:register:artist', INITIAL, ['password', 'confirmPassword'])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Bumped after a refused submit: the token it carried is spent.
  const [captchaReset, setCaptchaReset] = useState(0)

  const countries = useMemo(() => countryOptions(COUNTRY_NAMES as string[]), [])

  // Passwords are never kept in the saved draft. A draft restored past step 1
  // therefore has none: say so and go back to where they are typed, instead
  // of failing at the very end.
  useEffect(() => {
    if (draft.step > 1 && !draft.password) {
      setDraft((d) => ({ ...d, step: 1 }))
      toast(t('Votre saisie a été conservée. Pour votre sécurité, ressaisissez votre mot de passe.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const live = useAvailabilityCheck(
    { email: draft.email, phone: draft.phone, country: draft.country, stageName: draft.stageName },
    draft.step === 1
  )

  const payload = () => ({
    role: 'ARTIST' as const,
    firstName: draft.firstName,
    lastName: draft.lastName,
    stageName: draft.stageName,
    birthDate: draft.birthDate,
    country: draft.country,
    phone: draft.phone,
    email: draft.email,
    password: draft.password,
    mainCategory: draft.mainCategory,
    categoryType: draft.categoryType,
    specificCategory: draft.specificCategory || null,
    tributeTo: draft.tributeTo || null,
    secondaryCategory: draft.secondaryCategory || null,
    audienceTypes: draft.audienceTypes,
    languages: draft.languages,
    otherLanguages: draft.otherLanguages || null,
    videoUrls: (draft.videoUrls ?? []).map((v) => v.trim()).filter(Boolean),
    acceptTerms: draft.acceptTerms,
    locale: 'fr',
    referralCode: readReferralCode(),
    captchaToken,
  })

  /** Every problem with the form as it stands, field -> message. */
  const allErrors = (): Record<string, string> => {
    const result = artistRegistrationSchema.safeParse(payload())
    const errs = result.success ? {} : fieldErrors(result.error)
    if (draft.password && draft.password !== draft.confirmPassword) errs.confirmPassword = 'Les deux mots de passe ne correspondent pas'
    if (captchaEnabled && !captchaToken) errs.captchaToken = 'Cochez la vérification anti-robot'
    return errs
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  const goTo = (step: number) => {
    setDraft((d) => ({ ...d, step }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => {
    const errs = allErrors()
    // Live checks count too: a taken stage name stops the step like a bad one.
    const stepErrors = Object.fromEntries(
      Object.entries({ ...live.fields, ...errs }).filter(([field]) => STEP_FIELDS[draft.step].includes(field.split('.')[0]))
    )
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
      try { sessionStorage.removeItem('referralCode') } catch { /* ignore */ }
      navigate('/inscription-envoyee', { state: { role: 'ARTIST', email: draft.email.trim().toLowerCase() } })
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

  // An error shown under a field: the form's own, else the live check's.
  const err = (field: string) => {
    const message = errors[field] ?? (draft.step === 1 ? live.fields[field] : undefined)
    return message ? t(message) : undefined
  }

  const discipline = disciplineLabel({
    mainCategory: draft.mainCategory,
    categoryType: draft.categoryType,
    specificCategory: draft.specificCategory,
    tributeTo: draft.tributeTo,
  })

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SimpleNavbar />
      <SEOHead title={t('Inscription artiste — Travel Art')} description={t('Rejoignez le programme Travel Art : un séjour pour deux en échange de votre art.')} />
      <main className="container mx-auto flex-1 px-4 pb-12 pt-28 md:pb-16">
        <h1 className="sr-only">{t('Inscription artiste')}</h1>
        <div className="mx-auto mb-12 max-w-3xl">
          <StepIndicator currentStep={draft.step} totalSteps={3} steps={[t('Vous'), t('Votre art'), t('Vérification')]} />
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
              <div>
                <h2 className="mb-2 text-3xl font-bold text-content">{t('Vous')}</h2>
                <p className="text-content-secondary">{t('Vos vraies informations : elles figureront sur la convention.')}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label={t('Prénom')} autoComplete="given-name" value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} error={err('firstName')} required maxLength={50} />
                <FormField label={t('Nom')} autoComplete="family-name" value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} error={err('lastName')} required maxLength={50} />
              </div>
              <FormField
                label={t('Nom de scène')}
                value={draft.stageName}
                onChange={(e) => set('stageName', e.target.value)}
                error={err('stageName')}
                hint={t('Le nom sous lequel les hôtels vous découvriront')}
                required
                maxLength={60}
              />
              <DatePicker label={t('Date de naissance')} value={draft.birthDate} onChange={(v) => set('birthDate', v)} error={err('birthDate')} required />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectWithSearch label={t('Pays')} options={countries} value={draft.country} onChange={(v) => set('country', v)} error={err('country')} required />
                <FormField type="tel" autoComplete="tel" label={t('Téléphone')} placeholder="06 12 34 56 78" value={draft.phone} onChange={(e) => set('phone', e.target.value)} error={err('phone')} hint={t('Format local ou international (+212…)')} required />
              </div>
              <div>
                <FormField type="email" autoComplete="email" label="E-mail" value={draft.email} onChange={(e) => set('email', e.target.value)} error={err('email')} required />
                <EmailSuggestion suggestion={live.suggestion} onAccept={(email) => set('email', email)} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  type="password"
                  autoComplete="new-password"
                  showPasswordToggle
                  label={t('Mot de passe')}
                  value={draft.password}
                  onChange={(e) => set('password', e.target.value)}
                  error={err('password')}
                  hint={t('8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial')}
                  required
                />
                <FormField type="password" autoComplete="new-password" showPasswordToggle label={t('Confirmer le mot de passe')} value={draft.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} error={err('confirmPassword')} required />
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={next} className="btn-primary w-full md:w-auto">{t('Continuer')}</button>
              </div>
            </div>
          )}

          {draft.step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-content">{t('Votre art')}</h2>
                <p className="text-content-secondary">{t('Musique, arts plastiques, danse, bien-être, création de contenu : choisissez ce qui vous décrit le mieux.')}</p>
              </div>
              <CategoryFields
                value={draft}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, ...v }))
                  setErrors({})
                }}
                errors={errors}
              />
              <SelectWithSearch
                label={t('Catégorie secondaire (facultatif)')}
                options={[{ value: '', label: t('Aucune') }, ...MAIN_CATEGORIES.filter((c) => c !== draft.mainCategory).map((c) => ({ value: c, label: t(c) }))]}
                value={draft.secondaryCategory}
                onChange={(v) => set('secondaryCategory', v)}
                error={err('secondaryCategory')}
              />
              <CheckboxGroup
                name="audienceTypes"
                label={t('Public')}
                options={AUDIENCE_TYPES.map((v) => ({ value: v, label: t(v) }))}
                values={draft.audienceTypes}
                onChange={(v) => set('audienceTypes', v)}
                error={err('audienceTypes')}
                required
                layout="grid"
              />
              <CheckboxGroup
                name="languages"
                label={t('Langues parlées')}
                options={LANGUAGES.map((v) => ({ value: v, label: t(v) }))}
                values={draft.languages}
                onChange={(v) => set('languages', v)}
                error={err('languages')}
                required
                layout="grid"
              />
              {draft.languages.includes('Autre') && (
                <FormField label={t('Autres langues')} value={draft.otherLanguages} onChange={(e) => set('otherLanguages', e.target.value)} error={err('otherLanguages')} required maxLength={100} />
              )}
              <div className="space-y-3" data-testid="signup-videos">
                <div>
                  <h3 className="text-lg font-semibold text-content">{t('Vos vidéos')} *</h3>
                  <p className="text-sm text-content-secondary">
                    {t('Une à trois vidéos de vous en prestation, publiées depuis votre propre compte YouTube, Vimeo ou Instagram. Elles doivent être publiques ou non répertoriées.')}
                  </p>
                </div>
                {(draft.videoUrls ?? ['']).map((url, i) => {
                  const parsed = url.trim() ? parseVideoUrl(url) : null
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1">
                        <FormField
                          label={t('Lien de la vidéo {n}', { n: String(i + 1) })}
                          type="url"
                          inputMode="url"
                          placeholder="https://www.youtube.com/watch?v=…"
                          value={url}
                          onChange={(e) => {
                            const list = [...(draft.videoUrls ?? [''])]
                            list[i] = e.target.value
                            set('videoUrls', list)
                            setErrors((x) => {
                              const next = { ...x }
                              delete next[`videoUrls.${i}`]
                              return next
                            })
                          }}
                          error={err(`videoUrls.${i}`) || (url.trim() && !parsed ? t('Lien non reconnu : utilisez un lien YouTube, Vimeo ou Instagram') : undefined)}
                          hint={parsed ? (parsed.provider === 'INSTAGRAM' ? 'Instagram' : parsed.provider === 'VIMEO' ? 'Vimeo' : 'YouTube') : undefined}
                        />
                      </div>
                      {(draft.videoUrls ?? []).length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm mt-7"
                          onClick={() => set('videoUrls', (draft.videoUrls ?? []).filter((_, j) => j !== i))}
                          aria-label={t('Retirer cette vidéo')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
                {(draft.videoUrls ?? []).length < MAX_SIGNUP_VIDEOS && (
                  <button type="button" className="btn-outline btn-sm" onClick={() => set('videoUrls', [...(draft.videoUrls ?? []), ''])}>
                    {t('Ajouter une autre vidéo')}
                  </button>
                )}
                {err('videoUrls') && <p className="text-sm text-[var(--state-critical)]">{err('videoUrls')}</p>}
                <p className="text-[0.8125rem] text-content-secondary">
                  {t('Après l’inscription, vous pourrez prouver que ces vidéos sont les vôtres avec un code personnel à placer dans leur description.')}
                </p>
              </div>
              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => goTo(1)} className="btn-secondary">{t('Retour')}</button>
                <button type="button" onClick={next} className="btn-primary">{t('Continuer')}</button>
              </div>
            </div>
          )}

          {draft.step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-content">{t('Vérification')}</h2>
                <p className="text-content-secondary">{t('Relisez avant d’envoyer. Notre équipe examine chaque candidature.')}</p>
              </div>

              <div className="rounded-card border border-line bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-content">{t('Vous')}</h3>
                  <button type="button" onClick={() => goTo(1)} className="flex items-center gap-1 text-sm text-gold"><Edit2 className="h-4 w-4" />{t('Modifier')}</button>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div><dt className="text-content-secondary">{t('Nom')}</dt><dd className="text-content">{draft.firstName} {draft.lastName}</dd></div>
                  <div><dt className="text-content-secondary">{t('Nom de scène')}</dt><dd className="text-content">{draft.stageName}</dd></div>
                  <div><dt className="text-content-secondary">{t('Date de naissance')}</dt><dd className="text-content">{draft.birthDate}</dd></div>
                  <div><dt className="text-content-secondary">{t('Pays')}</dt><dd className="text-content">{countryLabel(draft.country)}</dd></div>
                  <div><dt className="text-content-secondary">E-mail</dt><dd className="text-content">{draft.email}</dd></div>
                  <div><dt className="text-content-secondary">{t('Téléphone')}</dt><dd className="text-content">{draft.phone}</dd></div>
                </dl>
              </div>

              <div className="rounded-card border border-line bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-content">{t('Votre art')}</h3>
                  <button type="button" onClick={() => goTo(2)} className="flex items-center gap-1 text-sm text-gold"><Edit2 className="h-4 w-4" />{t('Modifier')}</button>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div><dt className="text-content-secondary">{t('Discipline')}</dt><dd className="text-content">{t(discipline)}</dd></div>
                  <div><dt className="text-content-secondary">{t('Public')}</dt><dd className="text-content">{draft.audienceTypes.map((a) => t(a)).join(', ')}</dd></div>
                  <div><dt className="text-content-secondary">{t('Langues')}</dt><dd className="text-content">{[...draft.languages.filter((l) => l !== 'Autre').map((l) => t(l)), draft.otherLanguages].filter(Boolean).join(', ')}</dd></div>
                  <div className="md:col-span-2"><dt className="text-content-secondary">{t('Vidéos')}</dt><dd className="break-all text-content">{(draft.videoUrls ?? []).filter((v) => v.trim()).join(' · ')}</dd></div>
                </dl>
              </div>

              <p className="text-sm text-content-secondary">
                {t('Après l’envoi : confirmez votre adresse e-mail via le lien reçu. Pendant l’examen de votre candidature, ajoutez vos photos et prouvez que vos vidéos sont les vôtres depuis votre espace.')}
              </p>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.acceptTerms}
                  onChange={(e) => set('acceptTerms', e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-gold"
                  data-testid="artist-accept-terms"
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

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => goTo(2)} className="btn-secondary">{t('Retour')}</button>
                <button type="button" onClick={submit} disabled={submitting || !draft.acceptTerms} className="btn-primary">
                  {submitting ? t('Envoi…') : t('Envoyer ma candidature')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

export default ArtistRegistrationFlow
