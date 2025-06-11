// Server protection utilities to prevent crashes

// Safe JSON parsing with fallback
export async function safeJsonParse(response: Response): Promise<any> {
  try {
    const text = await response.text()
    if (!text || text.trim().length === 0) {
      return null
    }
    return JSON.parse(text)
  } catch (error) {
    console.error('JSON parse error:', error)
    return null
  }
}

// Request queue to prevent overwhelming the server
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private maxConcurrent = 3
  private activeRequests = 0

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.activeRequests >= this.maxConcurrent) return
    this.processing = true

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.queue.shift()
      if (request) {
        request().catch(console.error)
      }
    }

    this.processing = false
  }
}

export const requestQueue = new RequestQueue()

// Memory-safe data processor
export function processLargeDataset<T>(
  data: T[],
  processor: (item: T) => any,
  chunkSize = 100
): Promise<any[]> {
  return new Promise((resolve) => {
    const results: any[] = []
    let index = 0

    function processChunk() {
      const chunk = data.slice(index, index + chunkSize)
      chunk.forEach(item => {
        try {
          results.push(processor(item))
        } catch (error) {
          console.error('Error processing item:', error)
          results.push(null)
        }
      })

      index += chunkSize

      if (index < data.length) {
        // Process next chunk on next tick to avoid blocking
        setTimeout(processChunk, 0)
      } else {
        resolve(results)
      }
    }

    processChunk()
  })
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Timeout wrapper to prevent hanging requests
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ])
}

// Health check for server
export function isServerHealthy(): boolean {
  try {
    // Check memory usage
    const memUsage = process.memoryUsage()
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024
    
    if (heapUsedMB > 500) {
      console.warn(`High memory usage: ${heapUsedMB.toFixed(2)}MB`)
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}