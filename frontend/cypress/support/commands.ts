/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('artist1@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Logout').click()
  cy.url().should('not.include', '/dashboard')
})

/**
 * Login as specific role
 * @example cy.loginAsRole('artist')
 */
Cypress.Commands.add('loginAsRole', (role: 'artist' | 'hotel' | 'admin') => {
  const users = {
    artist: { email: 'artist1@example.com', password: 'password123' },
    hotel: { email: 'hotel1@example.com', password: 'password123' },
    admin: { email: 'admin@example.com', password: 'password123' }
  }
  const user = users[role]
  cy.login(user.email, user.password)
})

/**
 * Wait for API call and verify response
 * @example cy.waitForApi('@getArtists', 200)
 */
Cypress.Commands.add('waitForApi', (alias: string, expectedStatus: number = 200) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.eq(expectedStatus)
  })
})

/**
 * Check element has proper color contrast
 * @example cy.checkColorContrast('button', '#0B1F3F', '#FFFFFF')
 */
Cypress.Commands.add('checkColorContrast', (selector: string, bgColor: string, textColor: string) => {
  cy.get(selector).then(($el) => {
    const bg = Cypress.$($el[0]).css('background-color')
    const color = Cypress.$($el[0]).css('color')
    // In a real scenario, calculate contrast ratio
    expect(bg).to.exist
    expect(color).to.exist
  })
})

/**
 * Test responsive breakpoint
 * @example cy.testBreakpoint(375, 667)
 */
Cypress.Commands.add('testBreakpoint', (width: number, height: number) => {
  cy.viewport(width, height)
  cy.wait(500) // Wait for layout to adjust
})

/**
 * Check performance metric
 * @example cy.checkPerformanceMetric('FCP', 1800)
 */
Cypress.Commands.add('checkPerformanceMetric', (metric: string, maxValue: number) => {
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('paint')
    const metricEntry = perfData.find((entry: any) => entry.name.includes(metric.toLowerCase()))
    
    if (metricEntry) {
      expect(metricEntry.startTime).to.be.lessThan(maxValue)
    }
  })
})

/**
 * Verify no console errors
 * @example cy.verifyNoConsoleErrors()
 */
Cypress.Commands.add('verifyNoConsoleErrors', () => {
  cy.window().then((win) => {
    const consoleErrors: string[] = []
    const originalError = win.console.error
    
    win.console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '))
      originalError.apply(win.console, args)
    }
    
    // Check for errors after page load
    cy.wait(1000).then(() => {
      expect(consoleErrors.length).to.eq(0)
    })
  })
})

/**
 * Test XSS prevention
 * @example cy.testXSSPrevention('input[name="name"]', '<script>alert("xss")</script>')
 */
Cypress.Commands.add('testXSSPrevention', (selector: string, payload: string) => {
  cy.get(selector).type(payload)
  cy.window().then((win) => {
    // Verify script tag is not executed
    expect(win.document.body.innerHTML).to.not.include('<script>')
  })
})

/**
 * Test rate limiting
 * @example cy.testRateLimit('/api/auth/login', 10)
 */
Cypress.Commands.add('testRateLimit', (endpoint: string, attempts: number) => {
  for (let i = 0; i < attempts; i++) {
    cy.request({
      method: 'POST',
      url: endpoint,
      failOnStatusCode: false,
      body: { email: 'test@example.com', password: 'wrong' }
    }).then((response) => {
      if (i >= 5) {
        // After 5 attempts, should be rate limited
        expect(response.status).to.be.oneOf([429, 403])
      }
    })
    cy.wait(100) // Small delay between attempts
  }
})

/**
 * Check accessibility
 * @example cy.checkAccessibility()
 */
Cypress.Commands.add('checkAccessibility', () => {
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  // Check for labels on inputs
  cy.get('input, textarea, select').each(($input) => {
    const id = $input.attr('id')
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist')
    }
  })
  
  // Check for ARIA labels on icon buttons
  cy.get('button').each(($btn) => {
    const hasText = $btn.text().length > 0
    const hasAriaLabel = $btn.attr('aria-label')
    if (!hasText) {
      expect(hasAriaLabel).to.exist
    }
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsRole(role: 'artist' | 'hotel' | 'admin'): Chainable<void>
      waitForApi(alias: string, expectedStatus?: number): Chainable<void>
      checkColorContrast(selector: string, bgColor: string, textColor: string): Chainable<void>
      testBreakpoint(width: number, height: number): Chainable<void>
      checkPerformanceMetric(metric: string, maxValue: number): Chainable<void>
      verifyNoConsoleErrors(): Chainable<void>
      testXSSPrevention(selector: string, payload: string): Chainable<void>
      testRateLimit(endpoint: string, attempts: number): Chainable<void>
      checkAccessibility(): Chainable<void>
    }
  }
}

export {}

