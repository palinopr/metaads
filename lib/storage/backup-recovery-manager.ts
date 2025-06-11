// Data backup and recovery systems
import { z } from 'zod'
import { AgentNamespace, StorageEntry, UnifiedStorageManager } from './unified-storage-manager'
import { SafeStorage } from '../storage-utils'
import { IndexedDBOptimizer } from './indexeddb-optimizer'
import { EncryptionManager, EncryptedData } from './encryption-manager'
import { CompressionManager, CompressedData } from './compression-utils'

// Backup configuration schema
const BackupConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  schedule: z.enum(['manual', 'hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  retention: z.number().positive().default(30), // Days to keep backups
  compression: z.boolean().default(true),
  encryption: z.boolean().default(true),
  includeNamespaces: z.array(z.nativeEnum(AgentNamespace)).optional(),
  excludeNamespaces: z.array(z.nativeEnum(AgentNamespace)).optional(),
  incremental: z.boolean().default(false),
  maxSize: z.number().positive().optional(), // Maximum backup size in bytes
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
})

export type BackupConfig = z.infer<typeof BackupConfigSchema>

// Backup metadata
export interface BackupMetadata {
  id: string
  config: BackupConfig
  timestamp: number
  size: number
  compressed: boolean
  encrypted: boolean
  version: string
  entryCount: number
  namespaces: AgentNamespace[]
  checksum: string
  duration: number
  type: 'full' | 'incremental'
  parentBackupId?: string // For incremental backups
  status: 'creating' | 'completed' | 'failed' | 'corrupted'
  error?: string
}

// Backup data structure
export interface BackupData {
  metadata: BackupMetadata
  data: {
    localStorage: Record<string, any>
    sessionStorage: Record<string, any>
    indexedDB: Record<string, any[]>
    settings: Record<string, any>
  }
}

// Recovery options
export interface RecoveryOptions {
  backupId: string
  targetNamespaces?: AgentNamespace[]
  overwriteExisting?: boolean
  dryRun?: boolean
  validateBeforeRestore?: boolean
  createRestorePoint?: boolean
}

// Recovery result
export interface RecoveryResult {
  success: boolean
  backupId: string
  entriesRestored: number
  namespacesRestored: AgentNamespace[]
  errors: string[]
  warnings: string[]
  duration: number
  restorePointId?: string
}

// Restore point
export interface RestorePoint {
  id: string
  timestamp: number
  description: string
  size: number
  checksum: string
  data: Partial<BackupData['data']>
}

export class BackupRecoveryManager {
  private configs = new Map<string, BackupConfig>()
  private backups = new Map<string, BackupMetadata>()
  private restorePoints = new Map<string, RestorePoint>()
  private scheduledBackups = new Map<string, NodeJS.Timeout>()
  
  private storageManager: UnifiedStorageManager | null = null
  private indexedDB: IndexedDBOptimizer | null = null
  private encryptionManager: EncryptionManager | null = null
  private compressionManager = new CompressionManager()
  
  private readonly CONFIGS_KEY = '_backup_configs'
  private readonly METADATA_KEY = '_backup_metadata'
  private readonly RESTORE_POINTS_KEY = '_restore_points'
  private readonly BACKUP_PREFIX = '_backup_'
  private readonly MAX_RESTORE_POINTS = 10

  constructor(
    storageManager?: UnifiedStorageManager,
    indexedDB?: IndexedDBOptimizer,
    encryptionManager?: EncryptionManager
  ) {
    this.storageManager = storageManager || null
    this.indexedDB = indexedDB || null
    this.encryptionManager = encryptionManager || null
    
    this.loadConfigs()
    this.loadMetadata()
    this.loadRestorePoints()
    this.scheduleConfiguredBackups()
  }

  // Configuration management
  addBackupConfig(config: BackupConfig): void {
    const validated = BackupConfigSchema.parse(config)
    this.configs.set(validated.id, validated)
    this.saveConfigs()

    if (validated.schedule !== 'manual') {
      this.scheduleBackup(validated.id)
    }
  }

