// Database & Storage Optimization System - Main Export
export * from './indexeddb-optimizer'
export * from './compression-utils'
export * from './sync-manager'
export * from './migration-manager'
export * from './encryption-manager'
export * from './unified-storage-manager'
export * from './retention-manager'
export * from './backup-recovery-manager'
export * from './performance-monitor'
export * from './quota-manager'

// Re-export main storage utils
export { SafeStorage, storage, sessionStorage } from '../storage-utils'

// Main storage system initialization
import { 
  UnifiedStorageManager, 
  StorageManagerFactory, 
  AgentNamespace, 
  type StorageConfig 
} from './unified-storage-manager'
import { RetentionManager, CommonRetentionPolicies } from './retention-manager'
import { MigrationManager, CommonMigrations } from './migration-manager'
import { IndexedDBFactory } from './indexeddb-optimizer'
import { BackupRecoveryManager, CommonBackupConfigs } from './backup-recovery-manager'
import { StoragePerformanceMonitor, CommonAlerts } from './performance-monitor'
import { QuotaManager, DEFAULT_NAMESPACE_QUOTAS } from './quota-manager'

export interface StorageSystemConfig extends StorageConfig {
  masterPassword?: string
  enableRetentionPolicies?: boolean
  enableMigrations?: boolean
  enableBackups?: boolean
  enablePerformanceMonitoring?: boolean
  enableQuotaManagement?: boolean
  debugMode?: boolean
}

/**
 * Initialize the complete storage optimization system
 * This is the main entry point for all storage functionality
 */
