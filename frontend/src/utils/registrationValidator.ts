import { VALIDATION, PASSWORD_REQUIREMENTS } from '@/types/artistRegistration';

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
    return VALIDATION.phone.test(phone);
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
      errors.push('At least one uppercase letter required');
    }

    if (PASSWORD_REQUIREMENTS.lowercase && !/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter required');
    }

    if (PASSWORD_REQUIREMENTS.numbers && !/\d/.test(password)) {
      errors.push('At least one number required');
    }

    if (PASSWORD_REQUIREMENTS.special && !/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('At least one special character required');
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
        error: 'Date format must be DD/MM/YYYY'
      };
    }

    const [day, month, year] = dateString.split('/').map(Number);

    // Basic date validation
    if (month < 1 || month > 12) {
      return {
        isValid: false,
        error: 'Invalid month'
      };
    }

    if (day < 1 || day > 31) {
      return {
        isValid: false,
        error: 'Invalid day'
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
          error: 'You must be at least 13 years old'
        };
      }
    } else {
      if (age < 13) {
        return {
          isValid: false,
          error: 'You must be at least 13 years old'
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
        error: 'Passwords do not match'
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
      errors.stageName = 'Stage name is required';
    }

    if (!basicInfo.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!basicInfo.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!basicInfo.birthDate?.trim()) {
      errors.birthDate = 'Birth date is required';
    } else {
      const birthDateValidation = this.validateBirthDate(basicInfo.birthDate);
      if (!birthDateValidation.isValid) {
        errors.birthDate = birthDateValidation.error || 'Invalid birth date';
      }
    }

    if (!basicInfo.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!this.validatePhone(basicInfo.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (!basicInfo.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(basicInfo.email)) {
      errors.email = 'Invalid email address';
    }

    if (!basicInfo.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = this.validatePassword(basicInfo.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors.join(', ');
      }
    }

    if (!basicInfo.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else {
      const matchValidation = this.validatePasswordMatch(
        basicInfo.password,
        basicInfo.confirmPassword
      );
      if (!matchValidation.isValid) {
        errors.confirmPassword = matchValidation.error || 'Passwords do not match';
      }
    }

    if (!basicInfo.country) {
      errors.country = 'Country is required';
    }

    if (!basicInfo.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
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
      errors.mainCategory = 'Main category is required';
    }

    if (!artisticCategory.audienceType || artisticCategory.audienceType.length === 0) {
      errors.audienceType = 'Select at least one audience type';
    }

    if (!artisticCategory.languages || artisticCategory.languages.length === 0) {
      errors.languages = 'Select at least one language';
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
      errors.categoryType = 'Category type is required';
    }

    if (!subcategory.domain) {
      errors.domain = 'Domain is required';
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
  if (strength < 20) return 'Very weak';
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  if (strength < 100) return 'Strong';
  return 'Very strong';
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength < 20) return 'text-red-600';
  if (strength < 40) return 'text-orange-600';
  if (strength < 60) return 'text-amber-600';
  if (strength < 80) return 'text-lime-600';
  if (strength < 100) return 'text-green-600';
  return 'text-green-700';
}
