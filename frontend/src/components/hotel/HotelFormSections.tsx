import React from 'react'
import { Trash2, Plus } from 'lucide-react'
import FormField from '../FormField'
import CheckboxGroup from '../registration/CheckboxGroup'
import RadioGroup from '../registration/RadioGroup'
import SelectWithSearch from '../registration/SelectWithSearch'
import type { HotelProgramme, PerformanceSpot } from '@/types'
import { t } from '@/i18n'
import { COLLABORATION_TYPES, MAX_COLLAB_DAYS, MAX_PERFORMANCES_PER_WEEK, MIN_STAY_DAYS, TRANSPORT_COVERAGES, TRANSPORT_COVERAGE_LABELS } from '@shared/validation'

/**
 * The questions a hotel answers about its spaces and its programme, in one
 * place, used by the seven-step registration and by the hotel profile. The
 * answers go to the API as fields (see hotelProgrammeSchema), not folded into
 * a paragraph of description the way the old form did.
 */

// ------------------------------------------------------------------ options

const opts = (values: readonly string[]) => values.map((v) => ({ value: v, label: t(v) }))
const YES_NO = [
  { value: 'true', label: t('Oui') },
  { value: 'false', label: t('Non') },
]

export const HOTEL_TYPES = ['Resort / Club', 'Hôtel urbain', 'Hôtel de luxe', 'Hôtel familial', 'Riad / maison d’hôtes', 'Business']
export const AUDIENCES = ['Familles', 'Couples', 'Adultes uniquement', 'Corporate / événements']
const STYLES = ['Chill / Lounge', 'Festif', 'Culturel', 'Premium / luxe', 'Bien-être']
const EVENT_TYPES = ['Musique live', 'DJ sets', 'Spectacles', 'Ateliers / performances artistiques', 'Séances bien-être']
const EXPECTATIONS = ['Interaction avec les clients', 'Image de marque à respecter']
const POSSIBILITIES = ['Concepts originaux', 'Collaborations avec d’autres artistes', 'Workshops / expériences uniques']

// -------------------------------------------------------------------- types

/** The programme as the form edits it: numbers are typed as text. */
export type ProgrammeForm = Omit<HotelProgramme, 'perWeek' | 'desiredStayDays' | 'remunerationAmount' | 'transportCoverage'> & {
  perWeek: string
  desiredStayDays: string
  remunerationAmount: string
  transportCoverage: string
}

const REMUNERATION = COLLABORATION_TYPES[0]

export const emptyProgramme = (): ProgrammeForm => ({
  audiences: [], styles: [], eventTypes: [], appreciated: '', disliked: '',
  hasStage: false, stageDimensions: '', hasSound: false, soundDetails: '', lighting: '', hasScreens: false, hasCrew: false,
  collaborationTypes: [], conditions: '', openDates: '',
  offersLodging: true, offersMeals: false, offersTransport: false, transportCoverage: 'NONE', facilities: '', remunerationAmount: '',
  freedomLevel: '', expectations: [], possibilities: [], otherDetails: '', artistTypesNeeded: '', flowDescription: '',
  perWeek: '', desiredStayDays: '', responseDelay: '', validationProcess: '', decisionMaker: '',
})

export const programmeFromApi = (p?: HotelProgramme | null): ProgrammeForm => {
  const base = emptyProgramme()
  if (!p) return base
  const out: any = { ...base }
  for (const key of Object.keys(base)) {
    const v = (p as any)[key]
    if (v !== null && v !== undefined) out[key] = typeof v === 'number' ? String(v) : v
  }
  // Answers given before the 50/50 option existed were a yes or a no.
  if (!p.transportCoverage) out.transportCoverage = p.offersTransport ? 'FULL' : 'NONE'
  return out
}

/**
 * Text fields sent empty become null; the counts go as text and the API reads
 * them. Only the fields the form still asks are sent: a draft saved before a
 * question was removed would otherwise carry it, and the API refuses unknown
 * fields.
 */
export const programmePayload = (p: ProgrammeForm) => {
  const out: Record<string, unknown> = {}
  const known = new Set(Object.keys(emptyProgramme()))
  for (const [k, v] of Object.entries(p)) {
    if (!known.has(k)) continue
    out[k] = typeof v === 'string' ? (v.trim() ? v.trim() : null) : v
  }
  // The fee goes only with Rémunération.
  if (!(p.collaborationTypes ?? []).includes(REMUNERATION)) out.remunerationAmount = null
  return out
}

export interface SpaceForm {
  name: string
  setting: 'INDOOR' | 'OUTDOOR'
  capacity: string
  hours: string
  noiseLevel: string
  description: string
  /** Links to photos or videos, one per line. */
  media: string
}

export const emptySpace = (): SpaceForm => ({ name: '', setting: 'INDOOR', capacity: '', hours: '', noiseLevel: '', description: '', media: '' })

export const spacesFromApi = (spots?: PerformanceSpot[]): SpaceForm[] =>
  (spots ?? []).map((s) => ({
    name: s.name ?? '',
    setting: s.setting === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR',
    capacity: s.capacity ? String(s.capacity) : '',
    hours: s.hours ?? '',
    noiseLevel: s.noiseLevel ?? '',
    description: s.description ?? '',
    media: (s.media ?? []).join('\n'),
  }))

export const spacesPayload = (spaces: SpaceForm[]) =>
  spaces.map((s) => ({
    name: s.name,
    setting: s.setting,
    capacity: s.capacity || null,
    hours: s.hours || null,
    noiseLevel: s.noiseLevel || null,
    description: s.description || null,
    media: s.media.split(/[\s,]+/).map((m) => m.trim()).filter(Boolean),
  }))

// ----------------------------------------------------------------- sections

interface SectionProps {
  value: ProgrammeForm
  onChange: (patch: Partial<ProgrammeForm>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

const err = (errors: Record<string, string> | undefined, key: string) => {
  const message = errors?.[`programme.${key}`] ?? errors?.[key]
  return message ? t(message) : undefined
}

const text = (props: SectionProps, key: keyof ProgrammeForm, label: string, placeholder?: string, max = 500) => (
  <FormField
    label={t(label)}
    placeholder={placeholder ? t(placeholder) : undefined}
    value={(props.value[key] as string) ?? ''}
    maxLength={max}
    onChange={(e) => props.onChange({ [key]: (e.target as HTMLInputElement).value } as Partial<ProgrammeForm>)}
    error={err(props.errors, key as string)}
    disabled={props.disabled}
  />
)

const yesNo = (props: SectionProps, key: keyof ProgrammeForm, label: string) => (
  <RadioGroup
    name={`programme-${String(key)}`}
    label={t(label)}
    options={YES_NO}
    value={props.value[key] ? 'true' : 'false'}
    onChange={(v) => props.onChange({ [key]: v === 'true' } as Partial<ProgrammeForm>)}
    disabled={props.disabled}
  />
)

const many = (props: SectionProps, key: keyof ProgrammeForm, label: string, values: readonly string[]) => (
  <CheckboxGroup
    name={`programme-${String(key)}`}
    label={t(label)}
    options={opts(values)}
    values={(props.value[key] as string[]) ?? []}
    onChange={(vals) => props.onChange({ [key]: vals } as Partial<ProgrammeForm>)}
    error={err(props.errors, key as string)}
    disabled={props.disabled}
  />
)

export const AudienceField: React.FC<SectionProps> = (props) => many(props, 'audiences', 'Public principal', AUDIENCES)

export const AmbianceSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-6">
    {many(props, 'styles', 'Style / ambiance recherchée', STYLES)}
    {many(props, 'eventTypes', 'Types d’événements habituels', EVENT_TYPES)}
    {text(props, 'appreciated', 'Musiques / arts appréciés', 'Jazz, afro, pop, électro, classique, danse, yoga…')}
    {text(props, 'disliked', 'Ce que l’hôtel ne veut pas', 'Précisez les styles ou formats non souhaités')}
  </div>
)

export const EquipmentSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-4">
    {yesNo(props, 'hasStage', 'Scène')}
    {props.value.hasStage && text(props, 'stageDimensions', 'Dimensions de la scène', 'Ex. : 6 m x 4 m', 80)}
    {yesNo(props, 'hasSound', 'Sonorisation')}
    {props.value.hasSound && text(props, 'soundDetails', 'Détails sonorisation', 'Marque, puissance, console, micros…', 300)}
    <SelectWithSearch
      label={t('Éclairage')}
      options={opts(['Aucun', 'Basique', 'Pro'])}
      value={props.value.lighting ?? ''}
      onChange={(v) => props.onChange({ lighting: v })}
      disabled={props.disabled}
    />
    {yesNo(props, 'hasScreens', 'Écran / vidéo / LED')}
    {yesNo(props, 'hasCrew', 'Régie technique sur place')}
  </div>
)

