import { RegistrationFormData, ValidationError } from './artistRegistration';

// Email validation (RFC compliant)
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePassword = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const requirementsMet = Object.values(requirements).filter(Boolean).length;
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (requirementsMet >= 4) strength = 'strong';
  else if (requirementsMet >= 3) strength = 'medium';

  return {
    isValid: requirements.minLength && requirements.hasUppercase && requirements.hasLowercase && requirements.hasNumber,
    strength,
    requirements
  };
};

// Phone number validation (international)
export const validatePhone = (phone: string): boolean => {
  // Allow various phone formats
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Birth date validation (DD/MM/YYYY format and age check)
export const validateBirthDate = (birthDate: string, minAge: number = 13): {
  isValid: boolean;
  isCorrectFormat: boolean;
  isOldEnough: boolean;
  age: number | null;
} => {
  const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/([12]\d{3})$/;

  if (!dateRegex.test(birthDate)) {
    return {
      isValid: false,
      isCorrectFormat: false,
      isOldEnough: false,
      age: null
    };
  }

  const [day, month, year] = birthDate.split('/').map(Number);
  const birthDateObj = new Date(year, month - 1, day);

  // Check if date is valid
  if (birthDateObj.getFullYear() !== year || birthDateObj.getMonth() + 1 !== month || birthDateObj.getDate() !== day) {
    return {
      isValid: false,
      isCorrectFormat: true,
      isOldEnough: false,
      age: null
    };
  }

  // Check if birth date is in the future
  if (birthDateObj > new Date()) {
    return {
      isValid: false,
      isCorrectFormat: true,
      isOldEnough: false,
      age: null
    };
  }

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDifference = today.getMonth() - birthDateObj.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  const isOldEnough = age >= minAge;

  return {
    isValid: isOldEnough,
    isCorrectFormat: true,
    isOldEnough,
    age
  };
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name);
};

// Required field validation
export const validateRequired = (value: string | string[] | boolean): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== '' && value !== false;
};

// Form validation
export const validateRegistrationForm = (data: Partial<RegistrationFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Step 1 validations
  if (!validateRequired(data.email || '')) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(data.email || '')) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!validateRequired(data.password || '')) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePassword(data.password || '');
    if (!passwordValidation.isValid) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }
  }

  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (!validateRequired(data.firstName || '')) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (!validateName(data.firstName || '')) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
  }

  if (!validateRequired(data.lastName || '')) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (!validateName(data.lastName || '')) {
    errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
  }

  if (!validateRequired(data.stageName || '')) {
    errors.push({ field: 'stageName', message: 'Stage name is required' });
  }

  if (!validateRequired(data.birthDate || '')) {
    errors.push({ field: 'birthDate', message: 'Birth date is required' });
  } else {
    const dateValidation = validateBirthDate(data.birthDate || '');
    if (!dateValidation.isCorrectFormat) {
      errors.push({ field: 'birthDate', message: 'Birth date must be in DD/MM/YYYY format' });
    } else if (!dateValidation.isOldEnough) {
      errors.push({ field: 'birthDate', message: 'You must be at least 13 years old' });
    }
  }

  if (!validateRequired(data.phone || '')) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!validatePhone(data.phone || '')) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
  }

  if (!validateRequired(data.country || '')) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  // Step 2 validations
  if (!validateRequired(data.mainCategory || '')) {
    errors.push({ field: 'mainCategory', message: 'Main category is required' });
  }

  if (!validateRequired(data.audienceType || [])) {
    errors.push({ field: 'audienceType', message: 'Select at least one audience type' });
  }

  if (!validateRequired(data.languages || [])) {
    errors.push({ field: 'languages', message: 'Select at least one language' });
  }

  // Step 3 validations
  if (!validateRequired(data.categoryType || '')) {
    errors.push({ field: 'categoryType', message: 'Category type is required' });
  }

  if (!validateRequired(data.specificCategory || '')) {
    errors.push({ field: 'specificCategory', message: 'Specific category is required' });
  }

  if (!validateRequired(data.domain || '')) {
    errors.push({ field: 'domain', message: 'Domain is required' });
  }

  // Legal validations
  if (!data.termsAccepted) {
    errors.push({ field: 'termsAccepted', message: 'You must accept the terms and conditions' });
  }

  if (!data.privacyAccepted) {
    errors.push({ field: 'privacyAccepted', message: 'You must accept the privacy policy' });
  }

  return errors;
};

// Step-specific validation
export const validateStep = (step: 1 | 2 | 3, data: Partial<RegistrationFormData>): ValidationError[] => {
  const allErrors = validateRegistrationForm(data);

  if (step === 1) {
    return allErrors.filter(error =>
      ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'stageName', 'birthDate', 'phone', 'country'].includes(error.field)
    );
  }

  if (step === 2) {
    return allErrors.filter(error =>
      ['mainCategory', 'audienceType', 'languages'].includes(error.field)
    );
  }

  if (step === 3) {
    return allErrors.filter(error =>
      ['categoryType', 'specificCategory', 'domain', 'termsAccepted', 'privacyAccepted'].includes(error.field)
    );
  }

  return [];
};

// Get error message for field
export const getFieldError = (field: string, errors: ValidationError[]): string | undefined => {
  return errors.find(e => e.field === field)?.message;
};

// Check if field has error
export const hasFieldError = (field: string, errors: ValidationError[]): boolean => {
  return errors.some(e => e.field === field);
};
