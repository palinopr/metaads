/**
 * Agent 7: Security Agent
 * Implements security best practices and vulnerability protection
 */

import { BaseAgent, Task } from './base-agent';

export class SecurityAgent extends BaseAgent {
  constructor() {
    super('Security');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'sec-1',
        name: 'Implement input validation',
        description: 'Sanitize and validate all user inputs',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'sec-2',
        name: 'Setup CSP headers',
        description: 'Content Security Policy configuration',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'sec-3',
        name: 'Add rate limiting',
        description: 'Protect against DDoS and brute force',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'sec-4',
        name: 'Implement encryption',
        description: 'Encrypt sensitive data at rest and in transit',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'sec-5',
        name: 'Create audit logging',
        description: 'Track security-relevant events',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting security implementation...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'sec-1':
        await this.implementInputValidation();
        break;
      case 'sec-2':
        await this.setupCSPHeaders();
        break;
      case 'sec-3':
        await this.addRateLimiting();
        break;
      case 'sec-4':
        await this.implementEncryption();
        break;
      case 'sec-5':
        await this.createAuditLogging();
        break;
    }
  }

  private async implementInputValidation() {
    await this.writeFile('lib/security/validation.ts', `
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email address'),
  
  url: z.string().url('Invalid URL').refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  ),
  
  metaAccessToken: z.string()
    .min(1, 'Access token is required')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid token format'),
  
  metaAdAccountId: z.string()
    .regex(/^act_\\d+$/, 'Ad account ID must start with "act_" followed by numbers'),
  
  campaignId: z.string()
    .regex(/^\\d+$/, 'Campaign ID must be numeric'),
  
  dateRange: z.enum(['today', 'yesterday', 'last_7d', 'last_30d', 'last_90d', 'all_time']),
  
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),
  
  campaignUpdate: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'PAUSED']).optional(),
    dailyBudget: z.number().positive().optional(),
    bidAmount: z.number().positive().optional()
  })
};

// Input sanitization
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove control characters
  sanitized = sanitized.replace(/[\\x00-\\x1F\\x7F]/g, '');
  
  return sanitized;
}

// HTML sanitization
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

// SQL injection prevention
export function escapeSQLIdentifier(identifier: string): string {
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error('Invalid SQL identifier');
  }
  return identifier;
}

// Path traversal prevention
export function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  const sanitized = path
    .replace(/\\.\\./g, '')
    .replace(/\\/\\/+/g, '/')
    .replace(/^[./]+/, '');
  
  // Ensure path doesn't escape base directory
  if (sanitized.includes('..') || sanitized.startsWith('/')) {
    throw new Error('Invalid path');
  }
  
  return sanitized;
}

// Request validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<T> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  };
}

// Custom validation error
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Rate limit validation
export function validateRateLimit(
  key: string,
  limit: number,
  window: number
): boolean {
  // This would integrate with your rate limiting service
  // For now, return true as placeholder
  return true;
}

// CSRF token validation
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Constant-time comparison to prevent timing attacks
  if (token.length !== sessionToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i);
  }
  
  return result === 0;
}

// File upload validation
export function validateFileUpload(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): void {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    throw new Error(\`File size exceeds maximum of \${maxSize / 1024 / 1024}MB\`);
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    throw new Error('File extension not allowed');
  }
  
  // Additional checks could include:
  // - Magic number validation
  // - Virus scanning
  // - Content analysis
}
`);

    this.log('Input validation implemented');
  }

  private async setupCSPHeaders() {
    await this.writeFile('lib/security/csp.ts', `
export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'manifest-src'?: string[];
  'worker-src'?: string[];
  'navigate-to'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'require-trusted-types-for'?: string[];
  'trusted-types'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export class CSPBuilder {
  private directives: CSPDirectives = {};
  private nonce?: string;

  constructor(nonce?: string) {
    this.nonce = nonce;
    this.setDefaultDirectives();
  }

  private setDefaultDirectives() {
    this.directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", this.nonce ? \`'nonce-\${this.nonce}'\` : "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"], // Required for styled-components
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': [
        "'self'",
        'https://graph.facebook.com',
        'https://api.anthropic.com',
        'wss://*.anthropic.com',
        'https://*.google-analytics.com',
        'https://*.sentry.io'
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
      'upgrade-insecure-requests': true
    };
  }

  addDirective(directive: keyof CSPDirectives, values: string[]): this {
    if (!this.directives[directive]) {
      this.directives[directive] = [];
    }
    
    if (Array.isArray(this.directives[directive])) {
      (this.directives[directive] as string[]).push(...values);
    }
    
    return this;
  }

  removeDirective(directive: keyof CSPDirectives): this {
    delete this.directives[directive];
    return this;
  }

  build(): string {
    const parts: string[] = [];

    Object.entries(this.directives).forEach(([directive, value]) => {
      if (typeof value === 'boolean' && value) {
        parts.push(directive);
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(\`\${directive} \${value.join(' ')}\`);
      } else if (typeof value === 'string') {
        parts.push(\`\${directive} \${value}\`);
      }
    });

    return parts.join('; ');
  }

  // Environment-specific configurations
  forDevelopment(): this {
    this.addDirective('script-src', ["'unsafe-eval'"]); // For React DevTools
    this.addDirective('connect-src', ['ws://localhost:*', 'http://localhost:*']);
    return this;
  }

  forProduction(): this {
    this.removeDirective('script-src');
    this.addDirective('script-src', [
      "'self'",
      this.nonce ? \`'nonce-\${this.nonce}'\` : '',
      "'strict-dynamic'"
    ].filter(Boolean));
    
    this.addDirective('report-uri', ['/api/csp-report']);
    return this;
  }
}

// Nonce generation
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  
  // Fallback for older environments
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// CSP violation reporter
export async function reportCSPViolation(violation: any): Promise<void> {
  try {
    await fetch('/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        violation,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  } catch (error) {
    console.error('Failed to report CSP violation:', error);
  }
}

// React hook for CSP nonce
import { createContext, useContext } from 'react';

const CSPContext = createContext<string | undefined>(undefined);

export function CSPProvider({ 
  children, 
  nonce 
}: { 
  children: React.ReactNode; 
  nonce?: string;
}) {
  return (
    <CSPContext.Provider value={nonce}>
      {children}
    </CSPContext.Provider>
  );
}

export function useCSPNonce(): string | undefined {
  return useContext(CSPContext);
}

// Security headers configuration
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const cspBuilder = new CSPBuilder(nonce);
  
  if (process.env.NODE_ENV === 'development') {
    cspBuilder.forDevelopment();
  } else {
    cspBuilder.forProduction();
  }

  return {
    'Content-Security-Policy': cspBuilder.build(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
  };
}
`);

    this.log('CSP headers configured');
  }

  private async addRateLimiting() {
    await this.writeFile('lib/security/rate-limiter.ts', `
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request) => Response;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      keyGenerator: (req) => this.getDefaultKey(req),
      skip: () => false,
      handler: (req) => this.defaultHandler(req),
      ...config
    };

    this.cache = new LRUCache({
      max: 10000, // Maximum number of keys
      ttl: this.config.windowMs
    });
  }

  async limit(req: Request): Promise<Response | null> {
    if (this.config.skip(req)) {
      return null;
    }

    const key = this.config.keyGenerator(req);
    const now = Date.now();
    const entry = this.cache.get(key) || { count: 0, resetTime: now + this.config.windowMs };

    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
    }

    entry.count++;
    this.cache.set(key, entry);

    // Check if limit exceeded
    if (entry.count > this.config.max) {
      return this.config.handler(req);
    }

    // Add rate limit headers to response
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(this.config.max));
    headers.set('X-RateLimit-Remaining', String(Math.max(0, this.config.max - entry.count)));
    headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    return null;
  }

  private getDefaultKey(req: Request): string {
    // Try to get IP from various headers
    const forwarded = req.headers.get('x-forwarded-for');
    const real = req.headers.get('x-real-ip');
    const cloudflare = req.headers.get('cf-connecting-ip');
    
    const ip = forwarded?.split(',')[0] || real || cloudflare || 'unknown';
    const url = new URL(req.url);
    
    return \`\${ip}:\${url.pathname}\`;
  }

  private defaultHandler(req: Request): Response {
    return new Response(JSON.stringify({ error: this.config.message }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(this.config.windowMs / 1000))
      }
    });
  }

  reset(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getStatus(key: string): { count: number; remaining: number; resetTime: Date } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.max - entry.count),
      resetTime: new Date(entry.resetTime)
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict limit for auth endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts'
  }),

  // Standard API limit
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  }),

  // Relaxed limit for read operations
  read: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300
  }),

  // Strict limit for write operations
  write: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30
  }),

  // Very strict limit for expensive operations
  expensive: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10
  })
};

// Distributed rate limiting with Redis
export class DistributedRateLimiter {
  constructor(
    private redis: any, // Redis client
    private config: RateLimitConfig
  ) {}

  async limit(req: Request): Promise<Response | null> {
    const key = this.config.keyGenerator?.(req) || this.getDefaultKey(req);
    const now = Date.now();
    const window = Math.floor(now / this.config.windowMs);
    const redisKey = \`rate_limit:\${key}:\${window}\`;

    // Increment counter
    const count = await this.redis.incr(redisKey);
    
    // Set expiry on first request in window
    if (count === 1) {
      await this.redis.expire(redisKey, Math.ceil(this.config.windowMs / 1000));
    }

    // Check limit
    if (count > this.config.max) {
      return new Response(JSON.stringify({ error: this.config.message }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(this.config.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date((window + 1) * this.config.windowMs).toISOString()
        }
      });
    }

    return null;
  }

  private getDefaultKey(req: Request): string {
    const url = new URL(req.url);
    return url.pathname;
  }
}

// Middleware for Next.js
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  limiter: RateLimiter = rateLimiters.api
) {
  return async (req: Request): Promise<Response> => {
    const limitResponse = await limiter.limit(req);
    if (limitResponse) {
      return limitResponse;
    }
    return handler(req);
  };
}
`);

    this.log('Rate limiting added');
  }

  private async implementEncryption() {
    await this.writeFile('lib/security/encryption.ts', `
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private saltLength = 32;
  private tagLength = 16;
  private ivLength = 16;
  private keyLength = 32;

  constructor(private masterKey: string) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Master key must be at least 32 characters');
    }
  }

  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate salt and IV
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);

      // Derive key from master key
      const key = await this.deriveKey(this.masterKey, salt);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, key, iv);

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);

      // Get auth tag
      const tag = cipher.getAuthTag();

      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(\`Encryption failed: \${error.message}\`);
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);

      // Derive key
      const key = await this.deriveKey(this.masterKey, salt);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(\`Decryption failed: \${error.message}\`);
    }
  }

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  // Encrypt object
  async encryptObject(obj: any): Promise<string> {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  // Decrypt object
  async decryptObject<T>(encryptedData: string): Promise<T> {
    const json = await this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  // Hash sensitive data (one-way)
  async hash(data: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const hash = await scryptAsync(data, salt, 64);
    return salt.toString('hex') + ':' + (hash as Buffer).toString('hex');
  }

  // Verify hashed data
  async verifyHash(data: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = await scryptAsync(data, Buffer.from(salt, 'hex'), 64);
    return keyBuffer.equals(derivedKey as Buffer);
  }
}

// Field-level encryption for sensitive data
export class FieldEncryption {
  constructor(private encryption: EncryptionService) {}

  // Encrypt specific fields in an object
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Promise<T> {
    const encrypted = { ...obj };

    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        encrypted[field] = await this.encryption.encrypt(String(obj[field]));
      }
    }

    return encrypted;
  }

  // Decrypt specific fields in an object
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Promise<T> {
    const decrypted = { ...obj };

    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          decrypted[field] = await this.encryption.decrypt(String(obj[field]));
        } catch (error) {
          // Log error but don't expose decryption failures
          console.error(\`Failed to decrypt field \${String(field)}\`);
          decrypted[field] = null;
        }
      }
    }

    return decrypted;
  }
}

// Token encryption for API credentials
export class TokenEncryption {
  private encryption: EncryptionService;

  constructor(masterKey: string) {
    this.encryption = new EncryptionService(masterKey);
  }

  async encryptToken(token: string, metadata?: any): Promise<string> {
    const payload = {
      token,
      metadata,
      timestamp: Date.now()
    };

    return this.encryption.encryptObject(payload);
  }

  async decryptToken(encryptedToken: string): Promise<{
    token: string;
    metadata?: any;
    timestamp: number;
  }> {
    return this.encryption.decryptObject(encryptedToken);
  }

  async rotateToken(oldEncrypted: string, newToken: string): Promise<string> {
    const { metadata } = await this.decryptToken(oldEncrypted);
    return this.encryptToken(newToken, metadata);
  }
}

// Browser-side encryption using Web Crypto API
export class BrowserEncryption {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  async importKey(keyString: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      this.encoder.encode(plaintext)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return this.decoder.decode(decrypted);
  }
}

// Initialize encryption service
const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-key-change-in-production';
export const encryptionService = new EncryptionService(masterKey);
export const fieldEncryption = new FieldEncryption(encryptionService);
export const tokenEncryption = new TokenEncryption(masterKey);
`);

    this.log('Encryption implemented');
  }

  private async createAuditLogging() {
    await this.writeFile('lib/security/audit-logger.ts', `
interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  result: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export class AuditLogger {
  private queue: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxQueueSize = 100;
  private flushIntervalMs = 5000;

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...event
    };

    this.queue.push(auditEvent);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      await this.flush();
    }
  }

  private generateId(): string {
    return \`audit_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to audit log storage
      await this.storeEvents(events);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add events to queue for retry
      this.queue.unshift(...events);
    }
  }

  private async storeEvents(events: AuditEvent[]): Promise<void> {
    // Store in database or external service
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
  }

  // Security-specific audit methods
  async logAuthentication(
    userId: string,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'authentication',
      result: success ? 'success' : 'failure',
      metadata
    });
  }

  async logAuthorization(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action: \`authorization:\${action}\`,
      resource,
      result: allowed ? 'success' : 'failure',
      metadata
    });
  }

  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action: \`data:\${action}\`,
      resource,
      resourceId,
      result: 'success',
      metadata
    });
  }

  async logSecurityEvent(
    event: 'csrf_attempt' | 'xss_attempt' | 'sql_injection' | 'rate_limit_exceeded',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: \`security:\${event}\`,
      result: 'failure',
      metadata
    });
  }

  async logConfigChange(
    userId: string,
    setting: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.log({
      userId,
      action: 'config_change',
      resource: setting,
      result: 'success',
      metadata: { oldValue, newValue }
    });
  }

  // Query audit logs
  async query(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    result?: AuditEvent['result'];
    limit?: number;
  }): Promise<AuditEvent[]> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.result) params.append('result', filters.result);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(\`/api/audit-logs?\${params}\`);
    return response.json();
  }

  // Generate audit report
  async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    failurePatterns: Array<{ pattern: string; count: number }>;
  }> {
    const events = await this.query({ startDate, endDate });

    // Calculate summary statistics
    const summary: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const failures: Record<string, number> = {};

    events.forEach(event => {
      // Count by action
      summary[event.action] = (summary[event.action] || 0) + 1;

      // Count by user
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }

      // Track failures
      if (event.result === 'failure') {
        const key = \`\${event.action}:\${event.errorMessage || 'unknown'}\`;
        failures[key] = (failures[key] || 0) + 1;
      }
    });

    // Get top users
    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Get failure patterns
    const failurePatterns = Object.entries(failures)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    return { summary, topUsers, failurePatterns };
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

// Audit middleware for API routes
export function withAudit(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    
    let response: Response;
    let error: Error | null = null;

    try {
      response = await handler(req);
    } catch (err) {
      error = err as Error;
      response = new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      );
    }

    // Log the API request
    await auditLogger.log({
      action: \`api:\${req.method}:\${url.pathname}\`,
      result: error ? 'error' : response.ok ? 'success' : 'failure',
      metadata: {
        method: req.method,
        path: url.pathname,
        status: response.status,
        duration: Date.now() - startTime,
        userAgent: req.headers.get('user-agent')
      },
      errorMessage: error?.message
    });

    return response;
  };
}
`);

    this.log('Audit logging created');
  }
}