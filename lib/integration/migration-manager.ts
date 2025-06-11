/**
 * Migration Manager
 * Handles data migrations and user settings migration for existing users
 */

import { storage } from '@/lib/storage-utils';

export interface Migration {
  id: string;
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  dependencies: string[];
  critical: boolean;
}

export interface MigrationLog {
  id: string;
  timestamp: string;
  version: string;
  success: boolean;
  error?: string;
  duration: number;
}

export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private migrationLog: MigrationLog[] = [];
  private currentVersion: string = '1.0.0';

  constructor() {
    this.initializeMigrations();
    this.loadMigrationHistory();
  }

  private initializeMigrations() {
    const migrations: Migration[] = [
      // Version 1.0.0 - Initial setup
      {
        id: 'initial_setup',
        version: '1.0.0',
        name: 'Initial Setup Migration',
        description: 'Set up initial user preferences and feature flags',
        dependencies: [],
        critical: true,
        up: async () => {
          // Initialize default user preferences
          if (!storage.get('user_preferences')) {
            storage.set('user_preferences', JSON.stringify({
              theme: 'dark',
              language: 'en',
              notifications: true,
              autoRefresh: true,
              defaultDateRange: '7d'
            }));
          }

          // Initialize feature flags
          if (!storage.get('feature_flags')) {
            storage.set('feature_flags', JSON.stringify({
              enabledFeatures: [],
              disabledFeatures: [],
              lastUpdated: new Date().toISOString()
            }));
          }
        },
        down: async () => {
          storage.remove('user_preferences');
          storage.remove('feature_flags');
        }
      },

      // Version 1.1.0 - OAuth migration
      {
        id: 'oauth_credential_migration',
        version: '1.1.0',
        name: 'OAuth Credential Migration',
        description: 'Migrate legacy credentials to new OAuth format',
        dependencies: ['initial_setup'],
        critical: true,
        up: async () => {
          const legacyCredentials = storage.get('meta_credentials');
          if (legacyCredentials) {
            try {
              const parsed = JSON.parse(legacyCredentials);
              
              // Convert to new format
              const newCredentials = {
                accessToken: parsed.accessToken || parsed.token,
                adAccountId: parsed.adAccountId || parsed.accountId,
                userId: parsed.userId,
                expiresAt: parsed.expiresAt || Date.now() + (60 * 60 * 1000), // 1 hour default
                refreshToken: parsed.refreshToken,
                scopes: parsed.scopes || ['ads_read', 'ads_management'],
                version: '2.0'
              };

              storage.set('metaads_credentials', JSON.stringify(newCredentials));
              storage.remove('meta_credentials'); // Remove legacy
              
              console.log('Migrated credentials to new OAuth format');
            } catch (error) {
              console.warn('Failed to migrate legacy credentials:', error);
            }
          }
        },
        down: async () => {
          const newCredentials = storage.get('metaads_credentials');
          if (newCredentials) {
            try {
              const parsed = JSON.parse(newCredentials);
              
              // Convert back to legacy format
              const legacyCredentials = {
                token: parsed.accessToken,
                accountId: parsed.adAccountId,
                userId: parsed.userId
              };

              storage.set('meta_credentials', JSON.stringify(legacyCredentials));
              storage.remove('metaads_credentials');
            } catch (error) {
              console.warn('Failed to rollback credential migration:', error);
            }
          }
        }
      },

      // Version 1.2.0 - Multi-account support
      {
        id: 'multi_account_setup',
        version: '1.2.0',
        name: 'Multi-Account Setup',
        description: 'Set up multi-account support structure',
        dependencies: ['oauth_credential_migration'],
        critical: false,
        up: async () => {
          // Convert single account to multi-account structure
          const credentials = storage.get('metaads_credentials');
          if (credentials) {
            try {
              const parsed = JSON.parse(credentials);
              
              if (!Array.isArray(parsed)) {
                // Convert single account to array
                const multiAccountStructure = {
                  accounts: [
                    {
                      id: parsed.adAccountId,
                      name: `Account ${parsed.adAccountId}`,
                      accessToken: parsed.accessToken,
                      adAccountId: parsed.adAccountId,
                      userId: parsed.userId,
                      expiresAt: parsed.expiresAt,
                      refreshToken: parsed.refreshToken,
                      scopes: parsed.scopes,
                      isDefault: true,
                      addedAt: new Date().toISOString()
                    }
                  ],
                  activeAccountId: parsed.adAccountId,
                  version: '2.1'
                };

                storage.set('metaads_accounts', JSON.stringify(multiAccountStructure));
                
                console.log('Migrated to multi-account structure');
              }
            } catch (error) {
              console.warn('Failed to migrate to multi-account structure:', error);
            }
          }

          // Set up account preferences
          if (!storage.get('account_preferences')) {
            storage.set('account_preferences', JSON.stringify({
              showAllAccounts: false,
              autoSwitchAccount: false,
              syncSettings: true
            }));
          }
        },
        down: async () => {
          const multiAccounts = storage.get('metaads_accounts');
          if (multiAccounts) {
            try {
              const parsed = JSON.parse(multiAccounts);
              const defaultAccount = parsed.accounts?.find((acc: any) => acc.isDefault) || parsed.accounts?.[0];
              
              if (defaultAccount) {
                const singleAccountCredentials = {
                  accessToken: defaultAccount.accessToken,
                  adAccountId: defaultAccount.adAccountId,
                  userId: defaultAccount.userId,
                  expiresAt: defaultAccount.expiresAt,
                  refreshToken: defaultAccount.refreshToken,
                  scopes: defaultAccount.scopes,
                  version: '2.0'
                };

                storage.set('metaads_credentials', JSON.stringify(singleAccountCredentials));
              }
            } catch (error) {
              console.warn('Failed to rollback multi-account migration:', error);
            }
          }

          storage.remove('metaads_accounts');
          storage.remove('account_preferences');
        }
      },

      // Version 1.3.0 - Cache optimization
      {
        id: 'cache_optimization',
        version: '1.3.0',
        name: 'Cache Optimization Migration',
        description: 'Migrate to new cache structure for better performance',
        dependencies: ['multi_account_setup'],
        critical: false,
        up: async () => {
          // Clear old cache format
          const oldCacheKeys = [
            'meta_campaigns_cache',
            'meta_adsets_cache',
            'meta_ads_cache',
            'insights_cache'
          ];

          oldCacheKeys.forEach(key => {
            storage.remove(key);
          });

          // Set up new cache structure
          if (!storage.get('cache_config')) {
            storage.set('cache_config', JSON.stringify({
              version: '2.0',
              maxSize: 50 * 1024 * 1024, // 50MB
              defaultTTL: 1800000, // 30 minutes
              strategies: {
                campaigns: { ttl: 1800000, maxEntries: 100 },
                insights: { ttl: 900000, maxEntries: 200 },
                demographics: { ttl: 3600000, maxEntries: 50 }
              }
            }));
          }

          console.log('Migrated to optimized cache structure');
        },
        down: async () => {
          // Clear new cache and restore basic structure
          if (typeof window !== 'undefined' && 'caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(name => caches.delete(name))
              );
            } catch (error) {
              console.warn('Failed to clear caches during rollback:', error);
            }
          }

          storage.remove('cache_config');
        }
      },

      // Version 1.4.0 - AI features setup
      {
        id: 'ai_features_setup',
        version: '1.4.0',
        name: 'AI Features Setup',
        description: 'Set up AI features and user preferences',
        dependencies: ['cache_optimization'],
        critical: false,
        up: async () => {
          // Set up AI preferences
          if (!storage.get('ai_preferences')) {
            storage.set('ai_preferences', JSON.stringify({
              enableInsights: true,
              enablePredictions: false, // Gradual rollout
              enableCreativeAnalysis: false, // Gradual rollout
              autoAnalyze: true,
              insightFrequency: 'daily',
              predictionConfidenceThreshold: 0.7
            }));
          }

          // Set up AI model configurations
          if (!storage.get('ai_models')) {
            storage.set('ai_models', JSON.stringify({
              version: '1.0',
              models: {
                insights: {
                  name: 'claude-3-haiku',
                  version: '2024-06-01',
                  enabled: true
                },
                predictions: {
                  name: 'claude-3-sonnet',
                  version: '2024-06-01',
                  enabled: false
                }
              }
            }));
          }

          console.log('Set up AI features configuration');
        },
        down: async () => {
          storage.remove('ai_preferences');
          storage.remove('ai_models');
        }
      },

      // Version 1.5.0 - Performance optimization
      {
        id: 'performance_optimization',
        version: '1.5.0',
        name: 'Performance Optimization',
        description: 'Apply performance optimizations and cleanup',
        dependencies: ['ai_features_setup'],
        critical: false,
        up: async () => {
          // Clean up old performance data
          const oldPerfKeys = [
            'performance_metrics_old',
            'memory_usage_history',
            'api_response_times_legacy'
          ];

          oldPerfKeys.forEach(key => {
            storage.remove(key);
          });

          // Set up new performance monitoring
          if (!storage.get('performance_config')) {
            storage.set('performance_config', JSON.stringify({
              version: '2.0',
              monitoring: {
                enabled: true,
                sampleRate: 0.1, // 10% sampling
                metrics: ['api_response_time', 'render_time', 'memory_usage'],
                retention: 7 * 24 * 60 * 60 * 1000 // 7 days
              },
              optimization: {
                lazyLoading: true,
                imageOptimization: true,
                codesplitting: true,
                bundleOptimization: true
              }
            }));
          }

          console.log('Applied performance optimizations');
        },
        down: async () => {
          storage.remove('performance_config');
        }
      }
    ];

    migrations.forEach(migration => {
      this.migrations.set(migration.id, migration);
    });
  }

  private loadMigrationHistory() {
    try {
      const historyJson = storage.get('migration_history');
      if (historyJson) {
        this.migrationLog = JSON.parse(historyJson);
      }
    } catch (error) {
      console.warn('Failed to load migration history:', error);
      this.migrationLog = [];
    }
  }

  private saveMigrationHistory() {
    try {
      storage.set('migration_history', JSON.stringify(this.migrationLog));
    } catch (error) {
      console.error('Failed to save migration history:', error);
    }
  }

  public async runMigrations(targetVersion?: string): Promise<MigrationLog[]> {
    const target = targetVersion || this.getLatestVersion();
    const pendingMigrations = this.getPendingMigrations(target);
    const results: MigrationLog[] = [];

    console.log(`Running ${pendingMigrations.length} pending migrations to version ${target}`);

    for (const migration of pendingMigrations) {
      const startTime = Date.now();
      const log: MigrationLog = {
        id: `${migration.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        version: migration.version,
        success: false,
        duration: 0
      };

      try {
        console.log(`Running migration: ${migration.name}`);
        await migration.up();
        
        log.success = true;
        log.duration = Date.now() - startTime;
        
        this.markMigrationCompleted(migration.id, migration.version);
        console.log(`Completed migration: ${migration.name} (${log.duration}ms)`);
        
      } catch (error) {
        log.success = false;
        log.error = error.message;
        log.duration = Date.now() - startTime;
        
        console.error(`Failed migration: ${migration.name}`, error);
        
        if (migration.critical) {
          console.error('Critical migration failed, stopping migration process');
          results.push(log);
          break;
        }
      }

      results.push(log);
      this.migrationLog.push(log);
    }

    this.saveMigrationHistory();
    this.updateCurrentVersion(target);
    
    return results;
  }

  public async rollbackMigration(migrationId: string): Promise<boolean> {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    try {
      console.log(`Rolling back migration: ${migration.name}`);
      await migration.down();
      
      this.markMigrationRolledBack(migrationId);
      this.saveMigrationHistory();
      
      console.log(`Rolled back migration: ${migration.name}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to rollback migration: ${migration.name}`, error);
      return false;
    }
  }

  public getPendingMigrations(targetVersion?: string): Migration[] {
    const target = targetVersion || this.getLatestVersion();
    const completedMigrations = this.getCompletedMigrations();
    
    return Array.from(this.migrations.values())
      .filter(migration => {
        // Check if migration is needed for target version
        if (this.compareVersions(migration.version, target) > 0) {
          return false;
        }
        
        // Check if already completed
        return !completedMigrations.includes(migration.id);
      })
      .sort((a, b) => this.compareVersions(a.version, b.version));
  }

  public getCompletedMigrations(): string[] {
    try {
      const completed = storage.get('completed_migrations');
      return completed ? JSON.parse(completed) : [];
    } catch {
      return [];
    }
  }

  private markMigrationCompleted(migrationId: string, version: string) {
    const completed = this.getCompletedMigrations();
    if (!completed.includes(migrationId)) {
      completed.push(migrationId);
      storage.set('completed_migrations', JSON.stringify(completed));
    }
  }

  private markMigrationRolledBack(migrationId: string) {
    const completed = this.getCompletedMigrations();
    const index = completed.indexOf(migrationId);
    if (index > -1) {
      completed.splice(index, 1);
      storage.set('completed_migrations', JSON.stringify(completed));
    }
  }

  public getCurrentVersion(): string {
    return storage.get('current_version') || '0.0.0';
  }

  private updateCurrentVersion(version: string) {
    storage.set('current_version', version);
    this.currentVersion = version;
  }

  public getLatestVersion(): string {
    const versions = Array.from(this.migrations.values()).map(m => m.version);
    return versions.sort((a, b) => this.compareVersions(b, a))[0] || '1.0.0';
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  public needsMigration(): boolean {
    const currentVersion = this.getCurrentVersion();
    const latestVersion = this.getLatestVersion();
    return this.compareVersions(latestVersion, currentVersion) > 0;
  }

  public getMigrationStatus() {
    const currentVersion = this.getCurrentVersion();
    const latestVersion = this.getLatestVersion();
    const pendingMigrations = this.getPendingMigrations();
    const completedMigrations = this.getCompletedMigrations();
    
    return {
      currentVersion,
      latestVersion,
      needsMigration: this.needsMigration(),
      pendingCount: pendingMigrations.length,
      completedCount: completedMigrations.length,
      totalMigrations: this.migrations.size,
      lastMigration: this.migrationLog[this.migrationLog.length - 1] || null
    };
  }

  public exportUserData(): Record<string, any> {
    const exportData: Record<string, any> = {};
    
    // Export all user-related data
    const keysToExport = [
      'user_preferences',
      'metaads_credentials',
      'metaads_accounts',
      'account_preferences',
      'ai_preferences',
      'feature_flags',
      'cache_config',
      'performance_config',
      'migration_history',
      'completed_migrations',
      'current_version'
    ];

    keysToExport.forEach(key => {
      const value = storage.get(key);
      if (value) {
        try {
          exportData[key] = JSON.parse(value);
        } catch {
          exportData[key] = value;
        }
      }
    });

    return {
      version: this.getLatestVersion(),
      exportedAt: new Date().toISOString(),
      data: exportData
    };
  }

  public async importUserData(importData: Record<string, any>): Promise<void> {
    if (!importData.data) {
      throw new Error('Invalid import data format');
    }

    // Backup current data
    const backup = this.exportUserData();
    storage.set('backup_before_import', JSON.stringify(backup));

    try {
      // Import data
      Object.entries(importData.data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          storage.set(key, JSON.stringify(value));
        } else {
          storage.set(key, value);
        }
      });

      // Run migrations if needed
      if (this.needsMigration()) {
        await this.runMigrations();
      }

      console.log('Successfully imported user data');
      
    } catch (error) {
      // Restore backup on error
      console.error('Import failed, restoring backup:', error);
      const backupData = JSON.parse(storage.get('backup_before_import') || '{}');
      if (backupData.data) {
        Object.entries(backupData.data).forEach(([key, value]) => {
          if (typeof value === 'object') {
            storage.set(key, JSON.stringify(value));
          } else {
            storage.set(key, value);
          }
        });
      }
      throw error;
    }
  }
}

// Singleton instance
export const migrationManager = new MigrationManager();