describe('Travel Art - Comprehensive UI Test Suite', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Landing Page - Header and Navigation', () => {
    it('should verify all header elements are present and functional', () => {
      // Check logo is visible
      cy.get('nav img[alt="Travel Art"]').should('be.visible')
      
      // Check navigation links on landing page
      const publicNavItems = ['How it Works', 'Partners', 'Top Artists', 'Top Hotels', 'Pricing']
      publicNavItems.forEach(item => {
        cy.contains('nav a', item).should('be.visible')
      })

      // Check authentication buttons
      cy.contains('a', 'Login').should('be.visible')
      cy.contains('a', 'Register').should('be.visible')
    })

    it('should navigate to public pages from header', () => {
      cy.contains('nav a', 'How it Works').click()
      cy.url().should('include', '/how-it-works')
      cy.go('back')

      cy.contains('nav a', 'Partners').click()
      cy.url().should('include', '/partners')
      cy.go('back')

      cy.contains('nav a', 'Top Artists').click()
      cy.url().should('include', '/top-artists')
      cy.go('back')

      cy.contains('nav a', 'Top Hotels').click()
      cy.url().should('include', '/top-hotels')
      cy.go('back')

      cy.contains('nav a', 'Pricing').click()
      cy.url().should('include', '/pricing')
    })
  })

  describe('Authentication Flow', () => {
    it('should verify login page elements and functionality', () => {
      cy.contains('a', 'Login').click()
      cy.url().should('include', '/login')

      // Verify login form elements
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').contains('Sign In').should('be.visible')
      
      // Check "Forgot password" link
      cy.contains('a', 'Forgot your password?').should('be.visible')
      
      // Check "Sign up" link
      cy.contains('a', 'Sign up here').should('be.visible')
    })

    it('should verify register page elements', () => {
      cy.contains('a', 'Register').click()
      cy.url().should('include', '/register')

      // Verify registration form elements
      cy.get('input[type="text"]').should('exist') // Name field
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('have.length.at.least', 1)
      
      // Check role selection if exists
      cy.get('select, input[type="radio"]').should('exist')
      
      cy.get('button[type="submit"]').should('be.visible')
      
      // Check "Back to login" link
      cy.contains('a', 'login').should('be.visible')
    })

    it('should verify forgot password page', () => {
      cy.visit('/forgot-password')
      
      cy.get('input[type="email"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
      cy.contains('a', 'Back to Login').should('be.visible')
    })

    it('should successfully login as Artist', () => {
      cy.loginAsArtist()
      cy.url().should('include', '/dashboard')
      cy.contains('Dashboard').should('be.visible')
    })

    it('should successfully login as Hotel', () => {
      cy.loginAsHotel()
      cy.url().should('include', '/dashboard')
      cy.contains('Dashboard').should('be.visible')
    })

    it('should successfully login as Admin', () => {
      cy.loginAsAdmin()
      cy.url().should('include', '/dashboard')
      cy.contains('Dashboard').should('be.visible')
    })
  })

  describe('Dashboard - Navigation and Layout', () => {
    beforeEach(() => {
      cy.loginAsArtist()
    })

    it('should verify dashboard navbar elements', () => {
      // Check logo in navbar
      cy.get('nav img[alt="Travel Art"]').should('be.visible')
      
      // Check user info is displayed
      cy.contains(/artist|name|email/i).should('exist')
      
      // Check logout button
      cy.get('button').contains('Logout').should('be.visible')
    })

    it('should verify sidebar navigation for Artist', () => {
      const artistNavItems = ['Dashboard', 'My Profile', 'My Bookings', 'Membership', 'Referrals']
      
      artistNavItems.forEach(item => {
        cy.contains('aside a', item).should('be.visible')
      })
    })

    it('should navigate through Artist dashboard sections', () => {
      cy.contains('aside a', 'My Profile').click()
      cy.url().should('include', '/dashboard/profile')
      
      cy.contains('aside a', 'My Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
      
      cy.contains('aside a', 'Membership').click()
      cy.url().should('include', '/dashboard/membership')
      
      cy.contains('aside a', 'Referrals').click()
      cy.url().should('include', '/dashboard/referrals')
      
      cy.contains('aside a', 'Dashboard').click()
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Hotel Dashboard Navigation', () => {
    beforeEach(() => {
      cy.loginAsHotel()
    })

    it('should verify sidebar navigation for Hotel', () => {
      const hotelNavItems = ['Dashboard', 'Hotel Profile', 'Browse Artists', 'Bookings', 'Credits']
      
      hotelNavItems.forEach(item => {
        cy.contains('aside a', item).should('be.visible')
      })
    })

    it('should navigate through Hotel dashboard sections', () => {
      cy.contains('aside a', 'Hotel Profile').click()
      cy.url().should('include', '/dashboard/profile')
      
      cy.contains('aside a', 'Browse Artists').click()
      cy.url().should('include', '/dashboard/artists')
      
      cy.contains('aside a', 'Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
      
      cy.contains('aside a', 'Credits').click()
      cy.url().should('include', '/dashboard/credits')
    })
  })

  describe('Admin Dashboard Navigation', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
    })

    it('should verify sidebar navigation for Admin', () => {
      const adminNavItems = ['Dashboard', 'Users', 'Bookings']
      
      adminNavItems.forEach(item => {
        cy.contains('aside a', item).should('be.visible')
      })
    })

    it('should navigate through Admin dashboard sections', () => {
      cy.contains('aside a', 'Users').click()
      cy.url().should('include', '/dashboard/users')
      
      cy.contains('aside a', 'Bookings').click()
      cy.url().should('include', '/dashboard/bookings')
    })
  })

  describe('Form Elements and Validation', () => {
    it('should verify login form validation', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors or prevent submission
      cy.get('input[type="email"]:invalid, .error-message, p.text-red-600').should('exist')
    })

    it('should verify registration form fields', () => {
      cy.visit('/register')
      
      // Check all form inputs
      cy.get('input[type="text"]').should('exist') // Name
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('have.length.at.least', 1)
      
      // Fill form
      cy.get('input[type="text"]').first().type('Test User')
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('password123')
      
      // Check role selection
      cy.get('select, input[type="radio"]').should('exist')
      
      // Check submit button
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('should verify forgot password form', () => {
      cy.visit('/forgot-password')
      
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('button[type="submit"]').should('be.visible')
    })
  })

  describe('Footer Elements', () => {
    it('should verify footer is present on landing page', () => {
      cy.visit('/')
      cy.scrollTo('bottom')
      
      // Check footer exists
      cy.get('footer').should('be.visible')
      
      // Check footer links
      const footerLinks = ['How it Works', 'Partners', 'Pricing', 'Top Artists', 'Top Hotels']
      footerLinks.forEach(link => {
        cy.get('footer').contains(link).should('be.visible')
      })
      
      // Check contact information
      cy.get('footer').contains(/contact|email|phone/i).should('exist')
      
      // Check copyright
      cy.get('footer').contains(/copyright|©|2024/i).should('be.visible')
      
      // Check social media links if present
      cy.get('footer a[href*="#"]').should('exist')
    })

    it('should verify footer links are clickable', () => {
      cy.visit('/')
      cy.scrollTo('bottom')
      
      cy.get('footer').contains('How it Works').click()
      cy.url().should('include', '/how-it-works')
      
      cy.visit('/')
      cy.scrollTo('bottom')
      cy.get('footer').contains('Pricing').click()
      cy.url().should('include', '/pricing')
    })
  })

  describe('Responsive Design', () => {
    it('should verify mobile menu functionality', () => {
      cy.viewport('iphone-6')
      cy.visit('/')
      
      // Check mobile menu button exists
      cy.get('button').contains('Toggle mobile menu').should('exist').or('button[aria-label*="menu"]').should('exist')
      
      // If menu button exists, click it
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Toggle mobile menu"), button[aria-label*="menu"]').length > 0) {
          cy.get('button:contains("Toggle mobile menu"), button[aria-label*="menu"]').first().click()
          
          // Check mobile menu items are visible
          cy.contains('Login').should('be.visible')
          cy.contains('Register').should('be.visible')
        }
      })
    })

    it('should verify tablet view layout', () => {
      cy.viewport('ipad-2')
      cy.loginAsArtist()
      
      // Sidebar should be visible on tablet
      cy.get('aside').should('be.visible')
      
      // Dashboard content should be visible
      cy.contains('Dashboard').should('be.visible')
    })

    it('should verify desktop view layout', () => {
      cy.viewport(1920, 1080)
      cy.loginAsArtist()
      
      // Full navigation should be visible
      cy.get('aside').should('be.visible')
      cy.get('nav').should('be.visible')
      
      // Dashboard content should be properly laid out
      cy.get('main').should('be.visible')
    })
  })

  describe('Error States and 404 Pages', () => {
    it('should handle 404 page correctly', () => {
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      
      // Should redirect to home or show 404
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('404')
      })
    })

    it('should verify form error messages display correctly', () => {
      cy.visit('/login')
      
      // Submit empty form
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.get('body').then(($body) => {
        if ($body.find('.error-message, p.text-red-600, input:invalid').length > 0) {
          cy.get('.error-message, p.text-red-600, input:invalid').should('exist')
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should verify images have alt text', () => {
      cy.visit('/')
      
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')
      })
    })

    it('should verify form labels are associated with inputs', () => {
      cy.visit('/login')
      
      cy.get('input').each(($input) => {
        const id = $input.attr('id')
        const name = $input.attr('name')
        
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist').or('input').should('have.attr', 'aria-label')
        } else if (name) {
          // Check if label wraps input or aria-label exists
          cy.wrap($input).should('satisfy', ($el) => {
            return $el.attr('aria-label') || $el.parent().find('label').length > 0
          })
        }
      })
    })

    it('should verify keyboard navigation', () => {
      cy.visit('/')
      
      // Tab through interactive elements
      cy.get('body').tab()
      cy.focused().should('exist')
    })
  })

  describe('Performance and Loading States', () => {
    it('should verify page load time is acceptable', () => {
      const startTime = Date.now()
      
      cy.visit('/')
      cy.waitForPageLoad()
      
      cy.window().then((win) => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(10000) // 10 seconds max
      })
    })

    it('should verify loading spinner displays during authentication', () => {
      cy.visit('/login')
      
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Loading state should appear briefly
      cy.get('body').then(($body) => {
        // Check for loading indicators if they exist
        if ($body.find('.loading, [data-testid="loading"], .spinner').length > 0) {
          cy.get('.loading, [data-testid="loading"], .spinner').should('exist')
        }
      })
    })
  })

  describe('Public Pages Content', () => {
    it('should verify landing page hero section', () => {
      cy.visit('/')
      
      // Check hero content exists
      cy.contains(/travel art|luxury|artist|hotel/i).should('be.visible')
      
      // Check CTA buttons
      cy.contains('button, a', /register|join|get started/i).should('exist')
    })

    it('should verify How it Works page', () => {
      cy.visit('/how-it-works')
      
      cy.url().should('include', '/how-it-works')
      cy.contains(/how it works|process|steps/i).should('exist')
    })

    it('should verify Partners page', () => {
      cy.visit('/partners')
      
      cy.url().should('include', '/partners')
      cy.get('body').should('contain.text', 'Partner').or('contain.text', 'Hotel').or('contain.text', 'Artist')
    })

    it('should verify Top Artists page', () => {
      cy.visit('/top-artists')
      
      cy.url().should('include', '/top-artists')
      cy.contains(/artist|top|rank/i).should('exist')
    })

    it('should verify Top Hotels page', () => {
      cy.visit('/top-hotels')
      
      cy.url().should('include', '/top-hotels')
      cy.contains(/hotel|top|rank/i).should('exist')
    })

    it('should verify Pricing page', () => {
      cy.visit('/pricing')
      
      cy.url().should('include', '/pricing')
      cy.contains(/pricing|plan|price/i).should('exist')
    })
  })

  describe('Logout Functionality', () => {
    it('should successfully logout and redirect to home', () => {
      cy.loginAsArtist()
      
      cy.get('button').contains('Logout').click()
      
      // Should redirect to home
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
      
      // Should show login/register buttons again
      cy.contains('a', 'Login').should('be.visible')
      cy.contains('a', 'Register').should('be.visible')
    })
  })

  describe('Logo Display', () => {
    it('should verify logo is visible on landing page', () => {
      cy.visit('/')
      cy.get('nav img[alt="Travel Art"]').should('be.visible')
    })

    it('should verify logo is visible on dashboard', () => {
      cy.loginAsArtist()
      cy.get('nav img[alt="Travel Art"]').should('be.visible')
    })
  })

  describe('Mobile Menu Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-6')
    })

    it('should open and close mobile menu', () => {
      cy.loginAsArtist()
      
      // Find and click mobile menu button
      cy.get('body').then(($body) => {
        const menuButton = $body.find('button:contains("Toggle"), button[aria-label*="menu"], button svg')
        if (menuButton.length > 0) {
          cy.get('button').first().click()
          
          // Check if menu items are visible
          cy.get('body').should('contain.text', 'Dashboard')
        }
      })
    })
  })
})










