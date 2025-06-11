import { headers } from 'next/headers';

export interface SecurityConfig {
  development: boolean;
  enableReporting: boolean;
  nonce?: string;
  trustedDomains?: string[];
  reportUri?: string;
}

export class EnhancedCSPBuilder {
  private nonce: string;
  private config: SecurityConfig;
  
  constructor(config: SecurityConfig = { development: false, enableReporting: true }) {
    this.config = config;
    this.nonce = config.nonce || this.generateNonce();
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getTrustedDomains(): string[] {
    const baseDomains = [
      "'self'",
      'https://graph.facebook.com',
      'https://api.anthropic.com',
      'https://*.sentry.io'
    ];

    if (this.config.trustedDomains) {
      baseDomains.push(...this.config.trustedDomains);
    }

    if (this.config.development) {
      baseDomains.push(
        'http://localhost:*',
        'https://localhost:*',
        'ws://localhost:*',
        'wss://localhost:*'
      );
    }

    return baseDomains;
  }

  buildStrictCSP(): string {
    const trustedDomains = this.getTrustedDomains();
    
    const directives = {
      'default-src': ["'none'"], // Deny by default
      'script-src': [
        "'self'",
        `'nonce-${this.nonce}'`,
        "'strict-dynamic'"
      ],
      'style-src': [
        "'self'",
        `'nonce-${this.nonce}'`,
        "'unsafe-inline'" // Required for styled-components
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      'font-src': [
        "'self'",
        'data:'
      ],
      'connect-src': [
        "'self'",
        'https://graph.facebook.com',
        'https://api.anthropic.com',
        'https://*.sentry.io',
        ...(this.config.development ? [
          'http://localhost:*',
          'https://localhost:*',
          'ws://localhost:*',
          'wss://localhost:*'
        ] : [])
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
      'child-src': ["'none'"],
      'upgrade-insecure-requests': true
    };

    if (this.config.enableReporting && this.config.reportUri) {
      directives['report-uri'] = [this.config.reportUri];
      directives['report-to'] = ['csp-endpoint'];
    }

    if (this.config.development) {
      // Relax some restrictions for development
      directives['script-src'].push("'unsafe-eval'"); // For React DevTools
    }

    return this.buildCSPString(directives);
  }

  private buildCSPString(directives: Record<string, any>): string {
    const parts: string[] = [];

    Object.entries(directives).forEach(([directive, value]) => {
      if (typeof value === 'boolean' && value) {
        parts.push(directive);
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(`${directive} ${value.join(' ')}`);
      }
    });

    return parts.join('; ');
  }

  getNonce(): string {
    return this.nonce;
  }

  getReportingEndpoint(): object {
    return {
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [
        {
          url: this.config.reportUri || '/api/security/csp-report'
        }
      ]
    };
  }
}

export function getSecurityHeaders(config?: SecurityConfig): Record<string, string> {
  const cspBuilder = new EnhancedCSPBuilder(config);
  const csp = cspBuilder.buildStrictCSP();
  
  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };

  if (config?.enableReporting) {
    headers['Report-To'] = JSON.stringify(cspBuilder.getReportingEndpoint());
  }

  return headers;
}

export async function generateCSPNonce(): Promise<string> {
  return crypto.randomBytes(16).toString('base64');
}

// Security headers for different environments
export const SECURITY_HEADERS = {
  development: {
    development: true,
    enableReporting: false,
    trustedDomains: [
      'http://localhost:3000',
      'ws://localhost:3000',
      'https://localhost:3000'
    ]
  },
  production: {
    development: false,
    enableReporting: true,
    reportUri: '/api/security/csp-report'
  }
};

// CSP violation reporter for client-side
export const cspViolationReporter = `
(function() {
  document.addEventListener('securitypolicyviolation', function(e) {
    const violation = {
      blockedURI: e.blockedURI,
      columnNumber: e.columnNumber,
      disposition: e.disposition,
      documentURI: e.documentURI,
      effectiveDirective: e.effectiveDirective,
      lineNumber: e.lineNumber,
      originalPolicy: e.originalPolicy,
      referrer: e.referrer,
      sample: e.sample,
      sourceFile: e.sourceFile,
      statusCode: e.statusCode,
      violatedDirective: e.violatedDirective
    };
    
    fetch('/api/security/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ violation, timestamp: new Date().toISOString() })
    }).catch(function(err) {
      console.warn('Failed to report CSP violation:', err);
    });
  });
})();
`;
