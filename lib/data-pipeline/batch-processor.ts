// Batch Processor for efficient API operations
import { z } from 'zod'

// Batch request configuration
export interface BatchConfig {
  maxBatchSize: number
  maxConcurrent: number
  retryAttempts: number
  retryDelay: number
  timeout: number
}

// Default configuration
const DEFAULT_CONFIG: BatchConfig = {
  maxBatchSize: 50, // Meta API batch limit
  maxConcurrent: 5, // Concurrent batch requests
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000 // 30 seconds
}

// Batch request item
export interface BatchItem<T = any, R = any> {
  id: string
  method: string
  relativeUrl: string
  params?: Record<string, any>
  body?: any
  dependencies?: string[] // IDs of items that must complete first
  transform?: (response: any) => R
  context?: T
}

// Batch result
export interface BatchResult<R = any> {
  id: string
  success: boolean
  data?: R
  error?: {
    message: string
    code?: string | number
    type?: string
  }
  httpStatus?: number
}

// Batch processor class
export class BatchProcessor {
  private config: BatchConfig
  private queue: Map<string, BatchItem> = new Map()
  private processing: boolean = false
  private results: Map<string, BatchResult> = new Map()

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // Add single item to batch
  add<T = any, R = any>(item: BatchItem<T, R>): void {
    this.queue.set(item.id, item)
  }

  // Add multiple items to batch
  addMultiple<T = any, R = any>(items: BatchItem<T, R>[]): void {
    items.forEach(item => this.add(item))
  }

  // Process all queued items
  async process(
    executor: (batch: BatchItem[]) => Promise<any[]>
  ): Promise<Map<string, BatchResult>> {
    if (this.processing) {
      throw new Error('Batch processing already in progress')
    }

    this.processing = true
    this.results.clear()

    try {
      // Group items by dependencies
      const batches = this.organizeBatches()
      
      // Process each batch level
      for (const batch of batches) {
        await this.processBatchLevel(batch, executor)
      }

      return this.results
    } finally {
      this.processing = false
      this.queue.clear()
    }
  }

  // Organize items into dependency levels
  private organizeBatches(): BatchItem[][] {
    const levels: BatchItem[][] = []
    const processed = new Set<string>()
    const remaining = new Map(this.queue)

    while (remaining.size > 0) {
      const currentLevel: BatchItem[] = []

      for (const [id, item] of remaining) {
        // Check if all dependencies are processed
        const canProcess = !item.dependencies || 
          item.dependencies.every(dep => processed.has(dep))

        if (canProcess) {
          currentLevel.push(item)
        }
      }

      if (currentLevel.length === 0 && remaining.size > 0) {
        throw new Error('Circular dependencies detected in batch items')
      }

      // Remove processed items
      currentLevel.forEach(item => {
        processed.add(item.id)
        remaining.delete(item.id)
      })

      if (currentLevel.length > 0) {
        levels.push(currentLevel)
      }
    }

    return levels
  }

  // Process a single batch level
  private async processBatchLevel(
    items: BatchItem[],
    executor: (batch: BatchItem[]) => Promise<any[]>
  ): Promise<void> {
    // Split into chunks based on max batch size
    const chunks = this.chunkArray(items, this.config.maxBatchSize)
    
    // Process chunks with concurrency limit
    const chunkPromises: Promise<void>[] = []
    const semaphore = new Semaphore(this.config.maxConcurrent)

    for (const chunk of chunks) {
      const promise = semaphore.acquire().then(async (release) => {
        try {
          await this.processChunk(chunk, executor)
        } finally {
          release()
        }
      })
      chunkPromises.push(promise)
    }

    await Promise.all(chunkPromises)
  }

  // Process a single chunk
  private async processChunk(
    chunk: BatchItem[],
    executor: (batch: BatchItem[]) => Promise<any[]>
  ): Promise<void> {
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.config.retryAttempts) {
      try {
        const responses = await this.executeWithTimeout(
          () => executor(chunk),
          this.config.timeout
        )

        // Process responses
        chunk.forEach((item, index) => {
          const response = responses[index]
          const result = this.processResponse(item, response)
          this.results.set(item.id, result)
        })

        return
      } catch (error) {
        lastError = error as Error
        attempts++
        
        if (attempts < this.config.retryAttempts) {
          await this.sleep(this.config.retryDelay * attempts)
        }
      }
    }

