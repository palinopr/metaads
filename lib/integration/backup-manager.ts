/**
 * Backup Manager
 * Handles system and user data backups with restore capabilities
 */

import { storage } from '@/lib/storage-utils';
import { migrationManager } from './migration-manager';

export interface BackupMetadata {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  version: string;
  size: number;
  type: 'manual' | 'automatic' | 'pre-migration' | 'pre-deployment';
  tags: string[];
  checksum: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  userData: Record<string, any>;
  systemConfig: Record<string, any>;
  featureFlags: Record<string, any>;
  integrationState: Record<string, any>;
}

export interface RestorePoint {
  id: string;
  name: string;
  timestamp: string;
  version: string;
  type: string;
  size: number;
  valid: boolean;
}

export class BackupManager {
  private backups: Map<string, BackupData> = new Map();
  private maxBackups: number = 10;
  private autoBackupInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private autoBackupTimer: NodeJS.Timer | null = null;

  constructor() {
    this.loadBackupHistory();
    this.startAutoBackup();
  }

  private loadBackupHistory() {
    try {
      const backupList = storage.get('backup_list');
      if (backupList) {
        const backupIds = JSON.parse(backupList);
        backupIds.forEach((id: string) => {
          const backupData = storage.get(`backup_${id}`);
          if (backupData) {
            try {
              const backup = JSON.parse(backupData);
              this.backups.set(id, backup);
            } catch (error) {
              console.warn(`Failed to load backup ${id}:`, error);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load backup history:', error);
    }
  }

  private saveBackupList() {
    try {
      const backupIds = Array.from(this.backups.keys());
      storage.set('backup_list', JSON.stringify(backupIds));
    } catch (error) {
      console.error('Failed to save backup list:', error);
    }
  }

  private startAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }

    this.autoBackupTimer = setInterval(() => {
      this.createBackup({
        name: `Auto Backup ${new Date().toISOString().split('T')[0]}`,
        description: 'Automatic daily backup',
        type: 'automatic'
      });
    }, this.autoBackupInterval);
  }

  public async createBackup(options: {
    name?: string;
    description?: string;
    type?: 'manual' | 'automatic' | 'pre-migration' | 'pre-deployment';
    tags?: string[];
  } = {}): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    try {
      // Collect user data
      const userData = this.collectUserData();
      
      // Collect system configuration
      const systemConfig = this.collectSystemConfig();
      
      // Collect feature flags
      const featureFlags = this.collectFeatureFlags();
      
      // Collect integration state
      const integrationState = this.collectIntegrationState();

      // Calculate size and checksum
      const dataString = JSON.stringify({ userData, systemConfig, featureFlags, integrationState });
      const size = new Blob([dataString]).size;
      const checksum = await this.calculateChecksum(dataString);

      const metadata: BackupMetadata = {
        id: backupId,
        name: options.name || `Backup ${timestamp}`,
        description: options.description || 'Manual backup',
        timestamp,
        version: migrationManager.getCurrentVersion(),
        size,
        type: options.type || 'manual',
        tags: options.tags || [],
        checksum
      };

      const backupData: BackupData = {
        metadata,
        userData,
        systemConfig,
        featureFlags,
        integrationState
      };

      // Store backup
      this.backups.set(backupId, backupData);
      storage.set(`backup_${backupId}`, JSON.stringify(backupData));
      
      // Cleanup old backups
      this.cleanupOldBackups();
      
      // Update backup list
      this.saveBackupList();

      console.log(`Created backup: ${metadata.name} (${this.formatSize(size)})`);
      return backupId;

    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  private collectUserData(): Record<string, any> {
    const userDataKeys = [
      'user_preferences',
      'metaads_credentials',
      'metaads_accounts',
      'account_preferences',
      'ai_preferences',
      'notification_preferences',
      'dashboard_layout',
      'custom_filters',
      'saved_reports',
      'recent_searches',
      'favorite_campaigns'
    ];

    const userData: Record<string, any> = {};
    userDataKeys.forEach(key => {
      const value = storage.get(key);
      if (value) {
        try {
          userData[key] = JSON.parse(value);
        } catch {
          userData[key] = value;
        }
      }
    });

    return userData;
  }

  private collectSystemConfig(): Record<string, any> {
    const systemConfigKeys = [
      'cache_config',
      'performance_config',
      'security_config',
      'integration_config',
      'api_config',
      'environment_config'
    ];

    const systemConfig: Record<string, any> = {};
    systemConfigKeys.forEach(key => {
      const value = storage.get(key);
      if (value) {
        try {
          systemConfig[key] = JSON.parse(value);
        } catch {
          systemConfig[key] = value;
        }
      }
    });

    // Add environment information
    systemConfig.environment = {
      nodeEnv: process.env.NODE_ENV,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      timestamp: new Date().toISOString()
    };

    return systemConfig;
  }

  private collectFeatureFlags(): Record<string, any> {
    const featureFlagKeys = [
      'feature_flags',
      'enabled_features',
      'disabled_features',
      'feature_rollout_state',
      'ab_test_assignments'
    ];

    const featureFlags: Record<string, any> = {};
    featureFlagKeys.forEach(key => {
      const value = storage.get(key);
      if (value) {
        try {
          featureFlags[key] = JSON.parse(value);
        } catch {
          featureFlags[key] = value;
        }
      }
    });

    return featureFlags;
  }

  private collectIntegrationState(): Record<string, any> {
    const integrationKeys = [
      'migration_history',
      'completed_migrations',
      'current_version',
      'integration_status',
      'component_health',
      'conflict_log',
      'navigation_state'
    ];

    const integrationState: Record<string, any> = {};
    integrationKeys.forEach(key => {
      const value = storage.get(key);
      if (value) {
        try {
          integrationState[key] = JSON.parse(value);
        } catch {
          integrationState[key] = value;
        }
      }
    });

    return integrationState;
  }

  private async calculateChecksum(data: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        // Fallback to simple hash
        return this.simpleHash(data);
      }
    } else {
      return this.simpleHash(data);
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public async restoreBackup(backupId: string, options: {
    includeUserData?: boolean;
    includeSystemConfig?: boolean;
    includeFeatureFlags?: boolean;
    includeIntegrationState?: boolean;
    createBackupBeforeRestore?: boolean;
  } = {}): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const {
      includeUserData = true,
      includeSystemConfig = true,
      includeFeatureFlags = true,
      includeIntegrationState = true,
      createBackupBeforeRestore = true
    } = options;

    try {
      // Verify backup integrity
      const isValid = await this.verifyBackup(backup);
      if (!isValid) {
        throw new Error('Backup integrity check failed');
      }

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        await this.createBackup({
          name: `Pre-restore backup ${new Date().toISOString()}`,
          description: `Backup created before restoring ${backup.metadata.name}`,
          type: 'pre-migration',
          tags: ['pre-restore', backupId]
        });
      }

      console.log(`Restoring backup: ${backup.metadata.name}`);

      // Restore user data
      if (includeUserData && backup.userData) {
        Object.entries(backup.userData).forEach(([key, value]) => {
          if (typeof value === 'object') {
            storage.set(key, JSON.stringify(value));
          } else {
            storage.set(key, String(value));
          }
        });
        console.log('Restored user data');
      }

      // Restore system configuration
      if (includeSystemConfig && backup.systemConfig) {
        Object.entries(backup.systemConfig).forEach(([key, value]) => {
          if (key !== 'environment') { // Skip environment info
            if (typeof value === 'object') {
              storage.set(key, JSON.stringify(value));
            } else {
              storage.set(key, String(value));
            }
          }
        });
        console.log('Restored system configuration');
      }

      // Restore feature flags
      if (includeFeatureFlags && backup.featureFlags) {
        Object.entries(backup.featureFlags).forEach(([key, value]) => {
          if (typeof value === 'object') {
            storage.set(key, JSON.stringify(value));
          } else {
            storage.set(key, String(value));
          }
        });
        console.log('Restored feature flags');
      }

      // Restore integration state
      if (includeIntegrationState && backup.integrationState) {
        Object.entries(backup.integrationState).forEach(([key, value]) => {
          if (typeof value === 'object') {
            storage.set(key, JSON.stringify(value));
          } else {
            storage.set(key, String(value));
          }
        });
        console.log('Restored integration state');
      }

      // Log restore operation
      this.logRestoreOperation(backupId, options);

      console.log(`Successfully restored backup: ${backup.metadata.name}`);

    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  private async verifyBackup(backup: BackupData): Promise<boolean> {
    try {
      // Verify checksum
      const dataString = JSON.stringify({
        userData: backup.userData,
        systemConfig: backup.systemConfig,
        featureFlags: backup.featureFlags,
        integrationState: backup.integrationState
      });
      
      const calculatedChecksum = await this.calculateChecksum(dataString);
      
      if (calculatedChecksum !== backup.metadata.checksum) {
        console.error('Backup checksum mismatch');
        return false;
      }

      // Verify required fields
      if (!backup.metadata || !backup.metadata.id || !backup.metadata.timestamp) {
        console.error('Backup missing required metadata');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  private logRestoreOperation(backupId: string, options: any) {
    try {
      const restoreLog = {
        backupId,
        timestamp: new Date().toISOString(),
        options,
        success: true
      };

      const existingLogs = storage.get('restore_log');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(restoreLog);
      
      // Keep only last 50 restore operations
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      storage.set('restore_log', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to log restore operation:', error);
    }
  }

  public deleteBackup(backupId: string): boolean {
    try {
      if (this.backups.has(backupId)) {
        this.backups.delete(backupId);
        storage.remove(`backup_${backupId}`);
        this.saveBackupList();
        console.log(`Deleted backup: ${backupId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  public getBackups(): BackupMetadata[] {
    return Array.from(this.backups.values())
      .map(backup => backup.metadata)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getBackup(backupId: string): BackupData | null {
    return this.backups.get(backupId) || null;
  }

  public getRestorePoints(): RestorePoint[] {
    return this.getBackups().map(metadata => ({
      id: metadata.id,
      name: metadata.name,
      timestamp: metadata.timestamp,
      version: metadata.version,
      type: metadata.type,
      size: metadata.size,
      valid: true // Would include integrity check result
    }));
  }

  private cleanupOldBackups() {
    const backups = this.getBackups();
    
    // Keep only maxBackups most recent backups
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups);
      toDelete.forEach(backup => {
        this.deleteBackup(backup.id);
      });
    }

    // Delete backups older than 30 days (except manual ones)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    backups.forEach(backup => {
      if (backup.type === 'automatic' && 
          new Date(backup.timestamp).getTime() < thirtyDaysAgo) {
        this.deleteBackup(backup.id);
      }
    });
  }

  public exportBackup(backupId: string): string {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    return JSON.stringify(backup, null, 2);
  }

  public async importBackup(backupJson: string): Promise<string> {
    try {
      const backup: BackupData = JSON.parse(backupJson);
      
      // Verify backup structure
      if (!backup.metadata || !backup.userData) {
        throw new Error('Invalid backup format');
      }

      // Verify integrity
      const isValid = await this.verifyBackup(backup);
      if (!isValid) {
        throw new Error('Backup integrity check failed');
      }

      // Generate new ID if backup already exists
      let backupId = backup.metadata.id;
      if (this.backups.has(backupId)) {
        backupId = `${backupId}_imported_${Date.now()}`;
        backup.metadata.id = backupId;
        backup.metadata.name = `${backup.metadata.name} (Imported)`;
      }

      // Store backup
      this.backups.set(backupId, backup);
      storage.set(`backup_${backupId}`, JSON.stringify(backup));
      this.saveBackupList();

      console.log(`Imported backup: ${backup.metadata.name}`);
      return backupId;

    } catch (error) {
      throw new Error(`Failed to import backup: ${error.message}`);
    }
  }

  public getBackupStats() {
    const backups = this.getBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    const typeStats = backups.reduce((stats, backup) => {
      stats[backup.type] = (stats[backup.type] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalBackups: backups.length,
      totalSize,
      formattedSize: this.formatSize(totalSize),
      oldestBackup: backups[backups.length - 1]?.timestamp,
      newestBackup: backups[0]?.timestamp,
      typeStats,
      autoBackupEnabled: this.autoBackupTimer !== null,
      maxBackups: this.maxBackups
    };
  }

  private formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  public setMaxBackups(max: number) {
    this.maxBackups = Math.max(1, max);
    this.cleanupOldBackups();
  }

  public setAutoBackupInterval(intervalMs: number) {
    this.autoBackupInterval = Math.max(60000, intervalMs); // Minimum 1 minute
    this.startAutoBackup();
  }

  public enableAutoBackup() {
    if (!this.autoBackupTimer) {
      this.startAutoBackup();
    }
  }

  public disableAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  public destroy() {
    this.disableAutoBackup();
    this.backups.clear();
  }
}

// Singleton instance
export const backupManager = new BackupManager();