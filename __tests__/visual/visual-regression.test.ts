import { test, expect } from '@playwright/test'

// Configure Playwright for visual testing
test.describe('Visual Regression Tests', () => {
  // Setup before each test
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Mock API responses for consistent visual testing
    await page.route('/api/health', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          memory: { heapUsed: 50, heapTotal: 80, external: 10, rss: 100 },
          uptime: 3600,
          timestamp: '2024-01-01T12:00:00.000Z'
        })
      })
    })

    await page.route('/api/meta', (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData?.type === 'test_connection') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            accountInfo: {
              id: 'act_123456789',
              name: 'Test Ad Account',
              status: 1,
              currency: 'USD',
              timezone: 'America/New_York'
            }
          })
        })
      } else if (postData?.type === 'overview') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            campaigns: [
              {
                id: 'campaign_123',
                name: 'Test Campaign 1',
                status: 'ACTIVE',
                spend: 1250.75,
                impressions: 50000,
                clicks: 2500,
                conversions: 125,
                revenue: 6253.75,
                roas: 5.0,
                adsets: []
              },
              {
                id: 'campaign_456',
                name: 'Test Campaign 2',
                status: 'PAUSED',
                spend: 750.25,
                impressions: 30000,
                clicks: 1500,
                conversions: 75,
                revenue: 3751.25,
                roas: 5.0,
                adsets: []
              }
            ]
          })
        })
      } else {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid request' })
        })
      }
    })
  })

  test.describe('Dashboard Views', () => {
    test('homepage should match baseline', async ({ page }) => {
      await page.goto('/')
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible',
        timeout: 10000 
      })
      
      // Hide dynamic elements that change between runs
      await page.addStyleTag({
        content: `
          /* Hide elements with dynamic content */
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          /* Ensure consistent animations */
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      })
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('dashboard-homepage.png', {
        fullPage: true,
        threshold: 0.3 // Allow 30% difference for slight rendering variations
      })
    })

    test('dashboard with campaigns loaded', async ({ page }) => {
      await page.goto('/')
      
      // Wait for campaigns to load
      await page.waitForSelector('[data-testid="campaign-row"]', { 
        state: 'visible',
        timeout: 15000 
      })
      
      // Ensure all campaigns are visible
      const campaignRows = await page.locator('[data-testid="campaign-row"]').all()
      expect(campaignRows.length).toBeGreaterThan(0)
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-with-campaigns.png', {
        fullPage: true,
        threshold: 0.3
      })
    })

    test('settings page should match baseline', async ({ page }) => {
      await page.goto('/settings')
      
      // Wait for settings form to load
      await page.waitForSelector('[data-testid="settings-form"]', { 
        state: 'visible' 
      })
      
      await expect(page).toHaveScreenshot('settings-page.png', {
        fullPage: true,
        threshold: 0.2
      })
    })

    test('error state should match baseline', async ({ page }) => {
      // Mock API to return error
      await page.route('/api/meta', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error occurred' })
        })
      })
      
      await page.goto('/')
      
      // Wait for error message to appear
      await page.waitForSelector('[data-testid="error-message"]', { 
        state: 'visible' 
      })
      
      await expect(page).toHaveScreenshot('dashboard-error-state.png', {
        fullPage: true,
        threshold: 0.2
      })
    })

    test('loading state should match baseline', async ({ page }) => {
      // Delay API response to capture loading state
      await page.route('/api/meta', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, campaigns: [] })
        })
      })
      
      await page.goto('/')
      
      // Capture loading state
      await page.waitForSelector('[data-testid="loading-spinner"]', { 
        state: 'visible' 
      })
      
      await expect(page).toHaveScreenshot('dashboard-loading-state.png', {
        threshold: 0.2
      })
    })
  })

  test.describe('Mobile Views', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('mobile dashboard should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible' 
      })
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('mobile-dashboard.png', {
        fullPage: true,
        threshold: 0.3
      })
    })

    test('mobile navigation should match baseline', async ({ page }) => {
      await page.goto('/')
      
      // Open mobile menu if it exists
      const menuButton = page.locator('[data-testid="mobile-menu-button"]')
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await page.waitForSelector('[data-testid="mobile-navigation"]', { 
          state: 'visible' 
        })
      }
      
      await expect(page).toHaveScreenshot('mobile-navigation.png', {
        threshold: 0.2
      })
    })
  })

  test.describe('Tablet Views', () => {
    test.beforeEach(async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
    })

    test('tablet dashboard should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible' 
      })
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('tablet-dashboard.png', {
        fullPage: true,
        threshold: 0.3
      })
    })
  })

  test.describe('Dark Mode', () => {
    test('dark mode dashboard should match baseline', async ({ page }) => {
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' })
      
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible' 
      })
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        threshold: 0.3
      })
    })
  })

  test.describe('Component Screenshots', () => {
    test('campaign card component should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="campaign-row"]', { 
        state: 'visible' 
      })
      
      // Screenshot just the first campaign card
      const campaignCard = page.locator('[data-testid="campaign-row"]').first()
      await expect(campaignCard).toHaveScreenshot('campaign-card.png', {
        threshold: 0.2
      })
    })

    test('chart component should match baseline', async ({ page }) => {
      await page.goto('/')
      
      // Wait for chart to render
      await page.waitForSelector('[data-testid="overview-chart"]', { 
        state: 'visible',
        timeout: 10000 
      })
      
      // Screenshot just the chart area
      const chart = page.locator('[data-testid="overview-chart"]')
      await expect(chart).toHaveScreenshot('overview-chart.png', {
        threshold: 0.4 // Charts may have more variation
      })
    })

    test('recent sales component should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="recent-sales"]', { 
        state: 'visible' 
      })
      
      const recentSales = page.locator('[data-testid="recent-sales"]')
      await expect(recentSales).toHaveScreenshot('recent-sales.png', {
        threshold: 0.2
      })
    })
  })

  test.describe('High Contrast Mode', () => {
    test('high contrast mode should match baseline', async ({ page }) => {
      // Force high contrast mode
      await page.emulateMedia({ 
        colorScheme: 'dark',
        forcedColors: 'active'
      })
      
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible' 
      })
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
          
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-high-contrast.png', {
        fullPage: true,
        threshold: 0.4 // High contrast may have more variation
      })
    })
  })

  test.describe('Interaction States', () => {
    test('hover states should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="campaign-row"]', { 
        state: 'visible' 
      })
      
      // Hover over first campaign
      const firstCampaign = page.locator('[data-testid="campaign-row"]').first()
      await firstCampaign.hover()
      
      await expect(firstCampaign).toHaveScreenshot('campaign-hover-state.png', {
        threshold: 0.2
      })
    })

    test('focus states should match baseline', async ({ page }) => {
      await page.goto('/settings')
      
      await page.waitForSelector('[data-testid="access-token-input"]', { 
        state: 'visible' 
      })
      
      // Focus on input field
      const tokenInput = page.locator('[data-testid="access-token-input"]')
      await tokenInput.focus()
      
      await expect(tokenInput).toHaveScreenshot('input-focus-state.png', {
        threshold: 0.2
      })
    })
  })

  test.describe('Print Styles', () => {
    test('print layout should match baseline', async ({ page }) => {
      await page.goto('/')
      
      await page.waitForSelector('[data-testid="dashboard-container"]', { 
        state: 'visible' 
      })
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' })
      
      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="last-updated"],
          .timestamp {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-print-layout.png', {
        fullPage: true,
        threshold: 0.3
      })
    })
  })
})