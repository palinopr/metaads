import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf-protection';
import { withSecurity } from '@/lib/security/security-middleware';

// CSRF token generation endpoint
async function handleCSRFToken(request: NextRequest): Promise<NextResponse> {
  const csrf = new CSRFProtection();
  const token = csrf.generateToken();
  
  const response = NextResponse.json({ token });
  csrf.setTokenCookie(response, token);
  response.headers.set('X-CSRF-Token', token);
  
  return response;
}

// Apply security middleware (relaxed config for token endpoint)
export const GET = withSecurity(handleCSRFToken, {
  rateLimit: { enabled: true, profile: 'relaxed' },
  csrf: { enabled: false, strictSameSite: false } // Don't require CSRF for getting CSRF token
});
