// Browser Performance Testing for Meta Ads Dashboard UI/UX
// Tests front-end performance, rendering, and user interaction responsiveness under load

import { chromium, firefox, webkit } from 'playwright'
import { check, group, sleep } from 'k6'
import { Trend, Counter, Gauge, Rate } from 'k6/metrics'

// Browser performance metrics
const pageLoadTime = new Trend('page_load_time')
const domContentLoadedTime = new Trend('dom_content_loaded_time')
const firstContentfulPaint = new Trend('first_contentful_paint')
const largestContentfulPaint = new Trend('largest_contentful_paint')
const cumulativeLayoutShift = new Trend('cumulative_layout_shift')
const totalBlockingTime = new Trend('total_blocking_time')

// Interaction performance metrics
const clickResponseTime = new Trend('click_response_time')
const inputResponseTime = new Trend('input_response_time')
const navigationResponseTime = new Trend('navigation_response_time')
const searchResponseTime = new Trend('search_response_time')
const filterResponseTime = new Trend('filter_response_time')

// Resource loading metrics
const jsLoadTime = new Trend('js_load_time')
const cssLoadTime = new Trend('css_load_time')
const imageLoadTime = new Trend('image_load_time')
const fontLoadTime = new Trend('font_load_time')
const totalResourceSize = new Gauge('total_resource_size')
const networkRequests = new Counter('network_requests')

// Memory and performance metrics
const memoryUsage = new Gauge('browser_memory_usage')
const cpuUsage = new Gauge('browser_cpu_usage')
const performanceScore = new Gauge('performance_score')
const accessibilityScore = new Gauge('accessibility_score')
const javaScriptErrors = new Counter('javascript_errors')
const consoleErrors = new Counter('console_errors')

// User experience metrics
const timeToInteractive = new Trend('time_to_interactive')
const formSubmissionTime = new Trend('form_submission_time')
const dataVisualizationRenderTime = new Trend('data_visualization_render_time')
const tableRenderTime = new Trend('table_render_time')
const modalOpenTime = new Trend('modal_open_time')

// Error and reliability metrics
const pageErrors = new Counter('page_errors')
const timeoutErrors = new Counter('timeout_errors')
const renderingErrors = new Counter('rendering_errors')
const responsiveDesignIssues = new Counter('responsive_design_issues')

