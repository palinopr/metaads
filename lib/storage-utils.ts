'use client'

/**
 * Storage utilities with proper permission and error handling
 * Addresses "Access to storage is not allowed from this context" errors
 */

export interface StorageItem<T = any> {
  value: T
  timestamp: number
  expires?: number
}

export class SafeStorage {
  private static isClient = typeof window !== 'undefined'
  private static storageAvailable = false
  private static sessionAvailable = false
  private static memoryCache = new Map<string, StorageItem>()

  static {
    // Initialize storage availability on client
    if (this.isClient) {
      this.checkStorageAvailability()
    }
  }

  private static checkStorageAvailability() {
    try {
      // Test localStorage
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      this.storageAvailable = true
    } catch (error) {
      console.warn('localStorage not available:', error)
      this.storageAvailable = false
    }

    try {
      // Test sessionStorage
      const testKey = '__session_test__'
      window.sessionStorage.setItem(testKey, 'test')
      window.sessionStorage.removeItem(testKey)
      this.sessionAvailable = true
    } catch (error) {
      console.warn('sessionStorage not available:', error)
      this.sessionAvailable = false
    }
  }

  /**
   * Safely get an item from storage
   */
  static getItem<T = any>(key: string, useSession = false): T | null {
    if (!this.isClient) {
      return this.memoryCache.get(key)?.value || null
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        // Fall back to memory cache
        const cached = this.memoryCache.get(key)
        if (cached && (!cached.expires || Date.now() < cached.expires)) {
          return cached.value
        }
        return null
      }

      const item = storage.getItem(key)
      if (!item) return null

      try {
        const parsed: StorageItem<T> = JSON.parse(item)
        
        // Check if item has expired
        if (parsed.expires && Date.now() > parsed.expires) {
          storage.removeItem(key)
          this.memoryCache.delete(key)
          return null
        }

        return parsed.value
      } catch (parseError) {
        // If JSON parsing fails, return the raw string
        return item as unknown as T
      }
    } catch (error) {
      console.warn(`Failed to get item "${key}" from storage:`, error)
      
      // Fall back to memory cache
      const cached = this.memoryCache.get(key)
      if (cached && (!cached.expires || Date.now() < cached.expires)) {
        return cached.value
      }
      
      return null
    }
  }

  /**
   * Safely set an item in storage
   */
  static setItem<T = any>(
    key: string, 
    value: T, 
    options: { 
      useSession?: boolean
      expiresIn?: number // milliseconds
    } = {}
  ): boolean {
    const { useSession = false, expiresIn } = options
    
    const storageItem: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expires: expiresIn ? Date.now() + expiresIn : undefined
    }

    // Always cache in memory as fallback
    this.memoryCache.set(key, storageItem)

    if (!this.isClient) {
      return true
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        // Only memory cache available
        return true
      }

      storage.setItem(key, JSON.stringify(storageItem))
      return true
    } catch (error) {
      console.warn(`Failed to set item "${key}" in storage:`, error)
      
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && (
        error.code === 22 || // QUOTA_EXCEEDED_ERR
        error.code === 1014 || // NS_ERROR_DOM_QUOTA_REACHED (Firefox)
        error.name === 'QuotaExceededError'
      )) {
        console.warn('Storage quota exceeded, attempting cleanup...')
        this.cleanup(useSession)
        
        // Try again after cleanup
        try {
          const storage = useSession ? window.sessionStorage : window.localStorage
          storage?.setItem(key, JSON.stringify(storageItem))
          return true
        } catch (retryError) {
          console.error('Storage still full after cleanup:', retryError)
        }
      }
      
      return false
    }
  }

  /**
   * Safely remove an item from storage
   */
  static removeItem(key: string, useSession = false): boolean {
    // Remove from memory cache
    this.memoryCache.delete(key)

    if (!this.isClient) {
      return true
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        return true
      }

      storage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove item "${key}" from storage:`, error)
      return false
    }
  }

  /**
   * Clear all storage items
   */
  static clear(useSession = false): boolean {
    // Clear memory cache
    this.memoryCache.clear()

    if (!this.isClient) {
      return true
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        return true
      }

      storage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * Get all keys from storage
   */
  static getKeys(useSession = false): string[] {
    if (!this.isClient) {
      return Array.from(this.memoryCache.keys())
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        return Array.from(this.memoryCache.keys())
      }

      return Object.keys(storage)
    } catch (error) {
      console.warn('Failed to get storage keys:', error)
      return Array.from(this.memoryCache.keys())
    }
  }

  /**
   * Check if storage is available
   */
  static isStorageAvailable(useSession = false): boolean {
    return this.isClient && (useSession ? this.sessionAvailable : this.storageAvailable)
  }

  /**
   * Clean up expired items from storage
   */
  static cleanup(useSession = false): number {
    let cleaned = 0

    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires && Date.now() > item.expires) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    if (!this.isClient) {
      return cleaned
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        return cleaned
      }

      const keys = Object.keys(storage)
      
      for (const key of keys) {
        try {
          const item = storage.getItem(key)
          if (item) {
            const parsed: StorageItem = JSON.parse(item)
            if (parsed.expires && Date.now() > parsed.expires) {
              storage.removeItem(key)
              cleaned++
            }
          }
        } catch (error) {
          // If we can't parse the item, it might be corrupted, remove it
          storage.removeItem(key)
          cleaned++
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup storage:', error)
    }

    return cleaned
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(useSession = false): {
    available: boolean
    used: number
    total: number | null
    keys: number
  } {
    const keys = this.getKeys(useSession)
    
    if (!this.isClient) {
      return {
        available: false,
        used: this.memoryCache.size,
        total: null,
        keys: keys.length
      }
    }

    try {
      const storage = useSession ? 
        (this.sessionAvailable ? window.sessionStorage : null) :
        (this.storageAvailable ? window.localStorage : null)

      if (!storage) {
        return {
          available: false,
          used: this.memoryCache.size,
          total: null,
          keys: keys.length
        }
      }

      // Calculate used space
      let used = 0
      for (const key of keys) {
        const item = storage.getItem(key)
        if (item) {
          used += key.length + item.length
        }
      }

      return {
        available: true,
        used,
        total: null, // Browser doesn't expose storage quota reliably
        keys: keys.length
      }
    } catch (error) {
      console.warn('Failed to get storage info:', error)
      return {
        available: false,
        used: 0,
        total: null,
        keys: 0
      }
    }
  }
}

// Convenience functions for common use cases
export const storage = {
  get: <T = any>(key: string) => SafeStorage.getItem<T>(key),
  set: <T = any>(key: string, value: T, expiresIn?: number) => 
    SafeStorage.setItem(key, value, { expiresIn }),
  remove: (key: string) => SafeStorage.removeItem(key),
  clear: () => SafeStorage.clear(),
  keys: () => SafeStorage.getKeys(),
  available: () => SafeStorage.isStorageAvailable(),
  cleanup: () => SafeStorage.cleanup(),
  info: () => SafeStorage.getStorageInfo()
}

export const sessionStorage = {
  get: <T = any>(key: string) => SafeStorage.getItem<T>(key, true),
  set: <T = any>(key: string, value: T, expiresIn?: number) => 
    SafeStorage.setItem(key, value, { useSession: true, expiresIn }),
  remove: (key: string) => SafeStorage.removeItem(key, true),
  clear: () => SafeStorage.clear(true),
  keys: () => SafeStorage.getKeys(true),
  available: () => SafeStorage.isStorageAvailable(true),
  cleanup: () => SafeStorage.cleanup(true),
  info: () => SafeStorage.getStorageInfo(true)
}