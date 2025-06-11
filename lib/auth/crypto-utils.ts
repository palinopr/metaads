// Cryptographic utilities for secure credential storage
// Uses Web Crypto API for browser-compatible encryption

export class CryptoUtils {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 16
  private static readonly SALT_LENGTH = 32
  private static readonly ITERATIONS = 100000
  
  // Derive a key from a password using PBKDF2
  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  // Generate a unique encryption key for the user session
  static async generateSessionKey(): Promise<string> {
    // Generate a random key
    const key = crypto.getRandomValues(new Uint8Array(32))
    return this.arrayBufferToBase64(key)
  }
  
  // Encrypt data with a password
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
      
      const key = await this.deriveKey(password, salt)
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encoder.encode(data)
      )
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(
        salt.length + iv.length + encrypted.byteLength
      )
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encrypted), salt.length + iv.length)
      
      return this.arrayBufferToBase64(combined)
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }
  
  // Decrypt data with a password
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const decoder = new TextDecoder()
      const combined = this.base64ToArrayBuffer(encryptedData)
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, this.SALT_LENGTH)
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH)
      const data = combined.slice(this.SALT_LENGTH + this.IV_LENGTH)
      
      const key = await this.deriveKey(password, salt)
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        data
      )
      
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }
  
  // Helper to convert ArrayBuffer to base64
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  // Helper to convert base64 to ArrayBuffer
  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  
  // Generate a secure random token
  static generateSecureToken(length: number = 32): string {
    const array = crypto.getRandomValues(new Uint8Array(length))
    return this.arrayBufferToBase64(array)
  }
  
  // Hash a value using SHA-256
  static async hash(value: string): Promise<string> {
    const encoder = new TextEncoder()
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value))
    return this.arrayBufferToBase64(hash)
  }
  
  // Validate token format and entropy
  static isValidToken(token: string): boolean {
    if (!token || token.length < 50) return false
    
    // Check for minimum entropy (variety of characters)
    const uniqueChars = new Set(token).size
    const minEntropy = Math.min(token.length * 0.3, 20)
    
    return uniqueChars >= minEntropy
  }
}