  updateBackupConfig(id: string, updates: Partial<BackupConfig>): void {
    const existing = this.configs.get(id)
    if (!existing) {
      throw new Error(`Backup config ${id} not found`)
    }

    const updated = BackupConfigSchema.parse({ ...existing, ...updates })
    this.configs.set(id, updated)
    this.saveConfigs()

    // Reschedule if needed
    this.unscheduleBackup(id)
    if (updated.schedule !== 'manual') {
      this.scheduleBackup(id)
    }
  }

  removeBackupConfig(id: string): void {
    this.configs.delete(id)
    this.unscheduleBackup(id)
    this.saveConfigs()
  }

  getBackupConfig(id: string): BackupConfig | undefined {
    return this.configs.get(id)
  }

  getAllBackupConfigs(): BackupConfig[] {
    return Array.from(this.configs.values())
  }

  // Backup creation
  async createBackup(configId: string, options: {
    type?: 'full' | 'incremental'
    description?: string
  } = {}): Promise<BackupMetadata> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Backup config ${configId} not found`)
    }

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    // Determine backup type
    const backupType = options.type || (config.incremental ? 'incremental' : 'full')
    let parentBackupId: string | undefined

    if (backupType === 'incremental') {
      parentBackupId = this.getLatestBackupId(configId)
      if (!parentBackupId) {
        // No previous backup, create full backup instead
        console.warn('No previous backup found, creating full backup instead of incremental')
      }
    }

    // Create initial metadata
    const metadata: BackupMetadata = {
      id: backupId,
      config,
      timestamp: startTime,
      size: 0,
      compressed: config.compression,
      encrypted: config.encryption,
      version: '1.0.0',
      entryCount: 0,
      namespaces: [],
      checksum: '',
      duration: 0,
      type: parentBackupId ? 'incremental' : 'full',
      parentBackupId,
      status: 'creating'
    }

    this.backups.set(backupId, metadata)

    try {
      // Collect data to backup
      const backupData = await this.collectBackupData(config, parentBackupId)
      
      // Update metadata
      metadata.entryCount = this.countEntries(backupData.data)
      metadata.namespaces = this.extractNamespaces(backupData.data)

      // Process data (compress/encrypt)
      const processedData = await this.processBackupData(backupData, config)
      
      // Calculate size and checksum
      const serialized = JSON.stringify(processedData)
      metadata.size = new Blob([serialized]).size
      metadata.checksum = await this.calculateChecksum(serialized)

      // Store backup
      await this.storeBackup(backupId, processedData)

      // Update metadata
      metadata.status = 'completed'
      metadata.duration = Date.now() - startTime
      
      this.backups.set(backupId, metadata)
      this.saveMetadata()

      // Cleanup old backups
      await this.cleanupOldBackups(configId)

      return metadata

    } catch (error) {
      metadata.status = 'failed'
      metadata.error = error instanceof Error ? error.message : 'Unknown error'
      metadata.duration = Date.now() - startTime
      
      this.backups.set(backupId, metadata)
      this.saveMetadata()
      
      throw error
    }
  }

  private async collectBackupData(
    config: BackupConfig,
    parentBackupId?: string
  ): Promise<BackupData> {
    const data: BackupData['data'] = {
      localStorage: {},
      sessionStorage: {},
      indexedDB: {},
      settings: {}
    }

    const lastBackupTime = parentBackupId ? this.backups.get(parentBackupId)?.timestamp : 0

    // Collect localStorage data
    const localKeys = SafeStorage.getKeys()
    for (const key of localKeys) {
      if (this.shouldIncludeKey(key, config)) {
        const entry = SafeStorage.getItem<StorageEntry>(key)
        if (entry && (!parentBackupId || entry.updated > lastBackupTime!)) {
          data.localStorage[key] = entry
        }
      }
    }

    // Collect sessionStorage data
    const sessionKeys = SafeStorage.getKeys(true)
    for (const key of sessionKeys) {
      if (this.shouldIncludeKey(key, config)) {
        const entry = SafeStorage.getItem<StorageEntry>(key, true)
        if (entry && (!parentBackupId || entry.updated > lastBackupTime!)) {
          data.sessionStorage[key] = entry
        }
      }
    }

    // Collect IndexedDB data
    if (this.indexedDB) {
      try {
        const stores = ['campaigns', 'insights', 'cache', 'user_preferences', 'audit_logs']
        
        for (const store of stores) {
          const entries = await this.indexedDB.query<StorageEntry>(store)
          const filteredEntries = entries.filter(entry => {
            if (!this.shouldIncludeEntry(entry, config)) return false
            if (parentBackupId && entry.updated <= lastBackupTime!) return false
            return true
          })
          
          if (filteredEntries.length > 0) {
            data.indexedDB[store] = filteredEntries
          }
        }
      } catch (error) {
        console.warn('Failed to collect IndexedDB data:', error)
      }
    }

    // Collect system settings
    data.settings = {
      version: SafeStorage.getItem('_app_version'),
      preferences: SafeStorage.getItem('_user_preferences'),
      config: SafeStorage.getItem('_app_config')
    }

    return {
      metadata: {} as BackupMetadata, // Will be filled later
      data
    }
  }

  private shouldIncludeKey(key: string, config: BackupConfig): boolean {
    // Skip system keys
    if (key.startsWith('_backup_') || key.startsWith('_restore_')) {
      return false
    }

    // Extract namespace from key
    const namespace = key.split(':')[0] as AgentNamespace
    
    // Check include/exclude lists
    if (config.includeNamespaces && config.includeNamespaces.length > 0) {
      return config.includeNamespaces.includes(namespace)
    }
    
    if (config.excludeNamespaces && config.excludeNamespaces.length > 0) {
      return !config.excludeNamespaces.includes(namespace)
    }

    return true
  }

  private shouldIncludeEntry(entry: StorageEntry, config: BackupConfig): boolean {
    // Check include/exclude lists
    if (config.includeNamespaces && config.includeNamespaces.length > 0) {
      return config.includeNamespaces.includes(entry.namespace)
    }
    
    if (config.excludeNamespaces && config.excludeNamespaces.length > 0) {
      return !config.excludeNamespaces.includes(entry.namespace)
    }

    return true
  }

  private countEntries(data: BackupData['data']): number {
    return Object.keys(data.localStorage).length +
           Object.keys(data.sessionStorage).length +
           Object.values(data.indexedDB).reduce((sum, entries) => sum + entries.length, 0)
  }

  private extractNamespaces(data: BackupData['data']): AgentNamespace[] {
    const namespaces = new Set<AgentNamespace>()

    // From localStorage keys
    for (const key of Object.keys(data.localStorage)) {
      const namespace = key.split(':')[0] as AgentNamespace
      if (Object.values(AgentNamespace).includes(namespace)) {
        namespaces.add(namespace)
      }
    }

    // From sessionStorage keys
    for (const key of Object.keys(data.sessionStorage)) {
      const namespace = key.split(':')[0] as AgentNamespace
      if (Object.values(AgentNamespace).includes(namespace)) {
        namespaces.add(namespace)
      }
    }

    // From IndexedDB entries
    for (const entries of Object.values(data.indexedDB)) {
      for (const entry of entries) {
        if ('namespace' in entry) {
          namespaces.add(entry.namespace as AgentNamespace)
        }
      }
    }

    return Array.from(namespaces)
  }

  private async processBackupData(
    backupData: BackupData,
    config: BackupConfig
  ): Promise<string | EncryptedData> {
    let data = JSON.stringify(backupData)

    // Compress if enabled
    if (config.compression) {
      const compressed = await this.compressionManager.compress(data)
      if (compressed.compressionRatio > 1.1) {
        data = JSON.stringify(compressed)
      }
    }

    // Encrypt if enabled
    if (config.encryption && this.encryptionManager) {
      const encrypted = await this.encryptionManager.encrypt(data, {
        purpose: 'backup_storage',
        classification: 'restricted',
        retention: config.retention * 24 * 60 * 60 * 1000
      })
      return encrypted
    }

    return data
  }

  private async storeBackup(backupId: string, data: string | EncryptedData): Promise<void> {
    const key = `${this.BACKUP_PREFIX}${backupId}`
    
    // Try IndexedDB first
    if (this.indexedDB) {
      try {
        await this.indexedDB.put('cache', {
          key,
          data,
          timestamp: Date.now(),
          category: 'backup'
        })
        return
      } catch (error) {
        console.warn('Failed to store backup in IndexedDB:', error)
      }
    }

    // Fallback to localStorage
    SafeStorage.setItem(key, data)
  }

  // Recovery operations
  async recoverFromBackup(options: RecoveryOptions): Promise<RecoveryResult> {
    const metadata = this.backups.get(options.backupId)
    if (!metadata) {
      throw new Error(`Backup ${options.backupId} not found`)
    }

    if (metadata.status !== 'completed') {
      throw new Error(`Backup ${options.backupId} is not in completed state`)
    }

    const startTime = Date.now()
    const result: RecoveryResult = {
      success: false,
      backupId: options.backupId,
      entriesRestored: 0,
      namespacesRestored: [],
      errors: [],
      warnings: [],
      duration: 0
    }

    try {
      // Create restore point if requested
      if (options.createRestorePoint) {
        result.restorePointId = await this.createRestorePoint(`Before restore from ${options.backupId}`)
      }

      // Load backup data
      const backupData = await this.loadBackup(options.backupId)
      
      // Validate backup if requested
      if (options.validateBeforeRestore) {
        const isValid = await this.validateBackup(metadata, backupData)
        if (!isValid) {
          throw new Error('Backup validation failed')
        }
      }

      // Restore data
      if (options.dryRun) {
        result.warnings.push('Dry run mode - no data was actually restored')
      } else {
        await this.restoreBackupData(backupData, options, result)
      }

      result.success = true
      result.duration = Date.now() - startTime

    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      result.duration = Date.now() - startTime
    }

    return result
  }

  private async loadBackup(backupId: string): Promise<BackupData> {
    const key = `${this.BACKUP_PREFIX}${backupId}`
    
    // Try IndexedDB first
    if (this.indexedDB) {
      try {
        const stored = await this.indexedDB.get<any>('cache', key)
        if (stored) {
          return this.processLoadedBackup(stored.data)
        }
      } catch (error) {
        console.warn('Failed to load backup from IndexedDB:', error)
      }
    }

    // Fallback to localStorage
    const stored = SafeStorage.getItem<any>(key)
    if (!stored) {
      throw new Error(`Backup data not found for ${backupId}`)
    }

    return this.processLoadedBackup(stored)
  }

  private async processLoadedBackup(data: string | EncryptedData): Promise<BackupData> {
    let processedData = data

    // Decrypt if needed
    if (typeof data === 'object' && 'algorithm' in data && this.encryptionManager) {
      processedData = await this.encryptionManager.decrypt(data as EncryptedData)
    }

    // Decompress if needed
    if (typeof processedData === 'string') {
      try {
        const parsed = JSON.parse(processedData)
        if (parsed.algorithm && parsed.data) {
          // This is compressed data
          processedData = await this.compressionManager.decompress(parsed)
        }
      } catch {
        // Not compressed, use as is
      }
    }

    return JSON.parse(processedData as string)
  }

  private async restoreBackupData(
    backupData: BackupData,
    options: RecoveryOptions,
    result: RecoveryResult
  ): Promise<void> {
    const { targetNamespaces, overwriteExisting = false } = options

    // Restore localStorage data
    for (const [key, entry] of Object.entries(backupData.data.localStorage)) {
      if (this.shouldRestoreEntry(key, entry, targetNamespaces)) {
        if (!overwriteExisting && SafeStorage.getItem(key)) {
          result.warnings.push(`Skipped existing key: ${key}`)
          continue
        }

        try {
          SafeStorage.setItem(key, entry)
          result.entriesRestored++
        } catch (error) {
          result.errors.push(`Failed to restore ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Restore sessionStorage data
    for (const [key, entry] of Object.entries(backupData.data.sessionStorage)) {
      if (this.shouldRestoreEntry(key, entry, targetNamespaces)) {
        if (!overwriteExisting && SafeStorage.getItem(key, true)) {
          result.warnings.push(`Skipped existing session key: ${key}`)
          continue
        }

        try {
          SafeStorage.setItem(key, entry, { useSession: true })
          result.entriesRestored++
        } catch (error) {
          result.errors.push(`Failed to restore session ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Restore IndexedDB data
    if (this.indexedDB) {
      for (const [store, entries] of Object.entries(backupData.data.indexedDB)) {
        for (const entry of entries) {
          if (this.shouldRestoreEntry('', entry, targetNamespaces)) {
            try {
              if (!overwriteExisting) {
                const existing = await this.indexedDB.get(store, entry.key || entry.id)
                if (existing) {
                  result.warnings.push(`Skipped existing IndexedDB entry: ${entry.key || entry.id}`)
                  continue
                }
              }

              await this.indexedDB.put(store, entry)
              result.entriesRestored++
            } catch (error) {
              result.errors.push(`Failed to restore IndexedDB entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
        }
      }
    }

    // Track restored namespaces
    result.namespacesRestored = this.extractNamespaces(backupData.data)
  }

