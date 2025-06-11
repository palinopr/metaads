// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress Axe for accessibility testing
import 'cypress-axe'

// Import code coverage
import '@cypress/code-coverage/support'

// Global before hook to set up test environment
beforeEach(() => {
  // Preserve cookies across tests
  Cypress.Cookies.preserveOnce('sessionid', 'csrftoken')
  
  // Set default viewport
  cy.viewport(1280, 720)
  
  // Clear local storage before each test (optional)
  // cy.clearLocalStorage()
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions. You might want to be more specific
  // about which errors to ignore.
  
  // Don't fail on ResizeObserver errors (common in modern apps)
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  // Don't fail on hydration errors during development
  if (err.message.includes('Hydration')) {
    return false
  }
  
  // Don't fail on Network errors during testing
  if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})

// Custom command types for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @param email - User email
       * @param password - User password
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to set up Meta API credentials
       * @param accessToken - Meta access token
       * @param adAccountId - Meta ad account ID
       */
      setupMetaCredentials(accessToken: string, adAccountId: string): Chainable<void>
      
      /**
       * Custom command to wait for dashboard to load
       */
      waitForDashboard(): Chainable<void>
      
      /**
       * Custom command to check accessibility
       */
      checkA11y(context?: string, options?: any): Chainable<void>
      
      /**
       * Custom command to mock API responses
       */
      mockApiResponse(path: string, response: any): Chainable<void>
    }
  }
}