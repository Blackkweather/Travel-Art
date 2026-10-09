/**
 * The rules every field obeys - one copy, used by the web form to show the
 * message under the field and by the API to refuse the request.
 *
 * Before this file there were three: a regex table in the form, a second set
 * of checks in a validator class nothing imported, and the API's own zod
 * schemas, which agreed with neither. A name of "test test", a birth date of
 * 31/02/2030 and an address at mailinator.com passed all three.
 *
 * Messages are French (the product's language); the client translates them
 * through its i18n table, keyed by the French text.
 *
 * Dependencies are limited to zod and libphonenumber-js so this file runs
 * unchanged in Node and in the browser.
 */
import { z } from 'zod'
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { countryCode, isKnownCountry } from './countries'
import { AUDIENCE_TYPES, LANGUAGES, MAIN_CATEGORIES, categoryErrors } from './categories'
import { isHttpUrl, parseVideoUrl } from './media'

// ============================================================================
// Text helpers
// ============================================================================

/** Trim and collapse runs of whitespace. */
export const tidy = (value: string): string => value.replace(/\s+/g, ' ').trim()

/** Lower-case, accents removed, only letters and digits kept. "Élodie-Mäx" -> "elodiemax". */
export function foldKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

/**
 * Words people type when they are filling a form to see what happens. A name
 * made only of these is refused; a real name that merely contains one ("Bart
 * Testa") is not, because the check is per whole word.
 */
const PLACEHOLDER_WORDS = new Set([
  'test', 'tests', 'testing', 'tester', 'essai', 'asdf', 'qwerty', 'azerty', 'abc', 'abcd',
  'xxx', 'xx', 'x', 'aaa', 'aa', 'a', 'foo', 'bar', 'baz', 'toto', 'titi', 'tata', 'tutu',
  'demo', 'sample', 'fake', 'name', 'nom', 'prenom', 'firstname', 'lastname', 'user',
  'admin', 'null', 'none', 'undefined', 'anonymous', 'anonyme', 'lorem', 'ipsum', 'hello',
  'blabla', 'azer', 'qsdf', 'hotel', 'artist', 'artiste',
])

/** True when every word of `value` is a placeholder, or it is one character repeated. */
export function looksLikePlaceholder(value: string): boolean {
  const words = tidy(value)
    .split(' ')
    .map(foldKey)
    .filter(Boolean)
  if (words.length === 0) return true
  if (words.every((w) => PLACEHOLDER_WORDS.has(w) || /^(.)\1+$/.test(w) || /^\d+$/.test(w))) return true
  return /(.)\1{3,}/.test(foldKey(value))
}

// ============================================================================
// Email
// ============================================================================

/**
 * Throwaway-inbox providers. Not exhaustive - nothing is - but it covers the
 * services that come up first when someone searches for one, including the
 * French ones (yopmail, jetable).
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'mailinator.net', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
  'jetable.org', 'jetable.fr.nf', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me',
  '10minutemail.com', '10minutemail.net', '10minutemail.co.uk', '20minutemail.com',
  'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempail.com',
  'tempr.email', 'mytemp.email', 'tmpmail.org', 'tmpmail.net', 'trashmail.com', 'trashmail.de',
  'trash-mail.com', 'throwawaymail.com', 'getnada.com', 'nada.email', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com', 'mohmal.com',
  'emailondeck.com', 'spamgourmet.com', 'burnermail.io', 'moakt.com', 'mailcatch.com',
  'discard.email', 'harakirimail.com', 'inboxkitten.com', 'mail.tm', 'luxusmail.org',
  'minuteinbox.com', 'emailfake.com', 'fakemail.net', 'mailpoof.com', 'mvrht.net',
  'spambox.us', 'trbvm.com', 'byom.de', 'mailtemp.info', 'linshiyouxiang.net',
])

/** Domains reserved for documentation and testing (RFC 2606/6761) and the usual stand-ins. */
const RESERVED_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.fr', 'test.net', 'test.org',
  'domain.com', 'domaine.com', 'domaine.fr', 'email.test', 'mail.test', 'localhost',
])
const RESERVED_EMAIL_TLDS = ['test', 'example', 'invalid', 'localhost', 'local']

