import { useState, useEffect } from 'react';

interface PremiumCountdownRingProps {
  duration: number; // in milliseconds
  size?: number;
  strokeWidth?: number;
  onComplete?: () => void;
  isActive?: boolean;
}

export function PremiumCountdownRing({ 
  duration, 
  size = 180, // Increased from 120 to 180 for better visibility
  strokeWidth = 12, // Increased from 8 to 12 for thicker stroke
  onComplete,
  isActive = true 
}: PremiumCountdownRingProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = isActive ? timeLeft / duration : 0;
  const strokeDashoffset = circumference * (1 - progress);
  
  const secondsLeft = Math.ceil(timeLeft / 1000);
  const isUrgent = secondsLeft <= 10;
  const isCritical = secondsLeft <= 5;
  
  useEffect(() => {
    if (!isActive || isCompleted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          setIsCompleted(true);
          onComplete?.();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive, isCompleted, onComplete]);
  
  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration);
    setIsCompleted(false);
  }, [duration]);
  
  const getStrokeColor = () => {
    if (isCritical) return '#ff073a'; // neon-red
    if (isUrgent) return '#ff6b35'; // neon-orange
    return '#8b00ff'; // neon-purple
  };
  
  const getTextColor = () => {
    if (isCritical) return 'text-neon-red';
    if (isUrgent) return 'text-neon-orange';
    return 'text-white';
  };
  
  const getGlowEffect = () => {
    if (isCritical) return 'drop-shadow(0 0 25px #ff073a)';
    if (isUrgent) return 'drop-shadow(0 0 25px #ff6b35)';
    return 'drop-shadow(0 0 20px #8b00ff)';
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer glow ring */}
      <div className={`
        absolute inset-0 rounded-full
        ${isUrgent ? 'animate-pulse' : ''}
        ${isCritical ? 'animate-ping' : ''}
      `} 
        style={{
          background: `radial-gradient(circle, ${getStrokeColor()}40 0%, transparent 70%)`,
          filter: getGlowEffect()
        }}
      />
      
      {/* Main countdown ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-100 ease-linear"
          style={{
            filter: getGlowEffect()
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b00ff" />
            <stop offset="50%" stopColor="#ff0066" />
            <stop offset="100%" stopColor="#00ff9f" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Countdown text */}
      <div className={`absolute inset-0 flex items-center justify-center ${getTextColor()}`}>
        <div className="text-center">
          <div className={`
            font-black tracking-tighter
            ${size >= 180 ? 'text-5xl' : size >= 120 ? 'text-3xl' : 'text-2xl'}
            ${isUrgent ? 'animate-pulse' : ''}
            font-orbitron
            neon-text-purple
          `}>
            {secondsLeft}
          </div>
          <div className={`
            text-sm font-bold uppercase tracking-wider opacity-80
            ${size >= 180 ? 'text-sm' : size >= 120 ? 'text-xs' : 'text-2xs'}
            font-mono-premium
          `}>
            SECONDS
          </div>
        </div>
      </div>
      
      {/* Pulsing rings for critical state */}
      {isCritical && (
        <>
          <div className="absolute inset-0 rounded-full border-4 border-neon-red animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full border-2 border-neon-red animate-pulse opacity-50" />
        </>
      )}
      
      {/* Urgent indicator */}
      {isUrgent && !isCritical && (
        <div className="absolute -top-4 -right-4">
          <div className="w-8 h-8 bg-neon-orange rounded-full animate-pulse flex items-center justify-center" 
            style={{
              boxShadow: '0 0 20px #ff6b35'
            }}
          >
            <span className="text-xs font-bold text-black">!</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface PremiumFlipTimerProps {
  startTime: number;
  duration: number;
  onComplete?: () => void;
}

export function PremiumFlipTimer({ startTime, duration, onComplete }: PremiumFlipTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    setTimeLeft(remaining);
    
    if (remaining <= 0) {
      setIsActive(false);
      onComplete?.();
    }
  }, [startTime, duration, onComplete]);
  
  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Timer icon */}
      <div className="text-neon-purple animate-pulse">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      
      {/* Countdown ring */}
      <PremiumCountdownRing
        duration={timeLeft}
        size={100}
        strokeWidth={6}
        onComplete={onComplete}
        isActive={isActive}
      />
      
      {/* Timer label */}
      <div className="text-center">
        <div className="text-sm text-gray-400 uppercase tracking-wider">
          Flip Timer
        </div>
        <div className="text-lg font-bold text-white">
          60s Challenge
        </div>
      </div>
    </div>
  );
}

export function PremiumMiniTimer({ timeLeft, size = 60 }: { timeLeft: number; size?: number }) {
  const secondsLeft = Math.ceil(timeLeft / 1000);
  const isUrgent = secondsLeft <= 10;
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          stroke={isUrgent ? '#ff073a' : '#8b00ff'}
          strokeWidth="4"
          fill="none"
          strokeDasharray={(size - 4) * Math.PI}
          strokeDashoffset={(size - 4) * Math.PI * (1 - timeLeft / 60000)}
          strokeLinecap="round"
          className="transition-all duration-100 ease-linear"
          style={{
            filter: isUrgent ? 'drop-shadow(0 0 5px #ff073a)' : 'drop-shadow(0 0 5px #8b00ff)'
          }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${isUrgent ? 'text-neon-red' : 'text-white'}`}>
        <span className="text-sm font-black">
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}