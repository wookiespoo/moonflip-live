'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { captureError } from '@/lib/monitoring';

interface AuthState {
  isAuthenticated: boolean;
  role: 'user' | 'admin' | null;
  sessionId: string | null;
}

export function AuthButton() {
  const { connected, publicKey, signMessage } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    sessionId: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    const sessionId = localStorage.getItem('session-id');
    if (sessionId) {
      validateSession(sessionId);
    }
  }, []);

  const validateSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          role: data.role,
          sessionId
        });
      } else {
        // Invalid session, remove from storage
        localStorage.removeItem('session-id');
      }
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem('session-id');
    }
  };

  const handleSignIn = async () => {
    if (!connected || !publicKey || !signMessage) {
      return;
    }

    setLoading(true);
    
    try {
      // Create a message to sign
      const message = new TextEncoder().encode(
        `Sign in to MoonFlip.live\nWallet: ${publicKey.toString()}\nTime: ${new Date().toISOString()}`
      );
      
      // Sign the message
      const signature = await signMessage(message);
      const signatureBase64 = btoa(String.fromCharCode(...signature));
      
      // Send to server for verification
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          signature: signatureBase64
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setAuthState({
          isAuthenticated: true,
          role: data.role,
          sessionId: data.sessionId
        });
        
        localStorage.setItem('session-id', data.sessionId);
      } else {
        const error = await response.json();
        alert(`Sign in failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      captureError(error as Error, {
        component: 'AuthButton',
        action: 'signin'
      });
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!authState.sessionId) return;

    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'x-session-id': authState.sessionId
        }
      });
      
      setAuthState({
        isAuthenticated: false,
        role: null,
        sessionId: null
      });
      
      localStorage.removeItem('session-id');
    } catch (error) {
      console.error('Sign out error:', error);
      captureError(error as Error, {
        component: 'AuthButton',
        action: 'signout'
      });
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {authState.isAuthenticated ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-sm font-medium">
              {authState.role === 'admin' ? '👑 Admin' : '✅ Authenticated'}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      )}
    </div>
  );
}