export const CollaborationSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-6">
    {many(props, 'collaborationTypes', 'Type de collaboration acceptée', COLLABORATION_TYPES)}
    {(props.value.collaborationTypes ?? []).includes(REMUNERATION) && (
      <FormField
        type="number"
        inputMode="numeric"
        min={1}
        label={t('Tarif proposé (€)')}
        placeholder={t('Ex. : 500')}
        hint={t('Montant de la rémunération proposée à l’artiste, en euros.')}
        value={props.value.remunerationAmount ?? ''}
        onChange={(e) => props.onChange({ remunerationAmount: (e.target as HTMLInputElement).value })}
        error={err(props.errors, 'remunerationAmount')}
        disabled={props.disabled}
      />
    )}
    {text(props, 'conditions', 'Conditions pour l’artiste', 'Ce que vous offrez et ce que vous attendez en contrepartie', 1000)}
    {text(props, 'openDates', 'Dates ou périodes ouvertes', 'Ex. : avril à juin, vacances scolaires', 300)}
  </div>
)

export const LogisticsSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-4">
    {yesNo(props, 'offersLodging', 'Hébergement fourni (pour deux personnes)')}
    {yesNo(props, 'offersMeals', 'All inclusive (2 personnes)')}
    <RadioGroup
      name="programme-transportCoverage"
      label={t('Transport pris en charge')}
      options={TRANSPORT_COVERAGES.map((c) => ({ value: c, label: t(TRANSPORT_COVERAGE_LABELS[c]) }))}
      value={props.value.transportCoverage || 'NONE'}
      onChange={(v) => props.onChange({ transportCoverage: v, offersTransport: v !== 'NONE' })}
      disabled={props.disabled}
    />
    {text(props, 'facilities', 'Accès aux installations de l’hôtel', 'Piscine, salle de sport, spa, etc.', 300)}
  </div>
)

export const FreedomSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-6">
    <RadioGroup
      name="programme-freedomLevel"
      label={t('Niveau de liberté artistique')}
      options={opts(['Totale', 'Encadrée'])}
      value={props.value.freedomLevel ?? ''}
      onChange={(v) => props.onChange({ freedomLevel: v })}
      disabled={props.disabled}
    />
    {many(props, 'expectations', 'Attentes spécifiques de l’hôtel', EXPECTATIONS)}
    {many(props, 'possibilities', 'Possibilités de proposer', POSSIBILITIES)}
    {text(props, 'otherDetails', 'Autres attentes (facultatif)', 'Ajoutez vos attentes ou possibilités spécifiques')}
    {text(props, 'artistTypesNeeded', 'Types d’artistes recherchés', 'Musiciens, DJ, danseurs, professeurs de yoga…', 300)}
    {text(props, 'flowDescription', 'Comment ça se passe pour l’artiste', 'Décrivez l’organisation et le déroulé', 1000)}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_PERFORMANCES_PER_WEEK}
        label={t('Prestations par semaine')}
        placeholder={t('De 1 à {max}', { max: String(MAX_PERFORMANCES_PER_WEEK) })}
        hint={t('{max} au maximum : un jour de repos par semaine est obligatoire.', { max: String(MAX_PERFORMANCES_PER_WEEK) })}
        value={props.value.perWeek ?? ''}
        onChange={(e) => props.onChange({ perWeek: (e.target as HTMLInputElement).value })}
        error={err(props.errors, 'perWeek')}
        disabled={props.disabled}
      />
      <FormField
        type="number"
        inputMode="numeric"
        min={MIN_STAY_DAYS}
        max={MAX_COLLAB_DAYS}
        label={t('Durée de la prestation souhaitée (jours)')}
        placeholder={t('De {min} à {max} jours', { min: String(MIN_STAY_DAYS), max: String(MAX_COLLAB_DAYS) })}
        hint={t('Entre {min} et {max} jours.', { min: String(MIN_STAY_DAYS), max: String(MAX_COLLAB_DAYS) })}
        value={props.value.desiredStayDays ?? ''}
        onChange={(e) => props.onChange({ desiredStayDays: (e.target as HTMLInputElement).value })}
        error={err(props.errors, 'desiredStayDays')}
        disabled={props.disabled}
      />
    </div>
  </div>
)

