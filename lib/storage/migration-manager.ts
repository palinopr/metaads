// Database migration and versioning system
import { z } from 'zod'
import { SafeStorage } from '../storage-utils'
import { IndexedDBOptimizer } from './indexeddb-optimizer'
import { StorageSyncManager } from './sync-manager'

// Migration configuration schema
const MigrationConfigSchema = z.object({
  version: z.string(),
  description: z.string(),
  rollbackSupported: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedDuration: z.number().optional(),
  dependencies: z.array(z.string()).default([]),
  backupRequired: z.boolean().default(true)
})

export type MigrationConfig = z.infer<typeof MigrationConfigSchema>

// Migration status
export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  SKIPPED = 'skipped'
}

// Migration execution context
export interface MigrationContext {
  indexedDB?: IndexedDBOptimizer
  syncManager?: StorageSyncManager
  localStorage: typeof SafeStorage
  sessionStorage: typeof SafeStorage
  version: {
    from: string
    to: string
  }
  config: Record<string, any>
  backup?: BackupData
}

// Migration interface
export interface Migration {
  config: MigrationConfig
  up(context: MigrationContext): Promise<void>
  down?(context: MigrationContext): Promise<void>
  validate?(context: MigrationContext): Promise<boolean>
}

// Migration record
export interface MigrationRecord {
  version: string
  status: MigrationStatus
  startTime: number
  endTime?: number
  duration?: number
  error?: string
  backupId?: string
  rollbackId?: string
  metadata?: Record<string, any>
}

// Backup data structure
export interface BackupData {
  id: string
  version: string
  timestamp: number
  size: number
  data: {
    localStorage: Record<string, any>
    sessionStorage: Record<string, any>
    indexedDB?: Record<string, any[]>
    metadata: Record<string, any>
  }
  checksum: string
}

// Version management
export interface VersionInfo {
  current: string
  available: string[]
  migrations: MigrationRecord[]
  lastMigration?: string
  rollbackAvailable: boolean
}

export class MigrationManager {
  private migrations = new Map<string, Migration>()
  private records: MigrationRecord[] = []
  private backups = new Map<string, BackupData>()
  private readonly STORAGE_KEY = '_migration_data'
  private readonly BACKUP_KEY = '_migration_backups'
  private readonly VERSION_KEY = '_app_version'

  constructor() {
    this.loadMigrationData()
  }

  // Register a migration
  registerMigration(migration: Migration): void {
    const config = MigrationConfigSchema.parse(migration.config)
    this.migrations.set(config.version, {
      ...migration,
      config
    })
  }

  // Get current version
  getCurrentVersion(): string {
    return SafeStorage.getItem<string>(this.VERSION_KEY) || '0.0.0'
  }

  // Set current version
  private setCurrentVersion(version: string): void {
    SafeStorage.setItem(this.VERSION_KEY, version)
  }

  // Get version information
  getVersionInfo(): VersionInfo {
    const current = this.getCurrentVersion()
    const available = Array.from(this.migrations.keys()).sort(this.compareVersions)
    const rollbackAvailable = this.canRollback()

    return {
      current,
      available,
      migrations: this.records,
      lastMigration: this.getLastMigration()?.version,
      rollbackAvailable
    }
  }

  // Check if migrations are needed
  needsMigration(targetVersion?: string): boolean {
    const current = this.getCurrentVersion()
    const target = targetVersion || this.getLatestVersion()
    return this.compareVersions(current, target) < 0
  }

  // Get migrations needed to reach target version
  getMigrationsNeeded(targetVersion?: string): Migration[] {
    const current = this.getCurrentVersion()
    const target = targetVersion || this.getLatestVersion()
    
    if (this.compareVersions(current, target) >= 0) {
      return []
    }

    const needed: Migration[] = []
    const sortedVersions = Array.from(this.migrations.keys())
      .sort(this.compareVersions)

    for (const version of sortedVersions) {
      if (this.compareVersions(version, current) > 0 && 
          this.compareVersions(version, target) <= 0) {
        const migration = this.migrations.get(version)!
        needed.push(migration)
      }
    }

    // Sort by dependencies
    return this.resolveDependencies(needed)
  }

