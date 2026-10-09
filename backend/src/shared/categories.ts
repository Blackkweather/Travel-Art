/**
 * The artistic taxonomy: main category -> type -> speciality.
 *
 * One definition, read by the registration form (to draw the selects) and by
 * the API (to refuse anything that is not in it). The old form kept its own
 * copy with a "domain" level that duplicated the speciality, and two types
 * with no options under them - picking either hid a required field and left
 * the applicant stuck on the step with no visible error.
 *
 * Rules:
 *   - a type with specialities requires one of them;
 *   - a type with none needs nothing more;
 *   - a tribute type also requires `tributeTo` (who the tribute is to).
 *
 * Values are the French labels, which is what existing rows already hold. The
 * client translates them for display through its i18n table.
 */

export interface CategoryType {
  specialities: readonly string[]
  requiresTributeTo?: boolean
}

export type CategoryTree = Record<string, Record<string, CategoryType>>

export const CATEGORY_TREE: CategoryTree = {
  Musique: {
    DJ: { specialities: ['DJ set', 'DJ & Saxophone', 'DJ Live'] },
    Solo: {
      specialities: [
        'Chant',
        'Guitare - voix',
        'Piano-voix',
        'Piano',
        'Guitare',
        'Saxophone',
        'Violon',
        'Violoncelle',
        'Trompette',
        'Flûte',
        'Harpe',
        'Batterie / percussions',
        'Autre instrument',
      ],
    },
    'Groupe de musique': { specialities: ['Duo', 'Trio', 'Quartet', 'Quintet et plus'] },
    'Tribute / Hommage': {
      specialities: ['Tribute solo', 'Tribute groupe'],
      requiresTributeTo: true,
    },
  },
  Visuel: {
    'Arts plastiques': {
      specialities: [
        'Peinture',
        'Sculpture',
        'Dessin / Calligraphie',
        'Street-art / Graphe',
        'Photographie',
        'Céramique',
        'Installation',
        'Design',
      ],
    },
  },
  'Arts & craft': {
    'Ateliers créatifs': {
      specialities: ['Atelier DIY', 'Céramique', 'Bijoux', 'Textile / couture', 'Arts floraux'],
    },
  },
  Cirque: {
    Cirque: { specialities: ['Acrobatie', 'Jonglage', 'Equilibre', 'Mât chinois', 'Aérien / Tissu'] },
  },
  Magie: {
    Magie: { specialities: ['Close-up', 'Spectacle', 'Mentalisme'] },
  },
  Humour: {
    Humour: { specialities: ['Stand-up / One-man', 'Visuel & Mime'] },
  },
  Danse: {
    Danse: {
      specialities: [
        'Salon',
        'Salsa / Bachata',
        'Hip-Hop',
        'Moderne jazz',
        'Contemporain',
        'Orientale',
        'Classique',
      ],
    },
  },
  Famille: {
    'Magie pour enfants': { specialities: ['Spectacle', 'Close-up', 'Initiation'] },
    'Sculpture de bulles': { specialities: ['Spectacle', 'Happening'] },
    Conte: { specialities: ['Conte', 'Poésie'] },
    Chant: { specialities: ['Atelier éveil musical', 'Mini-concert enfants'] },
    'Arts & craft Famille': { specialities: ['Arts plastiques', 'Dessin', 'Ateliers parents-enfants'] },
  },
  'Bien-être': {
    'Bien-être': {
      specialities: ['Yoga', 'Méditation', 'Pilates', 'Sound healing', 'Breathwork'],
    },
  },
  Lifestyle: {
    'Création de contenu': { specialities: ['Photo / vidéo', 'Influence', 'Podcast'] },
    'Art de vivre': { specialities: ['Cuisine / chef', 'Mixologie', 'Coaching sportif'] },
  },
}

export const MAIN_CATEGORIES: readonly string[] = Object.keys(CATEGORY_TREE)

export const AUDIENCE_TYPES: readonly string[] = ['Adultes', 'Familles']

export const LANGUAGES: readonly string[] = ['Français', 'English', 'العربية', 'Español', 'Autre']

export function categoryTypes(main: string | null | undefined): string[] {
  return main && CATEGORY_TREE[main] ? Object.keys(CATEGORY_TREE[main]) : []
}

export function specialities(main: string | null | undefined, type: string | null | undefined): readonly string[] {
  if (!main || !type) return []
  return CATEGORY_TREE[main]?.[type]?.specialities ?? []
}

export function requiresTributeTo(main: string | null | undefined, type: string | null | undefined): boolean {
  if (!main || !type) return false
  return Boolean(CATEGORY_TREE[main]?.[type]?.requiresTributeTo)
}

export interface CategorySelection {
  mainCategory: string
  categoryType: string
  specificCategory?: string | null
  tributeTo?: string | null
}

/**
 * Field-keyed problems with a selection, empty when it is valid. Keys match
 * the form's field names so the client can put each message under its field.
 */
export function categoryErrors(sel: Partial<CategorySelection>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!sel.mainCategory || !CATEGORY_TREE[sel.mainCategory]) {
    errors.mainCategory = 'Choisissez une catégorie principale'
    return errors
  }
  const type = sel.categoryType ? CATEGORY_TREE[sel.mainCategory][sel.categoryType] : undefined
  if (!type) {
    errors.categoryType = 'Choisissez votre famille artistique'
    return errors
  }
  if (type.specialities.length > 0 && !type.specialities.includes(sel.specificCategory ?? '')) {
    errors.specificCategory = 'Choisissez votre spécialité'
  }
  if (type.requiresTributeTo) {
    const to = (sel.tributeTo ?? '').trim()
    if (to.length < 2 || to.length > 80) {
      errors.tributeTo = 'Indiquez à qui votre tribute rend hommage'
    }
  }
  return errors
}

/**
 * The label shown on cards and used by browse search: "Musique - Piano",
 * "Bien-être - Yoga", "Musique - Tribute groupe (Queen)".
 */
export function disciplineLabel(sel: Partial<CategorySelection>): string {
  if (!sel.mainCategory) return ''
  const detail = sel.specificCategory || sel.categoryType
  const base = detail && detail !== sel.mainCategory ? `${sel.mainCategory} - ${detail}` : sel.mainCategory
  const to = sel.tributeTo?.trim()
  return to ? `${base} (${to})` : base
}