export async function initializeStorageSystem(
  config: StorageSystemConfig = {}
): Promise<{
  storageManager: UnifiedStorageManager
  retentionManager: RetentionManager
  migrationManager: MigrationManager
  backupManager?: BackupRecoveryManager
  performanceMonitor?: StoragePerformanceMonitor
  quotaManager?: QuotaManager
  agentStorage: (namespace: AgentNamespace) => any
}> {
  const {
    masterPassword,
    enableRetentionPolicies = true,
    enableMigrations = true,
    enableBackups = true,
    enablePerformanceMonitoring = true,
    enableQuotaManagement = true,
    debugMode = false,
    ...storageConfig
  } = config

  if (debugMode) {
    console.log('🚀 Initializing Meta Ads Storage Optimization System...')
  }

  try {
    // 1. Initialize main storage manager
    const storageManager = await StorageManagerFactory.create(storageConfig, masterPassword)
    
    if (debugMode) {
      console.log('✅ Unified Storage Manager initialized')
    }

    // 2. Initialize IndexedDB for retention manager
    const indexedDB = await IndexedDBFactory.createMetaAdsDB()
    
    // 3. Initialize retention manager
    const retentionManager = new RetentionManager(indexedDB)
    
    if (enableRetentionPolicies) {
      // Add common retention policies
      const policies = [
        CommonRetentionPolicies.createCachePolicy(),
        CommonRetentionPolicies.createTempPolicy(),
        CommonRetentionPolicies.createSessionPolicy(),
        CommonRetentionPolicies.createAnalyticsPolicy(),
        CommonRetentionPolicies.createUnusedDataPolicy()
      ]
      
      for (const policy of policies) {
        retentionManager.addPolicy(policy)
      }
      
      if (debugMode) {
        console.log('✅ Retention policies configured')
      }
    }

    // 4. Initialize migration manager
    const migrationManager = new MigrationManager()
    
    if (enableMigrations) {
      // Register common migrations
      migrationManager.registerMigration(
        CommonMigrations.createStorageStructureMigration('1.0.0')
      )
      
      // Check for needed migrations
      if (migrationManager.needsMigration()) {
        if (debugMode) {
          console.log('🔄 Running database migrations...')
        }
        await migrationManager.migrate()
      }
      
      if (debugMode) {
        console.log('✅ Database migrations completed')
      }
    }

    // 5. Initialize backup manager
    let backupManager: BackupRecoveryManager | undefined
    if (enableBackups) {
      backupManager = new BackupRecoveryManager(
        storageManager,
        indexedDB,
        storageManager.getAgentStorage(AgentNamespace.SHARED)['encryptionManager']
      )

      // Add common backup configurations
      backupManager.addBackupConfig(CommonBackupConfigs.createDailyFullBackup())
      backupManager.addBackupConfig(CommonBackupConfigs.createCriticalDataBackup())

      if (debugMode) {
        console.log('✅ Backup manager initialized')
      }
    }

    // 6. Initialize performance monitor
    let performanceMonitor: StoragePerformanceMonitor | undefined
    if (enablePerformanceMonitoring) {
      performanceMonitor = new StoragePerformanceMonitor()

      // Add common alerts
      performanceMonitor.addAlert(CommonAlerts.createHighLatencyAlert())
      performanceMonitor.addAlert(CommonAlerts.createHighErrorRateAlert())
      performanceMonitor.addAlert(CommonAlerts.createLowCacheHitRateAlert())

      if (debugMode) {
        console.log('✅ Performance monitoring initialized')
      }
    }

    // 7. Initialize quota manager
    let quotaManager: QuotaManager | undefined
    if (enableQuotaManagement) {
      quotaManager = new QuotaManager({
        globalLimit: storageConfig.quota?.maxLocalStorage || 10 * 1024 * 1024,
        namespaceQuotas: DEFAULT_NAMESPACE_QUOTAS,
        autoCleanup: true,
        enforceQuotas: true
      })

      if (debugMode) {
        console.log('✅ Quota management initialized')
      }
    }

    // 8. Helper function for agent storage access
    const agentStorage = (namespace: AgentNamespace) => {
      const agentStorageInterface = storageManager.getAgentStorage(namespace)
      
      // Wrap with performance monitoring if enabled
      if (performanceMonitor) {
        return new Proxy(agentStorageInterface, {
          get(target, prop) {
            const originalMethod = target[prop as keyof typeof target]
            
            if (typeof originalMethod === 'function') {
              return function(...args: any[]) {
                const startTime = Date.now()
                const result = originalMethod.apply(target, args)
                
                // Record performance metric for async operations
                if (result instanceof Promise) {
                  return result.then(
                    (value) => {
                      performanceMonitor!.recordOperation(
                        prop as any, namespace, args[0] || '', startTime, true,
                        { size: JSON.stringify(value || '').length }
                      )
                      return value
                    },
                    (error) => {
                      performanceMonitor!.recordOperation(
                        prop as any, namespace, args[0] || '', startTime, false,
                        { error: error.message }
                      )
                      throw error
                    }
                  )
                } else {
                  performanceMonitor!.recordOperation(
                    prop as any, namespace, args[0] || '', startTime, true,
                    { size: JSON.stringify(result || '').length }
                  )
                  return result
                }
              }
            }
            
            return originalMethod
          }
        })
      }
      
      return agentStorageInterface
    }

    if (debugMode) {
      console.log('🎉 Storage Optimization System ready!')
      
      // Log system health
      const health = await storageManager.healthCheck()
      console.log('📊 System Health:', health.healthy ? '✅ Healthy' : '⚠️ Issues detected')
      
      if (!health.healthy) {
        console.warn('Issues:', health.issues)
      }

      // Log component status
      console.log('📋 Components initialized:')
      console.log(`  • Storage Manager: ✅`)
      console.log(`  • Retention Manager: ✅`)
      console.log(`  • Migration Manager: ✅`)
      console.log(`  • Backup Manager: ${backupManager ? '✅' : '❌'}`)
      console.log(`  • Performance Monitor: ${performanceMonitor ? '✅' : '❌'}`)
      console.log(`  • Quota Manager: ${quotaManager ? '✅' : '❌'}`)
    }

    return {
      storageManager,
      retentionManager,
      migrationManager,
      backupManager,
      performanceMonitor,
      quotaManager,
      agentStorage
    }

  } catch (error) {
    console.error('❌ Failed to initialize storage system:', error)
    throw error
  }
}

/**
 * Agent-specific storage configurations
 * Each agent gets optimized storage settings based on their needs
 */
