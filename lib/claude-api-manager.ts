// Claude API Manager with aggressive rate limiting and caching
import { Anthropic } from '@anthropic-ai/sdk'

interface ClaudeCache {
  [key: string]: {
    result: any
    timestamp: number
    ttl: number
  }
}

interface QueueItem {
  prompt: string
  resolve: (value: any) => void
  reject: (reason?: any) => void
  priority: number
}

export class ClaudeAPIManager {
  private static instance: ClaudeAPIManager
  private anthropic: Anthropic | null = null
  private cache: ClaudeCache = {}
  private queue: QueueItem[] = []
  private processing = false
  private lastRequestTime = 0
  private requestCount = 0
  private resetTime = Date.now() + 60000

  // Reasonable rate limiting for CLI usage
  private readonly MAX_REQUESTS_PER_MINUTE = 60 // Much more reasonable
  private readonly MIN_REQUEST_INTERVAL = 1000 // 1 second between requests
  private readonly CACHE_TTL = 3600000 // 1 hour cache

  private constructor() {
    // Initialize only if API key exists
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true
      })
    }

    // Cleanup cache every 10 minutes
    setInterval(() => this.cleanupCache(), 600000)
  }

  static getInstance(): ClaudeAPIManager {
    if (!ClaudeAPIManager.instance) {
      ClaudeAPIManager.instance = new ClaudeAPIManager()
    }
    return ClaudeAPIManager.instance
  }

  private cleanupCache() {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      if (now > this.cache[key].timestamp + this.cache[key].ttl) {
        delete this.cache[key]
      }
    })
  }

  private getCacheKey(prompt: string): string {
    return prompt.substring(0, 100) // Use first 100 chars as key
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true

    while (this.queue.length > 0) {
      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority)
      
      const item = this.queue.shift()
      if (!item) continue

      try {
        // Check rate limits
        const now = Date.now()
        
        // Reset counter if window passed
        if (now > this.resetTime) {
          this.requestCount = 0
          this.resetTime = now + 60000
        }

        // Check if we've hit the limit
        if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
          const waitTime = this.resetTime - now
          console.log(`Claude rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }

        // Ensure minimum interval between requests
        const timeSinceLastRequest = now - this.lastRequestTime
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest
          console.log(`Waiting ${Math.ceil(waitTime / 1000)}s before next Claude request`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }

        // Make the request
        const result = await this.makeRequest(item.prompt)
        this.requestCount++
        this.lastRequestTime = Date.now()

        // Cache the result
        const cacheKey = this.getCacheKey(item.prompt)
        this.cache[cacheKey] = {
          result,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        }

        item.resolve(result)
      } catch (error) {
        console.error('Claude API error:', error)
        item.reject(error)
      }
    }

    this.processing = false
  }

  private async makeRequest(prompt: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Claude API not initialized. Please check your API key.')
    }

    console.log('Making Claude API request...')
    
    const message = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    return message.content[0].type === 'text' ? message.content[0].text : ''
  }

  async analyze(prompt: string, options?: { 
    priority?: number,
    useCache?: boolean,
    ttl?: number 
  }): Promise<string> {
    const priority = options?.priority || 0
    const useCache = options?.useCache !== false
    const ttl = options?.ttl || this.CACHE_TTL

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt)
      const cached = this.cache[cacheKey]
      
      if (cached && Date.now() < cached.timestamp + cached.ttl) {
        console.log('Claude cache hit')
        return cached.result
      }
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject, priority })
      this.processQueue()
    })
  }

  // Batch analyze - combines multiple prompts into one
  async batchAnalyze(prompts: string[]): Promise<string> {
    const combinedPrompt = `Please analyze the following ${prompts.length} items:\n\n${
      prompts.map((p, i) => `Item ${i + 1}:\n${p}`).join('\n\n')
    }\n\nProvide a comprehensive analysis for all items.`

    return this.analyze(combinedPrompt, { priority: 1 })
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      requestsThisMinute: this.requestCount,
      maxRequestsPerMinute: this.MAX_REQUESTS_PER_MINUTE,
      resetIn: Math.max(0, Math.ceil((this.resetTime - Date.now()) / 1000))
    }
  }

  clearCache() {
    this.cache = {}
  }

  isAvailable(): boolean {
    return this.anthropic !== null
  }
}

// Singleton instance
export const claudeAPI = ClaudeAPIManager.getInstance()