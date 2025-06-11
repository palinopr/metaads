// import DOMPurify from 'isomorphic-dompurify';
import { NextRequest, NextResponse } from 'next/server';

// XSS attack patterns
const XSS_PATTERNS = {
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gis,
  EVENT_HANDLERS: /on\w+\s*=\s*["'][^"']*["']/gi,
  JAVASCRIPT_PROTOCOL: /javascript\s*:/gi,
  VBSCRIPT_PROTOCOL: /vbscript\s*:/gi,
  DATA_PROTOCOL: /data\s*:\s*text\/html/gi,
  META_REFRESH: /<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi,
  IFRAME_TAGS: /<iframe[^>]*>.*?<\/iframe>/gis,
  OBJECT_TAGS: /<object[^>]*>.*?<\/object>/gis,
  EMBED_TAGS: /<embed[^>]*>/gi,
  FORM_TAGS: /<form[^>]*>.*?<\/form>/gis,
  INPUT_TAGS: /<input[^>]*>/gi,
  SVG_SCRIPT: /<svg[^>]*>.*?<script.*?<\/svg>/gis,
  STYLE_EXPRESSION: /expression\s*\(/gi,
  CSS_IMPORT: /@import/gi,
  BASE64_SCRIPT: /data:text\/html;base64,/gi
};

// Common XSS payloads for detection
const XSS_PAYLOADS = [
  'alert(',
  'confirm(',
  'prompt(',
  'eval(',
  'setTimeout(',
  'setInterval(',
  'Function(',
  'document.cookie',
  'window.location',
  'document.write',
  'innerHTML',
  'outerHTML'
];

export interface XSSProtectionConfig {
  enabled: boolean;
  logViolations: boolean;
  blockMode: boolean;
  reportUri?: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
  strictMode: boolean;
  sanitizeInput: boolean;
  sanitizeOutput: boolean;
}

const DEFAULT_CONFIG: XSSProtectionConfig = {
  enabled: true,
  logViolations: true,
  blockMode: true,
  strictMode: true,
  sanitizeInput: true,
  sanitizeOutput: true,
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: ['href', 'target', 'rel', 'class']
};

export class XSSProtection {
  private config: XSSProtectionConfig;
  private violationCount: Map<string, number> = new Map();

  constructor(config: Partial<XSSProtectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Detect XSS patterns in input
  detectXSS(input: string): {
    isXSS: boolean;
    patterns: string[];
    severity: 'low' | 'medium' | 'high';
    payload?: string;
  } {
    const detectedPatterns: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let suspiciousPayload: string | undefined;

    // Check against known patterns
    Object.entries(XSS_PATTERNS).forEach(([name, pattern]) => {
      if (pattern.test(input)) {
        detectedPatterns.push(name);
        if (['SCRIPT_TAGS', 'EVENT_HANDLERS', 'JAVASCRIPT_PROTOCOL'].includes(name)) {
          severity = 'high';
        } else if (severity !== 'high') {
          severity = 'medium';
        }
      }
    });

    // Check for common XSS payloads
    const lowerInput = input.toLowerCase();
    XSS_PAYLOADS.forEach(payload => {
      if (lowerInput.includes(payload.toLowerCase())) {
        detectedPatterns.push(`PAYLOAD_${payload.toUpperCase()}`);
        suspiciousPayload = payload;
        severity = 'high';
      }
    });

    // Check for encoded payloads
    if (this.checkEncodedXSS(input)) {
      detectedPatterns.push('ENCODED_XSS');
      severity = 'high';
    }

    return {
      isXSS: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      severity,
      payload: suspiciousPayload
    };
  }

  private checkEncodedXSS(input: string): boolean {
    try {
      // Check URL encoding
      const urlDecoded = decodeURIComponent(input);
      if (urlDecoded !== input && this.detectXSS(urlDecoded).isXSS) {
        return true;
      }

      // Check HTML entity encoding
      const htmlDecoded = input
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&');
      
      if (htmlDecoded !== input && this.detectXSS(htmlDecoded).isXSS) {
        return true;
      }

      // Check Base64 encoding
      if (input.includes('base64')) {
        const base64Regex = /([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
        const matches = input.match(base64Regex);
        if (matches) {
          for (const match of matches) {
            try {
              const decoded = atob(match);
              if (this.detectXSS(decoded).isXSS) {
                return true;
              }
            } catch {
              // Invalid base64, continue
            }
          }
        }
      }
    } catch {
      // Decoding error, continue
    }

    return false;
  }

  // Sanitize input to remove XSS vectors
  sanitizeInput(input: string, options: {
    allowHtml?: boolean;
    customConfig?: any;
  } = {}): string {
    if (!this.config.sanitizeInput) return input;

    const { allowHtml = false, customConfig } = options;

    if (!allowHtml) {
      // For plain text, escape all HTML
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    // For HTML content, use DOMPurify
    const config = customConfig || {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.config.allowedAttributes,
      ALLOW_DATA_ATTR: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false
    };

    if (this.config.strictMode) {
      config.FORBID_TAGS = ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'select', 'button'];
      config.FORBID_ATTR = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
    }

    return DOMPurify.sanitize(input, config);
  }

  // Sanitize output before sending to client
  sanitizeOutput(output: any): any {
    if (!this.config.sanitizeOutput) return output;

    if (typeof output === 'string') {
      return this.sanitizeInput(output);
    }

    if (Array.isArray(output)) {
      return output.map(item => this.sanitizeOutput(item));
    }

    if (typeof output === 'object' && output !== null) {
      const sanitized: any = {};
      Object.keys(output).forEach(key => {
        sanitized[key] = this.sanitizeOutput(output[key]);
      });
      return sanitized;
    }

    return output;
  }

  // Log XSS violation
  private async logViolation(violation: {
    type: 'detection' | 'block';
    patterns: string[];
    severity: string;
    input: string;
    userAgent?: string;
    ip?: string;
    url?: string;
  }): Promise<void> {
    if (!this.config.logViolations) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'XSS_VIOLATION',
      ...violation,
      input: violation.input.substring(0, 1000) // Limit log size
    };

    console.warn('XSS Violation Detected:', logEntry);

    // Send to monitoring system
    if (this.config.reportUri) {
      try {
        await fetch(this.config.reportUri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        console.error('Failed to report XSS violation:', error);
      }
    }
  }

  // Middleware for XSS protection
  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      if (!this.config.enabled) return null;

      const url = request.nextUrl.pathname;
      const userAgent = request.headers.get('user-agent') || '';
      const ip = request.headers.get('x-forwarded-for') || 'unknown';

      // Check URL parameters for XSS
      const searchParams = request.nextUrl.searchParams;
      for (const [key, value] of searchParams.entries()) {
        const detection = this.detectXSS(value);
        if (detection.isXSS) {
          await this.logViolation({
            type: 'detection',
            patterns: detection.patterns,
            severity: detection.severity,
            input: `${key}=${value}`,
            userAgent,
            ip,
            url
          });

          if (this.config.blockMode && detection.severity === 'high') {
            return NextResponse.json(
              {
                error: 'Request blocked due to XSS detection',
                code: 'XSS_BLOCKED'
              },
              { status: 400 }
            );
          }
        }
      }

      // Check request body for POST requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.clone().text();
          if (body) {
            const detection = this.detectXSS(body);
            if (detection.isXSS) {
              await this.logViolation({
                type: 'detection',
                patterns: detection.patterns,
                severity: detection.severity,
                input: body.substring(0, 500),
                userAgent,
                ip,
                url
              });

              if (this.config.blockMode && detection.severity === 'high') {
                return NextResponse.json(
                  {
                    error: 'Request blocked due to XSS detection in body',
                    code: 'XSS_BLOCKED'
                  },
                  { status: 400 }
                );
              }
            }
          }
        } catch (error) {
          // Unable to read body, continue
        }
      }

      return null; // Continue processing
    };
  }

  // Rate limiting for XSS attempts
  trackViolation(identifier: string): boolean {
    const count = this.violationCount.get(identifier) || 0;
    this.violationCount.set(identifier, count + 1);

    // Block after 5 violations in 1 hour
    if (count >= 5) {
      setTimeout(() => {
        this.violationCount.delete(identifier);
      }, 60 * 60 * 1000); // 1 hour
      return true; // Should block
    }

    return false;
  }

  // Response sanitization wrapper
  wrapResponse(response: NextResponse): NextResponse {
    if (!this.config.sanitizeOutput) return response;

    // Add XSS protection headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  }
}

// Global XSS protection instance
export const xssProtection = new XSSProtection();

// Utility functions for components
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const sanitized = { ...props };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = xssProtection.sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
}

// React component wrapper for XSS protection
export function withXSSProtection<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function XSSProtectedComponent(props: P) {
    const sanitizedProps = sanitizeProps(props);
    return React.createElement(Component, sanitizedProps);
  };
}

// HTML sanitization for dangerouslySetInnerHTML
export function createSafeHTML(html: string): { __html: string } {
  return {
    __html: xssProtection.sanitizeInput(html, { allowHtml: true })
  };
}

// Validation middleware wrapper
export function withXSSValidation(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const middleware = xssProtection.createMiddleware();
    const blockResponse = await middleware(request);
    
    if (blockResponse) {
      return blockResponse;
    }
    
    const response = await handler(request);
    return xssProtection.wrapResponse(response);
  };
}
