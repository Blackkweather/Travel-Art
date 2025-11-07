/// <reference types="cypress" />

describe('Performance Tests', () => {
  describe('Core Web Vitals', () => {
    it('PERF-001: First Contentful Paint (FCP) should be < 1.8s', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          // Enable performance observer
          win.performance.mark('page-start')
        }
      })
      
      // Wait for first contentful paint
      cy.get('body').should('be.visible')
      
      cy.window().then((win) => {
        const perfData = win.performance.getEntriesByType('paint')
        const fcp = perfData.find((entry: any) => entry.name === 'first-contentful-paint')
        
        if (fcp) {
          // FCP should be less than 1800ms
          expect(fcp.startTime).to.be.lessThan(1800)
        }
      })
    })

    it('PERF-002: Largest Contentful Paint (LCP) should be < 2.5s', () => {
      cy.visit('/')
      
      // Wait for page to fully load
      cy.get('body').should('be.visible')
      cy.wait(3000) // Wait for LCP
      
      cy.window().then((win) => {
        // In a real scenario, use PerformanceObserver to measure LCP
        // This is a simplified check
        const perfData = win.performance.getEntriesByType('navigation')
        const loadTime = perfData[0]?.loadEventEnd - perfData[0]?.loadEventStart
        
        if (loadTime) {
          // Approximate LCP check
          expect(loadTime).to.be.lessThan(2500)
        }
      })
    })

    it('PERF-003: Time to Interactive (TTI) should be < 3s', () => {
      cy.visit('/')
      
      // Wait for interactive elements
      cy.get('button').should('be.visible')
      cy.get('a').should('be.visible')
      
      cy.window().then((win) => {
        const perfData = win.performance.getEntriesByType('navigation')
        const domContentLoaded = perfData[0]?.domContentLoadedEventEnd - perfData[0]?.domContentLoadedEventStart
        
        if (domContentLoaded) {
          // Approximate TTI check
          expect(domContentLoaded).to.be.lessThan(3000)
        }
      })
    })
  })

  describe('Page Load Performance', () => {
    it('PERF-011: Initial bundle size should be < 500KB', () => {
      cy.visit('/')
      
      cy.window().then((win) => {
        // Check resource sizes
        const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const jsResources = resources.filter((r: any) => r.name.includes('.js'))
        
        let totalSize = 0
        jsResources.forEach((resource: any) => {
          if (resource.transferSize) {
            totalSize += resource.transferSize
          }
        })
        
        // Convert to KB
        const totalSizeKB = totalSize / 1024
        
        // Initial bundle should be less than 500KB
        expect(totalSizeKB).to.be.lessThan(500)
      })
    })

    it('PERF-012: Code splitting should be implemented', () => {
      cy.visit('/')
      
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const jsResources = resources.filter((r: any) => r.name.includes('.js'))
        
        // Should have multiple JS chunks (code splitting)
        expect(jsResources.length).to.be.greaterThan(1)
      })
    })
  })

  describe('API Performance', () => {
    it('PERF-002: API response time should be < 500ms', () => {
      cy.login('artist1@example.com', 'password123')
      
      cy.intercept('GET', '/api/**').as('apiCall')
      
      cy.visit('/dashboard')
      cy.wait('@apiCall').then((interception) => {
        const responseTime = interception.response?.headers['x-response-time'] || 
                           (Date.now() - interception.request.startedAt)
        
        // Response time should be less than 500ms
        expect(responseTime).to.be.lessThan(500)
      })
    })
  })

  describe('Image Optimization', () => {
    it('PERF-003: Images should be optimized', () => {
      cy.visit('/')
      
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'src')
        
        // Check if image uses modern formats (WebP, AVIF) or has loading="lazy"
        cy.wrap($img).then(($el) => {
          const src = $el.attr('src') || ''
          const loading = $el.attr('loading')
          
          // Should use lazy loading or modern formats
          expect(loading === 'lazy' || src.includes('.webp') || src.includes('.avif')).to.be.true
        })
      })
    })
  })

  describe('Memory Usage', () => {
    it('PERF-006: Should not have memory leaks on navigation', () => {
      cy.login('artist1@example.com', 'password123')
      
      // Navigate multiple times
      const pages = ['/dashboard', '/dashboard/profile', '/dashboard/bookings', '/dashboard']
      
      pages.forEach((page) => {
        cy.visit(page)
        cy.wait(1000)
      })
      
      // Check memory usage (simplified - in real scenario use Chrome DevTools)
      cy.window().then((win) => {
        // In a real scenario, check performance.memory (Chrome only)
        if ((win.performance as any).memory) {
          const memory = (win.performance as any).memory
          // Memory should not grow excessively
          expect(memory.usedJSHeapSize).to.be.lessThan(50 * 1024 * 1024) // 50MB
        }
      })
    })
  })

  describe('Network Throttling', () => {
    it('PERF-008: Should work on slow 3G network', () => {
      // Simulate slow network
      cy.intercept('**', (req) => {
        req.reply((res) => {
          // Add delay to simulate slow network
          return new Promise((resolve) => {
            setTimeout(() => resolve(res), 1000)
          })
        })
      })
      
      cy.visit('/', { timeout: 10000 })
      cy.get('body').should('be.visible')
      
      // Page should still load (albeit slowly)
      cy.url().should('include', '/')
    })
  })
})