// Test configuration for browser performance testing
export const options = {
  scenarios: {
    // Scenario 1: Baseline browser performance
    baseline_browser_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      tags: { test_type: 'baseline_browser' },
    },

    // Scenario 2: Multi-browser compatibility test
    multi_browser_test: {
      executor: 'per-vu-iterations',
      vus: 3,
      iterations: 10,
      startTime: '12m',
      maxDuration: '15m',
      tags: { test_type: 'multi_browser' },
    },

    // Scenario 3: Heavy UI interaction test
    heavy_ui_interaction: {
      executor: 'ramping-vus',
      startTime: '30m',
      startVUs: 3,
      stages: [
        { duration: '2m', target: 8 },
        { duration: '10m', target: 8 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'heavy_ui' },
    },

    // Scenario 4: Mobile performance simulation
    mobile_performance_test: {
      executor: 'constant-vus',
      vus: 4,
      duration: '8m',
      startTime: '50m',
      tags: { test_type: 'mobile_performance' },
    },

    // Scenario 5: Data-heavy page performance
    data_heavy_performance: {
      executor: 'ramping-vus',
      startTime: '65m',
      startVUs: 2,
      stages: [
        { duration: '2m', target: 6 },
        { duration: '8m', target: 6 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'data_heavy' },
    },
  },
  
  thresholds: {
    // Core Web Vitals thresholds
    page_load_time: ['p(95)<3000', 'p(99)<5000'],
    dom_content_loaded_time: ['p(95)<1500', 'p(99)<2500'],
    first_contentful_paint: ['p(95)<1800', 'p(99)<3000'],
    largest_contentful_paint: ['p(95)<2500', 'p(99)<4000'],
    cumulative_layout_shift: ['p(95)<0.1', 'p(99)<0.25'],
    total_blocking_time: ['p(95)<200', 'p(99)<600'],
    
    // Interaction responsiveness thresholds
    click_response_time: ['p(95)<100', 'p(99)<300'],
    input_response_time: ['p(95)<50', 'p(99)<150'],
    navigation_response_time: ['p(95)<1000', 'p(99)<2000'],
    time_to_interactive: ['p(95)<3000', 'p(99)<5000'],
    
    // Resource loading thresholds
    js_load_time: ['p(95)<2000', 'p(99)<4000'],
    css_load_time: ['p(95)<1000', 'p(99)<2000'],
    
    // Error thresholds
    javascript_errors: ['count<10'],
    console_errors: ['count<20'],
    page_errors: ['count<5'],
    rendering_errors: ['count<5'],
    
    // Performance score thresholds
    performance_score: ['value>70'], // Lighthouse performance score > 70
    accessibility_score: ['value>80'], // Accessibility score > 80
  },
}

const BASE_URL = 'http://localhost:3000'

// Browser configuration
const browserConfigs = {
  chromium: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  firefox: {
    headless: true,
  },
  webkit: {
    headless: true,
  },
}

// Device emulation configurations
const deviceConfigs = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  laptop: {
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  },
  mobile: {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  },
}

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Browser performance testing functions
async function testPageLoadPerformance(browser, device = 'desktop') {
  const context = await browser.newContext({
    ...deviceConfigs[device],
    recordVideo: { dir: 'videos/' },
  })
  
  const page = await context.newPage()
  
  try {
    // Track JavaScript errors
    page.on('pageerror', (error) => {
      javaScriptErrors.add(1)
      console.error('JavaScript error:', error.message)
    })
    
    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.add(1)
      }
    })
    
    const startTime = Date.now()
    
    // Navigate to dashboard
    const response = await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 10000,
    })
    
    if (!response.ok()) {
      pageErrors.add(1)
      return
    }
    
    const domContentLoadedTime_val = Date.now() - startTime
    domContentLoadedTime.add(domContentLoadedTime_val)
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    const pageLoadTime_val = Date.now() - startTime
    pageLoadTime.add(pageLoadTime_val)
    
    // Capture Web Vitals using browser APIs
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {}
          
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime
              }
            } else if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            } else if (entry.entryType === 'layout-shift') {
              vitals.cls = (vitals.cls || 0) + entry.value
            }
          })
          
          setTimeout(() => resolve(vitals), 1000)
        })
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] })
      })
    })
    
    if (webVitals.fcp) firstContentfulPaint.add(webVitals.fcp)
    if (webVitals.lcp) largestContentfulPaint.add(webVitals.lcp)
    if (webVitals.cls) cumulativeLayoutShift.add(webVitals.cls)
    
    // Check Time to Interactive
    const tti = await page.evaluate(() => {
      return window.performance.timing.domInteractive - window.performance.timing.navigationStart
    })
    timeToInteractive.add(tti)
    
    // Measure memory usage
    const memoryInfo = await page.evaluate(() => {
      return window.performance.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      } : null
    })
    
    if (memoryInfo) {
      memoryUsage.add(memoryInfo.usedJSHeapSize / 1024 / 1024) // Convert to MB
    }
    
    // Check for responsive design issues
    if (device === 'mobile' || device === 'tablet') {
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })
      
      if (hasHorizontalScroll) {
        responsiveDesignIssues.add(1)
      }
    }
    
    return {
      pageLoadTime: pageLoadTime_val,
      domContentLoadedTime: domContentLoadedTime_val,
      webVitals,
      memoryInfo,
    }
    
  } catch (error) {
    pageErrors.add(1)
    console.error('Page load error:', error.message)
  } finally {
    await context.close()
  }
}

async function testUIInteractionPerformance(browser, device = 'desktop') {
  const context = await browser.newContext(deviceConfigs[device])
  const page = await context.newPage()
  
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    
    // Test button click responsiveness
    const clickStartTime = Date.now()
    await page.click('[data-testid="refresh-button"]', { timeout: 5000 })
    const clickResponseTime_val = Date.now() - clickStartTime
    clickResponseTime.add(clickResponseTime_val)
    
    // Test form input responsiveness
    const inputStartTime = Date.now()
    await page.fill('[data-testid="search-input"]', 'test campaign')
    const inputResponseTime_val = Date.now() - inputStartTime
    inputResponseTime.add(inputResponseTime_val)
    
    // Test navigation responsiveness
    const navStartTime = Date.now()
    await page.click('[data-testid="reports-nav"]')
    await page.waitForLoadState('networkidle')
    const navigationResponseTime_val = Date.now() - navStartTime
    navigationResponseTime.add(navigationResponseTime_val)
    
    // Test search functionality
    const searchStartTime = Date.now()
    await page.fill('[data-testid="campaign-search"]', 'performance')
    await page.press('[data-testid="campaign-search"]', 'Enter')
    await page.waitForTimeout(1000) // Wait for search results
    const searchResponseTime_val = Date.now() - searchStartTime
    searchResponseTime.add(searchResponseTime_val)
    
    // Test filter interactions
    const filterStartTime = Date.now()
    await page.selectOption('[data-testid="status-filter"]', 'ACTIVE')
    await page.waitForTimeout(500) // Wait for filter to apply
    const filterResponseTime_val = Date.now() - filterStartTime
    filterResponseTime.add(filterResponseTime_val)
    
    // Test modal opening
    if (await page.isVisible('[data-testid="campaign-details-button"]')) {
      const modalStartTime = Date.now()
      await page.click('[data-testid="campaign-details-button"]')
      await page.waitForSelector('[data-testid="campaign-modal"]', { timeout: 3000 })
      const modalOpenTime_val = Date.now() - modalStartTime
      modalOpenTime.add(modalOpenTime_val)
      
      // Close modal
      await page.click('[data-testid="modal-close"]')
    }
    
  } catch (error) {
    pageErrors.add(1)
    console.error('UI interaction error:', error.message)
  } finally {
    await context.close()
  }
}

