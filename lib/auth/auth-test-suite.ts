// Comprehensive authentication test suite
import { CryptoUtils } from './crypto-utils'
import { SessionManager } from './session-manager'
import { TokenManager } from './token-manager'
import { SecureCredentialManager } from './secure-credential-manager'
import { AuthRateLimiters } from './rate-limiter'

export interface TestResult {
  test: string
  passed: boolean
  error?: string
  duration?: number
}

export interface TestSuiteResult {
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
  duration: number
}

export class AuthTestSuite {
  private results: TestResult[] = []
  
  async runAllTests(): Promise<TestSuiteResult> {
    const startTime = Date.now()
    this.results = []
    
    console.log('🔒 Starting Authentication Test Suite...')
    
    // Crypto utilities tests
    await this.testCryptoUtilities()
    
    // Session management tests
    await this.testSessionManagement()
    
    // Token management tests
    await this.testTokenManagement()
    
    // Credential management tests
    await this.testCredentialManagement()
    
    // Rate limiting tests
    await this.testRateLimiting()
    
    // Integration tests
    await this.testIntegration()
    
    const endTime = Date.now()
    const totalTests = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = totalTests - passed
    
    console.log(`✅ Test Suite Complete: ${passed}/${totalTests} passed (${failed} failed)`)
    
    return {
      totalTests,
      passed,
      failed,
      results: this.results,
      duration: endTime - startTime
    }
  }
  
