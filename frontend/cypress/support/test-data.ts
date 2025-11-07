/// <reference types="cypress" />

/**
 * Test Data Utilities
 * Centralized test data for consistent testing
 */

export const testUsers = {
  artist: {
    email: 'artist1@example.com',
    password: 'password123',
    name: 'Test Artist',
    role: 'ARTIST'
  },
  hotel: {
    email: 'hotel1@example.com',
    password: 'password123',
    name: 'Test Hotel',
    role: 'HOTEL'
  },
  admin: {
    email: 'admin@example.com',
    password: 'password123',
    name: 'Test Admin',
    role: 'ADMIN'
  }
}

export const testArtists = {
  musician: {
    name: 'Test Musician',
    discipline: 'Music',
    location: 'New York, NY',
    bio: 'Test musician bio'
  },
  painter: {
    name: 'Test Painter',
    discipline: 'Visual Arts',
    location: 'Los Angeles, CA',
    bio: 'Test painter bio'
  }
}

export const testBookings = {
  valid: {
    startDate: '2024-12-01',
    endDate: '2024-12-05',
    notes: 'Test booking'
  },
  invalid: {
    startDate: '2024-12-05',
    endDate: '2024-12-01', // End before start
    notes: 'Invalid booking'
  }
}

export const xssPayloads = {
  scriptTag: "<script>alert('xss')</script>",
  imgTag: "<img src=x onerror=alert('xss')>",
  eventHandler: "<div onclick=alert('xss')>Click me</div>",
  javascriptProtocol: "javascript:alert('xss')"
}

export const sqlInjectionPayloads = {
  basic: "' OR '1'='1",
  union: "' UNION SELECT * FROM users--",
  drop: "'; DROP TABLE users--"
}

export const testFiles = {
  validImage: {
    name: 'test-image.jpg',
    type: 'image/jpeg',
    size: 1024 * 100 // 100KB
  },
  largeImage: {
    name: 'large-image.jpg',
    type: 'image/jpeg',
    size: 1024 * 1024 * 15 // 15MB (should fail)
  },
  invalidType: {
    name: 'test.exe',
    type: 'application/x-msdownload',
    size: 1024 * 100
  }
}

export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh'
  },
  artists: {
    list: '/api/artists',
    get: (id: string) => `/api/artists/${id}`,
    create: '/api/artists',
    update: (id: string) => `/api/artists/${id}`
  },
  bookings: {
    list: '/api/bookings',
    get: (id: string) => `/api/bookings/${id}`,
    create: '/api/bookings',
    update: (id: string) => `/api/bookings/${id}`
  }
}

export const performanceTargets = {
  fcp: 1800, // 1.8s
  lcp: 2500, // 2.5s
  tti: 3000, // 3s
  cls: 0.1,
  fid: 100, // 100ms
  bundleSize: 500 * 1024 // 500KB
}

export const breakpoints = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 430, height: 932 },
  tablet: { width: 768, height: 1024 },
  tabletLarge: { width: 1024, height: 1366 },
  desktop: { width: 1440, height: 900 },
  desktopLarge: { width: 2560, height: 1440 }
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}${timestamp}${random}@example.com`
}

/**
 * Generate test date (future date)
 */
export function generateFutureDate(daysFromNow: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

/**
 * Generate test date (past date)
 */
export function generatePastDate(daysAgo: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

/**
 * Wait for API response
 */
export function waitForApi(alias: string, timeout: number = 10000): Cypress.Chainable {
  return cy.wait(`@${alias}`, { timeout })
}

/**
 * Check API response status
 */
export function expectApiStatus(alias: string, status: number): void {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response?.statusCode).to.eq(status)
  })
}

