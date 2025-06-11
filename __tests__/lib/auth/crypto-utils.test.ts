import { CryptoUtils } from '../../../lib/auth/crypto-utils'

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn()
  },
  getRandomValues: jest.fn()
}

// Setup global crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
})

// Mock btoa and atob for Node.js environment
global.btoa = jest.fn((str: string) => Buffer.from(str, 'binary').toString('base64'))
global.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString('binary'))

describe('CryptoUtils', () => {
  const testPassword = 'test-password-123'
  const testData = 'sensitive-data-to-encrypt'
  const testSalt = new Uint8Array(32).fill(1)
  const testIv = new Uint8Array(16).fill(2)
  const testEncryptedData = new Uint8Array(32).fill(3)

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock getRandomValues to return predictable values
    ;(mockCrypto.getRandomValues as jest.Mock).mockImplementation((array: Uint8Array) => {
      if (array.length === 32) return testSalt
      if (array.length === 16) return testIv
      return array.fill(42) // Default fill for other lengths
    })

    // Mock crypto.subtle methods
    ;(mockCrypto.subtle.importKey as jest.Mock).mockResolvedValue('mock-password-key')
    ;(mockCrypto.subtle.deriveKey as jest.Mock).mockResolvedValue('mock-derived-key')
    ;(mockCrypto.subtle.encrypt as jest.Mock).mockResolvedValue(testEncryptedData.buffer)
    ;(mockCrypto.subtle.decrypt as jest.Mock).mockResolvedValue(new TextEncoder().encode(testData))
    ;(mockCrypto.subtle.digest as jest.Mock).mockResolvedValue(new Uint8Array(32).fill(5).buffer)
  })

  describe('generateSessionKey', () => {
    it('should generate a session key', async () => {
      const sessionKey = await CryptoUtils.generateSessionKey()
      
      expect(sessionKey).toBeDefined()
      expect(typeof sessionKey).toBe('string')
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
    })

    it('should generate different keys on subsequent calls', async () => {
      // Mock to return different values
      let callCount = 0
      ;(mockCrypto.getRandomValues as jest.Mock).mockImplementation((array: Uint8Array) => {
        return array.fill(callCount++)
      })

      const key1 = await CryptoUtils.generateSessionKey()
      const key2 = await CryptoUtils.generateSessionKey()
      
      expect(key1).not.toEqual(key2)
    })
  })

  describe('encrypt', () => {
    it('should encrypt data successfully', async () => {
      const encrypted = await CryptoUtils.encrypt(testData, testPassword)
      
      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()
    })

    it('should use correct encryption parameters', async () => {
      await CryptoUtils.encrypt(testData, testPassword)
      
      // Check importKey was called with correct parameters
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      )

      // Check deriveKey was called with correct parameters
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: testSalt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        'mock-password-key',
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )

      // Check encrypt was called with correct parameters
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: testIv
        },
        'mock-derived-key',
        expect.any(Uint8Array)
      )
    })

    it('should handle encryption errors', async () => {
      ;(mockCrypto.subtle.encrypt as jest.Mock).mockRejectedValue(new Error('Encryption failed'))
      
      await expect(CryptoUtils.encrypt(testData, testPassword)).rejects.toThrow('Failed to encrypt data')
    })

    it('should handle key derivation errors', async () => {
      ;(mockCrypto.subtle.deriveKey as jest.Mock).mockRejectedValue(new Error('Key derivation failed'))
      
      await expect(CryptoUtils.encrypt(testData, testPassword)).rejects.toThrow('Failed to encrypt data')
    })
  })

  describe('decrypt', () => {
    const mockEncryptedBase64 = 'mock-encrypted-base64-data'

    beforeEach(() => {
      // Mock base64 decoding to return combined salt + iv + encrypted data
      const combined = new Uint8Array(32 + 16 + 32) // salt + iv + encrypted
      combined.set(testSalt, 0)
      combined.set(testIv, 32)
      combined.set(testEncryptedData, 48)
      
      ;(global.atob as jest.Mock).mockReturnValue(
        String.fromCharCode(...combined)
      )
    })

    it('should decrypt data successfully', async () => {
      const decrypted = await CryptoUtils.decrypt(mockEncryptedBase64, testPassword)
      
      expect(decrypted).toBe(testData)
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })

    it('should use correct decryption parameters', async () => {
      await CryptoUtils.decrypt(mockEncryptedBase64, testPassword)
      
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: testIv
        },
        'mock-derived-key',
        expect.any(Uint8Array)
      )
    })

    it('should handle decryption errors', async () => {
      ;(mockCrypto.subtle.decrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'))
      
      await expect(CryptoUtils.decrypt(mockEncryptedBase64, testPassword)).rejects.toThrow('Failed to decrypt data')
    })

    it('should handle invalid base64 data', async () => {
      ;(global.atob as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base64')
      })
      
      await expect(CryptoUtils.decrypt('invalid-base64', testPassword)).rejects.toThrow('Failed to decrypt data')
    })
  })

  describe('hash', () => {
    it('should hash a value using SHA-256', async () => {
      const testValue = 'test-value-to-hash'
      const hash = await CryptoUtils.hash(testValue)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      )
    })

    it('should handle hashing errors', async () => {
      ;(mockCrypto.subtle.digest as jest.Mock).mockRejectedValue(new Error('Hashing failed'))
      
      await expect(CryptoUtils.hash('test')).rejects.toThrow()
    })

    it('should produce different hashes for different inputs', async () => {
      let callCount = 0
      ;(mockCrypto.subtle.digest as jest.Mock).mockImplementation(() => {
        return Promise.resolve(new Uint8Array(32).fill(callCount++).buffer)
      })

      const hash1 = await CryptoUtils.hash('input1')
      const hash2 = await CryptoUtils.hash('input2')
      
      expect(hash1).not.toEqual(hash2)
    })
  })

  describe('generateSecureToken', () => {
    it('should generate a secure token with default length', () => {
      const token = CryptoUtils.generateSecureToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
    })

    it('should generate token with custom length', () => {
      const customLength = 64
      const token = CryptoUtils.generateSecureToken(customLength)
      
      expect(token).toBeDefined()
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(
        expect.objectContaining({ length: customLength })
      )
    })

    it('should generate different tokens on subsequent calls', () => {
      let callCount = 0
      ;(mockCrypto.getRandomValues as jest.Mock).mockImplementation((array: Uint8Array) => {
        return array.fill(callCount++)
      })

      const token1 = CryptoUtils.generateSecureToken()
      const token2 = CryptoUtils.generateSecureToken()
      
      expect(token1).not.toEqual(token2)
    })
  })

  describe('isValidToken', () => {
    it('should validate tokens with sufficient length and entropy', () => {
      const validToken = 'EAA123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
      expect(CryptoUtils.isValidToken(validToken)).toBe(true)
    })

    it('should reject tokens that are too short', () => {
      const shortToken = 'short'
      expect(CryptoUtils.isValidToken(shortToken)).toBe(false)
    })

    it('should reject null or undefined tokens', () => {
      expect(CryptoUtils.isValidToken(null as any)).toBe(false)
      expect(CryptoUtils.isValidToken(undefined as any)).toBe(false)
      expect(CryptoUtils.isValidToken('')).toBe(false)
    })

    it('should reject tokens with low entropy', () => {
      const lowEntropyToken = 'a'.repeat(60) // 60 characters but only 1 unique character
      expect(CryptoUtils.isValidToken(lowEntropyToken)).toBe(false)
    })

    it('should accept tokens with good entropy', () => {
      const goodEntropyToken = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      expect(CryptoUtils.isValidToken(goodEntropyToken)).toBe(true)
    })

    it('should handle edge case token lengths', () => {
      // Exactly 50 characters with good entropy
      const edgeToken = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV'
      expect(CryptoUtils.isValidToken(edgeToken)).toBe(true)
      
      // 49 characters - should be invalid
      const tooShortToken = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTU'
      expect(CryptoUtils.isValidToken(tooShortToken)).toBe(false)
    })
  })

  describe('arrayBufferToBase64 and base64ToArrayBuffer', () => {
    it('should convert between ArrayBuffer and base64 correctly', async () => {
      // Test via encrypt/decrypt which uses these methods internally
      const originalData = 'test-data-for-conversion'
      
      const encrypted = await CryptoUtils.encrypt(originalData, testPassword)
      const decrypted = await CryptoUtils.decrypt(encrypted, testPassword)
      
      expect(decrypted).toBe(originalData)
    })

    it('should handle empty data', async () => {
      const emptyData = ''
      
      const encrypted = await CryptoUtils.encrypt(emptyData, testPassword)
      const decrypted = await CryptoUtils.decrypt(encrypted, testPassword)
      
      expect(decrypted).toBe(emptyData)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle Web Crypto API not available', async () => {
      const originalCrypto = global.crypto
      delete (global as any).crypto
      
      try {
        await expect(CryptoUtils.encrypt('test', 'password')).rejects.toThrow()
      } finally {
        global.crypto = originalCrypto
      }
    })

    it('should handle corrupted encrypted data', async () => {
      // Mock atob to return data that's too short
      ;(global.atob as jest.Mock).mockReturnValue('too-short')
      
      await expect(CryptoUtils.decrypt('corrupted-data', testPassword)).rejects.toThrow('Failed to decrypt data')
    })

    it('should handle wrong password during decryption', async () => {
      ;(mockCrypto.subtle.decrypt as jest.Mock).mockRejectedValue(new Error('Wrong password'))
      
      await expect(CryptoUtils.decrypt('encrypted-data', 'wrong-password')).rejects.toThrow('Failed to decrypt data')
    })
  })

  describe('Integration tests', () => {
    beforeEach(() => {
      // Use real crypto operations for integration tests
      // Reset mocks to use actual implementations where possible
      jest.clearAllMocks()
    })

    it('should complete full encrypt/decrypt cycle with mocked crypto', async () => {
      // Setup more realistic mocks for integration test
      const realTextEncoder = new TextEncoder()
      const realTextDecoder = new TextDecoder()
      
      const testPlaintext = 'integration-test-data'
      const testEncryptedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      
      ;(mockCrypto.subtle.encrypt as jest.Mock).mockResolvedValue(testEncryptedBytes.buffer)
      ;(mockCrypto.subtle.decrypt as jest.Mock).mockResolvedValue(realTextEncoder.encode(testPlaintext))
      
      const encrypted = await CryptoUtils.encrypt(testPlaintext, 'test-password')
      expect(encrypted).toBeDefined()
      
      const decrypted = await CryptoUtils.decrypt(encrypted, 'test-password')
      expect(decrypted).toBe(testPlaintext)
    })

    it('should handle large data encryption', async () => {
      const largeData = 'x'.repeat(10000) // 10KB of data
      const testEncryptedBytes = new Uint8Array(10000).fill(42)
      
      ;(mockCrypto.subtle.encrypt as jest.Mock).mockResolvedValue(testEncryptedBytes.buffer)
      ;(mockCrypto.subtle.decrypt as jest.Mock).mockResolvedValue(new TextEncoder().encode(largeData))
      
      const encrypted = await CryptoUtils.encrypt(largeData, 'test-password')
      expect(encrypted).toBeDefined()
      
      const decrypted = await CryptoUtils.decrypt(encrypted, 'test-password')
      expect(decrypted).toBe(largeData)
    })

    it('should handle unicode data correctly', async () => {
      const unicodeData = '🔒 Secure data with émojis and spëcial chârs 中文'
      const encodedData = new TextEncoder().encode(unicodeData)
      
      ;(mockCrypto.subtle.encrypt as jest.Mock).mockResolvedValue(encodedData.buffer)
      ;(mockCrypto.subtle.decrypt as jest.Mock).mockResolvedValue(encodedData)
      
      const encrypted = await CryptoUtils.encrypt(unicodeData, 'test-password')
      expect(encrypted).toBeDefined()
      
      const decrypted = await CryptoUtils.decrypt(encrypted, 'test-password')
      expect(decrypted).toBe(unicodeData)
    })
  })
})