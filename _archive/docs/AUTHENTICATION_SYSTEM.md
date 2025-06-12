# Enhanced Authentication & Security System

This document outlines the comprehensive authentication and security system implemented for the Meta Ads Dashboard project.

## 🔒 Overview

The enhanced authentication system provides enterprise-grade security features including:

- **AES-256-GCM encryption** for credential storage
- **Session management** with automatic timeout and renewal
- **Token management** with validation and refresh handling
- **Rate limiting** to prevent abuse and brute force attacks
- **CSRF protection** and security headers
- **OAuth flow improvements** with guided setup
- **Comprehensive error handling** and recovery mechanisms

## 🏗️ Architecture

### Core Components

1. **CryptoUtils** (`/lib/auth/crypto-utils.ts`)
   - Web Crypto API implementation
   - AES-256-GCM encryption/decryption
   - PBKDF2 key derivation
   - Secure token generation

2. **SessionManager** (`/lib/auth/session-manager.ts`)
   - Session lifecycle management
   - Activity tracking and timeout handling
   - CSRF token generation and validation
   - Auto-renewal capabilities

3. **TokenManager** (`/lib/auth/token-manager.ts`)
   - Token format validation
   - Automatic refresh logic
   - Expiry monitoring and notifications
   - OAuth error parsing

4. **SecureCredentialManager** (`/lib/auth/secure-credential-manager.ts`)
   - Encrypted credential storage
   - Migration from legacy system
   - Backup/restore functionality
   - Comprehensive validation

5. **RateLimiter** (`/lib/auth/rate-limiter.ts`)
   - In-memory rate limiting
   - Configurable windows and limits
   - Automatic cleanup and reset

### Security Features

#### Encryption
- **Algorithm**: AES-256-GCM with PBKDF2 key derivation
- **Key Generation**: Session-based with user agent entropy
- **Salt**: Random 32-byte salt per encryption
- **IV**: Random 16-byte initialization vector

#### Session Management
- **Timeout**: 24 hours maximum, 30 minutes inactivity
- **CSRF**: Random tokens for each session
- **Activity Tracking**: Mouse, keyboard, scroll, touch events
- **Auto-renewal**: 5 minutes before expiry

#### Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **API**: 60 requests per minute
- **Validation**: 10 attempts per minute
- **Token Refresh**: 5 attempts per hour

## 🚀 Getting Started

### Basic Usage

```typescript
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { TokenManager } from "@/lib/auth/token-manager"

// Initialize the system
await SecureCredentialManager.initialize()

// Save credentials with encryption
const credentials = {
  accessToken: "your_meta_token",
  adAccountId: "act_123456789",
  encryptionEnabled: true
}

const saved = await SecureCredentialManager.save(credentials, true, true)

// Load and validate
const loaded = await SecureCredentialManager.load()
const validation = await SecureCredentialManager.validate(loaded)
```

### Component Integration

```typescript
import { AuthManager } from "@/components/auth-manager"

function App() {
  return (
    <AuthManager showMonitor={true} onAuthReady={() => console.log("Ready!")}>
      <YourAppContent />
    </AuthManager>
  )
}
```

## 🛡️ Security Implementation

### API Route Protection

The system automatically adds:
- Rate limiting by IP address
- Request validation and sanitization
- Security headers (HSTS, CSP, etc.)
- Error response sanitization

```typescript
// Enhanced middleware with security headers
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
response.headers.set('Content-Security-Policy', 'default-src \'self\'; ...')
response.headers.set('X-Frame-Options', 'DENY')
```

### Token Handling

```typescript
// Automatic token validation
const isValid = await TokenManager.validateToken(token, accountId)

// OAuth error handling
const error = TokenManager.parseOAuthError(response)
if (error.needsReauth) {
  // Trigger re-authentication flow
}
```

### Error Recovery

The system includes automatic recovery mechanisms:

1. **Token Expiry**: Automatic detection and user notification
2. **Session Timeout**: Graceful degradation with re-auth prompt
3. **Network Errors**: Retry logic with exponential backoff
4. **Data Corruption**: Automatic cleanup and recovery

## 📊 Monitoring & Testing

### Authentication Status Monitor

Real-time monitoring component showing:
- Session status and expiry
- Token validity and refresh needs
- Security features status
- Rate limit usage
- Recent activity

### Test Suite

Comprehensive test suite covering:
- Encryption/decryption functionality
- Session management
- Token validation
- Rate limiting
- Integration scenarios

```typescript
import { AuthTestSuite } from "@/lib/auth/auth-test-suite"

const testSuite = new AuthTestSuite()
const results = await testSuite.runAllTests()
```

## 🔧 Configuration

### Session Configuration