export const ValidationSection: React.FC<SectionProps> = (props) => (
  <div className="space-y-6">
    {text(props, 'responseDelay', 'Délai de réponse moyen', 'Ex. : 48 h', 40)}
    <RadioGroup
      name="programme-validationProcess"
      label={t('Process de validation')}
      options={opts(['Validation simple', 'Validation après échange'])}
      value={props.value.validationProcess ?? ''}
      onChange={(v) => props.onChange({ validationProcess: v })}
      disabled={props.disabled}
    />
    {text(props, 'decisionMaker', 'Personne décisionnaire', 'Nom et rôle', 100)}
  </div>
)

// ------------------------------------------------------------------- spaces

interface SpacesProps {
  spaces: SpaceForm[]
  onChange: (spaces: SpaceForm[]) => void
  errors?: Record<string, string>
  disabled?: boolean
}

export const SpacesSection: React.FC<SpacesProps> = ({ spaces, onChange, errors = {}, disabled }) => {
  const update = (index: number, patch: Partial<SpaceForm>) => onChange(spaces.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  const e = (index: number, key: string) => (errors[`spaces.${index}.${key}`] ? t(errors[`spaces.${index}.${key}`]) : undefined)

  return (
    <div className="space-y-6">
      {spaces.map((space, index) => (
        <div key={index} className="space-y-4 rounded-card border border-line p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <FormField
                label={t('Nom de l’espace')}
                placeholder={t('Scène, plage, rooftop, salle, piscine…')}
                value={space.name}
                maxLength={80}
                onChange={(ev) => update(index, { name: (ev.target as HTMLInputElement).value })}
                error={e(index, 'name')}
                required
                disabled={disabled}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(spaces.filter((_, i) => i !== index))}
              className="btn-ghost mt-8 !px-3"
              aria-label={t('Supprimer cet espace')}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <RadioGroup
            name={`space-${index}-setting`}
            label={t('Intérieur / extérieur')}
            options={[{ value: 'INDOOR', label: t('Intérieur') }, { value: 'OUTDOOR', label: t('Extérieur') }]}
            value={space.setting}
            onChange={(v) => update(index, { setting: v as SpaceForm['setting'] })}
            disabled={disabled}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField inputMode="numeric" label={t('Capacité')} placeholder={t('Nombre de personnes')} value={space.capacity} onChange={(ev) => update(index, { capacity: (ev.target as HTMLInputElement).value })} error={e(index, 'capacity')} disabled={disabled} />
            <FormField label={t('Horaires possibles')} placeholder="Ex. : 18h–22h" value={space.hours} maxLength={80} onChange={(ev) => update(index, { hours: (ev.target as HTMLInputElement).value })} disabled={disabled} />
            <FormField label={t('Niveau sonore autorisé')} placeholder={t('Bas, moyen, élevé')} value={space.noiseLevel} maxLength={40} onChange={(ev) => update(index, { noiseLevel: (ev.target as HTMLInputElement).value })} disabled={disabled} />
          </div>
          <div>
            <label className="form-label" htmlFor={`space-${index}-media`}>{t('Liens photos ou vidéos (un par ligne)')}</label>
            <textarea
              id={`space-${index}-media`}
              rows={2}
              className="form-input w-full"
              placeholder="https://…"
              value={space.media}
              onChange={(ev) => update(index, { media: ev.target.value })}
              disabled={disabled}
            />
            {Object.keys(errors).some((k) => k.startsWith(`spaces.${index}.media`)) && (
              <p className="mt-1 text-sm text-[var(--state-critical)]">{t('Un des liens n’est pas une adresse web valide (https://…)')}</p>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...spaces, emptySpace()])} className="btn-outline flex items-center gap-2" disabled={disabled || spaces.length >= 20}>
        <Plus className="h-4 w-4" />
        {t('Ajouter un espace')}
      </button>
    </div>
  )
}
