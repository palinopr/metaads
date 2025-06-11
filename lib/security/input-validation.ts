import { z } from 'zod';
// import DOMPurify from 'isomorphic-dompurify';
// import validator from 'validator';

// Comprehensive security patterns
const SECURITY_PATTERNS = {
  SQL_INJECTION: /('|(\-\-)|(;)|(\||\|)|(\*|\*))|(select|union|insert|drop|delete|update|create|alter|exec|execute|script|declare|grant|revoke)/i,
  XSS: /<[^>]*script[^>]*>|javascript:|vbscript:|onload|onerror|onclick|onmouseover|onfocus|onblur|onchange|onsubmit/i,
  NOSQL_INJECTION: /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists|\$type|\$all|\$size|\$elemMatch|\$eval/i,
  COMMAND_INJECTION: /[;&|`$].*[;&|`$]/,
  PATH_TRAVERSAL: /\.\.[\/\\]/,
  LDAP_INJECTION: /[\(\)\*\\\x00]/,
  XML_INJECTION: /<\?xml|<!DOCTYPE|<!ENTITY/i,
  HEADER_INJECTION: /[\r\n]/,
  EMAIL_INJECTION: /[\r\n]|(content-type|bcc|cc|to|from):/i
};

// Enhanced validation schemas
export const secureSchemas = {
  email: z.string()
    .email('Invalid email format')
    .refine(val => !SECURITY_PATTERNS.EMAIL_INJECTION.test(val), 'Email contains invalid characters')
    .transform(val => val.toLowerCase()),

  url: z.string()
    .url('Invalid URL format')
    .refine(val => {
      try {
        const url = new URL(val);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    }, 'URL must use HTTP or HTTPS protocol')
    .refine(val => !SECURITY_PATTERNS.XSS.test(val), 'URL contains potentially malicious content'),

  metaAccessToken: z.string()
    .min(50, 'Access token too short')
    .max(500, 'Access token too long')
    .refine(val => /^[A-Za-z0-9_-]+$/.test(val), 'Invalid token format')
    .refine(val => !SECURITY_PATTERNS.SQL_INJECTION.test(val), 'Token contains invalid characters'),

  metaAdAccountId: z.string()
    .regex(/^act_\d+$/, 'Ad account ID must start with "act_" followed by numbers')
    .max(50, 'Account ID too long'),

  campaignId: z.string()
    .regex(/^\d+$/, 'Campaign ID must be numeric')
    .max(20, 'Campaign ID too long'),

  ipAddress: z.string()
    .refine(val => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val), 'Invalid IP address format'),

  fileName: z.string()
    .max(255, 'Filename too long')
    .refine(val => !SECURITY_PATTERNS.PATH_TRAVERSAL.test(val), 'Filename contains path traversal')
    .refine(val => !/[<>:"|?*\x00-\x1f]/.test(val), 'Filename contains invalid characters'),

  userInput: z.string()
    .max(10000, 'Input too long')
    .refine(val => !SECURITY_PATTERNS.XSS.test(val), 'Input contains potentially malicious content')
    .refine(val => !SECURITY_PATTERNS.SQL_INJECTION.test(val), 'Input contains SQL injection patterns'),

  searchQuery: z.string()
    .max(1000, 'Search query too long')
    .refine(val => !SECURITY_PATTERNS.NOSQL_INJECTION.test(val), 'Search query contains invalid patterns')
    .transform(val => val.replace(/[<>&"']/g, "")),

  dateRange: z.string()
    .regex(/^(today|yesterday|this_week|last_week|this_month|last_month|last_7_days|last_14_days|last_30_days|lifetime)$/, 'Invalid date range')
};

// Advanced input sanitization
export class InputSanitizer {
  static sanitizeString(input: string, options: {
    allowHtml?: boolean;
    maxLength?: number;
    allowedTags?: string[];
  } = {}): string {
    const { allowHtml = false, maxLength = 10000, allowedTags = [] } = options;

    // Basic sanitization
    let sanitized = input.trim();
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // HTML sanitization
    if (allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: allowedTags.length > 0 ? allowedTags : ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        SANITIZE_DOM: true
      });
    } else {
      // Escape HTML entities
      sanitized = sanitized.replace(/[<>&"']/g, "");
    }

    return sanitized;
  }

  static sanitizeObject<T extends Record<string, any>>(obj: T, fieldConfig: Record<keyof T, {
    type: 'string' | 'number' | 'boolean' | 'email' | 'url';
    sanitize?: boolean;
    maxLength?: number;
  }>): T {
    const sanitized = { ...obj };

    Object.entries(fieldConfig).forEach(([field, config]) => {
      const value = sanitized[field as keyof T];
      
      if (value === undefined || value === null) return;

      switch (config.type) {
        case 'string':
          if (typeof value === 'string') {
            sanitized[field as keyof T] = this.sanitizeString(value, {
              maxLength: config.maxLength,
              allowHtml: false
            }) as T[keyof T];
          }
          break;
        case 'email':
          if (typeof value === 'string') {
            const normalizedEmail = value.toLowerCase().trim();
            sanitized[field as keyof T] = (normalizedEmail || value) as T[keyof T];
          }
          break;
        case 'url':
          if (typeof value === 'string' && config.sanitize) {
            try {
              const url = new URL(value);
              sanitized[field as keyof T] = url.toString() as T[keyof T];
            } catch {
              // Invalid URL, keep original for validation to catch
            }
          }
          break;
      }
    });

    return sanitized;
  }

  static detectThreats(input: string): Array<{ type: string; pattern: string; severity: 'low' | 'medium' | 'high' }> {
    const threats: Array<{ type: string; pattern: string; severity: 'low' | 'medium' | 'high' }> = [];

    Object.entries(SECURITY_PATTERNS).forEach(([type, pattern]) => {
      if (pattern.test(input)) {
        threats.push({
          type,
          pattern: pattern.source,
          severity: this.getThreatSeverity(type)
        });
      }
    });

    return threats;
  }

  private static getThreatSeverity(threatType: string): 'low' | 'medium' | 'high' {
    const highSeverity = ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'NOSQL_INJECTION'];
    const mediumSeverity = ['PATH_TRAVERSAL', 'LDAP_INJECTION', 'XML_INJECTION'];
    
    if (highSeverity.includes(threatType)) return 'high';
    if (mediumSeverity.includes(threatType)) return 'medium';
    return 'low';
  }
}

// File upload validation
export class FileValidator {
  private static readonly ALLOWED_MIME_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'text/plain', 'application/json'],
    archives: ['application/zip', 'application/x-tar']
  };

  private static readonly MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    archive: 100 * 1024 * 1024 // 100MB
  };

  static validateFile(file: File, category: 'images' | 'documents' | 'archives'): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const allowedTypes = this.ALLOWED_MIME_TYPES[category];
    const maxSize = this.MAX_FILE_SIZES[category === 'images' ? 'image' : category === 'documents' ? 'document' : 'archive'];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const validExtensions = this.getValidExtensions(category);
    if (!validExtensions.includes(extension)) {
      errors.push(`File extension ${extension} not allowed`);
    }

    // Check filename for security issues
    if (SECURITY_PATTERNS.PATH_TRAVERSAL.test(file.name)) {
      errors.push('Filename contains path traversal characters');
    }

    // Check for double extensions
    if ((file.name.match(/\./g) || []).length > 1) {
      warnings.push('File has multiple extensions');
    }

    // Check for suspicious filenames
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(file.name.split('.')[0])) {
      errors.push('Filename uses reserved system name');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static getValidExtensions(category: 'images' | 'documents' | 'archives'): string[] {
    switch (category) {
      case 'images': return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      case 'documents': return ['.pdf', '.txt', '.json'];
      case 'archives': return ['.zip', '.tar'];
      default: return [];
    }
  }

  static async scanFileContent(file: File): Promise<{
    safe: boolean;
    threats: string[];
  }> {
    const threats: string[] = [];
    
    try {
      // Read file as text for content analysis
      const text = await file.text();
      
      // Check for embedded scripts
      if (SECURITY_PATTERNS.XSS.test(text)) {
        threats.push('Embedded script content detected');
      }
      
      // Check for suspicious patterns
      if (text.includes('eval(') || text.includes('Function(')) {
        threats.push('Dynamic code execution patterns detected');
      }
      
      // Check for data exfiltration patterns
      if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/i.test(text)) {
        threats.push('Network request patterns detected');
      }
      
    } catch (error) {
      // Binary files or reading errors
      // Perform basic binary analysis if needed
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }
}

// Request validation middleware
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<{
    valid: boolean;
    data?: T;
    errors?: string[];
    threats?: Array<{ type: string; severity: string }>;
  }> => {
    try {
      const body = await request.json();
      
      // First, sanitize the input
      const sanitizedBody = InputSanitizer.sanitizeObject(body, {
        // Define field configurations based on common API fields
        accessToken: { type: 'string', maxLength: 500 },
        adAccountId: { type: 'string', maxLength: 50 },
        campaignId: { type: 'string', maxLength: 20 },
        email: { type: 'email' },
        url: { type: 'url', sanitize: true },
        name: { type: 'string', maxLength: 100 },
        description: { type: 'string', maxLength: 1000 }
      });
      
      // Detect threats in the input
      const allThreats: Array<{ type: string; severity: string }> = [];
      const checkValue = (value: any) => {
        if (typeof value === 'string') {
          const threats = InputSanitizer.detectThreats(value);
          allThreats.push(...threats);
        } else if (typeof value === 'object' && value !== null) {
          Object.values(value).forEach(checkValue);
        }
      };
      checkValue(body);
      
      // If high-severity threats detected, reject immediately
      const highSeverityThreats = allThreats.filter(t => t.severity === 'high');
      if (highSeverityThreats.length > 0) {
        return {
          valid: false,
          errors: ['Request contains potentially malicious content'],
          threats: highSeverityThreats
        };
      }
      
      // Validate with schema
      const validatedData = schema.parse(sanitizedBody);
      
      return {
        valid: true,
        data: validatedData,
        threats: allThreats.filter(t => t.severity !== 'high')
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      
      return {
        valid: false,
        errors: ['Invalid request format']
      };
    }
  };
}

// Export validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[],
    public threats?: Array<{ type: string; severity: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
