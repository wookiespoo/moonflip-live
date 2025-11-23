import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { captureError } from '@/lib/monitoring';
import { withSecurity } from '@/lib/security';
import { requireAuth } from '@/lib/auth';

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    let analytics;
    
    if (wallet) {
      // For user-specific analytics, check if user is authenticated
      const sessionId = request.headers.get('x-session-id') || 
                       request.cookies.get('session-id')?.value;
      
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Authentication required for user analytics' },
          { status: 401 }
        );
      }
      
      const { validateSession } = await import('@/lib/auth');
      const session = validateSession(sessionId);
      
      if (!session || session.wallet !== wallet) {
        return NextResponse.json(
          { error: 'Unauthorized access to user analytics' },
          { status: 403 }
        );
      }
      
      // Get user-specific analytics
      analytics = await database.getUserAnalytics(wallet);
    } else {
      // Get global analytics (public)
      analytics = await database.getGlobalAnalytics();
    }
    
    return NextResponse.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    captureError(error as Error, {
      endpoint: '/api/analytics',
      method: 'GET'
    });
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
});