async function testResourceLoadingPerformance(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    const resourceMetrics = {
      js: [],
      css: [],
      images: [],
      fonts: [],
      totalSize: 0,
      requestCount: 0,
    }
    
    // Track resource loading
    page.on('response', (response) => {
      const url = response.url()
      const resourceType = response.request().resourceType()
      const size = parseInt(response.headers()['content-length'] || '0')
      
      resourceMetrics.totalSize += size
      resourceMetrics.requestCount++
      networkRequests.add(1)
      
      const timing = response.timing()
      const loadTime = timing.responseEnd - timing.requestStart
      
      switch (resourceType) {
        case 'script':
          resourceMetrics.js.push(loadTime)
          jsLoadTime.add(loadTime)
          break
        case 'stylesheet':
          resourceMetrics.css.push(loadTime)
          cssLoadTime.add(loadTime)
          break
        case 'image':
          resourceMetrics.images.push(loadTime)
          imageLoadTime.add(loadTime)
          break
        case 'font':
          resourceMetrics.fonts.push(loadTime)
          fontLoadTime.add(loadTime)
          break
      }
    })
    
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    
    // Wait for all resources to finish loading
    await page.waitForTimeout(2000)
    
    totalResourceSize.add(resourceMetrics.totalSize / 1024 / 1024) // Convert to MB
    
    // Generate performance score (simplified)
    const avgLoadTime = resourceMetrics.js.concat(resourceMetrics.css)
      .reduce((sum, time) => sum + time, 0) / 
      (resourceMetrics.js.length + resourceMetrics.css.length) || 0
    
    const score = Math.max(0, 100 - (avgLoadTime / 50)) // Simplified scoring
    performanceScore.add(score)
    
  } catch (error) {
    pageErrors.add(1)
    console.error('Resource loading error:', error.message)
  } finally {
    await context.close()
  }
}

async function testDataVisualizationPerformance(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    
    // Test chart rendering performance
    const chartRenderStart = Date.now()
    await page.waitForSelector('[data-testid="performance-chart"]', { timeout: 10000 })
    const chartRenderTime = Date.now() - chartRenderStart
    dataVisualizationRenderTime.add(chartRenderTime)
    
    // Test table rendering with large dataset
    const tableRenderStart = Date.now()
    await page.click('[data-testid="view-all-campaigns"]')
    await page.waitForSelector('[data-testid="campaigns-table"]', { timeout: 10000 })
    const tableRenderTime_val = Date.now() - tableRenderStart
    tableRenderTime.add(tableRenderTime_val)
    
    // Test table pagination performance
    if (await page.isVisible('[data-testid="pagination-next"]')) {
      const paginationStart = Date.now()
      await page.click('[data-testid="pagination-next"]')
      await page.waitForTimeout(1000)
      const paginationTime = Date.now() - paginationStart
      navigationResponseTime.add(paginationTime)
    }
    
    // Test data refresh performance
    const refreshStart = Date.now()
    await page.click('[data-testid="refresh-data"]')
    await page.waitForSelector('[data-testid="loading-indicator"]')
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden', timeout: 15000 })
    const refreshTime = Date.now() - refreshStart
    formSubmissionTime.add(refreshTime)
    
  } catch (error) {
    renderingErrors.add(1)
    console.error('Data visualization error:', error.message)
  } finally {
    await context.close()
  }
}