// Only words nobody uses as a real mailbox. "admin@", "contact@" and
// "reservation@" are how hotels actually write, so they are not here.
const TEST_LOCAL_PART = /^(test|tests|testing|tester|essai|asdf|qwerty|azerty|a+|x+|foo|toto|titi|tata|fake|null|example)[._-]?\d*$/i

/** The providers people actually use, for "did you mean" suggestions. */
const COMMON_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr',
  'live.com', 'live.fr', 'msn.com', 'yahoo.com', 'yahoo.fr', 'icloud.com', 'me.com',
  'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'bbox.fr', 'gmx.fr', 'gmx.com',
  'proton.me', 'protonmail.com', 'aol.com', 'menara.ma',
]

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/** "gmial.com" -> "gmail.com"; undefined when the domain is fine or not close to a common one. */
export function suggestEmailDomain(domain: string): string | undefined {
  const d = domain.toLowerCase()
  if (COMMON_EMAIL_DOMAINS.includes(d)) return undefined
  let best: { domain: string; distance: number } | undefined
  for (const candidate of COMMON_EMAIL_DOMAINS) {
    const distance = editDistance(d, candidate)
    if (distance <= 2 && (!best || distance < best.distance)) best = { domain: candidate, distance }
  }
  return best?.domain
}

const EMAIL_SHAPE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/

export interface EmailVerdict {
  ok: boolean
  /** Normalised form: trimmed, lower-cased. */
  email: string
  message?: string
  /** A corrected address to offer, when the domain looks mistyped. */
  suggestion?: string
}

/**
 * Everything that can be decided about an address without the network. The
 * API additionally checks that the domain accepts mail (an MX lookup) and that
 * nobody has registered it already.
 */
export function checkEmail(raw: string): EmailVerdict {
  const email = (raw ?? '').trim().toLowerCase()
  if (!email) return { ok: false, email, message: 'Indiquez votre adresse e-mail' }
  if (email.length > 254 || !EMAIL_SHAPE.test(email) || email.includes('..')) {
    return { ok: false, email, message: 'Adresse e-mail invalide' }
  }
  const [local, domain] = email.split('@')
  if (local.length > 64) return { ok: false, email, message: 'Adresse e-mail invalide' }
  const tld = domain.split('.').pop() ?? ''
  if (RESERVED_EMAIL_DOMAINS.has(domain) || RESERVED_EMAIL_TLDS.includes(tld)) {
    return { ok: false, email, message: 'Utilisez votre véritable adresse e-mail' }
  }
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, email, message: 'Les adresses e-mail jetables ne sont pas acceptées' }
  }
  if (TEST_LOCAL_PART.test(local)) {
    return { ok: false, email, message: 'Utilisez votre véritable adresse e-mail' }
  }
  const suggested = suggestEmailDomain(domain)
  if (suggested) {
    return {
      ok: false,
      email,
      message: `Vérifiez votre adresse : vouliez-vous dire ${local}@${suggested} ?`,
      suggestion: `${local}@${suggested}`,
    }
  }
  return { ok: true, email }
}

export const emailSchema = z
  .string({ required_error: 'Indiquez votre adresse e-mail' })
  .transform((v, ctx) => {
    const verdict = checkEmail(v)
    if (!verdict.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: verdict.message })
    return verdict.email
  })

/** For sign-in and password reset: shape only, so an existing account is never locked out by a newer rule. */
export const loginEmailSchema = z
  .string({ required_error: 'Indiquez votre adresse e-mail' })
  .trim()
  .toLowerCase()
  .max(254)
  .regex(EMAIL_SHAPE, 'Adresse e-mail invalide')

// ============================================================================
// Names
// ============================================================================

const PERSON_NAME = /^[\p{L}][\p{L}\p{M}' .-]*$/u

/** A first or last name. */
export const personNameSchema = (label: string) =>
  z
    .string({ required_error: `Indiquez votre ${label}` })
    .transform(tidy)
    .superRefine((v, ctx) => {
      if (v.length < 2) return ctx.addIssue({ code: 'custom', message: `Votre ${label} est trop court` })
      if (v.length > 50) return ctx.addIssue({ code: 'custom', message: `Votre ${label} est trop long` })
      if (!PERSON_NAME.test(v)) {
        return ctx.addIssue({ code: 'custom', message: `Votre ${label} ne peut contenir que des lettres` })
      }
      if (looksLikePlaceholder(v)) ctx.addIssue({ code: 'custom', message: `Indiquez votre vrai ${label}` })
    })

/** A full name typed in one field (a hotel's contact person). */
export const fullNameSchema = z
  .string({ required_error: 'Indiquez un nom' })
  .transform(tidy)
  .superRefine((v, ctx) => {
    if (v.length < 3 || v.length > 100) return ctx.addIssue({ code: 'custom', message: 'Indiquez un nom complet' })
    if (!PERSON_NAME.test(v)) return ctx.addIssue({ code: 'custom', message: 'Un nom ne peut contenir que des lettres' })
    if (looksLikePlaceholder(v)) ctx.addIssue({ code: 'custom', message: 'Indiquez un vrai nom' })
  })

const STAGE_NAME = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}' .&!-]*$/u

