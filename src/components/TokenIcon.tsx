/**
 * TokenIcon Component - Bulletproof token logo display
 * FIXED: No more crashes, no more broken images, no more CORS issues
 * 
 * Complete fallback chain:
 * 1. Jupiter logo (from server-side API)
 * 2. Solana token list GitHub fallback
 * 3. Neon placeholder with first letter (like pump.fun)
 * 
 * Error boundaries prevent any logo failure from crashing the card
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { tokenLogoService } from '@/lib/tokenLogos';

interface TokenIconProps {
  mint: string;
  symbol: string;
  size?: number;
  className?: string;
  priceChange24h?: number;
  showGlow?: boolean;
}

export function TokenIcon({ 
  mint, 
  symbol, 
  size = 48, 
  className = '',
  priceChange24h,
  showGlow = true
}: TokenIconProps) {
  const [logoUri, setLogoUri] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

  // Fallback chain exactly like pump.fun
  const fallbackChain = [
    // Primary: Jupiter logo from server-side API
    async () => {
      if (!mint) return null;
      try {
        const uri = await tokenLogoService.getTokenLogo(mint, symbol);
        return uri;
      } catch (error) {
        console.warn(`Jupiter logo failed for ${mint}:`, error);
        return null;
      }
    },
    // Fallback #1: Solana token list GitHub
    async () => {
      if (!mint) return null;
      return `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`;
    },
    // Fallback #2: Neon placeholder (never fails)
    async () => {
      return tokenLogoService.getPlaceholderLogo(symbol);
    }
  ];

  useEffect(() => {
    loadTokenLogo();
  }, [mint, symbol]);

  const loadTokenLogo = async () => {
    if (!mint || !symbol) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setImageError(false);
    setCurrentFallbackIndex(0);

    // Try each fallback in sequence
    for (let i = 0; i < fallbackChain.length; i++) {
      try {
        const uri = await fallbackChain[i]();
        if (uri) {
          setLogoUri(uri);
          setCurrentFallbackIndex(i);
          break;
        }
      } catch (error) {
        console.warn(`Fallback ${i} failed for ${symbol}:`, error);
        continue;
      }
    }

    setIsLoading(false);
  };

  const handleImageError = () => {
    console.warn(`Image failed for ${symbol} at fallback ${currentFallbackIndex}: ${logoUri}`);
    setImageError(true);
    
    // Try next fallback
    if (currentFallbackIndex < fallbackChain.length - 1) {
      const nextFallback = currentFallbackIndex + 1;
      fallbackChain[nextFallback]().then(uri => {
        if (uri) {
          setLogoUri(uri);
          setCurrentFallbackIndex(nextFallback);
          setImageError(false);
        }
      }).catch(error => {
        console.error(`Next fallback also failed:`, error);
      });
    }
  };

  // Calculate glow effects for pumping tokens
  const shouldShowGlow = showGlow && priceChange24h && priceChange24h > 5;
  const glowIntensity = shouldShowGlow ? Math.min(1, priceChange24h / 20) : 0;

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`skeleton-pulse rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Error state or no logo - show neon placeholder (never crashes)
  if (imageError || !logoUri) {
    return (
      <div 
        className={`
          relative flex items-center justify-center rounded-full
          bg-gradient-to-br from-purple-600 to-pink-600
          text-white font-bold select-none
          ${shouldShowGlow ? 'animate-pulse' : ''}
          ${className}
        `}
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.4,
          boxShadow: shouldShowGlow ? `0 0 ${size * 0.3}px rgba(168, 85, 247, ${glowIntensity})` : undefined
        }}
      >
        {symbol.charAt(0).toUpperCase()}
        {shouldShowGlow && (
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>
    );
  }

  // Success state - show actual logo with glow if pumping
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUri}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-full ${shouldShowGlow ? 'animate-pulse' : ''}`}
        onError={handleImageError}
        priority
        style={{
          boxShadow: shouldShowGlow ? `0 0 ${size * 0.4}px rgba(34, 197, 94, ${glowIntensity})` : undefined
        }}
      />
      {shouldShowGlow && (
        <>
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/30 to-emerald-400/30 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div 
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 blur-sm"
            style={{ 
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              opacity: glowIntensity
            }}
          />
        </>
      )}
    </div>
  );
}

// Loading skeleton component
export function TokenIconSkeleton({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div 
      className={`skeleton-pulse rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Error boundary wrapper - prevents logo failures from crashing cards
export function TokenIconWithErrorBoundary(props: TokenIconProps) {
  return (
    <ErrorBoundary fallback={<TokenIconFallback {...props} />}>
      <TokenIcon {...props} />
    </ErrorBoundary>
  );
}

// Simple fallback component
function TokenIconFallback({ symbol, size = 48, className = '', priceChange24h, showGlow }: TokenIconProps) {
  const shouldShowGlow = showGlow && priceChange24h && priceChange24h > 5;
  const glowIntensity = shouldShowGlow ? Math.min(1, priceChange24h / 20) : 0;

  return (
    <div 
      className={`
        relative flex items-center justify-center rounded-full
        bg-gradient-to-br from-purple-600 to-pink-600
        text-white font-bold select-none
        ${shouldShowGlow ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4,
        boxShadow: shouldShowGlow ? `0 0 ${size * 0.3}px rgba(168, 85, 247, ${glowIntensity})` : undefined
      }}
    >
      {symbol.charAt(0).toUpperCase()}
    </div>
  );
}

// Simple Error Boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TokenIcon Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

import React from 'react';