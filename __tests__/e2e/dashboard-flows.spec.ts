import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_TIMEOUT = 30000

// Mock data for tests
const mockCampaignData = {
  campaigns: [
    {
      id: '123456789',
      name: 'Test Campaign 1',
      status: 'ACTIVE',
      spend: '1000.50',
      impressions: '50000',
      clicks: '1500',
      conversions: '32'
    },
    {
      id: '987654321',
      name: 'Test Campaign 2',
      status: 'PAUSED',
      spend: '750.25',
      impressions: '35000',
      clicks: '1050',
      conversions: '21'
    }
  ]
}

// Page object models
class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/dashboard`)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForDataLoad() {
    await this.page.waitForSelector('[data-testid="campaign-table"]', { timeout: TEST_TIMEOUT })
  }

  async getCampaignCount() {
    return await this.page.locator('[data-testid="campaign-row"]').count()
  }

  async searchCampaigns(query: string) {
    await this.page.fill('[data-testid="campaign-search"]', query)
    await this.page.waitForTimeout(500) // Debounce
  }

  async filterByStatus(status: string) {
    await this.page.selectOption('[data-testid="status-filter"]', status)
    await this.page.waitForTimeout(500)
  }

  async openCampaignDetails(campaignName: string) {
    await this.page.click(`[data-testid="campaign-row"]:has-text("${campaignName}")`)
    await this.page.waitForSelector('[data-testid="campaign-details-modal"]')
  }

  async refreshData() {
    await this.page.click('[data-testid="refresh-button"]')
    await this.page.waitForSelector('[data-testid="loading-spinner"]')
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' })
  }
}

class SettingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/settings`)
    await this.page.waitForLoadState('networkidle')
  }

  async setupMetaIntegration(accessToken: string, adAccountId: string) {
    await this.page.fill('[data-testid="access-token-input"]', accessToken)
    await this.page.fill('[data-testid="ad-account-input"]', adAccountId)
    await this.page.click('[data-testid="save-settings-button"]')
    await this.page.waitForSelector('[data-testid="success-message"]')
  }

  async testConnection() {
    await this.page.click('[data-testid="test-connection-button"]')
    return await this.page.waitForSelector('[data-testid="connection-result"]', { timeout: 10000 })
  }
}

class AIInsightsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/ai-insights`)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForInsights() {
    await this.page.waitForSelector('[data-testid="ai-insights-container"]', { timeout: TEST_TIMEOUT })
  }

  async getInsightCount() {
    return await this.page.locator('[data-testid="insight-card"]').count()
  }

  async switchToRecommendationsTab() {
    await this.page.click('[data-testid="recommendations-tab"]')
    await this.page.waitForSelector('[data-testid="recommendations-content"]')
  }

  async switchToPredictionsTab() {
    await this.page.click('[data-testid="predictions-tab"]')
    await this.page.waitForSelector('[data-testid="predictions-content"]')
  }
}

// Test setup and utilities
test.beforeEach(async ({ page, context }) => {
  // Mock API responses
  await page.route('**/api/meta', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockCampaignData
        })
      })
    }
  })

  await page.route('**/api/ai-insights', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        insights: [
          {
            id: '1',
            type: 'opportunity',
            priority: 'high',
            title: 'Scale High-Performing Campaign',
            description: 'Campaign shows strong performance',
            confidence: 87
          }
        ],
        recommendations: [
          {
            campaignId: '123456789',
            action: 'scale',
            reason: 'Strong ROAS',
            confidence: 90
          }
        ],
        predictiveAnalytics: {
          nextWeekROAS: 3.1,
          nextWeekSpend: 1800,
          nextWeekRevenue: 5580
        }
      })
    })
  })

  // Set up authentication state
  await context.addCookies([
    {
      name: 'session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/'
    }
  ])
})

test.describe('Dashboard Core Functionality', () => {
  test('should load dashboard with campaign data', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    const campaignCount = await dashboard.getCampaignCount()
    expect(campaignCount).toBeGreaterThan(0)
    
    // Verify campaign data is displayed
    await expect(page.locator('text=Test Campaign 1')).toBeVisible()
    await expect(page.locator('text=Test Campaign 2')).toBeVisible()
  })

  test('should search campaigns effectively', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Search for specific campaign
    await dashboard.searchCampaigns('Test Campaign 1')
    
    await expect(page.locator('text=Test Campaign 1')).toBeVisible()
    await expect(page.locator('text=Test Campaign 2')).not.toBeVisible()
  })

  test('should filter campaigns by status', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Filter by active campaigns
    await dashboard.filterByStatus('ACTIVE')
    
    await expect(page.locator('text=Test Campaign 1')).toBeVisible()
    await expect(page.locator('text=Test Campaign 2')).not.toBeVisible()
  })

  test('should open campaign details modal', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    await dashboard.openCampaignDetails('Test Campaign 1')
    
    await expect(page.locator('[data-testid="campaign-details-modal"]')).toBeVisible()
    await expect(page.locator('text=Campaign Details')).toBeVisible()
  })

  test('should refresh campaign data', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Track API calls
    let apiCallCount = 0
    page.on('request', request => {
      if (request.url().includes('/api/meta')) {
        apiCallCount++
      }
    })
    
    await dashboard.refreshData()
    
    expect(apiCallCount).toBeGreaterThan(0)
  })
})

test.describe('Settings and Configuration', () => {
  test('should configure Meta API integration', async ({ page }) => {
    const settings = new SettingsPage(page)
    
    await settings.goto()
    
    const mockToken = 'EAA123456789abcdef_mock_token_for_testing_purposes_only'
    const mockAccountId = 'act_123456789'
    
    await settings.setupMetaIntegration(mockToken, mockAccountId)
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should test API connection', async ({ page }) => {
    const settings = new SettingsPage(page)
    
    await settings.goto()
    
    // Mock successful connection test
    await page.route('**/api/meta', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accountInfo: {
            id: 'act_123456789',
            name: 'Test Ad Account',
            currency: 'USD'
          }
        })
      })
    })
    
    const result = await settings.testConnection()
    await expect(result).toBeVisible()
    await expect(page.locator('text=Connection successful')).toBeVisible()
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    const settings = new SettingsPage(page)
    
    await settings.goto()
    
    // Mock failed connection
    await page.route('**/api/meta', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Invalid OAuth access token',
            code: 190
          }
        })
      })
    })
    
    await settings.setupMetaIntegration('invalid-token', 'invalid-account')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Invalid OAuth access token')).toBeVisible()
  })
})

test.describe('AI Insights Functionality', () => {
  test('should display AI insights', async ({ page }) => {
    const aiInsights = new AIInsightsPage(page)
    
    await aiInsights.goto()
    await aiInsights.waitForInsights()
    
    const insightCount = await aiInsights.getInsightCount()
    expect(insightCount).toBeGreaterThan(0)
    
    await expect(page.locator('text=Scale High-Performing Campaign')).toBeVisible()
  })

  test('should navigate between insight tabs', async ({ page }) => {
    const aiInsights = new AIInsightsPage(page)
    
    await aiInsights.goto()
    await aiInsights.waitForInsights()
    
    // Switch to recommendations tab
    await aiInsights.switchToRecommendationsTab()
    await expect(page.locator('[data-testid="recommendations-content"]')).toBeVisible()
    
    // Switch to predictions tab
    await aiInsights.switchToPredictionsTab()
    await expect(page.locator('[data-testid="predictions-content"]')).toBeVisible()
    
    // Verify predictions data
    await expect(page.locator('text=3.1')).toBeVisible() // ROAS
    await expect(page.locator('text=$1800.00')).toBeVisible() // Spend
  })

  test('should handle AI service errors', async ({ page }) => {
    const aiInsights = new AIInsightsPage(page)
    
    // Mock AI service failure
    await page.route('**/api/ai-insights', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'AI service temporarily unavailable'
          }
        })
      })
    })
    
    await aiInsights.goto()
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=AI service temporarily unavailable')).toBeVisible()
  })
})

test.describe('Navigation and User Experience', () => {
  test('should navigate between main sections', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Navigate to dashboard
    await page.click('a[href="/dashboard"]')
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    
    // Navigate to AI insights
    await page.click('a[href="/ai-insights"]')
    await expect(page).toHaveURL(`${BASE_URL}/ai-insights`)
    
    // Navigate to settings
    await page.click('a[href="/settings"]')
    await expect(page).toHaveURL(`${BASE_URL}/settings`)
  })

  test('should maintain state during navigation', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Apply filters
    await dashboard.searchCampaigns('Test Campaign 1')
    await dashboard.filterByStatus('ACTIVE')
    
    // Navigate away and back
    await page.click('a[href="/settings"]')
    await page.click('a[href="/dashboard"]')
    
    // Verify filters are preserved (if implementing state persistence)
    await expect(page.locator('[data-testid="campaign-search"]')).toHaveValue('Test Campaign 1')
  })

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.goto(`${BASE_URL}/ai-insights`)
    
    await page.goBack()
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    
    await page.goForward()
    await expect(page).toHaveURL(`${BASE_URL}/ai-insights`)
  })
})

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network connectivity issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Simulate network failure
    await page.route('**/api/meta', async route => {
      await route.abort()
    })
    
    const dashboard = new DashboardPage(page)
    await dashboard.refreshData()
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('should handle API rate limiting', async ({ page }) => {
    await page.route('**/api/meta', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Rate limit exceeded',
            code: 17
          }
        })
      })
    })
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    
    await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible()
  })

  test('should handle empty data states', async ({ page }) => {
    await page.route('**/api/meta', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { campaigns: [] }
        })
      })
    })
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('text=No campaigns found')).toBeVisible()
  })
})

test.describe('Performance and Loading States', () => {
  test('should show loading states during data fetch', async ({ page }) => {
    // Add delay to API response
    await page.route('**/api/meta', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockCampaignData
        })
      })
    })
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    
    // Verify loading spinner appears
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for data to load
    await dashboard.waitForDataLoad()
    
    // Verify loading spinner disappears
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('should handle slow AI processing', async ({ page }) => {
    await page.route('**/api/ai-insights', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          insights: [],
          recommendations: [],
          predictiveAnalytics: null
        })
      })
    })
    
    const aiInsights = new AIInsightsPage(page)
    await aiInsights.goto()
    
    await expect(page.locator('text=Analyzing your campaigns')).toBeVisible()
    await aiInsights.waitForInsights()
    await expect(page.locator('text=Analyzing your campaigns')).not.toBeVisible()
  })
})

test.describe('Responsive Design and Mobile', () => {
  test('should work on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Navigate via mobile menu
    await page.click('[data-testid="mobile-menu"] a[href="/ai-insights"]')
    await expect(page).toHaveURL(`${BASE_URL}/ai-insights`)
  })

  test('should adapt table layout for smaller screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Verify responsive table behavior
    await expect(page.locator('[data-testid="campaign-table"]')).toBeVisible()
    
    // Some columns might be hidden on smaller screens
    const visibleColumns = await page.locator('[data-testid="table-header"] th:visible').count()
    expect(visibleColumns).toBeLessThanOrEqual(6) // Assuming some columns are hidden
  })
})

test.describe('Accessibility Features', () => {
  test('should be keyboard navigable', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Navigate using keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify focus management
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    // Check for important ARIA labels
    await expect(page.locator('[aria-label="Campaign search"]')).toBeVisible()
    await expect(page.locator('[role="table"]')).toBeVisible()
    await expect(page.locator('[role="button"]')).toBeTruthy()
  })
})

test.describe('Data Integrity and Validation', () => {
  test('should validate input data', async ({ page }) => {
    const settings = new SettingsPage(page)
    await settings.goto()
    
    // Try to submit invalid data
    await page.fill('[data-testid="access-token-input"]', 'invalid-token')
    await page.fill('[data-testid="ad-account-input"]', 'invalid-account')
    await page.click('[data-testid="save-settings-button"]')
    
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
  })

  test('should handle data refresh correctly', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoad()
    
    const initialCount = await dashboard.getCampaignCount()
    
    // Mock updated data
    await page.route('**/api/meta', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            campaigns: [
              ...mockCampaignData.campaigns,
              {
                id: '555666777',
                name: 'New Campaign',
                status: 'ACTIVE',
                spend: '500.00'
              }
            ]
          }
        })
      })
    })
    
    await dashboard.refreshData()
    await dashboard.waitForDataLoad()
    
    const updatedCount = await dashboard.getCampaignCount()
    expect(updatedCount).toBeGreaterThan(initialCount)
  })
})