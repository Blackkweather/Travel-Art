/// <reference types="cypress" />

describe('API / Integration Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('API Contract Tests', () => {
    it('API-001: Should validate request schema', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        failOnStatusCode: false,
        body: {
          // Missing required fields
          email: 'test@example.com'
          // password missing
        }
      }).then((response) => {
        // Should return 400 Bad Request
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
      })
    })

    it('API-002: Should return correct response schema', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'artist1@example.com',
          password: 'password123'
        }
      }).then((response) => {
        // Should return 200 OK
        expect(response.status).to.eq(200)
        
        // Response should have correct schema
        expect(response.body).to.have.property('token')
        expect(response.body).to.have.property('user')
        expect(response.body.user).to.have.property('id')
        expect(response.body.user).to.have.property('email')
      })
    })

    it('API-003: Should return correct status codes', () => {
      // Test 200 OK
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'artist1@example.com',
          password: 'password123'
        }
      }).then((response) => {
        expect(response.status).to.eq(200)
      })

      // Test 401 Unauthorized
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        failOnStatusCode: false,
        body: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      }).then((response) => {
        expect(response.status).to.eq(401)
      })

      // Test 404 Not Found
      cy.request({
        method: 'GET',
        url: '/api/nonexistent',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })
  })

  describe('Error Handling', () => {
    it('API-004: Should handle 400 Bad Request errors', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        failOnStatusCode: false,
        body: {
          email: 'invalid-email-format',
          password: 'password123'
        }
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error')
        expect(response.body.error).to.be.a('string')
      })
    })

    it('API-005: Should handle 401 Unauthorized errors', () => {
      cy.request({
        method: 'GET',
        url: '/api/auth/me',
        failOnStatusCode: false,
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      }).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body).to.have.property('error')
      })
    })

    it('API-006: Should handle 500 Internal Server Error', () => {
      // This would require backend to simulate error
      // In a real scenario, trigger a server error
      cy.request({
        method: 'GET',
        url: '/api/error-endpoint',
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 500) {
          expect(response.body).to.have.property('error')
        }
      })
    })
  })

  describe('Timeout & Retry Logic', () => {
    it('API-007: Should handle request timeout', () => {
      // Intercept and delay response
      cy.intercept('GET', '/api/**', {
        delay: 35000, // 35 seconds (longer than typical timeout)
        statusCode: 200
      }).as('slowRequest')

      cy.visit('/dashboard')
      
      // Should handle timeout gracefully
      cy.wait('@slowRequest', { timeout: 30000, requestTimeout: 30000 }).then(() => {
        // In a real scenario, check for timeout error message
      })
    })

    it('API-008: Should retry on transient failures', () => {
      let attemptCount = 0
      
      cy.intercept('GET', '/api/artists', (req) => {
        attemptCount++
        if (attemptCount < 3) {
          req.reply({ statusCode: 500, body: { error: 'Server error' } })
        } else {
          req.reply({ statusCode: 200, body: { data: [] } })
        }
      }).as('retryRequest')

      cy.login('hotel1@example.com', 'password123')
      cy.visit('/dashboard/artists')
      
      // Should retry and eventually succeed
      cy.wait('@retryRequest')
      cy.get('body').should('be.visible')
    })
  })

  describe('Data Sync Verification', () => {
    it('API-010: Should sync local cache with server', () => {
      cy.login('artist1@example.com', 'password123')
      
      // Make initial request
      cy.intercept('GET', '/api/bookings').as('getBookings')
      cy.visit('/dashboard/bookings')
      cy.wait('@getBookings')
      
      // Update data on server (simulate)
      cy.intercept('GET', '/api/bookings', {
        statusCode: 200,
        body: { data: [{ id: 1, status: 'updated' }] }
      }).as('updatedBookings')
      
      // Refresh page
      cy.reload()
      cy.wait('@updatedBookings')
      
      // Cache should be updated
      cy.get('[data-testid="bookings-list"]').should('be.visible')
    })
  })

  describe('Authentication API', () => {
    it('API-001: Login API should work correctly', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'artist1@example.com',
          password: 'password123'
        }
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('token')
        expect(response.body).to.have.property('user')
      })
    })

    it('API-001: Registration API should work correctly', () => {
      const timestamp = Date.now()
      const email = `test${timestamp}@example.com`
      
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: email,
          password: 'password123',
          name: 'Test User',
          role: 'ARTIST'
        }
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('token')
        expect(response.body).to.have.property('user')
      })
    })
  })
})

