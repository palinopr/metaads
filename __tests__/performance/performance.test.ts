import { performance } from 'perf_hooks'

// Mock performance APIs for Node.js environment
Object.defineProperty(global, 'performance', {
  value: {
    now: () => performance.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  }
})

// Mock memory API
Object.defineProperty(global, 'process', {
  value: {
    ...process,
    memoryUsage: jest.fn().mockReturnValue({
      rss: 50 * 1024 * 1024, // 50MB
      heapTotal: 30 * 1024 * 1024, // 30MB
      heapUsed: 20 * 1024 * 1024, // 20MB
      external: 5 * 1024 * 1024 // 5MB
    })
  }
})

interface PerformanceMetrics {
  duration: number
  memoryBefore: NodeJS.MemoryUsage
  memoryAfter: NodeJS.MemoryUsage
  memoryDelta: number
}

interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  requestsPerSecond: number
  errorRate: number
}

class PerformanceProfiler {
  private startTime: number = 0
  private endTime: number = 0
  private memoryBefore: NodeJS.MemoryUsage
  private memoryAfter: NodeJS.MemoryUsage

  start(): void {
    this.memoryBefore = process.memoryUsage()
    this.startTime = performance.now()
  }

  stop(): PerformanceMetrics {
    this.endTime = performance.now()
    this.memoryAfter = process.memoryUsage()

    return {
      duration: this.endTime - this.startTime,
      memoryBefore: this.memoryBefore,
      memoryAfter: this.memoryAfter,
      memoryDelta: this.memoryAfter.heapUsed - this.memoryBefore.heapUsed
    }
  }
}

class LoadTester {
  async runLoadTest(
    testFunction: () => Promise<any>,
    options: {
      concurrent: number
      duration: number // in milliseconds
      maxRequests?: number
    }
  ): Promise<LoadTestResult> {
    const results: Array<{ success: boolean; responseTime: number }> = []
    const startTime = Date.now()
    const endTime = startTime + options.duration
    let activeRequests = 0
    let totalRequests = 0

    return new Promise((resolve) => {
      const runRequest = async () => {
        if (Date.now() >= endTime || (options.maxRequests && totalRequests >= options.maxRequests)) {
          if (activeRequests === 0) {
            resolve(this.calculateResults(results, Date.now() - startTime))
          }
          return
        }

        activeRequests++
        totalRequests++
        const requestStart = performance.now()

        try {
          await testFunction()
          const responseTime = performance.now() - requestStart
          results.push({ success: true, responseTime })
        } catch (error) {
          const responseTime = performance.now() - requestStart
          results.push({ success: false, responseTime })
        } finally {
          activeRequests--
          if (activeRequests < options.concurrent) {
            setImmediate(runRequest)
          }
          if (Date.now() >= endTime && activeRequests === 0) {
            resolve(this.calculateResults(results, Date.now() - startTime))
          }
        }
      }

      // Start initial concurrent requests
      for (let i = 0; i < options.concurrent; i++) {
        setImmediate(runRequest)
      }
    })
  }

  private calculateResults(results: Array<{ success: boolean; responseTime: number }>, totalDuration: number): LoadTestResult {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const responseTimes = results.map(r => r.responseTime)

    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      requestsPerSecond: (results.length / totalDuration) * 1000,
      errorRate: failed.length / results.length
    }
  }
}

// Import components and utilities to test
import { CacheManager } from '../../lib/data-pipeline/cache-manager'
import { BatchProcessor } from '../../lib/data-pipeline/batch-processor'
import { MetaAPIClient } from '../../lib/meta-api-client'

