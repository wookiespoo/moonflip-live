import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';
import { withSecurity } from '@/lib/security';

export const POST = withSecurity(async (request: NextRequest) => {
  try {
    const sessionId = request.headers.get('x-session-id') || 
                     request.cookies.get('session-id')?.value;
    
    if (sessionId) {
      await signOut(sessionId);
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });
    
    // Clear session cookie
    response.cookies.set('session-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire immediately
    });
    
    return response;
    
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});