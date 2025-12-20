/**
 * Accessibility Utilities
 * Provides helpers for ensuring WCAG compliance and better UX for all users
 */

/**
 * Common ARIA labels for authentication forms
 */
export const ariaLabels = {
  emailInput: 'Email address for account',
  passwordInput: 'Password for account security',
  passwordToggle: 'Toggle password visibility',
  loginButton: 'Sign in to your account',
  registerButton: 'Create a new account',
  rememberMe: 'Remember me on this device',
  forgotPassword: 'Reset your forgotten password',
  socialGoogle: 'Sign in with Google account',
  socialFacebook: 'Sign in with Facebook account',
  socialMicrosoft: 'Sign in with Microsoft account',
  roleSelectorArtist: 'Select artist account type',
  roleSelectorHotel: 'Select hotel account type',
  termsCheckbox: 'I agree to the terms of service and privacy policy'
}

/**
 * Color contrast ratios (WCAG AA/AAA)
 */
export const colorContrast = {
  navy: '#0B1F3F',
  gold: '#C9A63C',
  cream: '#F9F8F3',
  white: '#FFFFFF',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  red: '#DC2626',
  green: '#16A34A',
  blue: '#2563EB'
}

/**
 * Verify color contrast ratio
 * Returns WCAG level: 'AAA' | 'AA' | 'FAIL'
 */
export const getContrastLevel = (
  foreground: string,
  background: string
): 'AAA' | 'AA' | 'FAIL' => {
  const fgColor = hexToRgb(foreground)
  const bgColor = hexToRgb(background)

  if (!fgColor || !bgColor) return 'FAIL'

  const contrast = calculateContrastRatio(fgColor, bgColor)

  if (contrast >= 7) return 'AAA'
  if (contrast >= 4.5) return 'AA'
  return 'FAIL'
}

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Calculate WCAG contrast ratio
 */
const calculateContrastRatio = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number => {
  const lum1 = getRelativeLuminance(color1)
  const lum2 = getRelativeLuminance(color2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get relative luminance for WCAG calculations
 */
const getRelativeLuminance = (color: { r: number; g: number; b: number }): number => {
  const [r, g, b] = [color.r, color.g, color.b].map((val) => {
    const v = val / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement is read
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Move focus to element with smooth scroll
   */
  focusElement: (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },

  /**
   * Get first focusable element
   */
  getFirstFocusable: (container: HTMLElement): HTMLElement | null => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ]

    return container.querySelector(focusableSelectors.join(',')) as HTMLElement | null
  },

  /**
   * Trap focus within container (modal behavior)
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ]

    const focusableElements = Array.from(
      container.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[]

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
    } else {
      if (activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }
}

/**
 * Form validation accessibility
 */
export const formA11y = {
  /**
   * Set error state with ARIA attributes
   */
  setError: (
    input: HTMLInputElement,
    errorMessage: string,
    errorId: string
  ) => {
    input.setAttribute('aria-invalid', 'true')
    input.setAttribute('aria-describedby', errorId)

    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.setAttribute('role', 'alert')
      errorElement.textContent = errorMessage
    }
  },

  /**
   * Clear error state
   */
  clearError: (input: HTMLInputElement, errorId: string) => {
    input.setAttribute('aria-invalid', 'false')
    input.removeAttribute('aria-describedby')

    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.textContent = ''
    }
  }
}

/**
 * Keyboard shortcut helpers
 */
export const keyboardShortcuts = {
  /**
   * Check if Enter key was pressed
   */
  isEnter: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.code === 'Enter'
  },

  /**
   * Check if Escape key was pressed
   */
  isEscape: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape' || event.code === 'Escape'
  },

  /**
   * Check if Tab key was pressed
   */
  isTab: (event: KeyboardEvent): boolean => {
    return event.key === 'Tab' || event.code === 'Tab'
  },

  /**
   * Check if Ctrl/Cmd + key combination
   */
  isModifierKey: (event: KeyboardEvent, key: string): boolean => {
    return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === key.toLowerCase()
  }
}

export default {
  ariaLabels,
  colorContrast,
  getContrastLevel,
  announceToScreenReader,
  focusManagement,
  formA11y,
  keyboardShortcuts
}
