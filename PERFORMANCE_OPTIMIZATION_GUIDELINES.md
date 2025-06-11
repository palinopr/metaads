# Performance Optimization Guidelines

## Performance Targets

### Primary Metrics
- **Initial Page Load**: < 2 seconds
- **API Response Time**: < 500ms
- **Memory Usage**: < 100MB steady state
- **Bundle Size**: < 1.5MB gzipped
- **Time to Interactive**: < 3 seconds

### Secondary Metrics
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to First Byte (TTFB)**: < 600ms

---

## Frontend Performance Optimization

### 1. Bundle Size Optimization

#### Code Splitting Strategy
```javascript
// Implement dynamic imports for heavy components
import dynamic from 'next/dynamic'

// Lazy load heavy dashboard components
const CampaignPredictiveMini = dynamic(() => 
  import('../components/campaign-predictive-mini'), 
  { 
    loading: () => <div>Loading predictions...</div>,
    ssr: false 
  }
)

const DemographicAnalytics = dynamic(() => 
  import('../components/demographic-analytics'),
  { 
    loading: () => <div>Loading demographics...</div>,
    ssr: false 
  }
)
```

#### Bundle Analysis Setup
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build

# Check for duplicate dependencies
npm run build -- --analyze
```

#### Tree Shaking Optimization
```javascript
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  webpack: (config) => {
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
    return config
  }
}
```

### 2. Image and Asset Optimization

#### Next.js Image Optimization
```javascript
// Use Next.js Image component
import Image from 'next/image'

// Optimize images with proper sizing
<Image
  src="/placeholder.jpg"
  alt="Campaign thumbnail"
  width={300}
  height={200}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### Static Asset Optimization
```bash
# Optimize images before deployment
npm install --save-dev imagemin imagemin-mozjpeg imagemin-pngquant

# Create optimization script
node scripts/optimize-images.js
```

### 3. CSS and Styling Optimization

