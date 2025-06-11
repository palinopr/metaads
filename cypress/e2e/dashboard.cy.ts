describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Load mock data
    cy.fixture('mock-data').as('mockData')
    
    // Mock API responses
    cy.intercept('POST', '/api/meta', { fixture: 'mock-data.json' }).as('metaApiCall')
    cy.intercept('GET', '/api/health', {
      statusCode: 200,
      body: {
        status: 'healthy',
        memory: { heapUsed: 50, heapTotal: 80, external: 10, rss: 100 },
        uptime: 3600,
        timestamp: new Date().toISOString()
      }
    }).as('healthCheck')
  })

  describe('Dashboard Loading', () => {
    it('should load the dashboard page successfully', () => {
      cy.visit('/')
      cy.get('[data-testid="dashboard-container"]').should('be.visible')
      cy.title().should('contain', 'Meta Ads Dashboard')
    })

    it('should display loading state initially', () => {
      cy.visit('/')
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      // Wait for loading to complete
      cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
    })

    it('should show error state when API fails', () => {
      cy.intercept('POST', '/api/meta', { statusCode: 500, body: { error: 'Server error' } })
      cy.visit('/')
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load')
    })
  })

  describe('Campaign Display', () => {
    it('should display campaigns when data is loaded', function() {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Check if campaigns are displayed
      cy.get('[data-testid="campaign-row"]').should('have.length.at.least', 1)
      cy.get('[data-testid="campaign-name"]').first().should('contain', this.mockData.campaigns[0].name)
      
      // Check campaign metrics
      cy.get('[data-testid="campaign-spend"]').first().should('be.visible')
      cy.get('[data-testid="campaign-roas"]').first().should('be.visible')
      cy.get('[data-testid="campaign-conversions"]').first().should('be.visible')
    })

    it('should filter campaigns by status', function() {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Filter by active campaigns
      cy.get('[data-testid="status-filter"]').select('ACTIVE')
      cy.get('[data-testid="campaign-row"]').should('have.length', 1)
      cy.get('[data-testid="campaign-status"]').should('contain', 'ACTIVE')
      
      // Filter by paused campaigns
      cy.get('[data-testid="status-filter"]').select('PAUSED')
      cy.get('[data-testid="campaign-row"]').should('have.length', 1)
      cy.get('[data-testid="campaign-status"]').should('contain', 'PAUSED')
    })

    it('should search campaigns by name', function() {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Search for specific campaign
      cy.get('[data-testid="campaign-search"]').type('Test Campaign 1')
      cy.get('[data-testid="campaign-row"]').should('have.length', 1)
      cy.get('[data-testid="campaign-name"]').should('contain', 'Test Campaign 1')
      
      // Clear search
      cy.get('[data-testid="campaign-search"]').clear()
      cy.get('[data-testid="campaign-row"]').should('have.length.at.least', 2)
    })
  })

  describe('Campaign Details', () => {
    it('should show campaign details when clicked', function() {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Mock detailed campaign data
      cy.intercept('POST', '/api/meta', {
        statusCode: 200,
        body: {
          success: true,
          historicalDailyData: this.mockData.historicalData,
          todayHourlyData: this.mockData.hourlyData,
          adSets: this.mockData.campaigns[0].adsets
        }
      }).as('campaignDetails')
      
      // Click on first campaign
      cy.get('[data-testid="campaign-row"]').first().click()
      cy.wait('@campaignDetails')
      
      // Check if details modal/page is shown
      cy.get('[data-testid="campaign-details-modal"]').should('be.visible')
      cy.get('[data-testid="historical-chart"]').should('be.visible')
      cy.get('[data-testid="hourly-chart"]').should('be.visible')
      cy.get('[data-testid="adsets-table"]').should('be.visible')
    })

    it('should display historical performance chart', function() {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      cy.intercept('POST', '/api/meta', {
        statusCode: 200,
        body: {
          success: true,
          historicalDailyData: this.mockData.historicalData,
          todayHourlyData: this.mockData.hourlyData,
          adSets: this.mockData.campaigns[0].adsets
        }
      }).as('campaignDetails')
      
      cy.get('[data-testid="campaign-row"]').first().click()
      cy.wait('@campaignDetails')
      
      // Check chart elements
      cy.get('[data-testid="historical-chart"]').should('be.visible')
      cy.get('[data-testid="chart-spend-line"]').should('exist')
      cy.get('[data-testid="chart-revenue-line"]').should('exist')
      cy.get('[data-testid="chart-roas-line"]').should('exist')
    })
  })

  describe('Settings and Configuration', () => {
    it('should navigate to settings page', () => {
      cy.visit('/')
      cy.get('[data-testid="settings-button"]').click()
      cy.url().should('include', '/settings')
      cy.get('[data-testid="settings-form"]').should('be.visible')
    })

    it('should validate Meta API credentials', function() {
      cy.visit('/settings')
      
      // Mock successful validation
      cy.intercept('POST', '/api/meta', {
        statusCode: 200,
        body: {
          success: true,
          accountInfo: this.mockData.accountInfo
        }
      }).as('testConnection')
      
      // Enter valid credentials
      cy.get('[data-testid="access-token-input"]').type(this.mockData.testCredentials.validAccessToken)
      cy.get('[data-testid="ad-account-input"]').type(this.mockData.testCredentials.validAdAccountId)
      cy.get('[data-testid="test-connection-button"]').click()
      
      cy.wait('@testConnection')
      cy.get('[data-testid="success-message"]').should('be.visible')
      cy.get('[data-testid="account-info"]').should('contain', this.mockData.accountInfo.name)
    })

    it('should handle invalid credentials', function() {
      cy.visit('/settings')
      
      // Mock failed validation
      cy.intercept('POST', '/api/meta', {
        statusCode: 401,
        body: {
          success: false,
          error: 'Invalid OAuth access token'
        }
      }).as('testConnectionFailed')
      
      // Enter invalid credentials
      cy.get('[data-testid="access-token-input"]').type(this.mockData.testCredentials.invalidAccessToken)
      cy.get('[data-testid="ad-account-input"]').type(this.mockData.testCredentials.invalidAdAccountId)
      cy.get('[data-testid="test-connection-button"]').click()
      
      cy.wait('@testConnectionFailed')
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid OAuth access token')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.setViewport('mobile')
      cy.visit('/')
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-navigation"]').should('be.visible')
      
      // Check campaign cards are responsive
      cy.get('[data-testid="campaign-card"]').should('be.visible')
      cy.get('[data-testid="campaign-metrics"]').should('be.visible')
    })

    it('should work on tablet devices', () => {
      cy.setViewport('tablet')
      cy.visit('/')
      
      // Check tablet layout
      cy.get('[data-testid="dashboard-container"]').should('be.visible')
      cy.get('[data-testid="campaign-grid"]').should('have.class', 'tablet-layout')
    })

    it('should work on desktop', () => {
      cy.setViewport('desktop')
      cy.visit('/')
      
      // Check desktop layout
      cy.get('[data-testid="dashboard-container"]').should('be.visible')
      cy.get('[data-testid="sidebar"]').should('be.visible')
      cy.get('[data-testid="main-content"]').should('be.visible')
    })
  })

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      const start = Date.now()
      cy.visit('/')
      cy.get('[data-testid="dashboard-container"]').should('be.visible')
      cy.then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(5000) // 5 seconds max
      })
    })

    it('should handle slow network conditions', () => {
      cy.simulateSlowNetwork()
      cy.visit('/')
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      
      // Should eventually load
      cy.get('[data-testid="dashboard-container"]', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '/api/meta', { forceNetworkError: true }).as('networkError')
      cy.visit('/')
      
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Test retry functionality
      cy.intercept('POST', '/api/meta', { fixture: 'mock-data.json' }).as('retrySuccess')
      cy.get('[data-testid="retry-button"]').click()
      cy.wait('@retrySuccess')
      cy.get('[data-testid="campaign-row"]').should('be.visible')
    })

    it('should verify no console errors', () => {
      cy.visit('/')
      cy.verifyNoConsoleErrors()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible', () => {
      cy.visit('/')
      cy.wait('@metaApiCall')
      cy.checkA11y()
    })

    it('should support keyboard navigation', () => {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Tab through interactive elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid')
      
      // Test enter key on campaigns
      cy.get('[data-testid="campaign-row"]').first().focus().type('{enter}')
      cy.get('[data-testid="campaign-details-modal"]').should('be.visible')
    })

    it('should have proper ARIA labels', () => {
      cy.visit('/')
      cy.wait('@metaApiCall')
      
      // Check important elements have ARIA labels
      cy.get('[data-testid="campaign-table"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="status-filter"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="campaign-search"]').should('have.attr', 'aria-label')
    })
  })
})