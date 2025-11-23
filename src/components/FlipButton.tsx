'use client';

interface FlipButtonProps {
  direction: 'GREEN' | 'RED';
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function FlipButton({ direction, isActive, onClick, disabled }: FlipButtonProps) {
  const isGreen = direction === 'GREEN';
  const colorClasses = isGreen
    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white'
    : 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white';
  
  const activeClasses = isActive
    ? isGreen
      ? 'ring-4 ring-green-400/50 shadow-lg shadow-green-500/25'
      : 'ring-4 ring-red-400/50 shadow-lg shadow-red-500/25'
    : '';

  const arrow = isGreen ? '↗' : '↘';
  const text = isGreen ? 'GREEN' : 'RED';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl p-8 transition-all duration-300 transform
        ${colorClasses} ${activeClasses}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        min-h-[120px] flex flex-col items-center justify-center
      `}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="text-4xl font-bold mb-2">{arrow}</div>
        <div className="text-xl font-bold tracking-wider">{text}</div>
        <div className="text-sm opacity-90 mt-1">
          {isGreen ? 'Price UP' : 'Price DOWN'}
        </div>
      </div>

      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl ${isGreen ? 'bg-green-500/20' : 'bg-red-500/20'} blur-xl`} />
    </button>
  );
}