export const stageNameSchema = z
  .string({ required_error: 'Indiquez votre nom de scène' })
  .transform(tidy)
  .superRefine((v, ctx) => {
    if (v.length < 2) return ctx.addIssue({ code: 'custom', message: 'Votre nom de scène est trop court' })
    if (v.length > 60) return ctx.addIssue({ code: 'custom', message: 'Votre nom de scène est trop long' })
    if (!STAGE_NAME.test(v)) {
      return ctx.addIssue({ code: 'custom', message: 'Votre nom de scène contient des caractères non autorisés' })
    }
    if (looksLikePlaceholder(v)) ctx.addIssue({ code: 'custom', message: 'Indiquez votre vrai nom de scène' })
  })

export const hotelNameSchema = z
  .string({ required_error: 'Indiquez le nom de l’hôtel' })
  .transform(tidy)
  .superRefine((v, ctx) => {
    if (v.length < 2 || v.length > 120) {
      return ctx.addIssue({ code: 'custom', message: 'Indiquez le nom complet de l’hôtel' })
    }
    if (!/\p{L}/u.test(v) || looksLikePlaceholder(v)) {
      ctx.addIssue({ code: 'custom', message: 'Indiquez le vrai nom de l’hôtel' })
    }
  })

/** The key two stage names (or hotel names) are compared on for duplicates. */
export const nameKey = foldKey

// ============================================================================
// Phone, country, dates
// ============================================================================

export const countrySchema = z
  .string({ required_error: 'Choisissez votre pays' })
  .trim()
  .refine(isKnownCountry, 'Choisissez votre pays dans la liste')

/**
 * Normalise a phone number to E.164 ("+212612345678"), reading a local number
 * against the given country. Null when it is not a valid number.
 */
export function normalizePhone(raw: string, country?: string | null): string | null {
  if (!raw) return null
  const parsed = parsePhoneNumberFromString(raw.trim(), countryCode(country) as any)
  return parsed && parsed.isValid() ? parsed.number : null
}

