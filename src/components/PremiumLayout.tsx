import { ReactNode } from 'react';
import { PremiumTrustBar } from '@/components/PremiumLiveCounters';

interface PremiumLayoutProps {
  children: ReactNode;
  showTrustBar?: boolean;
  showCosmicBackground?: boolean;
}

export function PremiumLayout({ children, showTrustBar = true, showCosmicBackground = true }: PremiumLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cosmic background */}
      {showCosmicBackground && (
        <div className="cosmic-background fixed inset-0 z-0" />
      )}
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Trust bar at bottom */}
      {showTrustBar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <PremiumTrustBar />
        </div>
      )}
    </div>
  );
}

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: 'purple' | 'green' | 'pink' | 'blue';
}

export function PremiumCard({ children, className = '', glow = false, glowColor = 'purple' }: PremiumCardProps) {
  const glowColors = {
    purple: 'hover:shadow-neon-purple hover:border-neon-purple/30',
    green: 'hover:shadow-neon-green hover:border-neon-green/30',
    pink: 'hover:shadow-neon-pink hover:border-neon-pink/30',
    blue: 'hover:shadow-neon-blue hover:border-neon-blue/30'
  };
  
  return (
    <div className={`
      card-premium ${glow ? glowColors[glowColor] : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

interface PremiumButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PremiumButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '' 
}: PremiumButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-neon-purple',
    secondary: 'bg-premium-gray-800 text-white border border-white/20 hover:bg-premium-gray-700',
    success: 'bg-gradient-to-r from-neon-lime to-neon-green text-black hover:shadow-neon-green',
    danger: 'bg-gradient-to-r from-neon-red to-neon-pink text-white hover:shadow-neon-red'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        font-bold rounded-xl transition-all duration-300
        hover:scale-105 active:scale-95
        disabled:hover:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface PremiumInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password';
  className?: string;
}

export function PremiumInput({ placeholder, value, onChange, type = 'text', className = '' }: PremiumInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`
        w-full px-4 py-3 bg-premium-gray-800 text-white
        border border-white/20 rounded-xl
        focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50
        placeholder-gray-400
        transition-all duration-300
        ${className}
      `}
    />
  );
}

export function PremiumDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent ${className}`} />
  );
}