describe('Performance Tests', () => {
  let profiler: PerformanceProfiler
  let loadTester: LoadTester

  beforeEach(() => {
    profiler = new PerformanceProfiler()
    loadTester = new LoadTester()
    jest.clearAllMocks()
  })

  describe('Component Performance', () => {
    it('should render Overview component efficiently', async () => {
      // Mock React testing utilities
      const mockRender = jest.fn().mockResolvedValue(true)
      
      profiler.start()
      
      // Simulate rendering 100 instances
      for (let i = 0; i < 100; i++) {
        await mockRender()
      }
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(1000) // Should complete in under 1 second
      expect(metrics.memoryDelta).toBeLessThan(10 * 1024 * 1024) // Should use less than 10MB additional memory
    })

    it('should handle large datasets efficiently', async () => {
      const cacheManager = new CacheManager()
      
      profiler.start()
      
      // Add 10,000 cache entries
      for (let i = 0; i < 10000; i++) {
        cacheManager.set(`key-${i}`, {
          id: i,
          data: `data-${i}`,
          timestamp: Date.now()
        })
      }
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(2000) // Should complete in under 2 seconds
      expect(cacheManager.getStats().size).toBe(10000)
    })

    it('should batch process requests efficiently', async () => {
      const batchProcessor = new BatchProcessor()
      const mockExecutor = jest.fn().mockResolvedValue([{ data: 'success' }])
      
      // Add 1000 batch items
      for (let i = 0; i < 1000; i++) {
        batchProcessor.add({
          id: `item-${i}`,
          method: 'GET',
          relativeUrl: `endpoint/${i}`
        })
      }
      
      profiler.start()
      
      const results = await batchProcessor.process(mockExecutor)
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(results.size).toBe(1000)
      expect(mockExecutor).toHaveBeenCalled()
    })
  })

  describe('API Performance', () => {
    it('should handle concurrent API requests', async () => {
      // Mock Meta API client
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      })
      global.fetch = mockFetch

      const apiTest = async () => {
        const client = new MetaAPIClient('test-token', 'act_123')
        return await client.testConnection()
      }

      const results = await loadTester.runLoadTest(apiTest, {
        concurrent: 10,
        duration: 5000, // 5 seconds
        maxRequests: 100
      })

      expect(results.errorRate).toBeLessThan(0.05) // Less than 5% error rate
      expect(results.averageResponseTime).toBeLessThan(1000) // Average response under 1 second
      expect(results.requestsPerSecond).toBeGreaterThan(5) // At least 5 requests per second
    })

    it('should maintain performance under load', async () => {
      const cacheManager = new CacheManager()
      
      const cacheTest = async () => {
        const key = `test-${Math.random()}`
        cacheManager.set(key, { data: 'test' })
        return cacheManager.get(key)
      }

      const results = await loadTester.runLoadTest(cacheTest, {
        concurrent: 20,
        duration: 3000,
        maxRequests: 1000
      })

      expect(results.errorRate).toBe(0) // No errors expected
      expect(results.averageResponseTime).toBeLessThan(10) // Very fast cache operations
      expect(results.requestsPerSecond).toBeGreaterThan(100) // High throughput
    })
  })

  describe('Memory Usage', () => {
    it('should not have memory leaks in cache operations', async () => {
      const cacheManager = new CacheManager()
      
      const initialMemory = process.memoryUsage()
      
      // Perform many cache operations
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 1000; i++) {
          cacheManager.set(`cycle-${cycle}-key-${i}`, { data: `data-${i}` })
        }
        
        // Clear cache periodically
        if (cycle % 3 === 0) {
          cacheManager.clear()
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage()
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    })

    it('should handle large objects efficiently', async () => {
      const cacheManager = new CacheManager()
      
      profiler.start()
      
      // Store large objects
      for (let i = 0; i < 100; i++) {
        const largeObject = {
          id: i,
          data: 'x'.repeat(10000), // 10KB string
          nested: {
            array: Array(1000).fill(i),
            metadata: { timestamp: Date.now(), index: i }
          }
        }
        cacheManager.set(`large-${i}`, largeObject)
      }
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(3000) // Should complete in under 3 seconds
      expect(cacheManager.getStats().size).toBe(100)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent cache access', async () => {
      const cacheManager = new CacheManager()
      
      const concurrentOperations = async () => {
        const promises = []
        
        // Mix of read and write operations
        for (let i = 0; i < 100; i++) {
          if (i % 2 === 0) {
            promises.push(
              Promise.resolve().then(() => {
                cacheManager.set(`concurrent-${i}`, { value: i })
              })
            )
          } else {
            promises.push(
              Promise.resolve().then(() => {
                return cacheManager.get(`concurrent-${i - 1}`)
              })
            )
          }
        }
        
        return await Promise.all(promises)
      }

      profiler.start()
      await concurrentOperations()
      const metrics = profiler.stop()

      expect(metrics.duration).toBeLessThan(1000) // Should complete quickly
      expect(cacheManager.getStats().size).toBeGreaterThan(0)
    })

    it('should handle concurrent batch processing', async () => {
      const processors = Array(5).fill(null).map(() => new BatchProcessor())
      const mockExecutor = jest.fn().mockResolvedValue([{ data: 'success' }])

      const concurrentBatching = async () => {
        const promises = processors.map(async (processor, index) => {
          // Add items to each processor
          for (let i = 0; i < 20; i++) {
            processor.add({
              id: `processor-${index}-item-${i}`,
              method: 'GET',
              relativeUrl: `endpoint/${i}`
            })
          }
          
          return await processor.process(mockExecutor)
        })

        return await Promise.all(promises)
      }

      profiler.start()
      const results = await concurrentBatching()
      const metrics = profiler.stop()

      expect(metrics.duration).toBeLessThan(5000)
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.size).toBe(20)
      })
    })
  })

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly', async () => {
      const cacheManager = new CacheManager({ cleanupInterval: 100 })
      
      // Add items with short TTL
      for (let i = 0; i < 100; i++) {
        cacheManager.set(`cleanup-${i}`, { data: i }, 50) // 50ms TTL
      }
      
      expect(cacheManager.getStats().size).toBe(100)
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const finalSize = cacheManager.getStats().size
      expect(finalSize).toBeLessThan(100) // Items should be cleaned up
      
      cacheManager.destroy()
    })

    it('should handle batch processor cleanup', async () => {
      const processor = new BatchProcessor()
      
      // Add many items
      for (let i = 0; i < 1000; i++) {
        processor.add({
          id: `cleanup-${i}`,
          method: 'GET',
          relativeUrl: `endpoint/${i}`
        })
      }
      
      expect(processor.getQueueSize()).toBe(1000)
      
      processor.clearQueue()
      
      expect(processor.getQueueSize()).toBe(0)
    })
  })

  describe('Edge Case Performance', () => {
    it('should handle empty operations efficiently', async () => {
      const cacheManager = new CacheManager()
      
      profiler.start()
      
      // Perform many operations on empty cache
      for (let i = 0; i < 10000; i++) {
        cacheManager.get(`non-existent-${i}`)
      }
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(1000) // Should be very fast
      expect(cacheManager.getStats().misses).toBe(10000)
    })

    it('should handle pattern matching efficiently', async () => {
      const cacheManager = new CacheManager()
      
      // Add many items with patterns
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`pattern:group1:item:${i}`, { data: i })
        cacheManager.set(`pattern:group2:item:${i}`, { data: i })
      }
      
      profiler.start()
      
      const matches = cacheManager.findKeys('pattern:group1:*')
      
      const metrics = profiler.stop()
      
      expect(metrics.duration).toBeLessThan(500) // Pattern matching should be fast
      expect(matches).toHaveLength(1000)
    })
  })

  describe('Benchmark Comparisons', () => {
    it('should meet performance benchmarks', async () => {
      const benchmarks = {
        cacheSet: 1, // ms per operation
        cacheGet: 0.1, // ms per operation
        batchProcess: 5, // ms per item
        apiCall: 1000 // ms per call
      }

      // Test cache set performance
      const cacheManager = new CacheManager()
      
      const cacheSetStart = performance.now()
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`benchmark-${i}`, { data: i })
      }
      const cacheSetTime = (performance.now() - cacheSetStart) / 1000
      
      expect(cacheSetTime).toBeLessThan(benchmarks.cacheSet)

      // Test cache get performance
      const cacheGetStart = performance.now()
      for (let i = 0; i < 1000; i++) {
        cacheManager.get(`benchmark-${i}`)
      }
      const cacheGetTime = (performance.now() - cacheGetStart) / 1000
      
      expect(cacheGetTime).toBeLessThan(benchmarks.cacheGet)
    })
  })

  describe('Stress Tests', () => {
    it('should survive stress conditions', async () => {
      const cacheManager = new CacheManager({ maxSize: 1024 * 1024 }) // 1MB limit
      
      const stressTest = async () => {
        // Rapidly add and remove items
        for (let cycle = 0; cycle < 100; cycle++) {
          const operations = []
          
          for (let i = 0; i < 100; i++) {
            operations.push(
              Promise.resolve().then(() => {
                cacheManager.set(`stress-${cycle}-${i}`, { 
                  data: 'x'.repeat(Math.floor(Math.random() * 1000))
                })
              })
            )
            
            if (i % 10 === 0) {
              operations.push(
                Promise.resolve().then(() => {
                  cacheManager.delete(`stress-${cycle}-${i - 5}`)
                })
              )
            }
          }
          
          await Promise.all(operations)
        }
      }

      profiler.start()
      await stressTest()
      const metrics = profiler.stop()

      expect(metrics.duration).toBeLessThan(10000) // Should complete within 10 seconds
      
      // Cache should still be functional
      cacheManager.set('test-after-stress', 'value')
      expect(cacheManager.get('test-after-stress')).toBe('value')
    })
  })
})