/** Parse "DD/MM/YYYY" into a UTC date, or null when it is not a real calendar date. */
export function parseFrenchDate(raw: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((raw ?? '').trim())
  if (!m) return null
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

export function ageOn(birth: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export const MIN_AGE = 18

export const birthDateSchema = z
  .string({ required_error: 'Indiquez votre date de naissance' })
  .transform((v, ctx) => {
    const date = parseFrenchDate(v)
    if (!date) {
      ctx.addIssue({ code: 'custom', message: 'Date invalide (format JJ/MM/AAAA)' })
      return z.NEVER
    }
    const age = ageOn(date)
    if (age < MIN_AGE) {
      ctx.addIssue({ code: 'custom', message: `Vous devez avoir au moins ${MIN_AGE} ans pour vous inscrire` })
      return z.NEVER
    }
    if (age > 100) {
      ctx.addIssue({ code: 'custom', message: 'Vérifiez votre date de naissance' })
      return z.NEVER
    }
    return date
  })

// ============================================================================
// Password
// ============================================================================

export const PASSWORD_SPECIAL = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?~`]/

export const passwordSchema = z
  .string({ required_error: 'Choisissez un mot de passe' })
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(PASSWORD_SPECIAL, 'Le mot de passe doit contenir au moins un caractère spécial')

// ============================================================================
// Links
// ============================================================================

const optionalText = (max: number) =>
  z
    .string()
    .transform(tidy)
    .refine((v) => v.length <= max, `${max} caractères maximum`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const httpUrlSchema = z
  .string()
  .trim()
  .max(500, 'Adresse trop longue')
  .refine(isHttpUrl, 'Adresse web invalide (elle doit commencer par https://)')

const optionalUrl = z
  .union([httpUrlSchema, z.literal(''), z.null()])
  .optional()
  .transform((v) => (v ? v : null))

/** A link to a profile on a given network: must be on that network's domain. */
const socialUrl = (domain: string, label: string) =>
  z
    .union([z.literal(''), z.null(), httpUrlSchema])
    .optional()
    .superRefine((v, ctx) => {
      if (!v) return
      const host = new URL(v).hostname.toLowerCase()
      if (host !== domain && !host.endsWith(`.${domain}`)) {
        ctx.addIssue({ code: 'custom', message: `Ce lien n’est pas un lien ${label}` })
      }
    })
    .transform((v) => (v ? v : null))

export const MAX_SIGNUP_VIDEOS = 3

export const videoUrlSchema = z
  .string({ required_error: 'Collez le lien de votre vidéo' })
  .trim()
  .refine((v) => parseVideoUrl(v) !== null, 'Lien non reconnu : utilisez un lien YouTube, Vimeo ou Instagram')

// ============================================================================
// Forms
// ============================================================================

const consent = z.literal(true, {
  errorMap: () => ({ message: 'Vous devez accepter les conditions générales et la politique de confidentialité' }),
})

const phoneRequired = z.string({ required_error: 'Indiquez votre numéro de téléphone' }).trim().min(1, 'Indiquez votre numéro de téléphone')

/** Shared tail of both registrations; `phone` is checked against `country` in superRefine. */
const accountFields = {
  email: emailSchema,
  password: passwordSchema,
  phone: phoneRequired,
  country: countrySchema,
  acceptTerms: consent,
  locale: z.enum(['fr', 'en']).optional().default('fr'),
  referralCode: z.string().trim().max(40).optional().nullable(),
  /** Anti-bot token, checked by the API when a captcha is configured. */
  captchaToken: z.string().max(2048).optional().nullable(),
}

const checkPhone = (data: { phone?: string; country?: string }, ctx: z.RefinementCtx) => {
  if (data.phone && !normalizePhone(data.phone, data.country)) {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Numéro de téléphone invalide pour ce pays' })
  }
}

export const artistRegistrationSchema = z
  .object({
    role: z.literal('ARTIST'),
    firstName: personNameSchema('prénom'),
    lastName: personNameSchema('nom'),
    stageName: stageNameSchema,
    birthDate: birthDateSchema,
    mainCategory: z.string({ required_error: 'Choisissez une catégorie principale' }),
    categoryType: z.string().optional().default(''),
    specificCategory: z.string().optional().nullable(),
    tributeTo: optionalText(80),
    secondaryCategory: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || MAIN_CATEGORIES.includes(v), 'Catégorie inconnue'),
    audienceTypes: z
      .array(z.string())
      .min(1, 'Sélectionnez au moins un type de public')
      .refine((list) => list.every((a) => AUDIENCE_TYPES.includes(a)), 'Public inconnu'),
    languages: z
      .array(z.string())
      .min(1, 'Sélectionnez au moins une langue')
      .refine((list) => list.every((l) => LANGUAGES.includes(l)), 'Langue inconnue'),
    otherLanguages: optionalText(100),
    /** Proof of practice from day one: links to the artist's own performances. */
    videoUrls: z
      .array(videoUrlSchema)
      .min(1, 'Ajoutez au moins une vidéo de vous en prestation')
      .max(MAX_SIGNUP_VIDEOS, `${MAX_SIGNUP_VIDEOS} vidéos maximum à l’inscription`)
      .refine(
        (list) => new Set(list.map((v) => parseVideoUrl(v)?.url ?? v)).size === list.length,
        'La même vidéo apparaît deux fois'
      ),
    ...accountFields,
  })
  .superRefine((data, ctx) => {
    for (const [field, message] of Object.entries(categoryErrors(data))) {
      ctx.addIssue({ code: 'custom', path: [field], message })
    }
    if (data.languages.includes('Autre') && !data.otherLanguages) {
      ctx.addIssue({ code: 'custom', path: ['otherLanguages'], message: 'Précisez les autres langues' })
    }
    if (data.secondaryCategory && data.secondaryCategory === data.mainCategory) {
      ctx.addIssue({ code: 'custom', path: ['secondaryCategory'], message: 'Choisissez une catégorie différente de la principale' })
    }
    checkPhone(data, ctx)
  })

export type ArtistRegistration = z.output<typeof artistRegistrationSchema>

const capacitySchema = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d]/g, ''))
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      ctx.addIssue({ code: 'custom', message: 'Indiquez un nombre' })
      return z.NEVER
    }
    return n
  })

export const hotelSpaceSchema = z.object({
  name: z.string({ required_error: 'Nommez cet espace' }).transform(tidy).pipe(
    z.string().min(2, 'Nommez cet espace').max(80, '80 caractères maximum'),
  ),
  type: optionalText(40),
  setting: z.enum(['INDOOR', 'OUTDOOR']).optional().nullable().transform((v) => v ?? null),
  capacity: capacitySchema,
  description: optionalText(500),
  hours: optionalText(80),
  noiseLevel: optionalText(40),
  media: z.array(httpUrlSchema).max(10, '10 liens maximum par espace').optional().default([]),
})

export type HotelSpaceInput = z.output<typeof hotelSpaceSchema>

const shortList = (max = 12) => z.array(z.string().transform(tidy).pipe(z.string().min(1).max(80))).max(max).optional().default([])

const smallCount = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d]/g, ''))
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      ctx.addIssue({ code: 'custom', message: 'Indiquez un nombre entre 0 et 100' })
      return z.NEVER
    }
    return n
  })

/**
 * What a hotel tells us about the programme it wants: audience, atmosphere,
 * equipment, terms, freedom and how it decides. Every answer is optional - the
 * form is long and a hotel can complete it later from its profile - but each
 * one that is given is stored in its own column, not folded into a paragraph.
 */
export const hotelProgrammeSchema = z
  .object({
    audiences: shortList(),
    styles: shortList(),
    eventTypes: shortList(),
    appreciated: optionalText(500),
    disliked: optionalText(500),
    hasStage: z.boolean().optional().default(false),
    stageDimensions: optionalText(80),
    hasSound: z.boolean().optional().default(false),
    soundDetails: optionalText(300),
    lighting: optionalText(40),
    hasScreens: z.boolean().optional().default(false),
    hasCrew: z.boolean().optional().default(false),
    collaborationTypes: shortList(),
    conditions: optionalText(1000),
    durationType: optionalText(40),
    residenceDuration: optionalText(80),
    openDates: optionalText(300),
    offersLodging: z.boolean().optional().default(false),
    offersMeals: z.boolean().optional().default(false),
    offersTransport: z.boolean().optional().default(false),
    facilities: optionalText(300),
    freedomLevel: optionalText(40),
    expectations: shortList(),
    possibilities: shortList(),
    otherDetails: optionalText(500),
    artistTypesNeeded: optionalText(300),
    flowDescription: optionalText(1000),
    perWeek: smallCount,
    perMonth: smallCount,
    responseDelay: optionalText(40),
    validationProcess: optionalText(60),
    decisionMaker: optionalText(100),
  })
  .partial()
  .strict()

export type HotelProgrammeInput = z.output<typeof hotelProgrammeSchema>

export const hotelRegistrationSchema = z
  .object({
    role: z.literal('HOTEL'),
    name: hotelNameSchema,
    contactName: fullNameSchema,
    city: z.string({ required_error: 'Indiquez la ville' }).transform(tidy).pipe(
      z.string().min(2, 'Indiquez la ville').max(80, '80 caractères maximum'),
    ),
    address: optionalText(200),
    hotelType: optionalText(60),
    roomCount: capacitySchema,
    description: optionalText(2000),
    website: optionalUrl,
    instagramUrl: socialUrl('instagram.com', 'Instagram'),
    facebookUrl: socialUrl('facebook.com', 'Facebook'),
    youtubeUrl: socialUrl('youtube.com', 'YouTube'),
    spaces: z.array(hotelSpaceSchema).max(20, '20 espaces maximum').optional().default([]),
    programme: hotelProgrammeSchema.optional().default({}),
    ...accountFields,
  })
  .superRefine(checkPhone)

export type HotelRegistration = z.output<typeof hotelRegistrationSchema>

export const registrationSchema = z.union([artistRegistrationSchema, hotelRegistrationSchema])

/** What an artist may change on their own profile. Media has its own endpoints. */
export const artistProfileUpdateSchema = z
  .object({
    stageName: stageNameSchema.optional(),
    bio: z
      .string()
      .transform((v) => v.trim())
      .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 2000), 'Entre 10 et 2000 caractères')
      .optional(),
    country: countrySchema.optional(),
    phone: z.string().trim().optional(),
    mainCategory: z.string().optional(),
    categoryType: z.string().optional(),
    specificCategory: z.string().optional().nullable(),
    tributeTo: optionalText(80),
    secondaryCategory: z.string().optional().nullable(),
    audienceTypes: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    otherLanguages: optionalText(100),
  })
  .strict()

export const hotelProfileUpdateSchema = z
  .object({
    name: hotelNameSchema.optional(),
    description: optionalText(2000),
    city: z.string().transform(tidy).pipe(z.string().min(2).max(80)).optional(),
    country: countrySchema.optional(),
    address: optionalText(200),
    hotelType: optionalText(60),
    roomCount: capacitySchema,
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    website: optionalUrl,
    instagramUrl: socialUrl('instagram.com', 'Instagram'),
    facebookUrl: socialUrl('facebook.com', 'Facebook'),
    youtubeUrl: socialUrl('youtube.com', 'YouTube'),
    contactPhone: z.string().trim().max(40).optional().nullable(),
    repName: optionalText(100),
    responsibleName: optionalText(100),
    responsiblePhone: z.string().trim().max(40).optional().nullable(),
    responsibleEmail: z
      .union([z.literal(''), z.null(), loginEmailSchema])
      .optional()
      .transform((v) => (v ? v : null)),
    spaces: z.array(hotelSpaceSchema).max(20, '20 espaces maximum').optional(),
    programme: hotelProgrammeSchema.optional(),
  })
  .strict()

export const availabilitySchema = z
  .object({
    dateFrom: z.string().datetime({ message: 'Date invalide' }),
    dateTo: z.string().datetime({ message: 'Date invalide' }),
  })
  .refine((v) => new Date(v.dateTo) > new Date(v.dateFrom), {
    path: ['dateTo'],
    message: 'La date de fin doit être après la date de début',
  })

// ============================================================================
// Bookings - the terms the exchange convention fills in
// ============================================================================

export const BOARD_TYPES = ['ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE'] as const
export const TRANSPORT_TERMS = ['HOTEL_PAYS', 'ARTIST_PAYS', 'SHARED', 'NOT_NEEDED'] as const

/** French labels, as the convention and the screens write them. */
export const BOARD_LABELS: Record<(typeof BOARD_TYPES)[number], string> = {
  ROOM_ONLY: 'Chambre seule',
  BREAKFAST: 'Petit-déjeuner',
  HALF_BOARD: 'Demi-pension',
  FULL_BOARD: 'Pension complète',
  ALL_INCLUSIVE: 'All inclusive',
}

export const TRANSPORT_LABELS: Record<(typeof TRANSPORT_TERMS)[number], string> = {
  HOTEL_PAYS: 'Pris en charge par l’hôtel',
  ARTIST_PAYS: 'À la charge de l’artiste',
  SHARED: 'Partagé',
  NOT_NEEDED: 'Pas de transport',
}

/** An amount in euros typed in a form, stored in cents. */
const euros = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''))
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      ctx.addIssue({ code: 'custom', message: 'Indiquez un montant en euros' })
      return z.NEVER
    }
    return Math.round(n * 100)
  })

export const MAX_STAY_DAYS = 365

export const bookingCreateSchema = z
  .object({
    hotelId: z.string().min(1),
    artistId: z.string().min(1),
    startDate: z.string().datetime({ message: 'Date d’arrivée invalide' }),
    endDate: z.string().datetime({ message: 'Date de départ invalide' }),
    notes: optionalText(1000),
    companionName: optionalText(100),
    boardType: z.enum(BOARD_TYPES, { errorMap: () => ({ message: 'Choisissez la formule de repas' }) }),
    transportTerms: z.enum(TRANSPORT_TERMS, { errorMap: () => ({ message: 'Indiquez qui prend en charge le transport' }) }),
    transportNotes: optionalText(500),
    performanceDescription: z
      .string({ required_error: 'Décrivez la prestation attendue' })
      .transform(tidy)
      .pipe(z.string().min(10, 'Décrivez la prestation attendue (10 caractères minimum)').max(2000, '2000 caractères maximum')),
    performanceSchedule: optionalText(500),
    stayValue: euros,
    performanceValue: euros,
    // The rest of what the convention's articles 3, 5, 8 and 10 print.
    roomType: optionalText(100),
    includedServices: optionalText(1000),
    performanceLocation: optionalText(200),
    performanceDuration: optionalText(100),
    technicalConditions: optionalText(1000),
    socialContent: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    const start = new Date(v.startDate)
    const end = new Date(v.endDate)
    if (start.getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'La date d’arrivée doit être dans le futur' })
    }
    if (end <= start) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La date de départ doit être après l’arrivée' })
    } else if (end.getTime() - start.getTime() > MAX_STAY_DAYS * 24 * 3600 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: `Un séjour ne peut pas dépasser ${MAX_STAY_DAYS} jours` })
    }
  })

export type BookingCreateInput = z.output<typeof bookingCreateSchema>

// ============================================================================
// Convention signature
// ============================================================================

const requiredText = (min: number, max: number, message: string) =>
  z
    .string({ required_error: message })
    .transform(tidy)
    .pipe(z.string().min(min, message).max(max, `${max} caractères maximum`))

/** The typed name must be the signatory's own, give or take case and accents. */
const sameName = (a: string, b: string) => {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  return fold(a) === fold(b)
}

const signatureCommon = {
  termsHash: z.string().regex(/^[a-f0-9]{64}$/, 'Rechargez la convention avant de signer'),
  accept: z.literal(true, { errorMap: () => ({ message: 'Cochez la case pour accepter la convention' }) }),
  typedName: requiredText(2, 100, 'Tapez votre nom pour signer'),
}

export const hotelSignatureSchema = z
  .object({
    legalName: requiredText(2, 200, 'Indiquez la dénomination de l’établissement'),
    legalForm: optionalText(100),
    address: requiredText(5, 300, 'Indiquez l’adresse de l’établissement'),
    registrationNumber: optionalText(60),
    taxId: optionalText(60),
    signatoryName: requiredText(2, 100, 'Indiquez qui signe pour l’hôtel'),
    signatoryTitle: requiredText(2, 100, 'Indiquez sa fonction'),
    ...signatureCommon,
  })
  .refine((v) => sameName(v.typedName, v.signatoryName), {
    path: ['typedName'],
    message: 'Tapez exactement le nom du signataire',
  })

export const participantSignatureSchema = z
  .object({
    fullName: requiredText(2, 100, 'Indiquez votre nom complet'),
    address: requiredText(5, 300, 'Indiquez votre adresse'),
    idDocument: z
      .string({ required_error: 'Indiquez le numéro de votre CIN ou passeport' })
      .transform(tidy)
      .pipe(
        z
          .string()
          .min(4, 'Indiquez le numéro de votre CIN ou passeport')
          .max(40, '40 caractères maximum')
          .regex(/^[A-Za-z0-9 .\-/]+$/, 'Lettres et chiffres uniquement')
      ),
    ...signatureCommon,
  })
  .refine((v) => sameName(v.typedName, v.fullName), {
    path: ['typedName'],
    message: 'Tapez exactement votre nom complet',
  })

// ============================================================================
// After a cancellation (article 14)
// ============================================================================

export const transportClaimSchema = z.object({
  amount: euros.refine((v) => v !== null && v > 0, 'Indiquez le montant à rembourser'),
  note: optionalText(1000),
})

export const transportSettleSchema = z.object({
  status: z.enum(['PAID', 'REJECTED']),
  note: optionalText(500),
})

export const feeSettleSchema = z.object({
  status: z.enum(['PAID', 'WAIVED']),
  note: optionalText(500),
})

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  reason: optionalText(500),
})

export const ratingCreateSchema = z.object({
  bookingId: z.string().min(1),
  stars: z.number().int('Note entière de 1 à 5').min(1, 'Note de 1 à 5').max(5, 'Note de 1 à 5'),
  textReview: z
    .string({ required_error: 'Écrivez quelques mots' })
    .transform(tidy)
    .pipe(z.string().min(10, '10 caractères minimum').max(1000, '1000 caractères maximum')),
  isVisibleToArtist: z.boolean().optional().default(false),
})

/**
 * Turn a ZodError into { field: message }, keeping the first message per
 * field. Nested paths are dotted ("spaces.0.name").
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
