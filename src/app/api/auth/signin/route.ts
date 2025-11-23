import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { captureSecurityEvent } from '@/lib/monitoring';
import { withSecurity, sanitizeInput } from '@/lib/security';

export const POST = withSecurity(async (request: NextRequest) => {
  try {
    const { wallet, signature } = sanitizeInput(await request.json());
    
    if (!wallet || !signature) {
      return NextResponse.json(
        { error: 'Wallet address and signature are required' },
        { status: 400 }
      );
    }
    
    const result = await signIn(wallet, signature);
    
    if (!result) {
      captureSecurityEvent('failed_signin', {
        wallet: wallet.slice(0, 8) + '...'
      });
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Set session cookie
    const response = NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      role: result.role
    });
    
    response.cookies.set('session-id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    return response;
    
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});