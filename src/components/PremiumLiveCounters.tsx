import { useState, useEffect } from 'react';
import { TrendingUp, Shield, Zap, Users, DollarSign, Trophy, CheckCircle, Lock, Star } from 'lucide-react';

interface LiveCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: 'lime' | 'purple' | 'pink' | 'blue' | 'yellow';
  animated?: boolean;
}

function LiveCounter({ value, label, icon, color, animated = true }: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 2000;
    const steps = 60;
    const increment = (value - displayValue) / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + increment);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, animated]);
  
  const colorClasses = {
    lime: 'text-neon-lime border-neon-lime/30',
    purple: 'text-neon-purple border-neon-purple/30',
    pink: 'text-neon-pink border-neon-pink/30',
    blue: 'text-neon-blue border-neon-blue/30',
    yellow: 'text-neon-yellow border-neon-yellow/30'
  };
  
  const glowColors = {
    lime: 'shadow-neon-lime/25',
    purple: 'shadow-neon-purple/25',
    pink: 'shadow-neon-pink/25',
    blue: 'shadow-neon-blue/25',
    yellow: 'shadow-neon-yellow/25'
  };
  
  const formatValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return Math.round(val).toLocaleString();
  };
  
  return (
    <div className={`
      live-counter-premium border-2 ${colorClasses[color]} ${glowColors[color]}
      hover:scale-105 transition-all duration-300
    `}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="text-lg">
          {icon}
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
          {label}
        </div>
      </div>
      <div className={`counter-number text-2xl font-black ${colorClasses[color]}`}>
        {formatValue(displayValue)}
      </div>
    </div>
  );
}

interface PremiumLiveCountersProps {
  className?: string;
}

export function PremiumLiveCounters({ className = '' }: PremiumLiveCountersProps) {
  // Mock data - replace with real data from your backend
  const stats = {
    flipsToday: 12847,
    volume24h: 428000,
    biggestWin: 47.2,
    activePlayers: 1523,
    totalWagered: 2840000,
    winRate: 98.5
  };
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      <LiveCounter
        value={stats.flipsToday}
        label="Flips Today"
        icon={<Zap size={20} />}
        color="lime"
      />
      <LiveCounter
        value={stats.volume24h}
        label="24h Volume"
        icon={<DollarSign size={20} />}
        color="purple"
      />
      <LiveCounter
        value={stats.biggestWin}
        label="Biggest Win"
        icon={<Trophy size={20} />}
        color="yellow"
      />
      <LiveCounter
        value={stats.activePlayers}
        label="Active Players"
        icon={<Users size={20} />}
        color="blue"
      />
      <LiveCounter
        value={stats.totalWagered}
        label="Total Wagered"
        icon={<TrendingUp size={20} />}
        color="pink"
      />
      <LiveCounter
        value={stats.winRate}
        label="Win Rate"
        icon={<Star size={20} />}
        color="lime"
      />
    </div>
  );
}

interface TrustBadgeProps {
  type: 'verified' | 'secure' | 'fair' | 'solana' | 'jupiter';
  text?: string;
  showIcon?: boolean;
}

export function PremiumTrustBadge({ type, text, showIcon = true }: TrustBadgeProps) {
  const badges = {
    verified: {
      icon: <CheckCircle size={16} />,
      color: 'lime',
      defaultText: 'Verified'
    },
    secure: {
      icon: <Lock size={16} />,
      color: 'blue',
      defaultText: 'Secure'
    },
    fair: {
      icon: <Star size={16} />,
      color: 'purple',
      defaultText: 'Fair Play'
    },
    solana: {
      icon: <Zap size={16} />,
      color: 'purple',
      defaultText: 'Solana'
    },
    jupiter: {
      icon: <TrendingUp size={16} />,
      color: 'pink',
      defaultText: 'Jupiter API'
    }
  };
  
  const badge = badges[type];
  const displayText = text || badge.defaultText;
  
  const colorClasses = {
    lime: 'text-neon-lime border-neon-lime/30 bg-neon-lime/10',
    purple: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
    pink: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10',
    blue: 'text-neon-blue border-neon-blue/30 bg-neon-blue/10'
  };
  
  const colorClass = colorClasses[badge.color as keyof typeof colorClasses];
  
  return (
    <div className={`
      trust-badge-premium ${colorClass}
      hover:scale-105 transition-all duration-300
    `}>
      {showIcon && (
        <div className="animate-trust-badge">
          {badge.icon}
        </div>
      )}
      <span className="font-bold tracking-wide">
        {displayText}
      </span>
    </div>
  );
}

interface PremiumTrustBarProps {
  className?: string;
}

export function PremiumTrustBar({ className = '' }: PremiumTrustBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <PremiumTrustBadge type="verified" />
      <PremiumTrustBadge type="secure" />
      <PremiumTrustBadge type="fair" />
      <PremiumTrustBadge type="solana" />
      <PremiumTrustBadge type="jupiter" />
      
      {/* Additional trust indicators */}
      <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" 
          style={{ boxShadow: '0 0 5px #39ff14' }}
        />
        <span>10,000+ flips today</span>
      </div>
    </div>
  );
}

interface PremiumHouseBankrollProps {
  className?: string;
}

export function PremiumHouseBankroll({ className = '' }: PremiumHouseBankrollProps) {
  const [bankroll, setBankroll] = useState(1847.5);
  
  // Simulate bankroll updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBankroll(prev => prev + (Math.random() - 0.5) * 2);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`
      live-counter-premium border-2 border-neon-purple/30 shadow-neon-purple/25
      hover:scale-105 transition-all duration-300
      ${className}
    `}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="text-lg text-neon-purple">
          <Shield size={20} />
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
          House Bankroll
        </div>
      </div>
      <div className="counter-number text-2xl font-black text-neon-purple">
        {bankroll.toFixed(1)} SOL
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Fully backed
      </div>
    </div>
  );
}