  // Execute migrations
  async migrate(
    targetVersion?: string,
    context: Partial<MigrationContext> = {}
  ): Promise<MigrationRecord[]> {
    const migrations = this.getMigrationsNeeded(targetVersion)
    
    if (migrations.length === 0) {
      return []
    }

    const results: MigrationRecord[] = []
    const currentVersion = this.getCurrentVersion()
    
    for (const migration of migrations) {
      const record = await this.executeMigration(migration, {
        ...context,
        version: {
          from: currentVersion,
          to: migration.config.version
        }
      })
      
      results.push(record)
      
      if (record.status === MigrationStatus.FAILED) {
        break
      }
      
      this.setCurrentVersion(migration.config.version)
    }

    this.saveMigrationData()
    return results
  }

  // Execute a single migration
  private async executeMigration(
    migration: Migration,
    context: Partial<MigrationContext>
  ): Promise<MigrationRecord> {
    const record: MigrationRecord = {
      version: migration.config.version,
      status: MigrationStatus.PENDING,
      startTime: Date.now()
    }

    try {
      record.status = MigrationStatus.IN_PROGRESS
      this.records.push(record)

      // Create backup if required
      if (migration.config.backupRequired) {
        const backup = await this.createBackup(migration.config.version)
        record.backupId = backup.id
      }

      // Prepare migration context
      const migrationContext: MigrationContext = {
        localStorage: SafeStorage,
        sessionStorage: SafeStorage,
        config: {},
        ...context,
        version: context.version || {
          from: this.getCurrentVersion(),
          to: migration.config.version
        }
      }

      // Validate pre-conditions
      if (migration.validate) {
        const isValid = await migration.validate(migrationContext)
        if (!isValid) {
          throw new Error('Migration validation failed')
        }
      }

      // Execute migration
      await migration.up(migrationContext)

      // Post-migration validation
      if (migration.validate) {
        const isValid = await migration.validate(migrationContext)
        if (!isValid) {
          throw new Error('Post-migration validation failed')
        }
      }

      record.status = MigrationStatus.COMPLETED
      record.endTime = Date.now()
      record.duration = record.endTime - record.startTime

    } catch (error) {
      record.status = MigrationStatus.FAILED
      record.error = error instanceof Error ? error.message : 'Unknown error'
      record.endTime = Date.now()
      record.duration = record.endTime - record.startTime

      // Attempt rollback if supported
      if (migration.config.rollbackSupported && migration.down) {
        try {
          await this.rollbackMigration(migration, context)
          record.status = MigrationStatus.ROLLED_BACK
        } catch (rollbackError) {
          record.error += ` | Rollback failed: ${
            rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error'
          }`
        }
      }
    }

    return record
  }

  // Rollback a migration
  private async rollbackMigration(
    migration: Migration,
    context: Partial<MigrationContext>
  ): Promise<void> {
    if (!migration.down) {
      throw new Error('Migration does not support rollback')
    }

    const migrationContext: MigrationContext = {
      localStorage: SafeStorage,
      sessionStorage: SafeStorage,
      config: {},
      ...context,
      version: context.version || {
        from: migration.config.version,
        to: this.getCurrentVersion()
      }
    }

    await migration.down(migrationContext)
  }

  // Rollback to previous version
  async rollback(targetVersion?: string): Promise<MigrationRecord[]> {
    const current = this.getCurrentVersion()
    const target = targetVersion || this.getPreviousVersion()
    
    if (!target || this.compareVersions(current, target) <= 0) {
      throw new Error('Invalid rollback target version')
    }

    const migrationsToRollback = this.records
      .filter(record => 
        record.status === MigrationStatus.COMPLETED &&
        this.compareVersions(record.version, target) > 0
      )
      .reverse() // Rollback in reverse order

    const results: MigrationRecord[] = []

    for (const record of migrationsToRollback) {
      const migration = this.migrations.get(record.version)
      if (!migration || !migration.down) {
        throw new Error(`Cannot rollback migration ${record.version}: no down migration`)
      }

      try {
        await this.rollbackMigration(migration, {})
        
        const rollbackRecord: MigrationRecord = {
          ...record,
          status: MigrationStatus.ROLLED_BACK,
          rollbackId: `rollback_${Date.now()}`
        }
        
        results.push(rollbackRecord)
        this.setCurrentVersion(target)
        
      } catch (error) {
        throw new Error(`Rollback failed at version ${record.version}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`)
      }
    }

    this.saveMigrationData()
    return results
  }