async function testAccessibilityPerformance(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    
    // Basic accessibility checks
    const accessibilityIssues = await page.evaluate(() => {
      const issues = []
      
      // Check for missing alt attributes
      const images = document.querySelectorAll('img:not([alt])')
      issues.push({ type: 'missing_alt', count: images.length })
      
      // Check for missing form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
      const unlabeledInputs = Array.from(inputs).filter(input => {
        const label = document.querySelector(`label[for="${input.id}"]`)
        return !label && !input.closest('label')
      })
      issues.push({ type: 'unlabeled_inputs', count: unlabeledInputs.length })
      
      // Check for proper heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      let headingLevels = []
      headings.forEach(h => {
        const level = parseInt(h.tagName.charAt(1))
        headingLevels.push(level)
      })
      
      let headingStructureValid = true
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i-1] > 1) {
          headingStructureValid = false
          break
        }
      }
      issues.push({ type: 'heading_structure', valid: headingStructureValid })
      
      return issues
    })
    
    // Calculate accessibility score
    let accessibilityScore_val = 100
    accessibilityIssues.forEach(issue => {
      if (issue.type === 'missing_alt') accessibilityScore_val -= issue.count * 2
      if (issue.type === 'unlabeled_inputs') accessibilityScore_val -= issue.count * 5
      if (issue.type === 'heading_structure' && !issue.valid) accessibilityScore_val -= 10
    })
    
    accessibilityScore.add(Math.max(0, accessibilityScore_val))
    
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Should focus first interactive element
    await page.waitForTimeout(100)
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement ? document.activeElement.tagName : null
    })
    
    if (!focusedElement || focusedElement === 'BODY') {
      // Keyboard navigation issue
      accessibilityScore.add(-5)
    }
    
  } catch (error) {
    pageErrors.add(1)
    console.error('Accessibility test error:', error.message)
  } finally {
    await context.close()
  }
}

async function testMobilePerformance(browser) {
  const context = await browser.newContext({
    ...deviceConfigs.mobile,
    deviceScaleFactor: 2,
  })
  
  const page = await context.newPage()
  
  try {
    const startTime = Date.now()
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    const mobileLoadTime = Date.now() - startTime
    pageLoadTime.add(mobileLoadTime)
    
    // Test touch interactions
    const touchStartTime = Date.now()
    await page.tap('[data-testid="mobile-menu-button"]')
    const touchResponseTime = Date.now() - touchStartTime
    clickResponseTime.add(touchResponseTime)
    
    // Test swipe gestures on charts/tables
    if (await page.isVisible('[data-testid="swipeable-chart"]')) {
      const swipeStart = Date.now()
      await page.touchscreen.tap(200, 300)
      await page.mouse.move(200, 300)
      await page.mouse.move(100, 300)
      const swipeTime = Date.now() - swipeStart
      inputResponseTime.add(swipeTime)
    }
    
    // Check viewport meta tag
    const hasViewportMeta = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]')
      return viewport !== null
    })
    
    if (!hasViewportMeta) {
      responsiveDesignIssues.add(1)
    }
    
  } catch (error) {
    pageErrors.add(1)
    console.error('Mobile performance error:', error.message)
  } finally {
    await context.close()
  }
}

