// Advanced data encryption at rest implementation
import { z } from 'zod'

// Encryption configuration schema
const EncryptionConfigSchema = z.object({
  algorithm: z.enum(['AES-GCM', 'AES-CBC', 'ChaCha20-Poly1305']).default('AES-GCM'),
  keyLength: z.enum([128, 192, 256]).default(256),
  ivLength: z.number().min(12).max(16).default(12),
  saltLength: z.number().min(16).max(32).default(32),
  iterations: z.number().min(10000).max(1000000).default(100000),
  keyDerivation: z.enum(['PBKDF2', 'scrypt', 'Argon2']).default('PBKDF2'),
  compressionEnabled: z.boolean().default(true),
  integrityCheck: z.boolean().default(true)
})

export type EncryptionConfig = z.infer<typeof EncryptionConfigSchema>

// Encryption context
export interface EncryptionContext {
  purpose: string
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  retention: number // retention period in milliseconds
  metadata?: Record<string, any>
}

// Encrypted data structure
export interface EncryptedData {
  data: string // Base64 encoded encrypted data
  iv: string // Base64 encoded initialization vector
  salt: string // Base64 encoded salt
  algorithm: string
  keyId: string
  version: string
  timestamp: number
  checksum: string
  context?: EncryptionContext
  compressed?: boolean
}

// Key information
export interface KeyInfo {
  id: string
  algorithm: string
  keyLength: number
  created: number
  expires?: number
  purpose: string[]
  rotation: number
  status: 'active' | 'rotated' | 'revoked'
}

// Key derivation parameters
interface KeyDerivationParams {
  salt: Uint8Array
  iterations: number
  algorithm: string
  keyLength: number
}