export const AGENT_STORAGE_CONFIGS = {
  [AgentNamespace.AUTH]: {
    classification: 'restricted' as const,
    encrypt: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['auth', 'credentials']
  },
  
  [AgentNamespace.PERFORMANCE]: {
    classification: 'internal' as const,
    compress: true,
    ttl: 60 * 60 * 1000, // 1 hour
    tags: ['metrics', 'performance']
  },
  
  [AgentNamespace.DATA_PIPELINE]: {
    classification: 'internal' as const,
    compress: true,
    sync: true,
    ttl: 30 * 60 * 1000, // 30 minutes
    tags: ['pipeline', 'data']
  },
  
  [AgentNamespace.AI_INSIGHTS]: {
    classification: 'confidential' as const,
    encrypt: true,
    compress: true,
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    tags: ['ai', 'insights', 'predictions']
  },
  
  [AgentNamespace.MULTI_ACCOUNT]: {
    classification: 'confidential' as const,
    encrypt: true,
    sync: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['accounts', 'portfolio']
  },
  
  [AgentNamespace.AUTOMATION]: {
    classification: 'internal' as const,
    sync: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    tags: ['automation', 'rules']
  },
  
  [AgentNamespace.REALTIME]: {
    classification: 'internal' as const,
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['realtime', 'streaming']
  },
  
  [AgentNamespace.CREATIVE]: {
    classification: 'internal' as const,
    compress: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    tags: ['creative', 'assets']
  },
  
  [AgentNamespace.COMPETITOR]: {
    classification: 'confidential' as const,
    encrypt: true,
    compress: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['competitor', 'analysis']
  },
  
  [AgentNamespace.MONITORING]: {
    classification: 'internal' as const,
    compress: true,
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    tags: ['monitoring', 'logs']
  },
  
  [AgentNamespace.SHARED]: {
    classification: 'public' as const,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    tags: ['shared', 'common']
  }
}

/**
 * Utility function to get optimized storage for a specific agent
 */
export function getAgentStorageConfig(namespace: AgentNamespace) {
  return AGENT_STORAGE_CONFIGS[namespace] || AGENT_STORAGE_CONFIGS[AgentNamespace.SHARED]
}

/**
 * Quick setup function for development/testing
 */
export async function setupStorageForDevelopment(): Promise<ReturnType<typeof initializeStorageSystem>> {
  return initializeStorageSystem({
    debugMode: true,
    encryption: {
      enabled: false // Disable encryption for development
    },
    sync: {
      enabled: false // Disable sync for development
    },
    retention: {
      enabled: true,
      defaultTTL: 60 * 60 * 1000 // 1 hour for development
    }
  })
}

/**
 * Production setup with full security
 */
export async function setupStorageForProduction(masterPassword: string): Promise<ReturnType<typeof initializeStorageSystem>> {
  return initializeStorageSystem({
    masterPassword,
    debugMode: false,
    encryption: {
      enabled: true,
      algorithm: 'AES-GCM',
      keyRotationInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    compression: {
      enabled: true,
      algorithm: 'LZ77',
      threshold: 512 // 512 bytes
    },
    sync: {
      enabled: true,
      interval: 30000, // 30 seconds
      conflictResolution: 'timestamp'
    },
    retention: {
      enabled: true,
      defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
      cleanupInterval: 6 * 60 * 60 * 1000 // 6 hours
    },
    quota: {
      enabled: true,
      maxLocalStorage: 50 * 1024 * 1024, // 50MB
      maxIndexedDB: 500 * 1024 * 1024, // 500MB
      maxMemory: 100 * 1024 * 1024 // 100MB
    }
  })
}

/**
 * Storage system health check
 */
export async function performStorageHealthCheck(): Promise<{
  healthy: boolean
  issues: string[]
  recommendations: string[]
  metrics: any
}> {
  const storageManager = StorageManagerFactory.getInstance()
  
  if (!storageManager) {
    return {
      healthy: false,
      issues: ['Storage system not initialized'],
      recommendations: ['Initialize storage system before use'],
      metrics: {}
    }
  }

  const health = await storageManager.healthCheck()
  const recommendations: string[] = []

  // Add recommendations based on health issues
  if (health.issues.includes('Storage quota exceeded')) {
    recommendations.push('Run cleanup to free up storage space')
    recommendations.push('Consider increasing storage quota limits')
  }

  if (health.issues.includes('Encryption manager not initialized')) {
    recommendations.push('Initialize encryption with master password for production use')
  }

  if (health.issues.some(issue => issue.includes('performance'))) {
    recommendations.push('Consider optimizing data compression settings')
    recommendations.push('Review retention policies to reduce data volume')
  }

  return {
    healthy: health.healthy,
    issues: health.issues,
    recommendations,
    metrics: health.metrics
  }
}

// Export types for external use
export type {
  StorageConfig,
  StorageEntry,
  StorageMetrics,
  QueryOptions,
  RetentionPolicy,
  CleanupResult,
  EncryptedData,
  CompressedData,
  SyncConfig,
  MigrationConfig
} from './unified-storage-manager'