```typescript
SessionManager.initialize({
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  activityTimeout: 30 * 60 * 1000,     // 30 minutes
  enableAutoRenew: true,
  maxSessionDuration: 7 * 24 * 60 * 60 * 1000 // 7 days max
})
```

### Rate Limit Configuration

```typescript
const RATE_LIMITS = {
  validation: { windowMs: 60 * 1000, maxRequests: 10 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }
}
```

## 🚨 Error Handling

### Common Error Scenarios

1. **Invalid OAuth Token** (Code: 190)
   - Clear stored credentials
   - Trigger re-authentication
   - User-friendly error message

2. **Token Expired** (Code: 102)
   - Attempt automatic refresh
   - Fallback to re-authentication
   - Preserve user session data

3. **Rate Limit Exceeded** (Code: 429)
   - Show retry countdown
   - Automatic retry after cooldown
   - Progressive backoff

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
  retryAfter?: number
  needsReauth?: boolean
  details?: {
    tokenFormat: boolean
    accountFormat: boolean
    apiConnection: boolean
  }
}
```

## 📱 User Experience

### OAuth Flow

1. **Guided Setup**: Step-by-step instructions
2. **Real-time Validation**: Format checking as user types
3. **Security Indicators**: Visual feedback on security status
4. **Error Recovery**: Clear error messages with solutions

### Settings Management

- **Migration Notice**: Automatic upgrade from legacy system
- **Security Status**: Visual indicators of protection level
- **Backup/Restore**: Encrypted credential export/import
- **Test Functions**: Built-in security testing

## 🔄 Migration Guide

### From Legacy System

The system automatically detects and migrates legacy credentials:

```typescript
// Automatic migration on first load
const migrated = await CredentialManager.migrateToSecure()

// Manual migration
if (oldCredsDetected) {
  const success = await SecureCredentialManager.migrateFromLegacy()
}
```

### Breaking Changes

- Credentials now require encryption by default
- Session management is mandatory for secure operations
- Rate limiting is enforced on all auth endpoints
- CSRF tokens required for sensitive operations

## 📈 Performance

### Optimizations

- **Lazy Loading**: Components load only when needed
- **Debounced Validation**: Real-time checks with rate limiting
- **Memory Management**: Automatic cleanup of expired data
- **Efficient Encryption**: Hardware-accelerated Web Crypto API

### Metrics

- **Encryption**: ~1-5ms per operation
- **Session Check**: <1ms
- **Token Validation**: ~100-500ms (network dependent)
- **Rate Limit Check**: <1ms

## 🔐 Security Considerations

### Best Practices Implemented

1. **Defense in Depth**: Multiple security layers
2. **Least Privilege**: Minimal required permissions
3. **Secure by Default**: Encryption enabled automatically
4. **Fail Secure**: Graceful degradation on errors
5. **Audit Trail**: Comprehensive logging and monitoring

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### Data Protection

- **At Rest**: AES-256-GCM encryption
- **In Transit**: HTTPS only
- **In Memory**: Automatic cleanup
- **Client-side**: No sensitive data in plain text

## 🛠️ Troubleshooting

### Common Issues

1. **Encryption Failures**
   - Check browser Web Crypto API support
   - Verify secure context (HTTPS)
   - Clear corrupted localStorage data

2. **Session Issues**
   - Check system clock synchronization
   - Verify activity tracking events
   - Review browser storage permissions

3. **Token Problems**
   - Validate token format and length
   - Check Meta API permissions
   - Verify account ID format

### Debug Tools

```typescript
// Get comprehensive debug info
const debugInfo = await SecureCredentialManager.getDebugInfo()

// Run security tests
const testResults = await new AuthTestSuite().runAllTests()

// Check rate limit status
const limits = await AuthRateLimiters.getApiLimiter().checkLimit('debug')
```

## 🔄 Updates & Maintenance

### Regular Tasks

1. **Token Rotation**: Monitor expiry and prompt renewal
2. **Security Updates**: Keep crypto libraries updated
3. **Rate Limit Tuning**: Adjust based on usage patterns
4. **Session Cleanup**: Remove expired data

### Monitoring

- Session creation/expiry rates
- Token validation success rates
- Rate limit hit frequency
- Error pattern analysis

## 📋 Compliance

The system is designed to meet:

- **GDPR**: Data minimization and encryption
- **SOC 2**: Security controls and monitoring
- **OWASP**: Top 10 security practices
- **Meta Security**: Platform security requirements

---

## 🚀 Quick Start Checklist

- [ ] Initialize SecureCredentialManager
- [ ] Set up SessionManager with appropriate timeouts
- [ ] Configure rate limiting for your use case
- [ ] Implement error handling and recovery
- [ ] Add security monitoring
- [ ] Test with the AuthTestSuite
- [ ] Review security headers and CSP
- [ ] Document your security procedures

For detailed implementation examples, see the component files in `/components/auth-*` and `/lib/auth/`.