#### CSS-in-JS Optimization
```javascript
// Use Tailwind CSS for smaller bundle size
// Purge unused styles in production
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### Critical CSS Extraction
```javascript
// next.config.mjs
export default {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

---

## API Performance Optimization

### 1. Intelligent Caching Strategy

#### Multi-Level Caching
```javascript
// lib/cache-manager.ts
export class CacheManager {
  private memoryCache = new Map()
  private localStorageCache = new Map()
  
  private cacheTTL = {
    campaigns: 5 * 60 * 1000,      // 5 minutes
    insights: 10 * 60 * 1000,     // 10 minutes
    demographics: 30 * 60 * 1000, // 30 minutes
    account: 60 * 60 * 1000       // 1 hour
  }
  
  async get(key: string, fetchFn: () => Promise<any>, type: string = 'campaigns') {
    // 1. Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key)
      if (Date.now() - cached.timestamp < this.cacheTTL[type]) {
        return cached.data
      }
    }
    
    // 2. Check localStorage (fast)
    const localCached = localStorage.getItem(key)
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached)
        if (Date.now() - parsed.timestamp < this.cacheTTL[type]) {
          // Update memory cache
          this.memoryCache.set(key, parsed)
          return parsed.data
        }
      } catch (e) {
        localStorage.removeItem(key)
      }
    }
    
    // 3. Fetch fresh data (slow)
    const data = await fetchFn()
    const cacheEntry = { data, timestamp: Date.now() }
    
    // Store in both caches
    this.memoryCache.set(key, cacheEntry)
    localStorage.setItem(key, JSON.stringify(cacheEntry))
    
    return data
  }
  
  invalidate(pattern: string) {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }
    
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key)
      }
    })
  }
}
```

#### Cache-First API Strategy
```javascript
// lib/api-manager.ts
export class APIManager {
  private cache = new CacheManager()
  
  async getCampaigns(datePreset: string = 'last_7d', forceRefresh: boolean = false) {
    const cacheKey = `campaigns_${datePreset}`
    
    if (forceRefresh) {
      this.cache.invalidate(cacheKey)
    }
    
    return this.cache.get(cacheKey, async () => {
      const response = await fetch('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'overview', datePreset })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      return response.json()
    }, 'campaigns')
  }
}
```

### 2. Request Optimization

#### Request Batching
```javascript
// lib/request-batcher.ts
export class RequestBatcher {
  private batchQueue: Array<{
    request: Promise<any>,
    resolve: Function,
    reject: Function
  }> = []
  
  private batchTimeout: NodeJS.Timeout | null = null
  
  async batchRequest(requestFn: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        request: requestFn(),
        resolve,
        reject
      })
      
      // Debounce batch execution
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }
      
      this.batchTimeout = setTimeout(() => {
        this.executeBatch()
      }, 100) // Wait 100ms to collect more requests
    })
  }
  
  private async executeBatch() {
    const batch = [...this.batchQueue]
    this.batchQueue = []
    this.batchTimeout = null
    
    // Execute all requests in parallel
    const results = await Promise.allSettled(
      batch.map(item => item.request)
    )
    
    // Resolve/reject individual promises
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batch[index].resolve(result.value)
      } else {
        batch[index].reject(result.reason)
      }
    })
  }
}
```

#### Request Deduplication
```javascript
// lib/request-deduplicator.ts
export class RequestDeduplicator {
  private inFlightRequests = new Map<string, Promise<any>>()
  
  async dedupe(key: string, requestFn: () => Promise<any>) {
    // Return existing promise if same request is in flight
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)
    }
    
    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after completion
      this.inFlightRequests.delete(key)
    })
    
    this.inFlightRequests.set(key, request)
    return request
  }
}
```

### 3. Rate Limiting & Request Queuing

#### Intelligent Rate Limiter
```javascript
// lib/rate-limiter.ts
export class RateLimiter {
  private requestQueue: Array<{
    request: () => Promise<any>,
    resolve: Function,
    reject: Function,
    priority: number
  }> = []
  
  private lastRequestTime = 0
  private requestCount = 0
  private windowStart = Date.now()
  
  private readonly maxRequestsPerMinute = 30
  private readonly minInterval = 2000 // 2 seconds between requests
  
  async throttle(requestFn: () => Promise<any>, priority: number = 1) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request: requestFn, resolve, reject, priority })
      this.requestQueue.sort((a, b) => b.priority - a.priority) // Higher priority first
      
      this.processQueue()
    })
  }
  
  private async processQueue() {
    if (this.requestQueue.length === 0) return
    
    const now = Date.now()
    
    // Reset window if needed
    if (now - this.windowStart > 60000) {
      this.windowStart = now
      this.requestCount = 0
    }
    
    // Check rate limits
    if (this.requestCount >= this.maxRequestsPerMinute) {
      // Wait until next window
      setTimeout(() => this.processQueue(), 61000 - (now - this.windowStart))
      return
    }
    
    // Check minimum interval
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minInterval) {
      setTimeout(() => this.processQueue(), this.minInterval - timeSinceLastRequest)
      return
    }
    
    // Process next request
    const { request, resolve, reject } = this.requestQueue.shift()!
    
    this.lastRequestTime = now
    this.requestCount++
    
    try {
      const result = await request()
      resolve(result)
    } catch (error) {
      reject(error)
    }
    
    // Continue processing queue
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processQueue(), this.minInterval)
    }
  }
  
  getStatus() {
    const now = Date.now()
    const windowRemaining = 60000 - (now - this.windowStart)
    const requestsRemaining = this.maxRequestsPerMinute - this.requestCount
    
    return {
      requestsRemaining,
      windowRemaining,
      queueLength: this.requestQueue.length
    }
  }
}
```

---

## Memory Management

### 1. Memory Leak Prevention

#### Component Cleanup
```javascript
// hooks/use-cleanup.ts
import { useEffect, useRef } from 'react'

export function useCleanup() {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const intervalsRef = useRef<NodeJS.Timeout[]>([])
  const listenersRef = useRef<Array<() => void>>([])
  
  const addTimeout = (timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout)
  }
  
  const addInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.push(interval)
  }
  
  const addListener = (cleanup: () => void) => {
    listenersRef.current.push(cleanup)
  }
  
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(clearTimeout)
      
      // Clear all intervals
      intervalsRef.current.forEach(clearInterval)
      
      // Run all cleanup functions
      listenersRef.current.forEach(cleanup => cleanup())
    }
  }, [])
  
  return { addTimeout, addInterval, addListener }
}
```

#### Large Dataset Handling
```javascript
// lib/data-pagination.ts
export class DataPaginator {
  private pageSize = 50
  private currentPage = 0
  
  paginate<T>(data: T[]): T[] {
    const startIndex = this.currentPage * this.pageSize
    const endIndex = startIndex + this.pageSize
    return data.slice(startIndex, endIndex)
  }
  
  nextPage<T>(data: T[]): T[] {
    this.currentPage++
    return this.paginate(data)
  }
  
  previousPage<T>(data: T[]): T[] {
    this.currentPage = Math.max(0, this.currentPage - 1)
    return this.paginate(data)
  }
  
  reset() {
    this.currentPage = 0
  }
}

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const CampaignList = ({ campaigns }: { campaigns: Campaign[] }) => {
  const Row = ({ index, style }: { index: number, style: any }) => (
    <div style={style}>
      <CampaignRow campaign={campaigns[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={campaigns.length}
      itemSize={80}
      overscanCount={5}
    >
      {Row}
    </List>
  )
}
```

### 2. Garbage Collection Optimization

#### Memory Monitoring
```javascript
// lib/memory-monitor.ts
export class MemoryMonitor {
  private memoryWarningThreshold = 50 * 1024 * 1024 // 50MB
  private memoryErrorThreshold = 100 * 1024 * 1024 // 100MB
  
  startMonitoring() {
    setInterval(() => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize
        const limit = performance.memory.jsHeapSizeLimit
        
        console.log(`Memory usage: ${(used / 1024 / 1024).toFixed(2)}MB`)
        
        if (used > this.memoryErrorThreshold) {
          console.error('Critical memory usage detected')
          this.triggerGarbageCollection()
        } else if (used > this.memoryWarningThreshold) {
          console.warn('High memory usage detected')
        }
      }
    }, 30000) // Check every 30 seconds
  }
  
  private triggerGarbageCollection() {
    // Force garbage collection by clearing large objects
    window.dispatchEvent(new CustomEvent('memory-pressure'))
    
    // Clear caches
    if (window.caches) {
      window.caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old') || name.includes('temp')) {
            window.caches.delete(name)
          }
        })
      })
    }
  }
}
```

---

## Database and Storage Optimization

### 1. Local Storage Management

#### Efficient Storage Strategy
```javascript
// lib/storage-manager.ts
export class StorageManager {
  private maxStorageSize = 5 * 1024 * 1024 // 5MB
  
  setItem(key: string, value: any, ttl?: number) {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000 // 24 hours default
    }
    
    try {
      const serialized = JSON.stringify(item)
      
      // Check if storage would exceed limit
      if (this.getStorageSize() + serialized.length > this.maxStorageSize) {
        this.cleanup()
      }
      
      localStorage.setItem(key, serialized)
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.cleanup()
        // Retry after cleanup
        localStorage.setItem(key, JSON.stringify(item))
      }
    }
  }
  
  getItem(key: string) {
    try {
      const item = JSON.parse(localStorage.getItem(key) || 'null')
      
      if (!item) return null
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(key)
        return null
      }
      
      return item.value
    } catch (error) {
      localStorage.removeItem(key)
      return null
    }
  }
  
  private cleanup() {
    const keys = Object.keys(localStorage)
    const items = keys.map(key => ({
      key,
      item: this.parseStorageItem(key),
      size: localStorage.getItem(key)?.length || 0
    })).filter(item => item.item)
    
    // Sort by age (oldest first)
    items.sort((a, b) => (a.item?.timestamp || 0) - (b.item?.timestamp || 0))
    
    // Remove oldest items until under threshold
    let currentSize = this.getStorageSize()
    for (const item of items) {
      if (currentSize < this.maxStorageSize * 0.8) break // Keep 20% buffer
      
      localStorage.removeItem(item.key)
      currentSize -= item.size
    }
  }
  
  private getStorageSize(): number {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key)?.length || 0
      }
    }
    return total
  }
  
  private parseStorageItem(key: string) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null')
    } catch {
      return null
    }
  }
}
```

### 2. IndexedDB for Large Data

#### Structured Data Storage
```javascript
// lib/indexed-db-manager.ts
export class IndexedDBManager {
  private dbName = 'MetaAdsCache'
  private version = 1
  private db: IDBDatabase | null = null
  
  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignStore = db.createObjectStore('campaigns', { keyPath: 'id' })
          campaignStore.createIndex('date', 'date', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('insights')) {
          const insightStore = db.createObjectStore('insights', { keyPath: 'id' })
          insightStore.createIndex('campaignId', 'campaignId', { unique: false })
        }
      }
    })
  }
  
  async storeCampaigns(campaigns: any[], datePreset: string) {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['campaigns'], 'readwrite')
    const store = transaction.objectStore('campaigns')
    
    const cacheEntry = {
      id: `campaigns_${datePreset}`,
      data: campaigns,
      timestamp: Date.now(),
      datePreset
    }
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put(cacheEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getCampaigns(datePreset: string, maxAge: number = 300000) {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['campaigns'], 'readonly')
    const store = transaction.objectStore('campaigns')
    
    return new Promise<any[] | null>((resolve, reject) => {
      const request = store.get(`campaigns_${datePreset}`)
      
      request.onsuccess = () => {
        const result = request.result
        
        if (!result || Date.now() - result.timestamp > maxAge) {
          resolve(null)
        } else {
          resolve(result.data)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}
```

---

## Monitoring and Metrics

### 1. Performance Monitoring

#### Real-Time Performance Metrics
```javascript
// lib/performance-monitor.ts
export class PerformanceMonitor {
  private metrics = {
    pageLoad: [],
    apiCalls: [],
    userInteractions: []
  }
  
  startMonitoring() {
    // Monitor page load times
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      this.metrics.pageLoad.push({
        timestamp: Date.now(),
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      })
    })
    
    // Monitor API calls
    this.interceptFetch()
    
    // Monitor user interactions
    this.monitorInteractions()
  }
  
  private interceptFetch() {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        this.metrics.apiCalls.push({
          timestamp: Date.now(),
          url: args[0] as string,
          duration: endTime - startTime,
          status: response.status,
          success: response.ok
        })
        
        return response
      } catch (error) {
        const endTime = performance.now()
        
        this.metrics.apiCalls.push({
          timestamp: Date.now(),
          url: args[0] as string,
          duration: endTime - startTime,
          status: 0,
          success: false,
          error: error.message
        })
        
        throw error
      }
    }
  }
  
  private monitorInteractions() {
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.metrics.userInteractions.push({
          timestamp: Date.now(),
          type: eventType,
          target: (event.target as Element)?.tagName || 'unknown'
        })
      }, { passive: true })
    })
  }
  
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime || 0
  }
  
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp?.startTime || 0
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        avgPageLoad: this.average(this.metrics.pageLoad.map(m => m.loadTime)),
        avgApiResponse: this.average(this.metrics.apiCalls.map(m => m.duration)),
        apiSuccessRate: this.successRate(this.metrics.apiCalls),
        interactionsPerMinute: this.interactionsPerMinute()
      }
    }
  }
  
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
  }
  
  private successRate(apiCalls: any[]): number {
    if (apiCalls.length === 0) return 100
    const successful = apiCalls.filter(call => call.success).length
    return (successful / apiCalls.length) * 100
  }
  
  private interactionsPerMinute(): number {
    const recentInteractions = this.metrics.userInteractions.filter(
      interaction => Date.now() - interaction.timestamp < 60000
    )
    return recentInteractions.length
  }
}
```

### 2. Automated Performance Testing

#### Performance Test Suite
```javascript
// scripts/performance-tests.js
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse')

class PerformanceTestSuite {
  async runFullSuite() {
    const browser = await puppeteer.launch()
    const results = {}
    
    try {
      // Page load performance
      results.pageLoad = await this.testPageLoad(browser)
      
      // API performance
      results.apiPerformance = await this.testApiPerformance(browser)
      
      // Memory usage
      results.memoryUsage = await this.testMemoryUsage(browser)
      
      // User interaction performance
      results.interactions = await this.testInteractions(browser)
      
      // Lighthouse audit
      results.lighthouse = await this.runLighthouseAudit()
      
    } finally {
      await browser.close()
    }
    
    return results
  }
  
  async testPageLoad(browser) {
    const page = await browser.newPage()
    
    const startTime = Date.now()
    await page.goto('http://localhost:3000')
    
    // Wait for dashboard to be interactive
    await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 30000 })
    const endTime = Date.now()
    
    const metrics = await page.metrics()
    
    return {
      loadTime: endTime - startTime,
      jsHeapUsedSize: metrics.JSHeapUsedSize,
      jsHeapTotalSize: metrics.JSHeapTotalSize,
      domNodes: metrics.Nodes
    }
  }
  
  async testApiPerformance(browser) {
    const page = await browser.newPage()
    
    // Monitor network requests
    const apiCalls = []
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        })
      }
    })
    
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(10000) // Wait for API calls to complete
    
    return {
      totalCalls: apiCalls.length,
      avgResponseTime: apiCalls.reduce((sum, call) => 
        sum + (call.timing.receiveHeadersEnd - call.timing.sendStart), 0
      ) / apiCalls.length,
      successRate: (apiCalls.filter(call => call.status < 400).length / apiCalls.length) * 100
    }
  }
  
  async testMemoryUsage(browser) {
    const page = await browser.newPage()
    
    await page.goto('http://localhost:3000')
    
    // Initial memory
    const initialMetrics = await page.metrics()
    
    // Simulate user actions that might cause memory leaks
    for (let i = 0; i < 10; i++) {
      await page.reload()
      await page.waitForSelector('[data-testid="dashboard-loaded"]')
      await page.waitForTimeout(1000)
    }
    
    // Final memory
    const finalMetrics = await page.metrics()
    
    return {
      initialMemory: initialMetrics.JSHeapUsedSize,
      finalMemory: finalMetrics.JSHeapUsedSize,
      memoryIncrease: finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize,
      memoryLeakDetected: (finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize) > 10 * 1024 * 1024 // 10MB threshold
    }
  }
  
  async runLighthouseAudit() {
    const { lhr } = await lighthouse('http://localhost:3000', {
      onlyCategories: ['performance'],
      port: 9222
    })
    
    return {
      performanceScore: lhr.categories.performance.score * 100,
      firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
      firstInputDelay: lhr.audits['max-potential-fid'].numericValue,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue
    }
  }
}

// Run tests
const testSuite = new PerformanceTestSuite()
testSuite.runFullSuite().then(results => {
  console.log('Performance Test Results:', JSON.stringify(results, null, 2))
  
  // Check if performance targets are met
  const checks = [
    { name: 'Page Load Time', value: results.pageLoad.loadTime, target: 2000, unit: 'ms' },
    { name: 'API Response Time', value: results.apiPerformance.avgResponseTime, target: 500, unit: 'ms' },
    { name: 'Memory Usage', value: results.pageLoad.jsHeapUsedSize, target: 100 * 1024 * 1024, unit: 'bytes' },
    { name: 'Performance Score', value: results.lighthouse.performanceScore, target: 90, unit: 'score' }
  ]
  
  checks.forEach(check => {
    const passed = check.value <= check.target
    console.log(`${check.name}: ${check.value}${check.unit} (${passed ? 'PASS' : 'FAIL'})`)
  })
}).catch(console.error)
```

---

## Best Practices Summary

### 1. Development Guidelines

#### Code Quality
- Use TypeScript for better optimization
- Implement proper error boundaries
- Use React.memo for expensive components
- Implement proper cleanup in useEffect

#### Build Optimization
- Enable Next.js SWC compiler
- Use dynamic imports for code splitting
- Optimize images with Next.js Image component
- Minimize bundle size with tree shaking

### 2. Runtime Performance

#### Memory Management
- Implement proper cleanup in components
- Use virtual scrolling for large lists
- Monitor memory usage in development
- Clear caches when memory pressure detected

#### API Optimization
- Implement intelligent caching
- Use request deduplication
- Batch similar requests
- Implement proper rate limiting

### 3. Monitoring and Maintenance

#### Continuous Monitoring
- Track Core Web Vitals
- Monitor API response times
- Track memory usage trends
- Set up performance alerts

#### Regular Optimization
- Run performance audits monthly
- Update dependencies regularly
- Review and optimize cache strategies
- Conduct load testing before major releases

Remember: **Performance optimization is an ongoing process** - monitor metrics and optimize iteratively!