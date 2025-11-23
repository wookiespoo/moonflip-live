import { NextRequest, NextResponse } from 'next/server';
import { captureSecurityEvent } from './monitoring';

const ADMIN_WALLETS = [
  'B1vUK75FH7cBVJwtEs8KZr7d3MCUN2nTH9RdibFf1dfR', // House wallet
  // Add more admin wallets as needed
];

const SESSION_SECRET = process.env.SESSION_SECRET || 'moonflip-session-secret-key';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface Session {
  wallet: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

const sessions = new Map<string, Session>();

function generateSessionId(): string {
  return Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    .charAt(Math.floor(Math.random() * 62))
  ).join('');
}

function createSession(wallet: string): string {
  const sessionId = generateSessionId();
  const role = ADMIN_WALLETS.includes(wallet) ? 'admin' : 'user';
  
  sessions.set(sessionId, {
    wallet,
    role,
    expiresAt: Date.now() + SESSION_DURATION
  });
  
  return sessionId;
}

export function validateSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

export function requireAuth(handler: (request: NextRequest, session: Session) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const sessionId = request.headers.get('x-session-id') || 
                     request.cookies.get('session-id')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const session = validateSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
    
    return handler(request, session);
  };
}

export function requireAdmin(handler: (request: NextRequest, session: Session) => Promise<NextResponse>) {
  return requireAuth(async (request: NextRequest, session: Session): Promise<NextResponse> => {
    if (session.role !== 'admin') {
      captureSecurityEvent('admin_access_denied', {
        wallet: session.wallet,
        path: request.nextUrl.pathname
      });
      
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, session);
  });
}

export async function signIn(wallet: string, signature: string): Promise<{ sessionId: string; role: string } | null> {
  try {
    // Verify wallet signature (simplified - in production, verify against a message)
    // This is a placeholder - implement proper signature verification
    const isValidSignature = await verifyWalletSignature(wallet, signature);
    
    if (!isValidSignature) {
      captureSecurityEvent('invalid_signature', {
        wallet: wallet.slice(0, 8) + '...'
      });
      return null;
    }
    
    const sessionId = createSession(wallet);
    const role = ADMIN_WALLETS.includes(wallet) ? 'admin' : 'user';
    
    captureSecurityEvent('user_signed_in', {
      wallet: wallet.slice(0, 8) + '...',
      role
    });
    
    return { sessionId, role };
  } catch (error) {
    console.error('Sign in error:', error);
    return null;
  }
}

export async function signOut(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  
  if (session) {
    captureSecurityEvent('user_signed_out', {
      wallet: session.wallet.slice(0, 8) + '...',
      role: session.role
    });
    
    sessions.delete(sessionId);
  }
}

async function verifyWalletSignature(wallet: string, signature: string): Promise<boolean> {
  // This is a simplified implementation
  // In production, you should:
  // 1. Generate a unique message for the user to sign
  // 2. Verify the signature against that message
  // 3. Use a proper Solana signature verification library
  
  // For now, we'll accept any signature that's 64+ characters (typical Solana signature length)
  return signature.length >= 64 && /^[A-Za-z0-9+/=]+$/.test(signature);
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour