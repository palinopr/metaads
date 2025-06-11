// Memory optimization utilities for Meta Ads Dashboard
"use client"

interface MemoryStats {
  used: number
  total: number
  limit: number
  utilizationPercent: number
}

interface CleanupCallback {
  id: string
  callback: () => void
  priority: number
}

export class MemoryOptimizer {
  private static instance: MemoryOptimizer
  private cleanupCallbacks: CleanupCallback[] = []
  private memoryThresholds = {
    warning: 70, // 70% of available memory
    critical: 85 // 85% of available memory
  }
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  private constructor() {
    this.startMonitoring()
  }

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer()
    }
    return MemoryOptimizer.instance
  }

  // Start memory monitoring
  startMonitoring(intervalMs: number = 30000) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, intervalMs)

    // Monitor when page becomes visible/hidden
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.performLightCleanup()
        }
      })
    }

    // Monitor before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.performFullCleanup()
      })

      // Monitor low memory events (Chrome)
      if ('memory' in performance) {
        window.addEventListener('memory-pressure', () => {
          console.warn('Memory pressure detected, performing cleanup')
          this.performAggressiveCleanup()
        })
      }
    }
  }

  // Stop memory monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return null
    }

    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      utilizationPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  // Register cleanup callback
  registerCleanup(id: string, callback: () => void, priority: number = 1) {
    // Remove existing callback with same ID
    this.cleanupCallbacks = this.cleanupCallbacks.filter(cb => cb.id !== id)
    
    // Add new callback
    this.cleanupCallbacks.push({ id, callback, priority })
    
    // Sort by priority (higher priority first)
    this.cleanupCallbacks.sort((a, b) => b.priority - a.priority)
  }

  // Unregister cleanup callback
  unregisterCleanup(id: string) {
    this.cleanupCallbacks = this.cleanupCallbacks.filter(cb => cb.id !== id)
  }

  // Check memory usage and trigger cleanup if needed
  private checkMemoryUsage() {
    const stats = this.getMemoryStats()
    if (!stats) return

    console.log(`Memory usage: ${(stats.used / 1024 / 1024).toFixed(2)}MB (${stats.utilizationPercent.toFixed(1)}%)`)

    if (stats.utilizationPercent > this.memoryThresholds.critical) {
      console.warn('Critical memory usage detected, performing aggressive cleanup')
      this.performAggressiveCleanup()
    } else if (stats.utilizationPercent > this.memoryThresholds.warning) {
      console.warn('High memory usage detected, performing cleanup')
      this.performLightCleanup()
    }
  }

  // Perform light cleanup (high priority items only)
  performLightCleanup() {
    const highPriorityCallbacks = this.cleanupCallbacks.filter(cb => cb.priority >= 3)
    
    highPriorityCallbacks.forEach(({ id, callback }) => {
      try {
        callback()
        console.log(`Light cleanup executed: ${id}`)
      } catch (error) {
        console.error(`Cleanup failed for ${id}:`, error)
      }
    })

    // Suggest garbage collection
    this.suggestGarbageCollection()
  }

  // Perform aggressive cleanup (all items)
  performAggressiveCleanup() {
    this.cleanupCallbacks.forEach(({ id, callback }) => {
      try {
        callback()
        console.log(`Aggressive cleanup executed: ${id}`)
      } catch (error) {
        console.error(`Cleanup failed for ${id}:`, error)
      }
    })

    // Force garbage collection if possible
    this.forceGarbageCollection()
  }

  // Perform full cleanup (for page unload)
  performFullCleanup() {
    // Clear all intervals and timeouts
    const highestId = setTimeout(() => {}, 0)
    for (let i = 0; i <= highestId; i++) {
      clearTimeout(i)
      clearInterval(i)
    }

    // Execute all cleanup callbacks
    this.performAggressiveCleanup()

    // Clear callbacks array
    this.cleanupCallbacks = []

    console.log('Full cleanup completed')
  }

  // Suggest garbage collection
  private suggestGarbageCollection() {
    // Create temporary objects to trigger GC
    for (let i = 0; i < 1000; i++) {
      const temp = new Array(1000).fill(null)
      temp.length = 0
    }
  }

  // Force garbage collection (if available)
  private forceGarbageCollection() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
      console.log('Forced garbage collection')
    } else {
      this.suggestGarbageCollection()
    }
  }

  // Optimize large objects
  optimizeLargeObject<T>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj

    // Remove null/undefined values
    const optimized = JSON.parse(JSON.stringify(obj, (key, value) => {
      if (value === null || value === undefined) return undefined
      return value
    }))

    return optimized
  }

  // Create a weak reference to an object
  createWeakRef<T extends object>(obj: T): WeakRef<T> | T {
    if (typeof WeakRef !== 'undefined') {
      return new WeakRef(obj)
    }
    return obj // Fallback for browsers that don't support WeakRef
  }

  // Clean up weak references
  cleanupWeakRefs(refs: Array<WeakRef<any>>) {
    return refs.filter(ref => ref.deref() !== undefined)
  }
}

// React hook for memory optimization
export function useMemoryOptimization() {
  const memoryOptimizer = MemoryOptimizer.getInstance()
  
  React.useEffect(() => {
    const componentId = `component-${Math.random().toString(36).substr(2, 9)}`
    
    // Register component cleanup
    memoryOptimizer.registerCleanup(componentId, () => {
      // Component-specific cleanup logic
    }, 2)
    
    return () => {
      memoryOptimizer.unregisterCleanup(componentId)
    }
  }, [])

  return {
    getMemoryStats: () => memoryOptimizer.getMemoryStats(),
    registerCleanup: (id: string, callback: () => void, priority?: number) => 
      memoryOptimizer.registerCleanup(id, callback, priority),
    unregisterCleanup: (id: string) => memoryOptimizer.unregisterCleanup(id),
    performCleanup: () => memoryOptimizer.performLightCleanup()
  }
}

// Virtual list for large datasets
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
}

export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = React.useMemo(() => {
    const visible = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visible.push({
          item: items[i],
          index: i,
          offsetY: i * itemHeight
        })
      }
    }
    return visible
  }, [items, startIndex, endIndex, itemHeight])

  const totalHeight = items.length * itemHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    virtualItems: visibleItems,
    totalHeight,
    handleScroll
  }
}

// Memory-efficient state management
export function useMemoryEfficientState<T>(
  initialValue: T,
  maxHistorySize: number = 10
) {
  const [state, setState] = React.useState(initialValue)
  const historyRef = React.useRef<T[]>([initialValue])

  const updateState = React.useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState

      // Maintain history with size limit
      historyRef.current.push(nextState)
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current = historyRef.current.slice(-maxHistorySize)
      }

      return nextState
    })
  }, [maxHistorySize])

  const clearHistory = React.useCallback(() => {
    historyRef.current = [state]
  }, [state])

  return [state, updateState, { history: historyRef.current, clearHistory }] as const
}

// Export the singleton instance
export const memoryOptimizer = MemoryOptimizer.getInstance()

// Auto-start monitoring if in browser
if (typeof window !== 'undefined') {
  memoryOptimizer.startMonitoring()
}