  // Create backup
  async createBackup(version: string): Promise<BackupData> {
    const id = `backup_${version}_${Date.now()}`
    
    const backup: BackupData = {
      id,
      version,
      timestamp: Date.now(),
      size: 0,
      data: {
        localStorage: this.exportLocalStorage(),
        sessionStorage: this.exportSessionStorage(),
        metadata: {
          version: this.getCurrentVersion(),
          timestamp: Date.now()
        }
      },
      checksum: ''
    }

    // Export IndexedDB data if available
    const indexedDBData = await this.exportIndexedDB()
    if (indexedDBData) {
      backup.data.indexedDB = indexedDBData
    }

    // Calculate size and checksum
    const serialized = JSON.stringify(backup.data)
    backup.size = new Blob([serialized]).size
    backup.checksum = await this.calculateChecksum(serialized)

    this.backups.set(id, backup)
    this.saveBackups()

    return backup
  }

  // Restore from backup
  async restoreFromBackup(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId)
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`)
    }

    // Verify backup integrity
    const serialized = JSON.stringify(backup.data)
    const currentChecksum = await this.calculateChecksum(serialized)
    if (currentChecksum !== backup.checksum) {
      throw new Error('Backup integrity check failed')
    }

    // Restore localStorage
    SafeStorage.clear()
    for (const [key, value] of Object.entries(backup.data.localStorage)) {
      SafeStorage.setItem(key, value)
    }

    // Restore sessionStorage
    SafeStorage.clear(true)
    for (const [key, value] of Object.entries(backup.data.sessionStorage)) {
      SafeStorage.setItem(key, value, { useSession: true })
    }

    // Restore IndexedDB if available
    if (backup.data.indexedDB) {
      await this.importIndexedDB(backup.data.indexedDB)
    }

    // Update version
    this.setCurrentVersion(backup.version)
  }

  // Export storage data
  private exportLocalStorage(): Record<string, any> {
    const data: Record<string, any> = {}
    const keys = SafeStorage.getKeys()
    
    for (const key of keys) {
      data[key] = SafeStorage.getItem(key)
    }
    
    return data
  }

  private exportSessionStorage(): Record<string, any> {
    const data: Record<string, any> = {}
    const keys = SafeStorage.getKeys(true)
    
    for (const key of keys) {
      data[key] = SafeStorage.getItem(key, true)
    }
    
    return data
  }

  private async exportIndexedDB(): Promise<Record<string, any[]> | null> {
    // This would need to be implemented based on available IndexedDB instance
    return null
  }

  private async importIndexedDB(data: Record<string, any[]>): Promise<void> {
    // This would need to be implemented based on available IndexedDB instance
  }

  // Utility methods
  private compareVersions(a: string, b: string): number {
    const parseVersion = (version: string) => 
      version.split('.').map(n => parseInt(n, 10))
    
    const versionA = parseVersion(a)
    const versionB = parseVersion(b)
    
    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const numA = versionA[i] || 0
      const numB = versionB[i] || 0
      
      if (numA > numB) return 1
      if (numA < numB) return -1
    }
    
    return 0
  }

  private getLatestVersion(): string {
    const versions = Array.from(this.migrations.keys())
    return versions.sort(this.compareVersions).pop() || '0.0.0'
  }

  private getPreviousVersion(): string | null {
    const completedMigrations = this.records
      .filter(record => record.status === MigrationStatus.COMPLETED)
      .sort((a, b) => this.compareVersions(a.version, b.version))
    
    return completedMigrations.length > 1 
      ? completedMigrations[completedMigrations.length - 2].version
      : null
  }

  private getLastMigration(): MigrationRecord | undefined {
    return this.records
      .filter(record => record.status === MigrationStatus.COMPLETED)
      .sort((a, b) => this.compareVersions(a.version, b.version))
      .pop()
  }

  private canRollback(): boolean {
    return this.records.some(record => 
      record.status === MigrationStatus.COMPLETED &&
      this.migrations.get(record.version)?.config.rollbackSupported
    )
  }

  private resolveDependencies(migrations: Migration[]): Migration[] {
    const resolved: Migration[] = []
    const remaining = [...migrations]
    
    while (remaining.length > 0) {
      const migration = remaining.find(m => 
        m.config.dependencies.every(dep => 
          resolved.some(r => r.config.version === dep)
        )
      )
      
      if (!migration) {
        throw new Error('Circular dependency detected in migrations')
      }
      
      resolved.push(migration)
      remaining.splice(remaining.indexOf(migration), 1)
    }
    
    return resolved
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Persistence methods
  private loadMigrationData(): void {
    const data = SafeStorage.getItem<{
      records: MigrationRecord[]
      backups: Array<[string, BackupData]>
    }>(this.STORAGE_KEY)
    
    if (data) {
      this.records = data.records || []
      this.backups = new Map(data.backups || [])
    }
  }

  private saveMigrationData(): void {
    SafeStorage.setItem(this.STORAGE_KEY, {
      records: this.records,
      backups: Array.from(this.backups.entries())
    })
  }

  private saveBackups(): void {
    SafeStorage.setItem(this.BACKUP_KEY, Array.from(this.backups.entries()))
  }

  // Public API
  getMigrationHistory(): MigrationRecord[] {
    return [...this.records]
  }

  getBackups(): BackupData[] {
    return Array.from(this.backups.values())
  }

  async cleanupOldBackups(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAge
    let cleaned = 0
    
    for (const [id, backup] of this.backups.entries()) {
      if (backup.timestamp < cutoff) {
        this.backups.delete(id)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      this.saveBackups()
    }
    
    return cleaned
  }

  async validateMigrations(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    const versions = Array.from(this.migrations.keys())
    
    // Check for duplicate versions
    const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i)
    if (duplicates.length > 0) {
      errors.push(`Duplicate migration versions: ${duplicates.join(', ')}`)
    }
    
    // Check dependencies
    for (const migration of this.migrations.values()) {
      for (const dep of migration.config.dependencies) {
        if (!this.migrations.has(dep)) {
          errors.push(`Migration ${migration.config.version} depends on missing version ${dep}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Pre-built migrations for common scenarios
export class CommonMigrations {
  // Migration to add new storage structure
  static createStorageStructureMigration(version: string): Migration {
    return {
      config: {
        version,
        description: 'Initialize storage structure',
        rollbackSupported: true,
        priority: 'high'
      },
      
      async up(context) {
        // Initialize storage keys if they don't exist
        const keys = ['campaigns', 'insights', 'user_preferences', 'cache']
        
        for (const key of keys) {
          if (!context.localStorage.getItem(key)) {
            context.localStorage.setItem(key, [])
          }
        }
      },
      
      async down(context) {
        // Remove storage keys
        const keys = ['campaigns', 'insights', 'user_preferences', 'cache']
        for (const key of keys) {
          context.localStorage.removeItem(key)
        }
      }
    }
  }

