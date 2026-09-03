import { VALIDATION, PASSWORD_REQUIREMENTS } from '@/types/artistRegistration';
import { t } from '@/i18n'

export class RegistrationValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    return VALIDATION.email.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    if (!phone) return false;

    // The pattern alone accepts "123": its three digit groups are each 1-4
    // wide with optional separators, so any run of three digits satisfies it.
    // The shape check still runs first (it rejects letters and stray
    // punctuation), then the digit count enforces a real number. E.164 puts
    // that between 7 and 15 digits, country code included.
    if (!VALIDATION.phone.test(phone)) return false;

    const digitCount = phone.replace(/\D/g, '').length;
    return digitCount >= 7 && digitCount <= 15;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Minimum ${PASSWORD_REQUIREMENTS.minLength} characters required`);
    }

    if (PASSWORD_REQUIREMENTS.uppercase && !/[A-Z]/.test(password)) {
      errors.push('Au moins une lettre majuscule');
    }

    if (PASSWORD_REQUIREMENTS.lowercase && !/[a-z]/.test(password)) {
      errors.push('Au moins une lettre minuscule');
    }

    if (PASSWORD_REQUIREMENTS.numbers && !/\d/.test(password)) {
      errors.push('Au moins un chiffre');
    }

    if (PASSWORD_REQUIREMENTS.special && !/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push(t('Au moins un caractère spécial'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate birth date in DD/MM/YYYY format
   */
  static validateBirthDate(dateString: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!VALIDATION.date.test(dateString)) {
      return {
        isValid: false,
        error: 'Le format attendu est JJ/MM/AAAA'
      };
    }

    const [day, month, year] = dateString.split('/').map(Number);

    // Basic date validation
    if (month < 1 || month > 12) {
      return {
        isValid: false,
        error: 'Mois invalide'
      };
    }

    if (day < 1 || day > 31) {
      return {
        isValid: false,
        error: 'Jour invalide'
      };
    }

    // Check if user is at least 13 years old
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Subtract 1 from age if birthday hasn't occurred yet this year
      const actualAge = age - 1;
      if (actualAge < 13) {
        return {
          isValid: false,
          error: 'Vous devez avoir au moins 13 ans'
        };
      }
    } else {
      if (age < 13) {
        return {
          isValid: false,
          error: 'Vous devez avoir au moins 13 ans'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate that passwords match
   */
  static validatePasswordMatch(
    password: string,
    confirmPassword: string
  ): {
    isValid: boolean;
    error?: string;
  } {
    if (password !== confirmPassword) {
      return {
        isValid: false,
        error: 'Les mots de passe ne correspondent pas'
      };
    }
    return { isValid: true };
  }

  /**
   * Validate all basic information fields
   */
  static validateBasicInfo(basicInfo: any): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Required fields
    if (!basicInfo.stageName?.trim()) {
      errors.stageName = t('Le nom de scène est obligatoire');
    }

    if (!basicInfo.firstName?.trim()) {
      errors.firstName = t('Le prénom est obligatoire');
    }

    if (!basicInfo.lastName?.trim()) {
      errors.lastName = 'Le nom est obligatoire';
    }

    if (!basicInfo.birthDate?.trim()) {
      errors.birthDate = 'La date de naissance est obligatoire';
    } else {
      const birthDateValidation = this.validateBirthDate(basicInfo.birthDate);
      if (!birthDateValidation.isValid) {
        errors.birthDate = birthDateValidation.error || 'Date de naissance invalide';
      }
    }

    if (!basicInfo.phone?.trim()) {
      errors.phone = t('Le numéro de téléphone est obligatoire');
    } else if (!this.validatePhone(basicInfo.phone)) {
      errors.phone = t('Format de numéro de téléphone invalide');
    }

    if (!basicInfo.email?.trim()) {
      errors.email = t('L’adresse e-mail est obligatoire');
    } else if (!this.validateEmail(basicInfo.email)) {
      errors.email = 'Adresse e-mail invalide';
    }

    if (!basicInfo.password) {
      errors.password = 'Le mot de passe est obligatoire';
    } else {
      const passwordValidation = this.validatePassword(basicInfo.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors.join(', ');
      }
    }

    if (!basicInfo.confirmPassword) {
      errors.confirmPassword = 'Confirmez votre mot de passe';
    } else {
      const matchValidation = this.validatePasswordMatch(
        basicInfo.password,
        basicInfo.confirmPassword
      );
      if (!matchValidation.isValid) {
        errors.confirmPassword = matchValidation.error || 'Les mots de passe ne correspondent pas';
      }
    }

    if (!basicInfo.country) {
      errors.country = 'Le pays est obligatoire';
    }

    if (!basicInfo.agreeToTerms) {
      errors.agreeToTerms = t('Vous devez accepter les conditions d’utilisation');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate artistic category selection
   */
  static validateArtisticCategory(artisticCategory: any): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!artisticCategory.mainCategory) {
      errors.mainCategory = t('La catégorie principale est obligatoire');
    }

    if (!artisticCategory.audienceType || artisticCategory.audienceType.length === 0) {
      errors.audienceType = t('Sélectionnez au moins un type de public');
    }

    if (!artisticCategory.languages || artisticCategory.languages.length === 0) {
      errors.languages = t('Sélectionnez au moins une langue');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate subcategory selection
   */
  static validateSubcategory(subcategory: any): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!subcategory.categoryType) {
      errors.categoryType = t('Le type de catégorie est obligatoire');
    }

    if (!subcategory.domain) {
      errors.domain = 'Le domaine est obligatoire';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format based on country (simple international format)
  if (digits.length === 10) {
    // France
    return `+33 ${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
  }

  return phone;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  // Parse DD/MM/YYYY format
  const [day, month, year] = dateString.split('/');

  if (!day || !month || !year) return dateString;

  // Create date object
  const date = new Date(`${year}-${month}-${day}`);

  // Format as locale string
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calculate age from birth date
 */
export function calculateAge(dateString: string): number {
  if (!dateString) return 0;

  const [day, month, year] = dateString.split('/').map(Number);
  const birthDate = new Date(year, month - 1, day);

  // Anything that is not DD/MM/YYYY parses to NaN and produced an Invalid
  // Date, which then propagated NaN out of this function into age checks and
  // into the UI. An unparseable date is treated as "no age known", matching
  // the empty-string case above.
  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get password strength percentage
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (!password) return 0;

  // Length
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;

  // Lowercase
  if (/[a-z]/.test(password)) strength += 20;

  // Uppercase
  if (/[A-Z]/.test(password)) strength += 20;

  // Numbers
  if (/\d/.test(password)) strength += 15;

  // Special characters
  if (/[@$!%*?&]/.test(password)) strength += 15;

  return Math.min(strength, 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  if (strength < 20) return t('Très faible');
  if (strength < 40) return 'Faible';
  if (strength < 60) return 'Moyen';
  if (strength < 80) return 'Bon';
  if (strength < 100) return 'Robuste';
  return t('Très robuste');
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  /* Three steps, not six. The old ramp ran red-orange-amber-lime-green-green
     across a palette that only has three meanings, so two of its bands were
     indistinguishable to the eye and the last two were identical. */
  if (strength < 40) return 'text-[var(--state-critical)]';
  if (strength < 70) return 'text-[var(--state-caution)]';
  return 'text-[var(--state-positive)]';
}
