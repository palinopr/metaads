import { CacheManager, CacheEntry, CacheConfig, CacheStats } from '../../../lib/data-pipeline/cache-manager'

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {}
  })
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock timers
jest.useFakeTimers()

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockLocalStorage.store = {}
    cacheManager = new CacheManager()
  })

  afterEach(() => {
    cacheManager.clear()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const manager = new CacheManager()
      const stats = manager.getStats()
      
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.evictions).toBe(0)
      expect(stats.size).toBe(0)
    })

    it('should accept custom configuration', () => {
      const customConfig: Partial<CacheConfig> = {
        maxSize: 10 * 1024 * 1024, // 10MB
        defaultTTL: 10 * 60 * 1000, // 10 minutes
        persistToLocalStorage: false
      }
      
      const manager = new CacheManager(customConfig)
      expect(manager.getStats().size).toBe(0)
    })

    it('should start cleanup timer', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')
      new CacheManager({ cleanupInterval: 5000 })
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000)
    })
  })

  describe('Basic Cache Operations', () => {
    it('should set and get cache entries', () => {
      const key = 'test-key'
      const data = { message: 'test data' }
      
      cacheManager.set(key, data)
      const result = cacheManager.get(key)
      
      expect(result).toEqual(data)
    })

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should check if key exists', () => {
      const key = 'test-key'
      
      expect(cacheManager.has(key)).toBe(false)
      
      cacheManager.set(key, 'test data')
      
      expect(cacheManager.has(key)).toBe(true)
    })

    it('should delete cache entries', () => {
      const key = 'test-key'
      
      cacheManager.set(key, 'test data')
      expect(cacheManager.has(key)).toBe(true)
      
      const deleted = cacheManager.delete(key)
      
      expect(deleted).toBe(true)
      expect(cacheManager.has(key)).toBe(false)
    })

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheManager.delete('non-existent-key')
      expect(deleted).toBe(false)
    })

    it('should clear all cache entries', () => {
      cacheManager.set('key1', 'data1')
      cacheManager.set('key2', 'data2')
      cacheManager.set('key3', 'data3')
      
      expect(cacheManager.getStats().size).toBe(3)
      
      cacheManager.clear()
      
      expect(cacheManager.getStats().size).toBe(0)
    })
  })

  describe('TTL (Time To Live) Functionality', () => {
    it('should set entries with custom TTL', () => {
      const key = 'test-key'
      const data = 'test data'
      const customTTL = 10000 // 10 seconds
      
      cacheManager.set(key, data, customTTL)
      
      expect(cacheManager.get(key)).toBe(data)
    })

    it('should return null for expired entries', () => {
      const key = 'test-key'
      const data = 'test data'
      const shortTTL = 1000 // 1 second
      
      cacheManager.set(key, data, shortTTL)
      
      // Advance time past TTL
      jest.advanceTimersByTime(2000)
      
      expect(cacheManager.get(key)).toBeNull()
    })

    it('should use default TTL when none specified', () => {
      const key = 'test-key'
      const data = 'test data'
      
      cacheManager.set(key, data)
      
      // Entry should still be valid before default TTL expires
      jest.advanceTimersByTime(4 * 60 * 1000) // 4 minutes
      expect(cacheManager.get(key)).toBe(data)
      
      // Entry should expire after default TTL
      jest.advanceTimersByTime(2 * 60 * 1000) // 2 more minutes (total 6 minutes)
      expect(cacheManager.get(key)).toBeNull()
    })

    it('should update TTL on set', () => {
      const key = 'test-key'
      const data1 = 'first data'
      const data2 = 'second data'
      
      cacheManager.set(key, data1, 2000) // 2 seconds
      
      // Advance time almost to expiry
      jest.advanceTimersByTime(1800) // 1.8 seconds
      
      // Update with new data and TTL
      cacheManager.set(key, data2, 3000) // 3 seconds
      
      // Original TTL would have expired by now, but entry should still be valid
      jest.advanceTimersByTime(500) // 0.5 seconds more (total 2.3 seconds)
      
      expect(cacheManager.get(key)).toBe(data2)
    })
  })

  describe('Statistics Tracking', () => {
    it('should track cache hits', () => {
      const key = 'test-key'
      cacheManager.set(key, 'test data')
      
      cacheManager.get(key) // Hit
      cacheManager.get(key) // Hit
      
      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(0)
    })

    it('should track cache misses', () => {
      cacheManager.get('non-existent-1') // Miss
      cacheManager.get('non-existent-2') // Miss
      
      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(2)
    })

    it('should calculate hit rate correctly', () => {
      const key = 'test-key'
      cacheManager.set(key, 'test data')
      
      cacheManager.get(key) // Hit
      cacheManager.get('miss-1') // Miss
      cacheManager.get(key) // Hit
      cacheManager.get('miss-2') // Miss
      
      const stats = cacheManager.getStats()
      expect(stats.hitRate).toBe(0.5) // 2 hits out of 4 total
    })

    it('should track cache size', () => {
      cacheManager.set('key1', 'data1')
      cacheManager.set('key2', 'data2')
      
      expect(cacheManager.getStats().size).toBe(2)
      
      cacheManager.delete('key1')
      
      expect(cacheManager.getStats().size).toBe(1)
    })

    it('should track evictions', () => {
      // We'll test this with memory-based eviction later
      const stats = cacheManager.getStats()
      expect(stats.evictions).toBe(0)
    })
  })

  describe('Batch Operations', () => {
    it('should set multiple entries at once', () => {
      const entries: Array<{ key: string; data: any; ttl?: number }> = [
        { key: 'key1', data: 'data1' },
        { key: 'key2', data: 'data2', ttl: 10000 },
        { key: 'key3', data: { complex: 'object' } }
      ]
      
      cacheManager.setMultiple(entries)
      
      expect(cacheManager.get('key1')).toBe('data1')
      expect(cacheManager.get('key2')).toBe('data2')
      expect(cacheManager.get('key3')).toEqual({ complex: 'object' })
      expect(cacheManager.getStats().size).toBe(3)
    })

    it('should get multiple entries at once', () => {
      cacheManager.set('key1', 'data1')
      cacheManager.set('key2', 'data2')
      cacheManager.set('key3', 'data3')
      
      const results = cacheManager.getMultiple(['key1', 'key3', 'non-existent'])
      
      expect(results).toEqual({
        key1: 'data1',
        key3: 'data3',
        'non-existent': null
      })
    })

    it('should delete multiple entries at once', () => {
      cacheManager.set('key1', 'data1')
      cacheManager.set('key2', 'data2')
      cacheManager.set('key3', 'data3')
      
      const deletedCount = cacheManager.deleteMultiple(['key1', 'key3', 'non-existent'])
      
      expect(deletedCount).toBe(2)
      expect(cacheManager.has('key1')).toBe(false)
      expect(cacheManager.has('key2')).toBe(true)
      expect(cacheManager.has('key3')).toBe(false)
    })
  })

  describe('Key Pattern Operations', () => {
    beforeEach(() => {
      cacheManager.set('user:123:profile', { name: 'John' })
      cacheManager.set('user:123:settings', { theme: 'dark' })
      cacheManager.set('user:456:profile', { name: 'Jane' })
      cacheManager.set('campaign:789:stats', { clicks: 100 })
    })

    it('should find keys by pattern', () => {
      const userKeys = cacheManager.findKeys('user:123:*')
      
      expect(userKeys).toHaveLength(2)
      expect(userKeys).toContain('user:123:profile')
      expect(userKeys).toContain('user:123:settings')
    })

    it('should delete keys by pattern', () => {
      const deletedCount = cacheManager.deleteByPattern('user:*:profile')
      
      expect(deletedCount).toBe(2)
      expect(cacheManager.has('user:123:profile')).toBe(false)
      expect(cacheManager.has('user:456:profile')).toBe(false)
      expect(cacheManager.has('user:123:settings')).toBe(true)
    })

    it('should handle complex patterns', () => {
      const keys = cacheManager.findKeys('*:123:*')
      
      expect(keys).toHaveLength(2)
      expect(keys).toContain('user:123:profile')
      expect(keys).toContain('user:123:settings')
    })
  })

  describe('Memory Management', () => {
    it('should estimate memory usage', () => {
      const manager = new CacheManager({ maxSize: 1024 }) // 1KB limit
      
      manager.set('key1', 'x'.repeat(200)) // ~200 bytes
      manager.set('key2', 'y'.repeat(300)) // ~300 bytes
      
      const memoryUsage = manager.getMemoryUsage()
      
      expect(memoryUsage.used).toBeGreaterThan(500)
      expect(memoryUsage.limit).toBe(1024)
      expect(memoryUsage.percentage).toBeGreaterThan(50)
    })

    it('should evict entries when memory limit exceeded', () => {
      const manager = new CacheManager({ 
        maxSize: 1000, // 1KB limit
        persistToLocalStorage: false 
      })\n      \n      // Add entries that exceed the limit\n      manager.set('key1', 'x'.repeat(400)) // ~400 bytes\n      manager.set('key2', 'y'.repeat(400)) // ~400 bytes\n      manager.set('key3', 'z'.repeat(400)) // ~400 bytes - should trigger eviction\n      \n      const stats = manager.getStats()\n      expect(stats.evictions).toBeGreaterThan(0)\n      expect(stats.size).toBeLessThan(3) // Some entries should be evicted\n    })\n\n    it('should evict oldest entries first (LRU)', () => {\n      const manager = new CacheManager({ \n        maxSize: 800, // Small limit to force eviction\n        persistToLocalStorage: false \n      })\n      \n      manager.set('old', 'x'.repeat(300))\n      jest.advanceTimersByTime(1000) // Make it older\n      \n      manager.set('new1', 'y'.repeat(300))\n      manager.set('new2', 'z'.repeat(300)) // Should evict 'old'\n      \n      expect(manager.has('old')).toBe(false)\n      expect(manager.has('new1')).toBe(true)\n      expect(manager.has('new2')).toBe(true)\n    })\n  })\n\n  describe('Cleanup and Maintenance', () => {\n    it('should run periodic cleanup', () => {\n      const manager = new CacheManager({ cleanupInterval: 1000 })\n      \n      manager.set('expired1', 'data1', 500) // 0.5 seconds TTL\n      manager.set('expired2', 'data2', 500) // 0.5 seconds TTL\n      manager.set('valid', 'data3', 5000) // 5 seconds TTL\n      \n      expect(manager.getStats().size).toBe(3)\n      \n      // Advance time past expiry for first two entries\n      jest.advanceTimersByTime(1000)\n      \n      // Trigger cleanup\n      jest.advanceTimersByTime(1000) // Cleanup interval\n      \n      expect(manager.getStats().size).toBe(1)\n      expect(manager.has('valid')).toBe(true)\n    })\n\n    it('should manually trigger cleanup', () => {\n      cacheManager.set('expired', 'data', 100) // 0.1 seconds TTL\n      \n      jest.advanceTimersByTime(200) // Expire the entry\n      \n      expect(cacheManager.getStats().size).toBe(1) // Still in cache\n      \n      cacheManager.cleanup()\n      \n      expect(cacheManager.getStats().size).toBe(0) // Removed by cleanup\n    })\n\n    it('should reset statistics', () => {\n      cacheManager.set('key', 'data')\n      cacheManager.get('key') // Hit\n      cacheManager.get('missing') // Miss\n      \n      let stats = cacheManager.getStats()\n      expect(stats.hits).toBe(1)\n      expect(stats.misses).toBe(1)\n      \n      cacheManager.resetStats()\n      \n      stats = cacheManager.getStats()\n      expect(stats.hits).toBe(0)\n      expect(stats.misses).toBe(0)\n      expect(stats.size).toBe(1) // Size should remain\n    })\n  })\n\n  describe('Persistence to localStorage', () => {\n    it('should persist entries to localStorage', () => {\n      const manager = new CacheManager({ persistToLocalStorage: true })\n      \n      manager.set('persistent-key', { data: 'test' })\n      \n      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(\n        'cache:persistent-key',\n        expect.stringContaining('test')\n      )\n    })\n\n    it('should load entries from localStorage on initialization', () => {\n      // Pre-populate localStorage\n      const cacheEntry = {\n        key: 'loaded-key',\n        data: { message: 'loaded data' },\n        timestamp: Date.now(),\n        ttl: 300000, // 5 minutes\n        etag: 'test-etag'\n      }\n      \n      mockLocalStorage.store['cache:loaded-key'] = JSON.stringify(cacheEntry)\n      \n      const manager = new CacheManager({ persistToLocalStorage: true })\n      \n      expect(manager.get('loaded-key')).toEqual({ message: 'loaded data' })\n    })\n\n    it('should not load expired entries from localStorage', () => {\n      // Pre-populate localStorage with expired entry\n      const expiredEntry = {\n        key: 'expired-key',\n        data: { message: 'expired data' },\n        timestamp: Date.now() - 600000, // 10 minutes ago\n        ttl: 300000, // 5 minutes TTL (expired)\n        etag: 'test-etag'\n      }\n      \n      mockLocalStorage.store['cache:expired-key'] = JSON.stringify(expiredEntry)\n      \n      const manager = new CacheManager({ persistToLocalStorage: true })\n      \n      expect(manager.get('expired-key')).toBeNull()\n    })\n\n    it('should handle localStorage errors gracefully', () => {\n      mockLocalStorage.setItem.mockImplementation(() => {\n        throw new Error('Storage quota exceeded')\n      })\n      \n      const manager = new CacheManager({ persistToLocalStorage: true })\n      \n      // Should not throw error\n      expect(() => {\n        manager.set('key', 'data')\n      }).not.toThrow()\n    })\n  })\n\n  describe('Compression', () => {\n    it('should compress large entries when enabled', () => {\n      const manager = new CacheManager({ compressionEnabled: true })\n      \n      const largeData = 'x'.repeat(10000) // 10KB of repeated data\n      manager.set('large-key', largeData)\n      \n      // Should still retrieve correctly\n      expect(manager.get('large-key')).toBe(largeData)\n    })\n\n    it('should not compress when disabled', () => {\n      const manager = new CacheManager({ compressionEnabled: false })\n      \n      const data = 'test data'\n      manager.set('key', data)\n      \n      expect(manager.get('key')).toBe(data)\n    })\n  })\n\n  describe('ETags and Conditional Requests', () => {\n    it('should store and retrieve ETags', () => {\n      const key = 'test-key'\n      const data = { message: 'test' }\n      const etag = 'W/\"abc123\"'\n      \n      cacheManager.set(key, data, undefined, etag)\n      \n      const entry = cacheManager.getWithMetadata(key)\n      expect(entry?.etag).toBe(etag)\n      expect(entry?.data).toEqual(data)\n    })\n\n    it('should validate ETags', () => {\n      const key = 'test-key'\n      const data = { message: 'test' }\n      const etag = 'W/\"abc123\"'\n      \n      cacheManager.set(key, data, undefined, etag)\n      \n      expect(cacheManager.isValidETag(key, etag)).toBe(true)\n      expect(cacheManager.isValidETag(key, 'different-etag')).toBe(false)\n      expect(cacheManager.isValidETag('non-existent', etag)).toBe(false)\n    })\n  })\n\n  describe('Advanced Functionality', () => {\n    it('should support conditional setting (set if not exists)', () => {\n      const key = 'conditional-key'\n      \n      // First set should succeed\n      const result1 = cacheManager.setIfNotExists(key, 'first-value')\n      expect(result1).toBe(true)\n      expect(cacheManager.get(key)).toBe('first-value')\n      \n      // Second set should fail (key exists)\n      const result2 = cacheManager.setIfNotExists(key, 'second-value')\n      expect(result2).toBe(false)\n      expect(cacheManager.get(key)).toBe('first-value')\n    })\n\n    it('should support atomic increment operations', () => {\n      const key = 'counter'\n      \n      cacheManager.set(key, 10)\n      \n      const result1 = cacheManager.increment(key, 5)\n      expect(result1).toBe(15)\n      expect(cacheManager.get(key)).toBe(15)\n      \n      const result2 = cacheManager.increment(key)\n      expect(result2).toBe(16)\n      expect(cacheManager.get(key)).toBe(16)\n    })\n\n    it('should handle increment on non-numeric values', () => {\n      const key = 'non-numeric'\n      \n      cacheManager.set(key, 'not-a-number')\n      \n      const result = cacheManager.increment(key)\n      expect(result).toBeNull()\n    })\n\n    it('should handle increment on non-existent keys', () => {\n      const result = cacheManager.increment('non-existent', 5)\n      expect(result).toBe(5)\n      expect(cacheManager.get('non-existent')).toBe(5)\n    })\n  })\n\n  describe('Error Handling and Edge Cases', () => {\n    it('should handle JSON serialization errors', () => {\n      const circularObj: any = { prop: 'value' }\n      circularObj.circular = circularObj\n      \n      // Should handle circular references gracefully\n      expect(() => {\n        cacheManager.set('circular', circularObj)\n      }).not.toThrow()\n    })\n\n    it('should handle invalid key patterns', () => {\n      const keys = cacheManager.findKeys('[')\n      expect(keys).toEqual([])\n    })\n\n    it('should handle empty cache operations', () => {\n      expect(cacheManager.getMultiple([])).toEqual({})\n      expect(cacheManager.deleteMultiple([])).toBe(0)\n      expect(cacheManager.findKeys('*')).toEqual([])\n    })\n\n    it('should handle null and undefined values', () => {\n      cacheManager.set('null-key', null)\n      cacheManager.set('undefined-key', undefined)\n      \n      expect(cacheManager.get('null-key')).toBeNull()\n      expect(cacheManager.get('undefined-key')).toBeUndefined()\n    })\n  })\n\n  describe('Performance and Optimization', () => {\n    it('should handle large number of entries efficiently', () => {\n      const startTime = Date.now()\n      \n      // Add many entries\n      for (let i = 0; i < 1000; i++) {\n        cacheManager.set(`key-${i}`, `data-${i}`)\n      }\n      \n      const setTime = Date.now() - startTime\n      \n      const getStartTime = Date.now()\n      \n      // Retrieve many entries\n      for (let i = 0; i < 1000; i++) {\n        cacheManager.get(`key-${i}`)\n      }\n      \n      const getTime = Date.now() - getStartTime\n      \n      // Operations should complete in reasonable time\n      expect(setTime).toBeLessThan(1000) // 1 second\n      expect(getTime).toBeLessThan(500) // 0.5 seconds\n    })\n\n    it('should cleanup efficiently', () => {\n      // Add many entries with short TTL\n      for (let i = 0; i < 1000; i++) {\n        cacheManager.set(`short-lived-${i}`, `data-${i}`, 100)\n      }\n      \n      jest.advanceTimersByTime(200) // Expire all entries\n      \n      const cleanupStart = Date.now()\n      cacheManager.cleanup()\n      const cleanupTime = Date.now() - cleanupStart\n      \n      expect(cleanupTime).toBeLessThan(100) // Should cleanup quickly\n      expect(cacheManager.getStats().size).toBe(0)\n    })\n  })\n\n  describe('Destruction and Cleanup', () => {\n    it('should properly destroy cache instance', () => {\n      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')\n      \n      cacheManager.destroy()\n      \n      expect(clearIntervalSpy).toHaveBeenCalled()\n      expect(cacheManager.getStats().size).toBe(0)\n    })\n  })\n})"