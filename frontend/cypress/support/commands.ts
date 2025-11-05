/// <reference types="cypress" />

// Custom command to login as different user roles
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('Logout').click()
  cy.url().should('include', '/')
})

// Custom command to login as Artist
Cypress.Commands.add('loginAsArtist', () => {
  cy.login('artist1@example.com', 'password123')
})

// Custom command to login as Hotel
Cypress.Commands.add('loginAsHotel', () => {
  cy.login('hotel1@example.com', 'password123')
})

// Custom command to login as Admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@travelart.test', 'Password123!')
})

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().its('document.readyState').should('equal', 'complete')
})

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      loginAsArtist(): Chainable<void>
      loginAsHotel(): Chainable<void>
      loginAsAdmin(): Chainable<void>
      waitForPageLoad(): Chainable<void>
    }
  }
}










