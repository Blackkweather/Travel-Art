import React from 'react'
import { MAIN_CATEGORIES, categoryTypes, requiresTributeTo, specialities } from '@shared/categories'
import SelectWithSearch from './SelectWithSearch'
import FormField from '../FormField'
import { t } from '@/i18n'

/**
 * Main category -> family -> speciality, plus "tribute to" for tribute acts.
 *
 * Driven entirely by the shared taxonomy, so every option shown here is one
 * the API accepts, and every field it requires is on screen. (The form it
 * replaces could hide a required field and leave the applicant stuck.)
 * Used by registration and by the artist's profile editor.
 */

export interface CategoryValue {
  mainCategory: string
  categoryType: string
  specificCategory: string
  tributeTo: string
}

interface Props {
  value: CategoryValue
  onChange: (value: CategoryValue) => void
  errors?: Record<string, string | undefined>
  disabled?: boolean
}

const options = (values: readonly string[]) => values.map((v) => ({ value: v, label: t(v) }))

const CategoryFields: React.FC<Props> = ({ value, onChange, errors = {}, disabled }) => {
  const types = categoryTypes(value.mainCategory)
  const specs = specialities(value.mainCategory, value.categoryType)
  const needsTribute = requiresTributeTo(value.mainCategory, value.categoryType)

  const setMain = (mainCategory: string) => {
    const nextTypes = categoryTypes(mainCategory)
    // A category with a single family selects it, so there is one less step.
    onChange({ mainCategory, categoryType: nextTypes.length === 1 ? nextTypes[0] : '', specificCategory: '', tributeTo: '' })
  }

  return (
    <div className="space-y-6">
      <SelectWithSearch
        label={t('Catégorie principale')}
        placeholder={t('Sélectionner une catégorie')}
        options={options(MAIN_CATEGORIES)}
        value={value.mainCategory}
        onChange={setMain}
        error={errors.mainCategory ? t(errors.mainCategory) : undefined}
        required
        disabled={disabled}
      />

      {types.length > 1 && (
        <SelectWithSearch
          label={t('Famille artistique')}
          placeholder={t('Sélectionner une famille')}
          options={options(types)}
          value={value.categoryType}
          onChange={(categoryType) => onChange({ ...value, categoryType, specificCategory: '', tributeTo: '' })}
          error={errors.categoryType ? t(errors.categoryType) : undefined}
          required
          disabled={disabled}
        />
      )}

      {specs.length > 0 && (
        <SelectWithSearch
          label={t('Spécialité')}
          placeholder={t('Sélectionner votre spécialité')}
          options={options(specs)}
          value={value.specificCategory}
          onChange={(specificCategory) => onChange({ ...value, specificCategory })}
          error={errors.specificCategory ? t(errors.specificCategory) : undefined}
          required
          disabled={disabled}
        />
      )}

      {needsTribute && (
        <FormField
          label={t('Hommage à')}
          placeholder={t('Ex. : Queen, Oum Kalthoum, Daft Punk')}
          value={value.tributeTo}
          maxLength={80}
          onChange={(e) => onChange({ ...value, tributeTo: (e.target as HTMLInputElement).value })}
          error={errors.tributeTo ? t(errors.tributeTo) : undefined}
          required
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default CategoryFields
