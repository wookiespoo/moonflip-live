import { useState } from 'react';

interface PremiumBetButtonProps {
  direction: 'GREEN' | 'RED';
  amount: number;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
}

export function PremiumBetButton({ direction, amount, onClick, isActive = false, isLoading = false }: PremiumBetButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isGreen = direction === 'GREEN';
  const baseClasses = `
    relative overflow-hidden transform transition-all duration-300 ease-out
    ${isGreen 
      ? 'btn-premium-green text-black' 
      : 'btn-premium-red text-white'
    }
    ${isActive ? 'scale-105 shadow-2xl' : 'hover:scale-105'}
    ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
    ${isHovered ? 'shadow-neon-' + (isGreen ? 'green' : 'red') : ''}
  `;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={baseClasses}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-700 ease-out hover:translate-x-full" />
      
      {/* Neon glow border */}
      <div className={`
        absolute inset-0 rounded-inherit
        ${isGreen ? 'bg-gradient-to-r from-neon-lime to-neon-green' : 'bg-gradient-to-r from-neon-pink to-neon-red'}
        opacity-0 hover:opacity-100 transition-opacity duration-300
        blur-sm
      `} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 space-y-2">
        {/* Direction Icon */}
        <div className={`
          text-4xl font-black transition-all duration-300
          ${isHovered ? 'scale-110' : ''}
        `}>
          {isGreen ? '🚀' : '📉'}
        </div>
        
        {/* Direction Text */}
        <div className={`
          text-xl font-black tracking-wider uppercase
          ${isGreen ? 'text-black' : 'text-white'}
        `}>
          {direction}
        </div>
        
        {/* Amount */}
        <div className={`
          text-2xl font-black
          ${isGreen ? 'text-black/90' : 'text-white/90'}
        `}>
          {amount} SOL
        </div>
        
        {/* Multiplier */}
        <div className={`
          text-sm font-bold px-3 py-1 rounded-full
          ${isGreen 
            ? 'bg-black/20 text-black/80' 
            : 'bg-white/20 text-white/80'
          }
        `}>
          1.90× PAYOUT
        </div>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" />
        </div>
      )}
      
      {/* Active state pulse */}
      {isActive && (
        <div className={`
          absolute inset-0 rounded-inherit
          ${isGreen ? 'bg-neon-lime/20' : 'bg-neon-pink/20'}
          animate-pulse
        `} />
      )}
    </button>
  );
}

interface PremiumBetButtonPairProps {
  amount: number;
  onGreenClick: () => void;
  onRedClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PremiumBetButtonPair({ amount, onGreenClick, onRedClick, isLoading = false, disabled = false }: PremiumBetButtonPairProps) {
  return (
    <div className="flex gap-4 w-full">
      <div className="flex-1">
        <PremiumBetButton
          direction="GREEN"
          amount={amount}
          onClick={onGreenClick}
          isLoading={isLoading}
        />
      </div>
      <div className="flex-1">
        <PremiumBetButton
          direction="RED"
          amount={amount}
          onClick={onRedClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export function PremiumAmountSelector({ selectedAmount, onAmountChange }: {
  selectedAmount: number;
  onAmountChange: (amount: number) => void;
}) {
  const presetAmounts = [0.1, 0.5, 1, 5, 10, 25, 50, 100];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => onAmountChange(amount)}
            className={`
              p-3 rounded-xl font-bold transition-all duration-300
              ${selectedAmount === amount
                ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg shadow-neon-purple/25'
                : 'bg-premium-gray-800 text-gray-300 hover:bg-premium-gray-700 hover:text-white'
              }
            `}
          >
            {amount} SOL
          </button>
        ))}
      </div>
      
      {/* Custom amount input */}
      <div className="relative">
        <input
          type="number"
          placeholder="Custom amount"
          className="
            w-full p-4 rounded-xl bg-premium-gray-800 text-white 
            border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/50
            transition-all duration-300
          "
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
              onAmountChange(value);
            }
          }}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          SOL
        </div>
      </div>
    </div>
  );
}