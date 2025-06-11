'use client'

import { useState, useEffect, useCallback } from 'react'
import { offlineDataManager, OfflineDataItem, SyncProgress } from '@/lib/offline/offline-data-manager'
import { useNetworkStatus } from '@/hooks/use-mobile'

interface UseOfflineReturn {
  // Network state
  isOnline: boolean
  isOffline: boolean
  
  // Sync state
  syncProgress: SyncProgress | null
  isSyncing: boolean
  lastSyncTime: Date | null
  
  // Storage status
  storageUsed: number
  storageAvailable: number
  storagePercentage: number
  itemCount: number
  
  // Actions
  storeData: (item: Omit<OfflineDataItem, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>) => Promise<string>
  getData: (type: OfflineDataItem['type'], query?: any, useCache?: boolean) => Promise<OfflineDataItem[]>
  updateData: (id: string, updates: Partial<OfflineDataItem>) => Promise<boolean>
  deleteData: (id: string) => Promise<boolean>
  syncNow: () => Promise<SyncProgress>
  clearOfflineData: (type?: OfflineDataItem['type']) => Promise<void>
  
  // Utilities
  refreshStorageStatus: () => Promise<void>
}

export function useOffline(): UseOfflineReturn {
  const networkStatus = useNetworkStatus()
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [storageStatus, setStorageStatus] = useState({
    used: 0,
    available: 0,
    percentage: 0,
    itemCount: 0
  })

  // Initialize and set up event listeners
  useEffect(() => {
    const handleSyncStarted = () => {
      setIsSyncing(true)
    }

    const handleSyncProgress = (progress: SyncProgress) => {
      setSyncProgress(progress)
    }

    const handleSyncCompleted = (progress: SyncProgress) => {
      setIsSyncing(false)
      setSyncProgress(progress)
      setLastSyncTime(new Date())
      refreshStorageStatus()
    }

    const handleDataChanged = () => {
      refreshStorageStatus()
    }

    // Register event listeners
    offlineDataManager.on('sync-started', handleSyncStarted)
    offlineDataManager.on('sync-progress', handleSyncProgress)
    offlineDataManager.on('sync-completed', handleSyncCompleted)
    offlineDataManager.on('data-stored', handleDataChanged)
    offlineDataManager.on('data-updated', handleDataChanged)
    offlineDataManager.on('data-deleted', handleDataChanged)
    offlineDataManager.on('data-cleared', handleDataChanged)

    // Initial storage status
    refreshStorageStatus()

    return () => {
      offlineDataManager.off('sync-started', handleSyncStarted)
      offlineDataManager.off('sync-progress', handleSyncProgress)
      offlineDataManager.off('sync-completed', handleSyncCompleted)
      offlineDataManager.off('data-stored', handleDataChanged)
      offlineDataManager.off('data-updated', handleDataChanged)
      offlineDataManager.off('data-deleted', handleDataChanged)
      offlineDataManager.off('data-cleared', handleDataChanged)
    }
  }, [])

  // Refresh storage status
  const refreshStorageStatus = useCallback(async () => {
    try {
      const status = await offlineDataManager.getStorageStatus()
      setStorageStatus(status)
    } catch (error) {
      console.error('Failed to get storage status:', error)
    }
  }, [])

  // Store data offline
  const storeData = useCallback(async (
    item: Omit<OfflineDataItem, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
  ): Promise<string> => {
    return offlineDataManager.storeData(item)
  }, [])

  // Get data (with offline fallback)
  const getData = useCallback(async (
    type: OfflineDataItem['type'],
    query?: any,
    useCache = true
  ): Promise<OfflineDataItem[]> => {
    return offlineDataManager.getData(type, query, useCache)
  }, [])

  // Update data
  const updateData = useCallback(async (
    id: string,
    updates: Partial<OfflineDataItem>
  ): Promise<boolean> => {
    return offlineDataManager.updateData(id, updates)
  }, [])

  // Delete data
  const deleteData = useCallback(async (id: string): Promise<boolean> => {
    return offlineDataManager.deleteData(id)
  }, [])

  // Manual sync
  const syncNow = useCallback(async (): Promise<SyncProgress> => {
    return offlineDataManager.sync(true)
  }, [])

  // Clear offline data
  const clearOfflineData = useCallback(async (type?: OfflineDataItem['type']): Promise<void> => {
    return offlineDataManager.clearOfflineData(type)
  }, [])

  return {
    // Network state
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    
    // Sync state
    syncProgress,
    isSyncing,
    lastSyncTime,
    
    // Storage status
    storageUsed: storageStatus.used,
    storageAvailable: storageStatus.available,
    storagePercentage: storageStatus.percentage,
    itemCount: storageStatus.itemCount,
    
    // Actions
    storeData,
    getData,
    updateData,
    deleteData,
    syncNow,
    clearOfflineData,
    
    // Utilities
    refreshStorageStatus
  }
}

// Hook for specific data types
export function useOfflineData<T = any>(
  type: OfflineDataItem['type'],
  query?: any,
  autoRefresh = true
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getData, isOnline } = useOffline()

  const fetchData = useCallback(async (useCache = true) => {
    try {
      setLoading(true)
      setError(null)
      const items = await getData(type, query, useCache)
      setData(items.map(item => item.data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [getData, type, query])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh when coming online
  useEffect(() => {
    if (isOnline && autoRefresh) {
      fetchData(false) // Force fresh data when online
    }
  }, [isOnline, autoRefresh, fetchData])

  const refresh = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh
  }
}

// Hook for offline queue management
export function useOfflineQueue() {
  const { syncProgress, isSyncing, syncNow } = useOffline()
  const [queueSize, setQueueSize] = useState(0)

  useEffect(() => {
    const updateQueueSize = () => {
      const progress = offlineDataManager.getSyncProgress()
      setQueueSize(progress.total - progress.completed)
    }

    offlineDataManager.on('data-stored', updateQueueSize)
    offlineDataManager.on('sync-completed', updateQueueSize)
    updateQueueSize()

    return () => {
      offlineDataManager.off('data-stored', updateQueueSize)
      offlineDataManager.off('sync-completed', updateQueueSize)
    }
  }, [])

  return {
    queueSize,
    syncProgress,
    isSyncing,
    syncNow,
    hasItemsToSync: queueSize > 0
  }
}