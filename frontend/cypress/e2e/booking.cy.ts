/// <reference types="cypress" />

describe('Booking Flow', () => {
  beforeEach(() => {
    // Login as hotel user
    cy.visit('/login')
    cy.get('input[name="email"]').type('hotel1@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  describe('Browse Artists', () => {
    it('TC-BOOK-001: Should display artists list', () => {
      cy.visit('/dashboard/artists')
      cy.get('[data-testid="artists-list"]').should('be.visible')
    })

    it('TC-BOOK-002: Should filter artists', () => {
      cy.visit('/dashboard/artists')
      cy.get('[data-testid="filter-input"]').type('music')
      cy.get('[data-testid="artists-list"]').should('contain', 'music')
    })

    it('TC-BOOK-003: Should view artist profile', () => {
      cy.visit('/dashboard/artists')
      cy.get('[data-testid="artist-card"]').first().click()
      cy.url().should('include', '/artist/')
      cy.get('[data-testid="artist-profile"]').should('be.visible')
    })
  })

  describe('Create Booking', () => {
    it('TC-BOOK-004: Should create a booking', () => {
      cy.visit('/dashboard/artists')
      cy.get('[data-testid="artist-card"]').first().click()
      cy.get('[data-testid="book-button"]').click()
      
      // Fill booking form
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 10)
      
      cy.get('input[name="startDate"]').type(startDate.toISOString().split('T')[0])
      cy.get('input[name="endDate"]').type(endDate.toISOString().split('T')[0])
      cy.get('input[name="notes"]').type('Test booking')
      cy.get('button[type="submit"]').click()
      
      // Should show success message
      cy.contains('Booking confirmed', { timeout: 10000 }).should('be.visible')
    })

    it('TC-BOOK-005: Should validate booking dates', () => {
      cy.visit('/dashboard/artists')
      cy.get('[data-testid="artist-card"]').first().click()
      cy.get('[data-testid="book-button"]').click()
      
      // Try to submit with invalid dates
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      cy.get('input[name="startDate"]').type(pastDate.toISOString().split('T')[0])
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.contains('date', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('View Bookings', () => {
    it('TC-BOOK-006: Should display bookings list', () => {
      cy.visit('/dashboard/bookings')
      cy.get('[data-testid="bookings-list"]').should('be.visible')
    })

    it('TC-BOOK-007: Should filter bookings', () => {
      cy.visit('/dashboard/bookings')
      cy.get('[data-testid="status-filter"]').select('CONFIRMED')
      cy.get('[data-testid="bookings-list"]').should('contain', 'CONFIRMED')
    })

    it('TC-BOOK-008: Should view booking details', () => {
      cy.visit('/dashboard/bookings')
      cy.get('[data-testid="booking-item"]').first().click()
      cy.get('[data-testid="booking-details"]').should('be.visible')
    })
  })
})

