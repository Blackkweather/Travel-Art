/**
 * REGISTRATION TYPES REFERENCE
 * Complete TypeScript definitions for the Artist Registration System
 */

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Step 1: Basic Information
 * Personal details and account credentials
 */
export interface BasicInfo {
  /** Artist's stage/performance name */
  stageName: string;
  
  /** Birth date in DD/MM/YYYY format */
  birthDate: string;
  
  /** Legal last name */
  lastName: string;
  
  /** Legal first name */
  firstName: string;
  
  /** International phone number */
  phone: string;
  
  /** Valid email address */
  email: string;
  
  /** Account password (min 8 chars, uppercase, lowercase, number, special) */
  password: string;
  
  /** Password confirmation */
  confirmPassword: string;
  
  /** Country of residence */
  country: string;
  
  /** Terms & conditions acceptance */
  agreeToTerms: boolean;
}

/**
 * Step 2: Artistic Category
 * Main artistic domain and audience preferences
 */
export interface ArtisticCategory {
  /** Primary artistic category (Music, Visual, Circus, etc.) */
  mainCategory: string;
  
  /** Optional secondary artistic category */
  secondaryCategory?: string;
  
  /** Target audience (Adultes, Familles, etc.) */
  audienceType: string[];
  
  /** Languages spoken (Français, English, Autre) */
  languages: string[];
}

/**
 * Step 3: Subcategory Selection
 * Detailed categorization based on Step 2 selection
 */
export interface SubcategoryInfo {
  /** Category type (Performer, DJ, Solo, etc. for Music) */
  categoryType: string;
  
  /** Specific subcategory within category type */
  specificCategory: string;
  
  /** Final domain selection (Saxophone, Guitar, etc.) */
  domain: string;
}

/**
 * Complete Registration Data
 * Combines all three steps into one data structure
 */
export interface ArtistRegistrationData {
  /** Current step (1, 2, or 3) */
  step: number;
  
  /** Step 1 data */
  basicInfo: BasicInfo;
  
  /** Step 2 data */
  artisticCategory: ArtisticCategory;
  
  /** Step 3 data */
  subcategory: SubcategoryInfo;
}

/**
 * API Submission Payload
 * Formatted data sent to backend
 */
export interface RegistrationSubmissionPayload {
  name: string;
  stageName: string;
  email: string;
  phone: string;
  country: string;
  birthDate: string;
  password: string;
  role: 'ARTIST';
  artisticProfile: {
    mainCategory: string;
    secondaryCategory?: string;
    audienceType: string[];
    languages: string[];
    categoryType: string;
    specificCategory: string;
    domain: string;
  };
}

/**
 * API Response on Success
 */
export interface RegistrationSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    role: 'ARTIST';
    stageName: string;
  };
}

/**
 * API Response on Error
 */
export interface RegistrationErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for Step1BasicInfo component
 */
export interface Step1Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
  isLoading?: boolean;
}

/**
 * Props for Step2ArtisticCategory component
 */
export interface Step2Props {
  data: ArtisticCategory;
  onChange: (data: ArtisticCategory) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * Props for Step3SubcategorySelection component
 */
export interface Step3Props {
  mainCategory: string;
  data: SubcategoryInfo;
  onChange: (data: SubcategoryInfo) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * Props for SelectWithSearch component
 */
export interface SelectWithSearchProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Props for CheckboxGroup component
 */
export interface CheckboxGroupProps {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  layout?: 'vertical' | 'grid';
}

/**
 * Props for RadioGroup component
 */
export interface RadioGroupProps {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

/**
 * Props for StepIndicator component
 */
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

/**
 * Props for ArtistRegistrationFlow component
 */
export interface ArtistRegistrationFlowProps {
  onSuccess?: (userId: string) => void;
  onError?: (error: Error) => void;
  redirectUrl?: string;
}

// ============================================================================
// CATEGORY OPTIONS
// ============================================================================

export type MainCategory = 
  | 'Musique'
  | 'Visuel'
  | 'Arts & craft'
  | 'Cirque'
  | 'Magie'
  | 'Humour'
  | 'Danse'
  | 'Famille'
  | 'Lifestyle';

export type AudienceType = 'Adultes' | 'Familles';

export type Language = 'Français' | 'English' | 'Autre';

export type MusicCategoryType = 
  | 'Tribu Artistique'
  | 'Performer'
  | 'DJ'
  | 'Solo'
  | 'Groupe de musique'
  | 'Univers Artistique';

export type VisualCategoryType = 'Arts & craft' | 'Visuel';

export type CirqueCategoryType = 'Cirque';

export type MagieCategoryType = 'Magie';

export type HumourCategoryType = 'Humour';

export type DanceCategoryType = 'Danse';

export type FamilyCategoryType =
  | 'Magie pour enfants'
  | 'Sculpture de bulles'
  | 'Conte'
  | 'Chant'
  | 'Arts & craft Famille';

export type LifestyleCategoryType = 'Lifestyle';

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Regular expressions for form validation
 */
export interface ValidationPatterns {
  /** Email RFC 5322 pattern */
  email: RegExp;
  
  /** International phone number pattern */
  phone: RegExp;
  
  /** Strong password pattern */
  password: RegExp;
  
