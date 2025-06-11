import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';

// CSP violation reporting endpoint
async function handleCSPReport(request: NextRequest): Promise<NextResponse> {
  try {
    const violation = await request.json();
    
    // Log CSP violation
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      violation,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });
    
    // Store violation in monitoring system
    // In production, this would go to your logging/monitoring service
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
  }
}

// Apply security middleware
export const POST = withSecurity(handleCSPReport);

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
