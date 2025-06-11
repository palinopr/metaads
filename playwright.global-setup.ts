import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright visual regression tests...')
  
  // Verify the development server is running
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  
  try {
    const browser = await chromium.launch()
    const page = await browser.newPage()
    
    // Test if server is responding
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    console.log(`✅ Server is running at ${baseURL}`)
    
    // Verify critical pages load
    const criticalPages = ['/', '/settings', '/dashboard']
    
    for (const path of criticalPages) {
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' })
        console.log(`✅ Page ${path} loaded successfully`)
      } catch (error) {
        console.warn(`⚠️  Page ${path} failed to load:`, error)
      }
    }
    
    await browser.close()
    
  } catch (error) {
    console.error(`❌ Failed to connect to server at ${baseURL}:`, error)
    console.error('Make sure the development server is running with "npm run dev"')
    process.exit(1)
  }
  
  console.log('🎭 Playwright setup complete!')
}

export default globalSetup