  private async runTest(testName: string, testFn: () => Promise<void> | void): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      const duration = Date.now() - startTime
      this.results.push({ test: testName, passed: true, duration })
      console.log(`✅ ${testName} (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.push({ 
        test: testName, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      })
      console.error(`❌ ${testName} (${duration}ms):`, error)
    }
  }
  
  private async testCryptoUtilities(): Promise<void> {
    console.log('\n🔐 Testing Crypto Utilities...')
    
    await this.runTest('Generate Secure Token', async () => {
      const token = CryptoUtils.generateSecureToken()
      if (!token || token.length < 32) {
        throw new Error('Token too short')
      }
      if (!CryptoUtils.isValidToken(token)) {
        throw new Error('Generated token failed validation')
      }
    })
    
    await this.runTest('Encrypt/Decrypt Data', async () => {
      const testData = 'sensitive credential data'
      const password = 'test-password-123'
      
      const encrypted = await CryptoUtils.encrypt(testData, password)
      if (!encrypted || encrypted === testData) {
        throw new Error('Encryption failed')
      }
      
      const decrypted = await CryptoUtils.decrypt(encrypted, password)
      if (decrypted !== testData) {
        throw new Error('Decryption failed or data corrupted')
      }
    })
    
    await this.runTest('Hash Function', async () => {
      const input = 'test-input'
      const hash1 = await CryptoUtils.hash(input)
      const hash2 = await CryptoUtils.hash(input)
      
      if (hash1 !== hash2) {
        throw new Error('Hash function not deterministic')
      }
      
      if (hash1.length < 32) {
        throw new Error('Hash too short')
      }
    })
    
    await this.runTest('Token Validation', () => {
      // Valid tokens
      const validTokens = [
        'EAABwzLixnjYBO1234567890abcdefghijklmnopqrstuvwxyz123456789',
        'ABC123|DEF456_GHI789-JKL012_MNO345PQR678STU901VWX234YZ567AB890'
      ]
      
      validTokens.forEach(token => {
        if (!CryptoUtils.isValidToken(token)) {
          throw new Error(`Valid token ${token} failed validation`)
        }
      })
      
      // Invalid tokens
      const invalidTokens = [
        '',
        'short',
        'a'.repeat(30), // Too short
        'ab', // Way too short
      ]
      
      invalidTokens.forEach(token => {
        if (CryptoUtils.isValidToken(token)) {
          throw new Error(`Invalid token ${token} passed validation`)
        }
      })
    })
  }
  
  private async testSessionManagement(): Promise<void> {
    console.log('\n👤 Testing Session Management...')
    
    await this.runTest('Initialize Session Manager', async () => {
      SessionManager.initialize({
        sessionTimeout: 60000, // 1 minute for testing
        activityTimeout: 30000, // 30 seconds
        enableAutoRenew: false // Disable for testing
      })
    })
    
    await this.runTest('Create Session', async () => {
      const session = await SessionManager.createSession('test-user')
      
      if (!session || !session.id || !session.csrfToken) {
        throw new Error('Session creation failed')
      }
      
      if (session.userId !== 'test-user') {
        throw new Error('Session user ID mismatch')
      }
    })
    
    await this.runTest('Get Session', async () => {
      const session = SessionManager.getSession()
      
      if (!session) {
        throw new Error('Session retrieval failed')
      }
      
      if (session.userId !== 'test-user') {
        throw new Error('Session data mismatch')
      }
    })
    
    await this.runTest('Update Activity', () => {
      const sessionBefore = SessionManager.getSession()
      if (!sessionBefore) throw new Error('No session to update')
      
      const lastActivityBefore = sessionBefore.lastActivity
      
      // Wait a bit
      setTimeout(() => {
        SessionManager.updateActivity()
        
        const sessionAfter = SessionManager.getSession()
        if (!sessionAfter) throw new Error('Session lost after activity update')
        
        if (sessionAfter.lastActivity <= lastActivityBefore) {
          throw new Error('Activity timestamp not updated')
        }
      }, 10)
    })
    
    await this.runTest('CSRF Token Validation', () => {
      const session = SessionManager.getSession()
      if (!session) throw new Error('No session for CSRF test')
      
      const validToken = session.csrfToken
      const invalidToken = 'invalid-token'
      
      if (!SessionManager.validateCSRFToken(validToken)) {
        throw new Error('Valid CSRF token rejected')
      }
      
      if (SessionManager.validateCSRFToken(invalidToken)) {
        throw new Error('Invalid CSRF token accepted')
      }
    })
  }
  
  private async testTokenManagement(): Promise<void> {
    console.log('\n🎫 Testing Token Management...')
    
    await this.runTest('Token Format Validation', () => {
      const validTokens = [
        'EAABwzLixnjYBO1234567890abcdefghijklmnopqrstuvwxyz123456789',
        'EAAG1234567890abcdefghijklmnopqrstuvwxyz123456789',
        'ABC123|DEF456_GHI789-JKL012_MNO345PQR678STU901VWX234YZ567AB890'
      ]
      
      validTokens.forEach(token => {
        if (!TokenManager.validateTokenFormat(token)) {
          throw new Error(`Valid token format rejected: ${token}`)
        }
      })
      
      const invalidTokens = [
        '',
        'short',
        'invalid@token!',
        'a'.repeat(600), // Too long
      ]
      
      invalidTokens.forEach(token => {
        if (TokenManager.validateTokenFormat(token)) {
          throw new Error(`Invalid token format accepted: ${token}`)
        }
      })
    })
    
    await this.runTest('Save and Load Token', async () => {
      const tokenInfo = {
        accessToken: 'EAABwzLixnjYBOtest123456789abcdefghijklmnopqrstuvwxyz',
        refreshToken: 'refresh_token_123',
        expiresAt: Date.now() + 60000
      }
      
      const saved = await TokenManager.saveToken(tokenInfo, true)
      if (!saved) {
        throw new Error('Token save failed')
      }
      
      const loaded = await TokenManager.loadToken(true)
      if (!loaded) {
        throw new Error('Token load failed')
      }
      
      if (loaded.accessToken !== tokenInfo.accessToken) {
        throw new Error('Token data mismatch')
      }
    })
    
    await this.runTest('Token Status Check', async () => {
      const status = await TokenManager.getTokenStatus()
      
      if (!status.hasToken || !status.isValid) {
        throw new Error('Token status check failed')
      }
    })
    
    await this.runTest('OAuth Error Parsing', () => {
      const testCases = [
        {
          error: { code: 190, message: 'Invalid OAuth access token' },
          expected: { isExpired: true, needsReauth: true }
        },
        {
          error: { code: 102, message: 'Session expired' },
          expected: { isExpired: true, needsReauth: true }
        },
        {
          error: { code: 100, message: 'Invalid parameter' },
          expected: { isExpired: false, needsReauth: false }
        }
      ]
      
      testCases.forEach(({ error, expected }) => {
        const parsed = TokenManager.parseOAuthError(error)
        
        if (parsed.isExpired !== expected.isExpired) {
          throw new Error(`OAuth error parsing failed for code ${error.code}`)
        }
        
        if (parsed.needsReauth !== expected.needsReauth) {
          throw new Error(`OAuth reauth detection failed for code ${error.code}`)
        }
      })
    })
  }
  
  private async testCredentialManagement(): Promise<void> {
    console.log('\n🔑 Testing Credential Management...')
    
    await this.runTest('Initialize Secure Credential Manager', async () => {
      await SecureCredentialManager.initialize()
    })
    
    await this.runTest('Save and Load Encrypted Credentials', async () => {
      const credentials = {
        accessToken: 'EAABwzLixnjYBOtest123456789abcdefghijklmnopqrstuvwxyz',
        adAccountId: 'act_123456789',
        encryptionEnabled: true
      }
      
      const saved = await SecureCredentialManager.save(credentials, true, true)
      if (!saved) {
        throw new Error('Credential save failed')
      }
      
      const loaded = await SecureCredentialManager.load()
      if (!loaded) {
        throw new Error('Credential load failed')
      }
      
      if (loaded.accessToken !== credentials.accessToken) {
        throw new Error('Credential data mismatch')
      }
      
      if (loaded.adAccountId !== credentials.adAccountId) {
        throw new Error('Account ID mismatch')
      }
    })
    
    await this.runTest('Format Validation', async () => {
      const validCredentials = {
        accessToken: 'EAABwzLixnjYBOtest123456789abcdefghijklmnopqrstuvwxyz',
        adAccountId: 'act_123456789'
      }
      
      const result = await SecureCredentialManager.validate(validCredentials)
      
      if (!result.details?.tokenFormat) {
        throw new Error('Valid token format rejected')
      }
      
      if (!result.details?.accountFormat) {
        throw new Error('Valid account format rejected')
      }
    })
    
    await this.runTest('Export and Import', async () => {
      const password = 'test-export-password'
      
      const exported = await SecureCredentialManager.exportCredentials(password)
      if (!exported) {
        throw new Error('Export failed')
      }
      
      // Clear credentials
      await SecureCredentialManager.clear()
      
      // Import back
      const imported = await SecureCredentialManager.importCredentials(exported, password)
      if (!imported) {
        throw new Error('Import failed')
      }
      
      // Verify data is restored
      const restored = await SecureCredentialManager.load()
      if (!restored) {
        throw new Error('Restored credentials not found')
      }
    })
  }
  
  private async testRateLimiting(): Promise<void> {
    console.log('\n⏱️ Testing Rate Limiting...')
    
    await this.runTest('Login Rate Limiting', async () => {
      const limiter = AuthRateLimiters.getLoginLimiter()
      
      // Should allow first few requests
      for (let i = 0; i < 3; i++) {
        const result = await limiter.checkLimit('test-key')
        if (!result.allowed) {
          throw new Error(`Request ${i + 1} was blocked unexpectedly`)
        }
      }
    })
    
    await this.runTest('API Rate Limiting', async () => {
      const limiter = AuthRateLimiters.getApiLimiter()
      
      // Should allow many requests
      for (let i = 0; i < 10; i++) {
        const result = await limiter.checkLimit('test-api-key')
        if (!result.allowed) {
          throw new Error(`API request ${i + 1} was blocked unexpectedly`)
        }
      }
    })
    
    await this.runTest('Rate Limit Reset', async () => {
      const limiter = AuthRateLimiters.getValidationLimiter()
      const testKey = 'reset-test-key'
      
      // Use up the limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit(testKey)
      }
      
      // Should be blocked now
      const blockedResult = await limiter.checkLimit(testKey)
      if (blockedResult.allowed) {
        throw new Error('Rate limit not enforced')
      }
      
      // Reset and try again
      limiter.resetLimit(testKey)
      const resetResult = await limiter.checkLimit(testKey)
      if (!resetResult.allowed) {
        throw new Error('Rate limit reset failed')
      }
    })
  }
  
  private async testIntegration(): Promise<void> {
    console.log('\n🔗 Testing Integration...')
    
    await this.runTest('Full Authentication Flow', async () => {
      // Clear any existing state
      await SecureCredentialManager.clear()
      
      // Initialize all systems
      await SecureCredentialManager.initialize()
      
      // Create session
      const session = await SessionManager.createSession('integration-test')
      if (!session) {
        throw new Error('Session creation failed in integration test')
      }
      
      // Save credentials
      const credentials = {
        accessToken: 'EAABwzLixnjYBOintegration123456789abcdefghijklmnopqr',
        adAccountId: 'act_987654321',
        encryptionEnabled: true
      }
      
      const saved = await SecureCredentialManager.save(credentials, true, true)
      if (!saved) {
        throw new Error('Credential save failed in integration test')
      }
      
      // Verify everything is working together
      const loadedCreds = await SecureCredentialManager.load()
      const currentSession = SessionManager.getSession()
      const tokenStatus = await TokenManager.getTokenStatus()
      
      if (!loadedCreds || !currentSession || !tokenStatus.hasToken) {
        throw new Error('Integration test failed - components not working together')
      }
    })
    
    await this.runTest('Security Event Handling', async () => {
      let eventFired = false
      
      const handler = () => {
        eventFired = true
      }
      
      // Listen for token expiry event
      window.addEventListener('token-expired', handler)
      
      // Simulate token expiry
      window.dispatchEvent(new CustomEvent('token-expired', {
        detail: { reason: 'test' }
      }))
      
      // Wait a bit for event to process
      await new Promise(resolve => setTimeout(resolve, 10))
      
      window.removeEventListener('token-expired', handler)
      
      if (!eventFired) {
        throw new Error('Security event not handled')
      }
    })
  }
}