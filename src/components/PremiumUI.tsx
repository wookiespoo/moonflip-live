'use client';

import { useEffect, useState } from 'react';

interface PremiumBackgroundProps {
  variant?: 'dark' | 'purple' | 'solana';
  particleCount?: number;
}

export function PremiumBackground({ variant = 'solana', particleCount = 50 }: PremiumBackgroundProps) {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; duration: number; left: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 20,
      duration: 20 + Math.random() * 15,
      left: Math.random() * 100,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  const gradientClass = {
    dark: 'gradient-premium-dark',
    purple: 'gradient-premium-purple',
    solana: 'gradient-premium-solana',
  }[variant];

  return (
    <div className={`fixed inset-0 ${gradientClass} -z-10`}>
      {/* Animated particles */}
      <div className="particles-premium">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Premium overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* Premium radial gradient for depth */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-900/10 via-transparent to-transparent" 
           style={{
             background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 70%)'
           }} />
    </div>
  );
}

export function PremiumCard({ children, className = '', hover = true }: { 
  children: React.ReactNode; 
  className?: string; 
  hover?: boolean;
}) {
  return (
    <div className={`card-premium ${hover ? 'glass-premium-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function PremiumButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'green' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }[size];

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
    green: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
    red: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
    purple: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        btn-premium ${sizeClasses} ${variantClasses} ${className}
        relative font-bold text-white rounded-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? 'cursor-wait' : ''}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
}

export function PremiumTrustBadge({ 
  text, 
  type = 'verified',
  className = ''
}: {
  text: string;
  type?: 'verified' | 'secure' | 'fair' | 'solana';
  className?: string;
}) {
  const icons = {
    verified: '✓',
    secure: '🔒',
    fair: '⚖️',
    solana: '◎',
  };

  const colors = {
    verified: 'text-green-400',
    secure: 'text-blue-400',
    fair: 'text-purple-400',
    solana: 'text-purple-400',
  };

  return (
    <div className={`trust-badge-premium px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colors[type]} ${className}`}>
      <span className="text-sm">{icons[type]}</span>
      {text}
    </div>
  );
}

export function PremiumPriceDisplay({ 
  price, 
  change,
  size = 'xl',
  className = ''
}: {
  price: number;
  change: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  }[size];

  const isPositive = change >= 0;
  const neonClass = isPositive ? 'neon-premium-green' : 'neon-premium-red';

  return (
    <div className={`text-center ${className}`}>
      <div className={`${sizeClasses} font-bold ${neonClass}`}>
        ${(price ?? 0).toFixed(8)}
      </div>
      <div className={`text-lg font-semibold flex items-center justify-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <span className={`inline-block bouncing-arrow ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↗' : '↘'}
        </span>
        <span>{isPositive ? '+' : ''}{(change ?? 0).toFixed(2)}%</span>
      </div>
    </div>
  );
}