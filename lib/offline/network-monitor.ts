// Network monitoring and connection management

export type ConnectionQuality = 'offline' | 'slow' | 'good' | 'excellent'
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown'

export interface NetworkStatus {
  online: boolean
  quality: ConnectionQuality
  type: ConnectionType
  downlink?: number // Mbps
  rtt?: number // Round trip time in ms
  saveData?: boolean
}

export interface NetworkChangeListener {
  (status: NetworkStatus): void
}

export class NetworkMonitor {
  private static instance: NetworkMonitor
  private listeners: Set<NetworkChangeListener> = new Set()
  private currentStatus: NetworkStatus
  private pingInterval?: NodeJS.Timeout
  private lastPingTime: number = 0
  
  private constructor() {
    this.currentStatus = this.getNetworkStatus()
    this.setupEventListeners()
    this.startPingMonitoring()
  }
  
  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  // Get current network status
  private getNetworkStatus(): NetworkStatus {
    const online = navigator.onLine
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    let quality: ConnectionQuality = 'offline'
    let type: ConnectionType = 'unknown'
    let downlink: number | undefined
    let rtt: number | undefined
    let saveData: boolean | undefined
    
    if (online && connection) {
      // Get connection info
      type = this.getConnectionType(connection.effectiveType || connection.type)
      downlink = connection.downlink
      rtt = connection.rtt
      saveData = connection.saveData
      
      // Determine quality based on effective type or metrics
      if (connection.effectiveType) {
        switch (connection.effectiveType) {
          case '4g':
            quality = 'excellent'
            break
          case '3g':
            quality = 'good'
            break
          case '2g':
          case 'slow-2g':
            quality = 'slow'
            break
          default:
            quality = 'good'
        }
      } else if (downlink !== undefined) {
        // Fallback to downlink speed
        if (downlink >= 10) quality = 'excellent'
        else if (downlink >= 5) quality = 'good'
        else if (downlink >= 1) quality = 'slow'
        else quality = 'offline'
      } else {
        quality = 'good' // Default for online
      }
    }
    
    return { online, quality, type, downlink, rtt, saveData }
  }

  // Convert connection type
  private getConnectionType(type: string): ConnectionType {
    switch (type?.toLowerCase()) {
      case 'wifi':
      case 'wimax':
        return 'wifi'
      case 'cellular':
      case '4g':
      case '3g':
      case '2g':
        return 'cellular'
      case 'ethernet':
        return 'ethernet'
      default:
        return 'unknown'
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => this.handleConnectionChange())
    window.addEventListener('offline', () => this.handleConnectionChange())
    
    // Connection change events
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', () => this.handleConnectionChange())
    }
    
    // Visibility change - check connection when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection()
      }
    })
  }

  // Handle connection changes
  private handleConnectionChange(): void {
    const newStatus = this.getNetworkStatus()
    
    // Check if status actually changed
    if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
      const wasOffline = !this.currentStatus.online
      const isNowOnline = newStatus.online
      
      this.currentStatus = newStatus
      
      // Notify listeners
      this.notifyListeners(newStatus)
      
      // If we came back online, trigger sync
      if (wasOffline && isNowOnline) {
        this.triggerSync()
      }
    }
  }

  // Ping monitoring for more accurate online detection
  private startPingMonitoring(): void {
    // Check every 30 seconds
    this.pingInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkConnection()
      }
    }, 30000)
  }

  // Check actual connection by pinging a reliable endpoint
  private async checkConnection(): Promise<void> {
    // Throttle pings
    const now = Date.now()
    if (now - this.lastPingTime < 5000) return
    this.lastPingTime = now
    
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      })
      
      clearTimeout(timeout)
      
      if (!response.ok && this.currentStatus.online) {
        // We think we're online but can't reach our server
        this.handleConnectionChange()
      }
    } catch (error) {
      if (this.currentStatus.online) {
        // Connection failed, update status
        this.handleConnectionChange()
      }
    }
  }

  // Trigger sync when coming back online
  private triggerSync(): void {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('sync-meta-data')
      }).catch(error => {
        console.error('Failed to register sync:', error)
      })
    }
    
    // Also dispatch custom event
    window.dispatchEvent(new CustomEvent('network-reconnected', {
      detail: this.currentStatus
    }))
  }

  // Notify all listeners
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Network listener error:', error)
      }
    })
  }

  // Public API

  // Get current status
  getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  // Check if online
  isOnline(): boolean {
    return this.currentStatus.online
  }

  // Check if connection is good enough for heavy operations
  isConnectionGood(): boolean {
    return this.currentStatus.online && 
           (this.currentStatus.quality === 'good' || this.currentStatus.quality === 'excellent')
  }

  // Check if on cellular to avoid heavy downloads
  isOnCellular(): boolean {
    return this.currentStatus.type === 'cellular'
  }

  // Check if save data is enabled
  isSaveDataEnabled(): boolean {
    return this.currentStatus.saveData === true
  }

  // Add listener for network changes
  addListener(listener: NetworkChangeListener): void {
    this.listeners.add(listener)
  }

  // Remove listener
  removeListener(listener: NetworkChangeListener): void {
    this.listeners.delete(listener)
  }

  // Force connection check
  async checkNow(): Promise<NetworkStatus> {
    await this.checkConnection()
    this.handleConnectionChange()
    return this.getStatus()
  }

  // Cleanup
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    this.listeners.clear()
  }

  // Wait for online status
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) return true
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.removeListener(listener)
        resolve(false)
      }, timeout)
      
      const listener = (status: NetworkStatus) => {
        if (status.online) {
          clearTimeout(timer)
          this.removeListener(listener)
          resolve(true)
        }
      }
      
      this.addListener(listener)
    })
  }
}

// Export singleton instance
export const networkMonitor = NetworkMonitor.getInstance()

// React hook for network status
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState(() => networkMonitor.getStatus())
  
  useEffect(() => {
    const listener = (newStatus: NetworkStatus) => {
      setStatus(newStatus)
    }
    
    networkMonitor.addListener(listener)
    
    return () => {
      networkMonitor.removeListener(listener)
    }
  }, [])
  
  return status
}

// Import React hooks if in React environment
import { useState, useEffect } from 'react'