  private shouldRestoreEntry(key: string, entry: any, targetNamespaces?: AgentNamespace[]): boolean {
    if (!targetNamespaces || targetNamespaces.length === 0) {
      return true
    }

    // Extract namespace from key or entry
    let namespace: string | undefined
    
    if (key && key.includes(':')) {
      namespace = key.split(':')[0]
    } else if (entry && typeof entry === 'object' && entry.namespace) {
      namespace = entry.namespace
    }

    if (!namespace) {
      return true // Include if we can't determine namespace
    }

    return targetNamespaces.includes(namespace as AgentNamespace)
  }

  // Restore point management
  async createRestorePoint(description: string): Promise<string> {
    const id = `restore_point_${Date.now()}`
    
    // Collect current state
    const data: Partial<BackupData['data']> = {
      localStorage: {},
      sessionStorage: {},
      settings: {}
    }

    // Collect key data only (to save space)
    const criticalKeys = ['_app_version', '_user_preferences', '_app_config']
    for (const key of criticalKeys) {
      const value = SafeStorage.getItem(key)
      if (value) {
        data.localStorage![key] = value
      }
    }

    const serialized = JSON.stringify(data)
    const restorePoint: RestorePoint = {
      id,
      timestamp: Date.now(),
      description,
      size: new Blob([serialized]).size,
      checksum: await this.calculateChecksum(serialized),
      data
    }

    this.restorePoints.set(id, restorePoint)
    this.trimRestorePoints()
    this.saveRestorePoints()

    return id
  }

