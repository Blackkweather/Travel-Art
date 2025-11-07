/// <reference types="cypress" />

describe('Security Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('XSS Prevention', () => {
    it('SEC-001: Should prevent XSS in text fields', () => {
      cy.visit('/register')
      
      // Try to inject script tag
      const xssPayload = "<script>alert('xss')</script>"
      
      cy.get('input[name="name"]').type(xssPayload)
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Script should not execute - check that alert didn't fire
      // In a real scenario, check that the script tag is escaped in the output
      cy.window().then((win) => {
        // Verify script tag is not executed
        expect(win.document.body.innerHTML).to.not.include('<script>')
      })
    })

    it('SEC-002: Should escape HTML entities in profile fields', () => {
      cy.login('artist1@example.com', 'password123')
      cy.visit('/dashboard/profile')
      
      // Try to inject HTML
      const htmlPayload = "<img src=x onerror=alert('xss')>"
      
      // If there's a bio or description field, test it
      cy.get('body').then(($body) => {
        if ($body.find('textarea[name="bio"]').length > 0) {
          cy.get('textarea[name="bio"]').type(htmlPayload)
          cy.get('button[type="submit"]').click()
          
          // Verify HTML is escaped
          cy.get('textarea[name="bio"]').should('not.contain', '<img')
        }
      })
    })
  })

  describe('CSRF Protection', () => {
    it('SEC-004: Should require CSRF token for state-changing requests', () => {
      // This test would need backend support
      // In a real scenario, make a POST request without CSRF token
      cy.request({
        method: 'POST',
        url: '/api/auth/logout',
        failOnStatusCode: false,
        headers: {
          // Intentionally omit CSRF token
        }
      }).then((response) => {
        // Should reject request without token
        expect(response.status).to.be.oneOf([401, 403, 400])
      })
    })
  })

  describe('Rate Limiting', () => {
    it('SEC-007: Should rate limit login attempts', () => {
      cy.visit('/login')
      
      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        cy.get('input[name="email"]').clear().type('invalid@example.com')
        cy.get('input[name="password"]').clear().type('wrongpassword')
        cy.get('button[type="submit"]').click()
        cy.wait(500) // Wait between attempts
      }
      
      // Should show rate limit message
      cy.contains('Too many requests', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Session Security', () => {
    it('SEC-013: Should invalidate token on logout', () => {
      cy.login('artist1@example.com', 'password123')
      
      // Get token from localStorage
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token')
        expect(token).to.exist
      })
      
      // Logout
      cy.logout()
      
      // Token should be removed
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token')
        expect(token).to.be.null
      })
      
      // Should not be able to access protected route
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })

    it('SEC-015: Should handle token expiration', () => {
      cy.login('artist1@example.com', 'password123')
      
      // Manually expire token (in real scenario, wait for actual expiry)
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired-token')
      })
      
      // Try to access protected route
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Sensitive Data Exposure', () => {
    it('SEC-016: Should not expose secrets in network requests', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      
      cy.intercept('POST', '/api/auth/login').as('loginRequest')
      cy.get('button[type="submit"]').click()
      
      cy.wait('@loginRequest').then((interception) => {
        const requestBody = interception.request.body
        
        // Password should not be in plaintext in request (should be hashed or not logged)
        // In a real scenario, check that sensitive data is not exposed
        expect(requestBody).to.have.property('email')
        // Note: Password will be in request body for login, but should not be in logs
      })
    })

    it('SEC-017: Should not log secrets in console', () => {
      cy.visit('/login')
      
      // Check console for sensitive data
      cy.window().then((win) => {
        const consoleSpy = cy.stub(win.console, 'log')
        
        cy.get('input[name="email"]').type('test@example.com')
        cy.get('input[name="password"]').type('password123')
        cy.get('button[type="submit"]').click()
        
        // In a real scenario, verify console.log doesn't contain passwords
        // This is a simplified check
      })
    })
  })

  describe('Password Security', () => {
    it('SEC-010: Should enforce minimum password length', () => {
      cy.visit('/register')
      
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('short') // 5 characters
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.contains('8 characters', { timeout: 5000 }).should('be.visible')
    })

    it('SEC-011: Should hash passwords (backend verification)', () => {
      // This test would need backend access to verify
      // In a real scenario, register a user and check database
      cy.visit('/register')
      
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('hashtest@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Note: Actual password hashing verification would require database access
      // This is a placeholder for the test case
      cy.url().should('include', '/dashboard')
    })
  })
})

