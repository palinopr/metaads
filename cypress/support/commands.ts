/// <reference types="cypress" />

// Custom command to log in (if authentication is implemented)
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Custom command to set up Meta API credentials
Cypress.Commands.add('setupMetaCredentials', (accessToken: string, adAccountId: string) => {
  cy.visit('/settings')
  cy.get('[data-testid="access-token-input"]').clear().type(accessToken)
  cy.get('[data-testid="ad-account-input"]').clear().type(adAccountId)
  cy.get('[data-testid="save-credentials-button"]').click()
  cy.get('[data-testid="success-message"]').should('be.visible')
})

// Custom command to wait for dashboard to load
Cypress.Commands.add('waitForDashboard', () => {
  cy.get('[data-testid="dashboard-container"]', { timeout: 15000 }).should('be.visible')
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
})

// Custom command for accessibility testing
Cypress.Commands.add('checkA11y', (context?: string, options?: any) => {
  cy.injectAxe()
  cy.checkA11y(context, options, (violations) => {
    if (violations.length > 0) {
      cy.task('log', 'Accessibility violations found:')
      cy.task('table', violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      })))
    }
  })
})

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (path: string, response: any) => {
  cy.intercept('POST', `/api/${path}`, {
    statusCode: 200,
    body: response,
  }).as(`mock${path.replace(/[^a-zA-Z0-9]/g, '')}`)
})

// Command to simulate network conditions
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(2000) // 2 second delay
    })
  })
})

// Command to clear all browser data
Cypress.Commands.add('clearBrowserData', () => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})

// Command to take a full page screenshot
Cypress.Commands.add('takeFullPageScreenshot', (name: string) => {
  cy.screenshot(name, { capture: 'fullPage' })
})

// Command to wait for API request to complete
Cypress.Commands.add('waitForApiRequest', (alias: string, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

// Command to verify no console errors
Cypress.Commands.add('verifyNoConsoleErrors', () => {
  cy.window().then((win) => {
    // Check for console errors
    win.console.error = cy.stub().as('consoleError')
  })
  cy.get('@consoleError').should('not.have.been.called')
})

// Command to set viewport for different devices
Cypress.Commands.add('setViewport', (device: string) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
    'desktop-xl': [1920, 1080]
  }
  
  const [width, height] = viewports[device] || viewports.desktop
  cy.viewport(width, height)
})

// Add type definitions for new commands
declare global {
  namespace Cypress {
    interface Chainable {
      simulateSlowNetwork(): Chainable<void>
      clearBrowserData(): Chainable<void>
      takeFullPageScreenshot(name: string): Chainable<void>
      waitForApiRequest(alias: string, timeout?: number): Chainable<void>
      verifyNoConsoleErrors(): Chainable<void>
      setViewport(device: string): Chainable<void>
    }
  }
}