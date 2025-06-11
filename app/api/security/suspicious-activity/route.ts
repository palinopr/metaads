import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';

// Suspicious activity reporting endpoint
async function handleSuspiciousActivity(request: NextRequest): Promise<NextResponse> {
  try {
    const activity = await request.json();
    
    // Log suspicious activity
    console.warn('Suspicious Activity Report:', {
      timestamp: new Date().toISOString(),
      activity,
      reportedBy: 'security_system'
    });
    
    // In production, this would:
    // 1. Store in security database
    // 2. Trigger alerts if severity is high
    // 3. Update threat intelligence
    // 4. Notify security team
    
    // Check if immediate action is required
    if (activity.type === 'ddos_attack' || 
        activity.type === 'sql_injection' || 
        activity.type === 'rate_limit_exceeded') {
      
      // Could trigger automatic IP blocking here
      console.error('High-severity security event detected:', activity);
    }
    
    return NextResponse.json({ 
      received: true, 
      id: `security_${Date.now()}` 
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing suspicious activity report:', error);
    return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
  }
}

// Apply security middleware
export const POST = withSecurity(handleSuspiciousActivity);