  // Migration to update data format
  static createDataFormatMigration(
    version: string,
    transformer: (data: any) => any
  ): Migration {
    return {
      config: {
        version,
        description: 'Update data format',
        rollbackSupported: false,
        priority: 'medium',
        backupRequired: true
      },
      
      async up(context) {
        const keys = context.localStorage.getKeys()
        
        for (const key of keys) {
          const data = context.localStorage.getItem(key)
          if (data) {
            const transformed = transformer(data)
            context.localStorage.setItem(key, transformed)
          }
        }
      }
    }
  }

  // Migration to cleanup old data
  static createCleanupMigration(
    version: string,
    keysToRemove: string[]
  ): Migration {
    return {
      config: {
        version,
        description: 'Cleanup old data',
        rollbackSupported: true,
        priority: 'low'
      },
      
      async up(context) {
        const backup: Record<string, any> = {}
        
        for (const key of keysToRemove) {
          const data = context.localStorage.getItem(key)
          if (data !== null) {
            backup[key] = data
            context.localStorage.removeItem(key)
          }
        }
        
        // Store backup for potential rollback
        context.localStorage.setItem(`_cleanup_backup_${version}`, backup)
      },
      
      async down(context) {
        const backup = context.localStorage.getItem(`_cleanup_backup_${version}`)
        if (backup) {
          for (const [key, value] of Object.entries(backup)) {
            context.localStorage.setItem(key, value)
          }
          context.localStorage.removeItem(`_cleanup_backup_${version}`)
        }
      }
    }
  }
}