// Main test execution function
export default async function () {
  const testType = __ENV.TEST_TYPE || 'mixed'
  const browserType = randomChoice(['chromium', 'firefox', 'webkit'])
  const device = randomChoice(['desktop', 'laptop', 'tablet', 'mobile'])
  
  let browser
  
  try {
    // Launch browser based on type
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch(browserConfigs.firefox)
        break
      case 'webkit':
        browser = await webkit.launch(browserConfigs.webkit)
        break
      default:
        browser = await chromium.launch(browserConfigs.chromium)
    }
    
    switch (testType) {
      case 'page_load_only':
        await testPageLoadPerformance(browser, device)
        break
        
      case 'ui_interaction_only':
        await testUIInteractionPerformance(browser, device)
        break
        
      case 'resource_loading_only':
        await testResourceLoadingPerformance(browser)
        break
        
      case 'data_visualization_only':
        await testDataVisualizationPerformance(browser)
        break
        
      case 'accessibility_only':
        await testAccessibilityPerformance(browser)
        break
        
      case 'mobile_only':
        await testMobilePerformance(browser)
        break
        
      default:
        // Mixed scenario - comprehensive testing
        const scenario = Math.random()
        
        if (scenario < 0.3) {
          // 30% - Page load and basic interaction
          await testPageLoadPerformance(browser, device)
          sleep(1)
          await testUIInteractionPerformance(browser, device)
        } else if (scenario < 0.5) {
          // 20% - Resource loading and visualization
          await testResourceLoadingPerformance(browser)
          sleep(1)
          await testDataVisualizationPerformance(browser)
        } else if (scenario < 0.7) {
          // 20% - Mobile-focused testing
          await testMobilePerformance(browser)
        } else if (scenario < 0.85) {
          // 15% - Accessibility testing
          await testAccessibilityPerformance(browser)
          sleep(1)
          await testPageLoadPerformance(browser, device)
        } else {
          // 15% - Comprehensive testing
          await testPageLoadPerformance(browser, device)
          sleep(1)
          await testUIInteractionPerformance(browser, device)
          sleep(1)
          await testResourceLoadingPerformance(browser)
        }
    }
    
  } catch (error) {
    pageErrors.add(1)
    console.error('Browser test error:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
  
  // Simulate user think time
  sleep(randomInt(2, 8))
}

// Setup function
export function setup() {
  console.log('🌐 Starting Browser Performance Test')
  console.log(`Target: ${BASE_URL}`)
  console.log('Test Coverage: Page Load, UI Interactions, Resource Loading, Mobile Performance, Accessibility')
  console.log('Browsers: Chromium, Firefox, WebKit')
  console.log('Devices: Desktop, Laptop, Tablet, Mobile')
  
  return {
    startTime: new Date().toISOString(),
    browsers: ['chromium', 'firefox', 'webkit'],
    devices: ['desktop', 'laptop', 'tablet', 'mobile'],
    testCoverage: ['page-load', 'ui-interaction', 'resource-loading', 'mobile', 'accessibility'],
  }
}

// Teardown function
export function teardown(data) {
  if (data && data.startTime) {
    console.log(`🏁 Browser performance test completed`)
    console.log(`Started: ${data.startTime}`)
    console.log(`Finished: ${new Date().toISOString()}`)
    console.log(`Browsers tested: ${data.browsers.join(', ')}`)
    console.log(`Devices tested: ${data.devices.join(', ')}`)
  }
  
  console.log('\n📊 Browser Performance Metrics Summary:')
  
  console.log('\nCore Web Vitals:')
  console.log('- page_load_time: Total page load time')
  console.log('- dom_content_loaded_time: DOM ready time')
  console.log('- first_contentful_paint: FCP - First visible content')
  console.log('- largest_contentful_paint: LCP - Largest element render time')
  console.log('- cumulative_layout_shift: CLS - Visual stability score')
  console.log('- total_blocking_time: TBT - Main thread blocking time')
  console.log('- time_to_interactive: TTI - Interactive readiness time')
  
  console.log('\nUser Interaction Performance:')
  console.log('- click_response_time: Button/link click responsiveness')
  console.log('- input_response_time: Form input responsiveness')
  console.log('- navigation_response_time: Page navigation speed')
  console.log('- search_response_time: Search functionality speed')
  console.log('- filter_response_time: Filter application speed')
  console.log('- modal_open_time: Modal/dialog opening speed')
  
  console.log('\nResource Loading Performance:')
  console.log('- js_load_time: JavaScript file loading time')
  console.log('- css_load_time: CSS file loading time')
  console.log('- image_load_time: Image loading time')
  console.log('- font_load_time: Font loading time')
  console.log('- total_resource_size: Total page weight')
  console.log('- network_requests: Number of network requests')
  
  console.log('\nData Visualization Performance:')
  console.log('- data_visualization_render_time: Chart/graph rendering time')
  console.log('- table_render_time: Data table rendering time')
  console.log('- form_submission_time: Form processing time')
  
  console.log('\nSystem Resource Usage:')
  console.log('- browser_memory_usage: Browser memory consumption')
  console.log('- browser_cpu_usage: Browser CPU utilization')
  console.log('- performance_score: Overall performance score')
  console.log('- accessibility_score: Accessibility compliance score')
  
  console.log('\n⚠️  Error and Issue Tracking:')
  console.log('- javascript_errors: JavaScript runtime errors')
  console.log('- console_errors: Browser console errors')
  console.log('- page_errors: Page loading/rendering errors')
  console.log('- rendering_errors: UI rendering failures')
  console.log('- responsive_design_issues: Mobile/responsive design problems')
  console.log('- timeout_errors: Request/operation timeouts')
  
  console.log('\n📱 Mobile-Specific Metrics:')
  console.log('- Touch interaction responsiveness')
  console.log('- Viewport configuration validation')
  console.log('- Responsive design compliance')
  console.log('- Mobile-specific performance optimizations')
}