  /** DD/MM/YYYY date pattern */
  date: RegExp;
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  minLength: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Form validation error structure
 */
export interface FormErrors {
  [fieldName: string]: string;
}

/**
 * Step-specific validation errors
 */
export interface StepErrors {
  step1: FormErrors;
  step2: FormErrors;
  step3: FormErrors;
}

/**
 * Registration status type
 */
export type RegistrationStatus = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'validating';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial updates for form sections
 */
export type BasicInfoUpdate = Partial<BasicInfo>;
export type ArtisticCategoryUpdate = Partial<ArtisticCategory>;
export type SubcategoryUpdate = Partial<SubcategoryInfo>;

/**
 * Form state change handlers
 */
export type BasicInfoHandler = (data: BasicInfo) => void;
export type ArtisticCategoryHandler = (data: ArtisticCategory) => void;
export type SubcategoryHandler = (data: SubcategoryInfo) => void;

/**
 * Validation function type
 */
export type ValidationFn = (value: string) => boolean;

/**
 * Option structure for selects and inputs
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Main artistic categories
 */
export const MAIN_CATEGORIES: SelectOption[] = [
  { value: 'Musique', label: 'Musique (Music)' },
  { value: 'Visuel', label: 'Visuel (Visual)' },
  { value: 'Arts & craft', label: 'Arts & craft' },
  { value: 'Cirque', label: 'Cirque (Circus)' },
  { value: 'Magie', label: 'Magie (Magic)' },
  { value: 'Humour', label: 'Humour (Humor)' },
  { value: 'Danse', label: 'Danse (Dance)' },
  { value: 'Famille', label: 'Famille (Family)' },
  { value: 'Lifestyle', label: 'Lifestyle' }
];

/**
 * Audience types
 */
export const AUDIENCE_TYPES: SelectOption[] = [
  { value: 'Adultes', label: 'Adultes (Adults)' },
  { value: 'Familles', label: 'Familles (Families)' }
];

/**
 * Languages spoken
 */
export const LANGUAGES: SelectOption[] = [
  { value: 'Français', label: 'Français' },
  { value: 'English', label: 'English' },
  { value: 'Autre', label: 'Autre (Other)' }
];

/**
 * Validation patterns
 */
export const VALIDATION: ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
  date: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/
};

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  uppercase: true,
  lowercase: true,
  numbers: true,
  special: true
};

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Check if value is valid AudienceType
 */
export function isAudienceType(value: unknown): value is AudienceType {
  return value === 'Adultes' || value === 'Familles';
}

/**
 * Check if value is valid Language
 */
export function isLanguage(value: unknown): value is Language {
  return value === 'Français' || value === 'English' || value === 'Autre';
}

/**
 * Check if value is valid MainCategory
 */
export function isMainCategory(value: unknown): value is MainCategory {
  return [
    'Musique', 'Visuel', 'Arts & craft', 'Cirque',
    'Magie', 'Humour', 'Danse', 'Famille', 'Lifestyle'
  ].includes(value as string);
}

/**
 * Check if BasicInfo is valid
 */
export function isValidBasicInfo(data: unknown): data is BasicInfo {
  const info = data as BasicInfo;
  return !!(
    info.stageName &&
    info.firstName &&
    info.lastName &&
    info.birthDate &&
    info.phone &&
    info.email &&
    info.password &&
    info.confirmPassword &&
    info.country &&
    info.agreeToTerms
  );
}

/**
 * Check if ArtisticCategory is valid
 */
export function isValidArtisticCategory(data: unknown): data is ArtisticCategory {
  const cat = data as ArtisticCategory;
  return !!(
    cat.mainCategory &&
    cat.audienceType?.length > 0 &&
    cat.languages?.length > 0
  );
}

/**
 * Check if SubcategoryInfo is valid
 */
export function isValidSubcategory(data: unknown): data is SubcategoryInfo {
  const sub = data as SubcategoryInfo;
  return !!(sub.categoryType && sub.domain);
}

// ============================================================================
// INITIAL STATE FACTORY
// ============================================================================

/**
 * Create initial BasicInfo state
 */
export function createInitialBasicInfo(): BasicInfo {
  return {
    stageName: '',
    birthDate: '',
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    agreeToTerms: false
  };
}

/**
 * Create initial ArtisticCategory state
 */
export function createInitialArtisticCategory(): ArtisticCategory {
  return {
    mainCategory: '',
    secondaryCategory: undefined,
    audienceType: [],
    languages: [],
    otherLanguages: undefined
  };
}

/**
 * Create initial SubcategoryInfo state
 */
export function createInitialSubcategory(): SubcategoryInfo {
  return {
    categoryType: '',
    specificCategory: '',
    domain: ''
  };
}

/**
 * Create initial ArtistRegistrationData state
 */
export function createInitialRegistrationData(): ArtistRegistrationData {
  return {
    step: 1,
    basicInfo: createInitialBasicInfo(),
    artisticCategory: createInitialArtisticCategory(),
    subcategory: createInitialSubcategory()
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return VALIDATION.email.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  return VALIDATION.password.test(password);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  return VALIDATION.phone.test(phone);
}

/**
 * Validate date format (DD/MM/YYYY)
 */
export function validateDate(date: string): boolean {
  return VALIDATION.date.test(date);
}

/**
 * Get password strength indicator
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!validatePassword(password)) return 'weak';
  if (password.length >= 12) return 'strong';
  return 'medium';
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `+33 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Parse date string from DD/MM/YYYY to Date object
 */
export function parseDateString(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  
  const [, day, month, year] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Format Date object to DD/MM/YYYY string
 */
export function formatDateString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}