export class EncryptionManager {
  private config: EncryptionConfig
  private masterKey: CryptoKey | null = null
  private keyCache = new Map<string, CryptoKey>()
  private keyInfo = new Map<string, KeyInfo>()
  private readonly STORAGE_KEY = '_encryption_keys'

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = EncryptionConfigSchema.parse(config)
    this.loadKeyInfo()
  }

  // Initialize encryption manager with master password
  async initialize(masterPassword: string): Promise<void> {
    try {
      this.masterKey = await this.deriveMasterKey(masterPassword)
      await this.loadOrCreateDefaultKeys()
    } catch (error) {
      throw new Error(`Failed to initialize encryption: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Encrypt data
  async encrypt(
    data: any,
    context: EncryptionContext,
    keyId?: string
  ): Promise<EncryptedData> {
    if (!this.masterKey) {
      throw new Error('Encryption manager not initialized')
    }

    // Serialize data
    let serializedData = typeof data === 'string' ? data : JSON.stringify(data)
    
    // Compress if enabled
    let compressed = false
    if (this.config.compressionEnabled) {
      const compressedData = await this.compress(serializedData)
      if (compressedData.length < serializedData.length) {
        serializedData = compressedData
        compressed = true
      }
    }

    // Get or create encryption key
    const encKeyId = keyId || await this.getDefaultKeyId(context.classification)
    const encryptionKey = await this.getKey(encKeyId)

    // Generate IV and salt
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength))
    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))

    // Encrypt data
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(serializedData)
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.config.algorithm,
        iv: iv
      },
      encryptionKey,
      dataBuffer
    )

    // Create encrypted data structure
    const encryptedData: EncryptedData = {
      data: this.arrayBufferToBase64(encryptedBuffer),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
      algorithm: this.config.algorithm,
      keyId: encKeyId,
      version: '1.0.0',
      timestamp: Date.now(),
      checksum: '',
      context,
      compressed
    }

    // Calculate integrity checksum
    if (this.config.integrityCheck) {
      encryptedData.checksum = await this.calculateChecksum(encryptedData)
    }

    return encryptedData
  }

  // Decrypt data
  async decrypt<T = any>(encryptedData: EncryptedData): Promise<T> {
    if (!this.masterKey) {
      throw new Error('Encryption manager not initialized')
    }

    // Verify integrity
    if (this.config.integrityCheck && encryptedData.checksum) {
      const currentChecksum = await this.calculateChecksum({
        ...encryptedData,
        checksum: ''
      })
      if (currentChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed')
      }
    }

    // Get decryption key
    const decryptionKey = await this.getKey(encryptedData.keyId)

    // Decrypt data
    const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data)
    const iv = this.base64ToArrayBuffer(encryptedData.iv)

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm,
        iv: iv
      },
      decryptionKey,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    let decryptedData = decoder.decode(decryptedBuffer)

    // Decompress if needed
    if (encryptedData.compressed) {
      decryptedData = await this.decompress(decryptedData)
    }

    // Parse JSON if possible
    try {
      return JSON.parse(decryptedData)
    } catch {
      return decryptedData as T
    }
  }

  // Generate new encryption key
  async generateKey(
    purpose: string[],
    classification: 'public' | 'internal' | 'confidential' | 'restricted',
    expires?: number
  ): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption manager not initialized')
    }

    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate new key
    const key = await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keyLength
      },
      true, // extractable
      ['encrypt', 'decrypt']
    )

    // Store key info
    const keyInfo: KeyInfo = {
      id: keyId,
      algorithm: this.config.algorithm,
      keyLength: this.config.keyLength,
      created: Date.now(),
      expires,
      purpose,
      rotation: 0,
      status: 'active'
    }

    this.keyCache.set(keyId, key)
    this.keyInfo.set(keyId, keyInfo)
    
    // Persist key info
    await this.saveKeyInfo()
    await this.storeKey(keyId, key)

    return keyId
  }

  // Rotate encryption key
  async rotateKey(keyId: string): Promise<string> {
    const oldKeyInfo = this.keyInfo.get(keyId)
    if (!oldKeyInfo) {
      throw new Error(`Key ${keyId} not found`)
    }

    // Generate new key with same properties
    const newKeyId = await this.generateKey(
      oldKeyInfo.purpose,
      'confidential', // Default to confidential for rotated keys
      oldKeyInfo.expires
    )

    // Mark old key as rotated
    oldKeyInfo.status = 'rotated'
    oldKeyInfo.rotation++
    
    await this.saveKeyInfo()
    return newKeyId
  }

  // Revoke encryption key
  async revokeKey(keyId: string): Promise<void> {
    const keyInfo = this.keyInfo.get(keyId)
    if (keyInfo) {
      keyInfo.status = 'revoked'
      await this.saveKeyInfo()
    }
    
    this.keyCache.delete(keyId)
    await this.removeStoredKey(keyId)
  }

  // Get encryption key
  private async getKey(keyId: string): Promise<CryptoKey> {
    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!
    }

    // Load from storage
    const key = await this.loadStoredKey(keyId)
    if (key) {
      this.keyCache.set(keyId, key)
      return key
    }

    throw new Error(`Encryption key ${keyId} not found`)
  }

  // Get default key ID for classification level
  private async getDefaultKeyId(classification: string): Promise<string> {
    // Find active key for classification
    for (const [keyId, keyInfo] of this.keyInfo.entries()) {
      if (keyInfo.status === 'active' && keyInfo.purpose.includes(classification)) {
        return keyId
      }
    }

    // Generate new key if none found
    return this.generateKey([classification], classification as any)
  }

  // Derive master key from password
  private async deriveMasterKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    // Get or generate salt
    const salt = await this.getMasterSalt()

    // Derive master key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.config.algorithm,
        length: this.config.keyLength
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    )
  }

  // Get or generate master salt
  private async getMasterSalt(): Promise<Uint8Array> {
    const stored = localStorage.getItem('_master_salt')
    if (stored) {
      return this.base64ToArrayBuffer(stored)
    }

    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))
    localStorage.setItem('_master_salt', this.arrayBufferToBase64(salt))
    return salt
  }

  // Store encryption key
  private async storeKey(keyId: string, key: CryptoKey): Promise<void> {
    if (!this.masterKey) return

    const exported = await crypto.subtle.exportKey('raw', key)
    const encrypted = await this.encrypt(
      this.arrayBufferToBase64(exported),
      {
        purpose: 'key_storage',
        classification: 'restricted',
        retention: 365 * 24 * 60 * 60 * 1000 // 1 year
      }
    )

    localStorage.setItem(`_key_${keyId}`, JSON.stringify(encrypted))
  }

  // Load stored encryption key
  private async loadStoredKey(keyId: string): Promise<CryptoKey | null> {
    try {
      const stored = localStorage.getItem(`_key_${keyId}`)
      if (!stored) return null

      const encryptedData: EncryptedData = JSON.parse(stored)
      const keyData = await this.decrypt<string>(encryptedData)
      const keyBuffer = this.base64ToArrayBuffer(keyData)

      return crypto.subtle.importKey(
        'raw',
        keyBuffer,
        {
          name: this.config.algorithm,
          length: this.config.keyLength
        },
        true,
        ['encrypt', 'decrypt']
      )
    } catch {
      return null
    }
  }

  // Remove stored key
  private async removeStoredKey(keyId: string): Promise<void> {
    localStorage.removeItem(`_key_${keyId}`)
  }

  // Load or create default keys
  private async loadOrCreateDefaultKeys(): Promise<void> {
    const classifications = ['public', 'internal', 'confidential', 'restricted']
    
    for (const classification of classifications) {
      const hasKey = Array.from(this.keyInfo.values()).some(
        keyInfo => keyInfo.status === 'active' && keyInfo.purpose.includes(classification)
      )

      if (!hasKey) {
        await this.generateKey([classification], classification as any)
      }
    }
  }

  // Compression utilities
  private async compress(data: string): Promise<string> {
    // Simple LZ-style compression for demonstration
    // In production, you might want to use a more sophisticated algorithm
    const compressed = data.replace(/(.)\1+/g, (match, char) => {
      return char + match.length.toString(36)
    })
    return compressed.length < data.length ? compressed : data
  }

  private async decompress(data: string): Promise<string> {
    // Reverse of simple compression
    return data.replace(/(.)\w+/g, (match, char) => {
      const count = parseInt(match.slice(1), 36)
      return char.repeat(count)
    })
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  private async calculateChecksum(data: any): Promise<string> {
    const serialized = JSON.stringify(data)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(serialized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return this.arrayBufferToBase64(hashBuffer)
  }

  // Key management persistence
  private loadKeyInfo(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.keyInfo = new Map(data.keyInfo || [])
      }
    } catch (error) {
      console.warn('Failed to load key info:', error)
    }
  }

  private async saveKeyInfo(): Promise<void> {
    try {
      const data = {
        keyInfo: Array.from(this.keyInfo.entries()),
        timestamp: Date.now()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save key info:', error)
    }
  }

  // Public API methods
  getKeyInfo(): KeyInfo[] {
    return Array.from(this.keyInfo.values())
  }

  getActiveKeys(): KeyInfo[] {
    return this.getKeyInfo().filter(key => key.status === 'active')
  }

  async cleanupExpiredKeys(): Promise<number> {
    const now = Date.now()
    let cleaned = 0

    for (const [keyId, keyInfo] of this.keyInfo.entries()) {
      if (keyInfo.expires && keyInfo.expires < now) {
        await this.revokeKey(keyId)
        cleaned++
      }
    }

    return cleaned
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // Verify old password
    const oldMasterKey = await this.deriveMasterKey(oldPassword)
    if (!this.masterKey || !await this.verifyMasterKey(oldMasterKey)) {
      throw new Error('Invalid old password')
    }

    // Generate new master key
    const newMasterKey = await this.deriveMasterKey(newPassword)
    
    // Re-encrypt all stored keys with new master key
    const oldMasterKeyBackup = this.masterKey
    this.masterKey = newMasterKey

    try {
      for (const keyId of this.keyInfo.keys()) {
        const key = await this.getKey(keyId)
        await this.storeKey(keyId, key)
      }
    } catch (error) {
      // Restore old master key on failure
      this.masterKey = oldMasterKeyBackup
      throw new Error('Failed to change password: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  private async verifyMasterKey(testKey: CryptoKey): Promise<boolean> {
    try {
      // Try to decrypt a known value
      const testData = 'verification_test'
      const encrypted = await this.encrypt(testData, {
        purpose: 'verification',
        classification: 'internal',
        retention: 1000
      })
      
      const tempMasterKey = this.masterKey
      this.masterKey = testKey
      
      const decrypted = await this.decrypt<string>(encrypted)
      this.masterKey = tempMasterKey
      
      return decrypted === testData
    } catch {
      return false
    }
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    metrics: {
      activeKeys: number
      expiredKeys: number
      revokedKeys: number
      rotatedKeys: number
    }
  }> {
    const issues: string[] = []
    let healthy = true

    if (!this.masterKey) {
      issues.push('Encryption manager not initialized')
      healthy = false
    }

    const now = Date.now()
    const keys = this.getKeyInfo()
    const activeKeys = keys.filter(k => k.status === 'active').length
    const expiredKeys = keys.filter(k => k.expires && k.expires < now).length
    const revokedKeys = keys.filter(k => k.status === 'revoked').length
    const rotatedKeys = keys.filter(k => k.status === 'rotated').length

    if (activeKeys === 0) {
      issues.push('No active encryption keys')
      healthy = false
    }

    if (expiredKeys > 0) {
      issues.push(`${expiredKeys} expired keys need cleanup`)
    }

    return {
      healthy,
      issues,
      metrics: {
        activeKeys,
        expiredKeys,
        revokedKeys,
        rotatedKeys
      }
    }
  }
}

// Encryption utilities for common use cases
export const encryptionUtils = {
  // Create encryption manager with default config
  async createManager(password: string): Promise<EncryptionManager> {
    const manager = new EncryptionManager()
    await manager.initialize(password)
    return manager
  },

  // Encrypt sensitive data
  async encryptSensitive(manager: EncryptionManager, data: any): Promise<EncryptedData> {
    return manager.encrypt(data, {
      purpose: 'sensitive_data',
      classification: 'confidential',
      retention: 365 * 24 * 60 * 60 * 1000 // 1 year
    })
  },

  // Encrypt user credentials
  async encryptCredentials(manager: EncryptionManager, credentials: any): Promise<EncryptedData> {
    return manager.encrypt(credentials, {
      purpose: 'user_credentials',
      classification: 'restricted',
      retention: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
  },

  // Encrypt cache data
  async encryptCache(manager: EncryptionManager, cacheData: any): Promise<EncryptedData> {
    return manager.encrypt(cacheData, {
      purpose: 'cache_data',
      classification: 'internal',
      retention: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  }
}