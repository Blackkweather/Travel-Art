/// <reference types="cypress" />

describe('Dashboard Tests', () => {
  describe('Artist Dashboard', () => {
    beforeEach(() => {
      // Login as artist
      cy.visit('/login')
      cy.get('input[name="email"]').type('artist1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('TC-DASH-ART-001: Should display artist dashboard', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.contains('Welcome back').should('be.visible')
    })

    it('TC-DASH-ART-002: Should display booking stats', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      // Check for stats cards
      cy.contains('Total Bookings').should('be.visible')
      cy.contains('Hotels Worked With').should('be.visible')
    })

    it('TC-DASH-ART-003: Should navigate to bookings page', () => {
      cy.visit('/dashboard')
      cy.contains('My Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
      cy.get('[data-testid="bookings-list"]').should('be.visible')
    })

    it('TC-DASH-ART-004: Should navigate to profile page', () => {
      cy.visit('/dashboard')
      cy.contains('Profile').click()
      cy.url().should('include', '/dashboard/profile')
    })

    it('TC-DASH-ART-005: Should navigate to membership page', () => {
      cy.visit('/dashboard')
      cy.contains('Membership').click()
      cy.url().should('include', '/dashboard/membership')
    })

    it('TC-DASH-ART-006: Should navigate to referrals page', () => {
      cy.visit('/dashboard')
      cy.contains('Referrals').click()
      cy.url().should('include', '/dashboard/referrals')
    })
  })

  describe('Hotel Dashboard', () => {
    beforeEach(() => {
      // Login as hotel
      cy.visit('/login')
      cy.get('input[name="email"]').type('hotel1@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('TC-DASH-HOTEL-001: Should display hotel dashboard', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.contains('Welcome back').should('be.visible')
    })

    it('TC-DASH-HOTEL-002: Should display hotel stats', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.contains('Active Bookings').should('be.visible')
      cy.contains('Available Credits').should('be.visible')
    })

    it('TC-DASH-HOTEL-003: Should navigate to artists page', () => {
      cy.visit('/dashboard')
      cy.contains('Artists').click()
      cy.url().should('include', '/dashboard/artists')
      cy.get('[data-testid="artists-list"]').should('be.visible')
    })

    it('TC-DASH-HOTEL-004: Should navigate to bookings page', () => {
      cy.visit('/dashboard')
      cy.contains('Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
      cy.get('[data-testid="bookings-list"]').should('be.visible')
    })

    it('TC-DASH-HOTEL-005: Should navigate to credits page', () => {
      cy.visit('/dashboard')
      cy.contains('Credits').click()
      cy.url().should('include', '/dashboard/credits')
    })
  })

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      // Login as admin
      cy.visit('/login')
      cy.get('input[name="email"]').type('admin@travelart.test')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('TC-DASH-ADMIN-001: Should display admin dashboard', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.contains('Admin Dashboard').should('be.visible')
    })

    it('TC-DASH-ADMIN-002: Should display admin stats', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.contains('Total Users').should('be.visible')
      cy.contains('Total Bookings').should('be.visible')
    })

    it('TC-DASH-ADMIN-003: Should navigate to users page', () => {
      cy.visit('/dashboard')
      cy.contains('Users').click()
      cy.url().should('include', '/dashboard/users')
    })

    it('TC-DASH-ADMIN-004: Should navigate to bookings page', () => {
      cy.visit('/dashboard')
      cy.contains('Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
    })

    it('TC-DASH-ADMIN-005: Should navigate to analytics page', () => {
      cy.visit('/dashboard')
      cy.contains('Analytics').click()
      cy.url().should('include', '/dashboard/analytics')
    })

    it('TC-DASH-ADMIN-006: Should navigate to moderation page', () => {
      cy.visit('/dashboard')
      cy.contains('Moderation').click()
      cy.url().should('include', '/dashboard/moderation')
    })
  })
})