  async restoreFromRestorePoint(id: string): Promise<void> {
    const restorePoint = this.restorePoints.get(id)
    if (!restorePoint) {
      throw new Error(`Restore point ${id} not found`)
    }

    // Restore the data
    if (restorePoint.data.localStorage) {
      for (const [key, value] of Object.entries(restorePoint.data.localStorage)) {
        SafeStorage.setItem(key, value)
      }
    }

    if (restorePoint.data.sessionStorage) {
      for (const [key, value] of Object.entries(restorePoint.data.sessionStorage)) {
        SafeStorage.setItem(key, value, { useSession: true })
      }
    }
  }

  // Backup validation
  private async validateBackup(metadata: BackupMetadata, backupData: BackupData): Promise<boolean> {
    try {
      // Verify checksum
      const serialized = JSON.stringify(backupData)
      const currentChecksum = await this.calculateChecksum(serialized)
      
      if (currentChecksum !== metadata.checksum) {
        return false
      }

      // Verify entry count
      const actualCount = this.countEntries(backupData.data)
      if (actualCount !== metadata.entryCount) {
        return false
      }

      // Verify structure
      if (!backupData.data || !backupData.data.localStorage || !backupData.data.sessionStorage) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  // Scheduling
  private scheduleBackup(configId: string): void {
    const config = this.configs.get(configId)
    if (!config || config.schedule === 'manual') return

    let interval: number
    switch (config.schedule) {
      case 'hourly':
        interval = 60 * 60 * 1000
        break
      case 'daily':
        interval = 24 * 60 * 60 * 1000
        break
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000
        break
      case 'monthly':
        interval = 30 * 24 * 60 * 60 * 1000
        break
      default:
        return
    }

    const timer = setInterval(async () => {
      try {
        await this.createBackup(configId)
      } catch (error) {
        console.error(`Scheduled backup ${configId} failed:`, error)
      }
    }, interval)

    this.scheduledBackups.set(configId, timer)
  }

  private unscheduleBackup(configId: string): void {
    const timer = this.scheduledBackups.get(configId)
    if (timer) {
      clearInterval(timer)
      this.scheduledBackups.delete(configId)
    }
  }

  private scheduleConfiguredBackups(): void {
    for (const config of this.configs.values()) {
      if (config.schedule !== 'manual') {
        this.scheduleBackup(config.id)
      }
    }
  }

  // Cleanup
  private async cleanupOldBackups(configId: string): Promise<void> {
    const config = this.configs.get(configId)
    if (!config) return

    const cutoffTime = Date.now() - (config.retention * 24 * 60 * 60 * 1000)
    const toDelete: string[] = []

    for (const [backupId, metadata] of this.backups.entries()) {
      if (metadata.config.id === configId && metadata.timestamp < cutoffTime) {
        toDelete.push(backupId)
      }
    }

    for (const backupId of toDelete) {
      await this.deleteBackup(backupId)
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    // Remove backup data
    const key = `${this.BACKUP_PREFIX}${backupId}`
    
    if (this.indexedDB) {
      try {
        await this.indexedDB.delete('cache', key)
      } catch (error) {
        console.warn('Failed to delete backup from IndexedDB:', error)
      }
    }

    SafeStorage.removeItem(key)

    // Remove metadata
    this.backups.delete(backupId)
    this.saveMetadata()
  }

  private trimRestorePoints(): void {
    if (this.restorePoints.size > this.MAX_RESTORE_POINTS) {
      const sorted = Array.from(this.restorePoints.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = sorted.slice(0, sorted.length - this.MAX_RESTORE_POINTS)
      for (const [id] of toRemove) {
        this.restorePoints.delete(id)
      }
    }
  }

  private getLatestBackupId(configId: string): string | undefined {
    let latest: BackupMetadata | undefined
    
    for (const metadata of this.backups.values()) {
      if (metadata.config.id === configId && metadata.status === 'completed') {
        if (!latest || metadata.timestamp > latest.timestamp) {
          latest = metadata
        }
      }
    }

    return latest?.id
  }

  // Utility methods
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Persistence
  private loadConfigs(): void {
    try {
      const stored = SafeStorage.getItem<BackupConfig[]>(this.CONFIGS_KEY)
      if (stored && Array.isArray(stored)) {
        for (const config of stored) {
          this.configs.set(config.id, config)
        }
      }
    } catch (error) {
      console.warn('Failed to load backup configs:', error)
    }
  }

  private saveConfigs(): void {
    try {
      const configs = Array.from(this.configs.values())
      SafeStorage.setItem(this.CONFIGS_KEY, configs)
    } catch (error) {
      console.warn('Failed to save backup configs:', error)
    }
  }

  private loadMetadata(): void {
    try {
      const stored = SafeStorage.getItem<BackupMetadata[]>(this.METADATA_KEY)
      if (stored && Array.isArray(stored)) {
        for (const metadata of stored) {
          this.backups.set(metadata.id, metadata)
        }
      }
    } catch (error) {
      console.warn('Failed to load backup metadata:', error)
    }
  }

  private saveMetadata(): void {
    try {
      const metadata = Array.from(this.backups.values())
      SafeStorage.setItem(this.METADATA_KEY, metadata)
    } catch (error) {
      console.warn('Failed to save backup metadata:', error)
    }
  }

  private loadRestorePoints(): void {
    try {
      const stored = SafeStorage.getItem<RestorePoint[]>(this.RESTORE_POINTS_KEY)
      if (stored && Array.isArray(stored)) {
        for (const point of stored) {
          this.restorePoints.set(point.id, point)
        }
      }
    } catch (error) {
      console.warn('Failed to load restore points:', error)
    }
  }

  private saveRestorePoints(): void {
    try {
      const points = Array.from(this.restorePoints.values())
      SafeStorage.setItem(this.RESTORE_POINTS_KEY, points)
    } catch (error) {
      console.warn('Failed to save restore points:', error)
    }
  }

  // Public API
  getAllBackups(): BackupMetadata[] {
    return Array.from(this.backups.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  getBackupsByConfig(configId: string): BackupMetadata[] {
    return this.getAllBackups().filter(backup => backup.config.id === configId)
  }

  getAllRestorePoints(): RestorePoint[] {
    return Array.from(this.restorePoints.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  async exportBackup(backupId: string): Promise<Blob> {
    const backupData = await this.loadBackup(backupId)
    const serialized = JSON.stringify(backupData, null, 2)
    return new Blob([serialized], { type: 'application/json' })
  }

  async importBackup(file: File): Promise<string> {
    const text = await file.text()
    const backupData: BackupData = JSON.parse(text)
    
    // Generate new backup ID
    const backupId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store the backup
    await this.storeBackup(backupId, JSON.stringify(backupData))
    
    // Create metadata
    const metadata: BackupMetadata = {
      id: backupId,
      config: backupData.metadata.config,
      timestamp: Date.now(),
      size: file.size,
      compressed: false,
      encrypted: false,
      version: '1.0.0',
      entryCount: this.countEntries(backupData.data),
      namespaces: this.extractNamespaces(backupData.data),
      checksum: await this.calculateChecksum(text),
      duration: 0,
      type: 'full',
      status: 'completed'
    }

    this.backups.set(backupId, metadata)
    this.saveMetadata()

    return backupId
  }

  async destroy(): Promise<void> {
    // Clear all scheduled backups
    for (const timer of this.scheduledBackups.values()) {
      clearInterval(timer)
    }
    this.scheduledBackups.clear()

    // Save final state
    this.saveConfigs()
    this.saveMetadata()
    this.saveRestorePoints()
  }
}

// Common backup configurations
export class CommonBackupConfigs {
  static createDailyFullBackup(): BackupConfig {
    return {
      id: 'daily_full',
      name: 'Daily Full Backup',
      description: 'Complete backup of all data, created daily',
      schedule: 'daily',
      retention: 7, // Keep for 7 days
      compression: true,
      encryption: true,
      incremental: false,
      priority: 'high'
    }
  }

  static createWeeklyBackup(): BackupConfig {
    return {
      id: 'weekly_backup',
      name: 'Weekly Backup',
      description: 'Weekly backup for long-term retention',
      schedule: 'weekly',
      retention: 30, // Keep for 30 days
      compression: true,
      encryption: true,
      incremental: false,
      priority: 'medium'
    }
  }

  static createCriticalDataBackup(): BackupConfig {
    return {
      id: 'critical_data',
      name: 'Critical Data Backup',
      description: 'Backup of critical user data and settings',
      schedule: 'daily',
      retention: 30,
      compression: true,
      encryption: true,
      includeNamespaces: [
        AgentNamespace.AUTH,
        AgentNamespace.MULTI_ACCOUNT,
        AgentNamespace.AUTOMATION
      ],
      priority: 'critical'
    }
  }

  static createIncrementalBackup(): BackupConfig {
    return {
      id: 'incremental_backup',
      name: 'Incremental Backup',
      description: 'Hourly incremental backup for recent changes',
      schedule: 'hourly',
      retention: 3, // Keep for 3 days
      compression: true,
      encryption: false,
      incremental: true,
      priority: 'medium'
    }
  }
}