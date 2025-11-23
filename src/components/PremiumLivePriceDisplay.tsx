import { useState, useEffect } from 'react';

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  isPositive: boolean;
}

function Sparkline({ data, width, height, isPositive }: SparklineProps) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Normalize data to 0-1 range
  const normalized = data.map(value => (value - min) / range);
  
  // Create SVG path
  const points = normalized.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value * height * 0.8) - height * 0.1;
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        stroke={isPositive ? '#00ff9f' : '#ff073a'}
        strokeWidth="2"
        fill="none"
        className="sparkline-path"
        filter="url(#sparkline-glow)"
      />
      {/* Glow filter */}
      <defs>
        <filter id="sparkline-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

interface PremiumLivePriceDisplayProps {
  price: number;
  change24h: number;
  symbol: string;
  sparklineData?: number[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PremiumLivePriceDisplay({ 
  price, 
  change24h, 
  symbol, 
  sparklineData = [],
  size = 'lg' 
}: PremiumLivePriceDisplayProps) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [priceChanged, setPriceChanged] = useState(false);
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl', 
    lg: 'text-4xl',
    xl: 'text-6xl'
  };
  
  const sparklineHeight = {
    sm: 20,
    md: 25,
    lg: 30,
    xl: 40
  };
  
  useEffect(() => {
    if (price !== displayPrice) {
      setPriceChanged(true);
      setDisplayPrice(price);
      
      // Reset animation after it completes
      const timer = setTimeout(() => setPriceChanged(false), 800);
      return () => clearTimeout(timer);
    }
  }, [price, displayPrice]);
  
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? 'text-neon-lime' : 'text-neon-red';
  const changeGlow = isPositive ? 'text-glow-green' : 'text-glow-red';
  
  return (
    <div className="space-y-3">
      {/* Main price display */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className={`
            font-black tracking-tight price-display-premium
            ${sizeClasses[size]} ${priceChanged ? 'animate-price-pump' : ''}
          `}>
            ${displayPrice.toFixed(6)}
          </div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">
            {symbol} / USD
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" 
            style={{ boxShadow: '0 0 10px #39ff14' }}
          />
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>
      
      {/* 24h change */}
      <div className="flex items-center justify-center gap-3">
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          bg-black/20 border border-white/10
          ${changeColor} ${changeGlow}
        `}>
          <div className={isPositive ? 'rotate-0' : 'rotate-180'}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2L10 6L6 10L2 6L6 2Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-bold">
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
        
        <div className="text-xs text-gray-400 uppercase tracking-wider">
          24h
        </div>
      </div>
      
      {/* Sparkline */}
      {sparklineData.length > 1 && (
        <div className="flex items-center justify-center">
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <Sparkline 
              data={sparklineData} 
              width={120} 
              height={sparklineHeight[size]} 
              isPositive={isPositive}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PremiumPriceTickerProps {
  price: number;
  change24h: number;
  symbol: string;
  compact?: boolean;
}

export function PremiumPriceTicker({ price, change24h, symbol, compact = false }: PremiumPriceTickerProps) {
  const [flash, setFlash] = useState(false);
  const [prevPrice, setPrevPrice] = useState(price);
  
  useEffect(() => {
    if (price !== prevPrice) {
      setFlash(true);
      setPrevPrice(price);
      
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);
  
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? 'text-neon-lime' : 'text-neon-red';
  
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-full
      bg-black/20 border border-white/10
      ${flash ? 'animate-pulse' : ''}
      ${compact ? 'text-sm' : 'text-base'}
    `}>
      <div className="font-mono font-bold text-white">
        ${price.toFixed(compact ? 4 : 6)}
      </div>
      <div className={`
        flex items-center gap-1 font-bold
        ${changeColor}
      `}>
        <div className={isPositive ? 'rotate-0' : 'rotate-180'}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 1L6.5 3.5L4 6L1.5 3.5L4 1Z" fill="currentColor"/>
          </svg>
        </div>
        <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
      </div>
    </div>
  );
}

interface PremiumVolumeDisplayProps {
  volume24h: number;
  marketCap: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumVolumeDisplay({ volume24h, marketCap, size = 'md' }: PremiumVolumeDisplayProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };
  
  const sizeClasses = {
    sm: 'text-xs gap-2',
    md: 'text-sm gap-3', 
    lg: 'text-base gap-4'
  };
  
  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center">
        <div className="text-gray-400 uppercase tracking-wider text-xs">
          24h Volume
        </div>
        <div className="font-bold text-neon-blue text-glow-purple">
          {formatNumber(volume24h)}
        </div>
      </div>
      
      <div className="w-px h-8 bg-white/10" />
      
      <div className="text-center">
        <div className="text-gray-400 uppercase tracking-wider text-xs">
          Market Cap
        </div>
        <div className="font-bold text-neon-purple text-glow-purple">
          {formatNumber(marketCap)}
        </div>
      </div>
    </div>
  );
}