    // If all retries failed, mark all items as failed
    chunk.forEach(item => {
      this.results.set(item.id, {
        id: item.id,
        success: false,
        error: {
          message: lastError?.message || 'Batch processing failed',
          type: 'BATCH_ERROR'
        }
      })
    })
  }

  // Process individual response
  private processResponse(item: BatchItem, response: any): BatchResult {
    try {
      // Check for API errors
      if (response.error) {
        return {
          id: item.id,
          success: false,
          error: {
            message: response.error.message || 'Unknown error',
            code: response.error.code,
            type: response.error.type
          },
          httpStatus: response.code || response.status
        }
      }

      // Transform response if transformer provided
      const data = item.transform ? item.transform(response) : response

      return {
        id: item.id,
        success: true,
        data,
        httpStatus: 200
      }
    } catch (error) {
      return {
        id: item.id,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Transform error',
          type: 'TRANSFORM_ERROR'
        }
      }
    }
  }

  // Execute with timeout
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    })

    return Promise.race([fn(), timeoutPromise])
  }

  // Chunk array into smaller arrays
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get current queue size
  getQueueSize(): number {
    return this.queue.size
  }

  // Clear queue
  clearQueue(): void {
    this.queue.clear()
  }

  // Get results
  getResults(): Map<string, BatchResult> {
    return new Map(this.results)
  }
}

// Semaphore for concurrency control
class Semaphore {
  private permits: number
  private queue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<() => void> {
    if (this.permits > 0) {
      this.permits--
      return () => this.release()
    }

    return new Promise<() => void>(resolve => {
      this.queue.push(() => {
        this.permits--
        resolve(() => this.release())
      })
    })
  }

  private release(): void {
    this.permits++
    if (this.queue.length > 0 && this.permits > 0) {
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

// Batch builder for common operations
export class BatchBuilder {
  private items: BatchItem[] = []

  // Add campaign insights request
  addCampaignInsights(
    campaignId: string,
    params: {
      fields?: string[]
      datePreset?: string
      timeRange?: { since: string; until: string }
      timeIncrement?: string
    } = {}
  ): BatchBuilder {
    const defaultFields = [
      'spend',
      'impressions',
      'clicks',
      'ctr',
      'cpc',
      'actions',
      'action_values',
      'conversions',
      'cost_per_conversion'
    ]

    this.items.push({
      id: `campaign_insights_${campaignId}`,
      method: 'GET',
      relativeUrl: `${campaignId}/insights`,
      params: {
        fields: (params.fields || defaultFields).join(','),
        date_preset: params.datePreset,
        time_range: params.timeRange ? JSON.stringify(params.timeRange) : undefined,
        time_increment: params.timeIncrement
      }
    })

    return this
  }

  // Add ad set insights request
  addAdSetInsights(
    adSetId: string,
    params: Record<string, any> = {}
  ): BatchBuilder {
    this.items.push({
      id: `adset_insights_${adSetId}`,
      method: 'GET',
      relativeUrl: `${adSetId}/insights`,
      params
    })

    return this
  }

  // Add multiple campaign requests
  addCampaigns(
    campaignIds: string[],
    fields: string[] = ['id', 'name', 'status', 'objective']
  ): BatchBuilder {
    campaignIds.forEach(id => {
      this.items.push({
        id: `campaign_${id}`,
        method: 'GET',
        relativeUrl: id,
        params: { fields: fields.join(',') }
      })
    })

    return this
  }

  // Build batch items
  build(): BatchItem[] {
    return [...this.items]
  }

  // Clear builder
  clear(): void {
    this.items = []
  }
}

// Batch executor for Meta API
export class MetaBatchExecutor {
  constructor(
    private accessToken: string,
    private apiVersion: string = 'v19.0'
  ) {}

  // Execute batch request
  async execute(items: BatchItem[]): Promise<any[]> {
    const batch = items.map(item => ({
      method: item.method,
      relative_url: item.relativeUrl,
      body: item.body,
      ...item.params
    }))

    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          batch: JSON.stringify(batch)
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.statusText}`)
    }

    const results = await response.json()
    
    // Parse individual responses
    return results.map((result: any) => {
      if (result.body) {
        try {
          return JSON.parse(result.body)
        } catch {
          return result.body
        }
      }
      return result
    })
  }
}