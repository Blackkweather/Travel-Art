import { describe, it, expect } from 'vitest';
import { RegistrationValidator, formatPhoneNumber, formatDate, calculateAge } from '../registrationValidator';

describe('RegistrationValidator', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(RegistrationValidator.validateEmail('test@example.com')).toBe(true);
      expect(RegistrationValidator.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(RegistrationValidator.validateEmail('invalid')).toBe(false);
      expect(RegistrationValidator.validateEmail('@example.com')).toBe(false);
      expect(RegistrationValidator.validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const result = RegistrationValidator.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
    });

    it('rejects weak passwords', () => {
      const result1 = RegistrationValidator.validatePassword('short');
      expect(result1.isValid).toBe(false);

      const result2 = RegistrationValidator.validatePassword('nouppercase123!');
      expect(result2.isValid).toBe(false);

      const result3 = RegistrationValidator.validatePassword('NOLOWERCASE123!');
      expect(result3.isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('validates phone numbers', () => {
      expect(RegistrationValidator.validatePhone('+33123456789')).toBe(true);
      expect(RegistrationValidator.validatePhone('0123456789')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(RegistrationValidator.validatePhone('123')).toBe(false);
      expect(RegistrationValidator.validatePhone('abc')).toBe(false);
    });
  });

  describe('validatePasswordMatch', () => {
    it('validates matching passwords', () => {
      const result = RegistrationValidator.validatePasswordMatch('password123', 'password123');
      expect(result.isValid).toBe(true);
    });

    it('rejects non-matching passwords', () => {
      const result = RegistrationValidator.validatePasswordMatch('password123', 'password456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('formatPhoneNumber', () => {
  it('formats phone numbers correctly', () => {
    expect(formatPhoneNumber('0123456789')).toContain('+33');
  });

  it('handles already formatted numbers', () => {
    const formatted = formatPhoneNumber('+33123456789');
    expect(formatted).toBeTruthy();
  });
});

describe('formatDate', () => {
  it('formats dates correctly', () => {
    const formatted = formatDate('25/12/1990');
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('');
  });

  it('handles empty dates', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null as any)).toBe('');
  });
});

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const birthYear = new Date().getFullYear() - 25;
    const age = calculateAge(`01/01/${birthYear}`);
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(26);
  });

  it('handles invalid dates', () => {
    expect(calculateAge('')).toBe(0);
    expect(calculateAge('invalid')).toBe(0);
  });
});





