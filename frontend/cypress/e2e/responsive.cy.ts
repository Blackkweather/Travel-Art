/// <reference types="cypress" />

describe('Responsive Design', () => {
  describe('Mobile View (375px)', () => {
    beforeEach(() => {
      cy.viewport(375, 667)
    })

    it('TC-RESP-001: Should show mobile menu', () => {
      cy.visit('/')
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible')
      cy.get('[data-testid="desktop-menu"]').should('not.be.visible')
    })

    it('TC-RESP-002: Should toggle mobile menu', () => {
      cy.visit('/')
      cy.get('[data-testid="mobile-menu-toggle"]').click()
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-toggle"]').click()
      cy.get('[data-testid="mobile-menu"]').should('not.be.visible')
    })

    it('TC-RESP-003: Should stack form fields vertically', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').should('have.css', 'width', '100%')
      cy.get('input[name="password"]').should('have.css', 'width', '100%')
    })

    it('TC-RESP-004: Should show full-width buttons', () => {
      cy.visit('/login')
      cy.get('button[type="submit"]').should('have.css', 'width', '100%')
    })
  })

  describe('Tablet View (768px)', () => {
    beforeEach(() => {
      cy.viewport(768, 1024)
    })

    it('TC-RESP-005: Should show 2-column layout', () => {
      cy.visit('/')
      cy.get('[data-testid="feature-grid"]').should('have.css', 'grid-template-columns')
    })

    it('TC-RESP-006: Should show navigation menu', () => {
      cy.visit('/')
      cy.get('[data-testid="desktop-menu"]').should('be.visible')
    })
  })

  describe('Desktop View (1440px)', () => {
    beforeEach(() => {
      cy.viewport(1440, 900)
    })

    it('TC-RESP-007: Should show full navigation', () => {
      cy.visit('/')
      cy.get('[data-testid="desktop-menu"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-toggle"]').should('not.be.visible')
    })

    it('TC-RESP-008: Should show multi-column layouts', () => {
      cy.visit('/top-artists')
      cy.get('[data-testid="artists-grid"]').should('have.css', 'grid-template-columns')
    })
  })

  describe('Touch Targets', () => {
    it('TC-RESP-009: Buttons should be at least 44px', () => {
      cy.viewport(375, 667)
      cy.visit('/login')
      cy.get('button[type="submit"]').should('have.css', 'min-height', '44px')
    })

    it('TC-RESP-010: Links should be at least 44px', () => {
      cy.viewport(375, 667)
      cy.visit('/')
      cy.get('a').each(($link) => {
        cy.wrap($link).should('have.css', 'min-height', '44px')
      })
    })
  })
})







