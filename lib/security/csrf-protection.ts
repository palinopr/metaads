import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface CSRFConfig {
  tokenName: string;
  cookieName: string;
  headerName: string;
  secretKey: string;
  tokenLength: number;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };
}

const DEFAULT_CONFIG: CSRFConfig = {
  tokenName: 'csrfToken',
  cookieName: '__Host-csrf-token',
  headerName: 'X-CSRF-Token',
  secretKey: process.env.CSRF_SECRET || 'default-secret-change-in-production',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  }
};

export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  generateToken(): string {
    const randomBytes = crypto.randomBytes(this.config.tokenLength);
    const timestamp = Date.now().toString(36);
    const token = randomBytes.toString('hex') + timestamp;
    
    return this.signToken(token);
  }

  private signToken(token: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(token);
    const signature = hmac.digest('hex');
    
    return `${token}.${signature}`;
  }

  private verifyTokenSignature(signedToken: string): boolean {
    const parts = signedToken.split('.');
    if (parts.length !== 2) return false;
    
    const [token, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', this.config.secretKey)
      .update(token)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(signature, expectedSignature);
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  private isTokenExpired(signedToken: string): boolean {
    try {
      const token = signedToken.split('.')[0];
      const timestampHex = token.slice(-8); // Last 8 characters are timestamp
      const timestamp = parseInt(timestampHex, 36);
      const age = Date.now() - timestamp;
      
      return age > (this.config.cookieOptions.maxAge * 1000);
    } catch {
      return true; // If we can't parse, consider it expired
    }
  }

  validateToken(token: string, cookieToken: string): boolean {
    if (!token || !cookieToken) return false;
    
    // Verify both tokens are properly signed
    if (!this.verifyTokenSignature(token) || !this.verifyTokenSignature(cookieToken)) {
      return false;
    }
    
    // Check if tokens match (double-submit cookie pattern)
    if (!this.constantTimeCompare(token, cookieToken)) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return false;
    }
    
    return true;
  }

  setTokenCookie(response: NextResponse, token?: string): NextResponse {
    const csrfToken = token || this.generateToken();
    
    response.cookies.set(this.config.cookieName, csrfToken, {
      ...this.config.cookieOptions,
      path: '/'
    });
    
    return response;
  }

  getTokenFromRequest(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.config.headerName);
    if (headerToken) return headerToken;
    
    // Try form data if POST request
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        // This would need to be handled in the actual route handler
        // as we can't read the body here without consuming it
        return null;
      }
    }
    
    return null;
  }

  getCookieToken(request: NextRequest): string | null {
    return request.cookies.get(this.config.cookieName)?.value || null;
  }
}

// Middleware wrapper for CSRF protection
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<CSRFConfig>
) {
  const csrf = new CSRFProtection(config);
  
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const response = await handler(request);
      
      // Set CSRF token for subsequent requests
      const token = csrf.generateToken();
      csrf.setTokenCookie(response, token);
      
      // Add token to response headers for client access
      response.headers.set('X-CSRF-Token', token);
      
      return response;
    }
    
    // Validate CSRF token for unsafe methods
    const requestToken = csrf.getTokenFromRequest(request);
    const cookieToken = csrf.getCookieToken(request);
    
    if (!csrf.validateToken(requestToken || '', cookieToken || '')) {
      return NextResponse.json(
        { 
          error: 'CSRF token validation failed',
          code: 'CSRF_INVALID'
        },
        { 
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }
    
    // Token valid, proceed with request
    const response = await handler(request);
    
    // Refresh token for next request
    const newToken = csrf.generateToken();
    csrf.setTokenCookie(response, newToken);
    response.headers.set('X-CSRF-Token', newToken);
    
    return response;
  };
}

// React hook for CSRF token management
export const csrfTokenManager = {
  getToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    // Try to get from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;
    
    // Try to get from previous API response header
    return sessionStorage.getItem('csrf-token');
  },
  
  setToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('csrf-token', token);
    }
  },
  
  clearToken(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('csrf-token');
    }
  },
  
  async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const token = response.headers.get('X-CSRF-Token');
        if (token) {
          this.setToken(token);
          return token;
        }
      }
    } catch (error) {
      console.warn('Failed to refresh CSRF token:', error);
    }
    
    return null;
  }
};

// Fetch wrapper with CSRF protection
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = csrfTokenManager.getToken();
  
  const headers = new Headers(options.headers);
  
  if (token && !['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET')) {
    headers.set('X-CSRF-Token', token);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  });
  
  // Update token if provided in response
  const newToken = response.headers.get('X-CSRF-Token');
  if (newToken) {
    csrfTokenManager.setToken(newToken);
  }
  
  // If CSRF error, try to refresh token and retry once
  if (response.status === 403) {
    const responseData = await response.clone().json().catch(() => ({}));
    if (responseData.code === 'CSRF_INVALID') {
      const refreshedToken = await csrfTokenManager.refreshToken();
      if (refreshedToken) {
        headers.set('X-CSRF-Token', refreshedToken);
        return fetch(url, { ...options, headers });
      }
    }
  }
  
  return response;
}

// API route for getting CSRF token
export async function GET(): Promise<NextResponse> {
  const csrf = new CSRFProtection();
  const token = csrf.generateToken();
  
  const response = NextResponse.json({ token });
  csrf.setTokenCookie(response, token);
  response.headers.set('X-CSRF-Token', token);
  
  return response;
}

// Double-submit cookie pattern validation
export class DoubleSubmitCSRF {
  private secretKey: string;
  
  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.CSRF_SECRET || 'default-secret';
  }
  
  generateTokenPair(): { cookieToken: string; headerToken: string } {
    const randomValue = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Cookie token (opaque to client)
    const cookieToken = this.encryptValue(`${randomValue}:${timestamp}`);
    
    // Header token (derived from cookie)
    const headerToken = crypto.createHmac('sha256', this.secretKey)
      .update(cookieToken)
      .digest('hex');
    
    return { cookieToken, headerToken };
  }
  
  validateTokenPair(cookieToken: string, headerToken: string): boolean {
    if (!cookieToken || !headerToken) return false;
    
    try {
      // Verify the header token was derived from the cookie token
      const expectedHeaderToken = crypto.createHmac('sha256', this.secretKey)
        .update(cookieToken)
        .digest('hex');
      
      if (!this.constantTimeCompare(headerToken, expectedHeaderToken)) {
        return false;
      }
      
      // Decrypt and validate the cookie token
      const decrypted = this.decryptValue(cookieToken);
      const [randomValue, timestamp] = decrypted.split(':');
      
      // Check if token is expired (24 hours)
      const age = Date.now() - parseInt(timestamp);
      if (age > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  private encryptValue(value: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.secretKey);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  private decryptValue(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.secretKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}
