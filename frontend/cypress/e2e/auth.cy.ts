/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('Login Page', () => {
    it('TC-AUTH-001: Should display login form correctly', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
      cy.contains('Sign In').should('be.visible')
    })

    it('TC-AUTH-002: Should login successfully with valid credentials', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
    })

    it('TC-AUTH-003: Should show error on invalid credentials', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show error toast
      cy.contains('Invalid credentials', { timeout: 5000 }).should('be.visible')
      cy.url().should('include', '/login')
    })

    it('TC-AUTH-004: Should validate email format', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid-email')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.contains('Invalid email address').should('be.visible')
    })

    it('TC-AUTH-005: Should validate required fields', () => {
      cy.visit('/login')
      cy.get('button[type="submit"]').click()
      
      // Should show required field errors
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('TC-AUTH-006: Should show loading state during login', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Button should show loading state
      cy.get('button[type="submit"]').should('contain', 'Signing in...')
    })

    it('TC-AUTH-007: Should navigate to forgot password page', () => {
      cy.visit('/login')
      cy.contains('Forgot your password?').click()
      cy.url().should('include', '/forgot-password')
    })

    it('TC-AUTH-008: Should navigate to register page', () => {
      cy.visit('/login')
      cy.contains('Sign up here').click()
      cy.url().should('include', '/register')
    })

    it('TC-AUTH-009: Should redirect authenticated users away from login', () => {
      // Login first
      cy.visit('/login')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
      
      // Try to access login page again
      cy.visit('/login')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Registration Flow', () => {
    it('TC-REG-001: Should display registration form', () => {
      cy.visit('/register')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('input[name="name"]').should('be.visible')
      cy.get('input[name="role"]').should('be.visible')
    })

    it('TC-REG-002: Should register new user successfully', () => {
      const timestamp = Date.now()
      const email = `test${timestamp}@example.com`
      
      cy.visit('/register')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type('password123')
      cy.get('input[value="ARTIST"]').check()
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard', { timeout: 10000 })
    })

    it('TC-REG-003: Should validate email uniqueness', () => {
      cy.visit('/register')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('artist1@example.com') // Existing email
      cy.get('input[name="password"]').type('password123')
      cy.get('input[value="ARTIST"]').check()
      cy.get('button[type="submit"]').click()
      
      // Should show error
      cy.contains('already exists', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Password Reset Flow', () => {
    it('TC-PWD-001: Should display forgot password form', () => {
      cy.visit('/forgot-password')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('TC-PWD-002: Should submit forgot password request', () => {
      cy.visit('/forgot-password')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('button[type="submit"]').click()
      
      // Should show success message
      cy.contains('reset instructions', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Logout Flow', () => {
    it('TC-LOGOUT-001: Should logout successfully', () => {
      // Login first
      cy.visit('/login')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Logout').click()
      
      // Should redirect to home
      cy.url().should('not.include', '/dashboard')
      cy.url().should('include', '/')
    })
  })
})







