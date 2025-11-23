import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security';

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const sessionId = request.headers.get('x-session-id') || 
                     request.cookies.get('session-id')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session provided' },
        { status: 401 }
      );
    }
    
    // Import auth functions dynamically to avoid client-side issues
    const { validateSession } = await import('@/lib/auth');
    const session = validateSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      role: session.role,
      wallet: session.wallet.slice(0, 8) + '...'
    });
    
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});