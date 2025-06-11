'use client'

import { useState, useEffect, useCallback } from 'react'
import { SafeStorage } from '@/lib/storage-utils'

export interface UseSafeStorageOptions {
  /**
   * Use sessionStorage instead of localStorage
   */
  useSession?: boolean
  
  /**
   * Expiration time in milliseconds
   */
  expiresIn?: number
  
  /**
   * Default value if storage is not available
   */
  defaultValue?: any
  
  /**
   * Serialize function for complex objects
   */
  serialize?: (value: any) => string
  
  /**
   * Deserialize function for complex objects
   */
  deserialize?: (value: string) => any
}

/**
 * React hook for safe storage access with CSP compliance
 */
export function useSafeStorage<T = any>(
  key: string,
  initialValue: T,
  options: UseSafeStorageOptions = {}
) {
  const {
    useSession = false,
    expiresIn,
    defaultValue = initialValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options

  // Initialize state
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = SafeStorage.getItem<T>(key, useSession)
      return item !== null ? item : defaultValue
    } catch (error) {
      console.warn(`Failed to load initial value for "${key}":`, error)
      return defaultValue
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if storage is available
  const isStorageAvailable = SafeStorage.isStorageAvailable(useSession)

  // Set value function
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setError(null)
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save to state
      setStoredValue(valueToStore)
      
      // Save to storage
      const success = SafeStorage.setItem(key, valueToStore, {
        useSession,
        expiresIn
      })
      
      if (!success && isStorageAvailable) {
        setError('Failed to save to storage')
      }
    } catch (error) {
      console.error(`Failed to set storage value for "${key}":`, error)
      setError(error instanceof Error ? error.message : 'Storage error')
    }
  }, [key, storedValue, useSession, expiresIn, isStorageAvailable])

  // Remove value function
  const removeValue = useCallback(() => {
    try {
      setError(null)
      setStoredValue(defaultValue)
      SafeStorage.removeItem(key, useSession)
    } catch (error) {
      console.error(`Failed to remove storage value for "${key}":`, error)
      setError(error instanceof Error ? error.message : 'Storage error')
    }
  }, [key, defaultValue, useSession])

  // Load value on mount and key change
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    
    try {
      const item = SafeStorage.getItem<T>(key, useSession)
      if (item !== null) {
        setStoredValue(item)
      } else {
        setStoredValue(defaultValue)
      }
    } catch (error) {
      console.warn(`Failed to load storage value for "${key}":`, error)
      setError(error instanceof Error ? error.message : 'Storage error')
      setStoredValue(defaultValue)
    } finally {
      setIsLoading(false)
    }
  }, [key, useSession, defaultValue])

  // Sync across tabs (for localStorage only)
  useEffect(() => {
    if (!isStorageAvailable || useSession) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = deserialize(e.newValue)
          setStoredValue(parsed)
        } catch (error) {
          console.warn(`Failed to parse storage change for "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, useSession, isStorageAvailable, deserialize])

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoading,
    error,
    isStorageAvailable
  }
}

/**
 * Hook for managing storage with automatic cleanup
 */
export function useStorageCleanup(intervalMs = 60000) { // 1 minute default
  const [cleanupStats, setCleanupStats] = useState({ 
    lastCleanup: Date.now(),
    itemsRemoved: 0 
  })

  useEffect(() => {
    const cleanup = () => {
      const removed = SafeStorage.cleanup(false) + SafeStorage.cleanup(true)
      setCleanupStats({
        lastCleanup: Date.now(),
        itemsRemoved: removed
      })
      
      if (removed > 0) {
        console.log(`Storage cleanup: removed ${removed} expired items`)
      }
    }

    // Initial cleanup
    cleanup()

    // Set up interval
    const interval = setInterval(cleanup, intervalMs)
    
    return () => clearInterval(interval)
  }, [intervalMs])

  return cleanupStats
}

/**
 * Hook for monitoring storage usage
 */
export function useStorageInfo() {
  const [info, setInfo] = useState(() => ({
    localStorage: SafeStorage.getStorageInfo(false),
    sessionStorage: SafeStorage.getStorageInfo(true)
  }))

  const refresh = useCallback(() => {
    setInfo({
      localStorage: SafeStorage.getStorageInfo(false),
      sessionStorage: SafeStorage.getStorageInfo(true)
    })
  }, [])

  useEffect(() => {
    // Refresh info periodically
    const interval = setInterval(refresh, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [refresh])

  return { ...info, refresh }
}

/**
 * Simple localStorage hook with fallback
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  return useSafeStorage(key, initialValue, { useSession: false })
}

/**
 * Simple sessionStorage hook with fallback
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  return useSafeStorage(key, initialValue, { useSession: true })
}