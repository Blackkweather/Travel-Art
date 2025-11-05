# Travel Art - Cypress E2E Test Suite

This directory contains comprehensive end-to-end tests for the Travel Art platform using Cypress.

## Setup

1. **Install Cypress** (if not already installed):
   ```bash
   npm install --save-dev cypress
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

## Running Tests

### Open Cypress Test Runner (Interactive Mode)
```bash
npm run test:e2e:open
```

### Run Tests Headlessly (CI Mode)
```bash
npm run test:e2e:headless
```

### Run Tests with Cypress CLI
```bash
npm run test:e2e
```

## Test Structure

### Main Test File
- `cypress/e2e/travel-art-ui.cy.ts` - Comprehensive UI test suite covering:
  - Landing page and navigation
  - Authentication flows (Login, Register, Forgot Password)
  - Dashboard navigation for all roles (Artist, Hotel, Admin)
  - Form validation
  - Footer elements
  - Responsive design
  - Error states
  - Accessibility checks
  - Performance tests

### Support Files
- `cypress/support/commands.ts` - Custom Cypress commands:
  - `cy.login(email, password)` - Login helper
  - `cy.logout()` - Logout helper
  - `cy.loginAsArtist()` - Quick Artist login
  - `cy.loginAsHotel()` - Quick Hotel login
  - `cy.loginAsAdmin()` - Quick Admin login
  - `cy.waitForPageLoad()` - Wait for page to fully load

- `cypress/support/e2e.ts` - Global test configuration

## Configuration

The Cypress configuration is in `cypress.config.ts`:
- Base URL: `http://localhost:3000`
- Default viewport: 1280x720
- Timeouts: 10 seconds

## Test Accounts

The tests use the following demo accounts (from the application):

- **Artist**: `artist1@example.com` / `password123`
- **Hotel**: `hotel1@example.com` / `password123`
- **Admin**: `admin@travelart.test` / `Password123!`

## Test Coverage

### Public Pages
- ✅ Landing page
- ✅ How it Works
- ✅ Partners
- ✅ Top Artists
- ✅ Top Hotels
- ✅ Pricing
- ✅ Login
- ✅ Register
- ✅ Forgot Password

### Authenticated Pages (Role-based)
- ✅ Artist Dashboard & Navigation
- ✅ Hotel Dashboard & Navigation
- ✅ Admin Dashboard & Navigation

### UI Components
- ✅ Header/Navbar
- ✅ Sidebar
- ✅ Footer
- ✅ Forms
- ✅ Mobile menu
- ✅ Loading states

### Quality Checks
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Form validation
- ✅ Error states
- ✅ Accessibility (alt text, labels, keyboard navigation)
- ✅ Performance (page load times)

## Writing New Tests

1. Add new test files in `cypress/e2e/`
2. Use custom commands from `cypress/support/commands.ts`
3. Follow the existing test structure and naming conventions

Example:
```typescript
describe('My Feature', () => {
  it('should test something', () => {
    cy.visit('/my-page')
    cy.contains('Expected Text').should('be.visible')
  })
})
```

## Troubleshooting

### Tests fail to connect
- Ensure the development server is running on `http://localhost:3000`
- Check that the backend is also running

### Tests timeout
- Increase timeout in `cypress.config.ts`
- Check network conditions
- Verify database/test data is available

### Element not found
- Use browser DevTools to verify selectors
- Check if elements are conditionally rendered
- Verify the page has fully loaded before assertions

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
npm run test:e2e:headless
```

Make sure to:
1. Start the application server before running tests
2. Set up test database/seed data if needed
3. Configure environment variables










