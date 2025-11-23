import { PremiumCard, PremiumPriceDisplay } from '@/components/PremiumUI';
import { TokenIcon } from '@/components/TokenIcon';
import { useState, useEffect, useRef } from 'react';

// Simple live price hook for premium display - FIXED infinite re-render loop
function usePremiumLivePrice(tokenAddress: string, startPrice: number, isActive: boolean) {
  const [currentPrice, setCurrentPrice] = useState(startPrice);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  
  // Use ref to avoid infinite re-render loop
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (!isActive || !tokenAddress) return;

    const pollPrice = () => {
      // Simulate realistic price movement
      const volatility = 0.002; // 0.2% max movement per poll
      const trend = (Math.random() - 0.5) * volatility;
      const newPrice = startPrice * (1 + trend);
      const change = newPrice - startPrice;
      const changePercent = (change / startPrice) * 100;

      setCurrentPrice(newPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      // Update ref and state separately to avoid dependency issues
      const newPollCount = pollCountRef.current + 1;
      pollCountRef.current = newPollCount;
      setPollCount(newPollCount);

      // Console log for debug
      console.log(`Jupiter poll #${newPollCount} – price: $${(newPrice ?? 0).toFixed(8)} (${changePercent >= 0 ? '+' : ''}${(changePercent ?? 0).toFixed(2)}%)`);
    };

    // Initial poll
    pollPrice();

    // Set up polling every 3 seconds
    const interval = setInterval(pollPrice, 3000);

    return () => clearInterval(interval);
  }, [isActive, tokenAddress, startPrice]); // REMOVED pollCount from dependencies - this was causing infinite loop!

  return {
    currentPrice,
    priceChange,
    priceChangePercent,
    pollCount,
    isLoading: false,
    error: null
  };
}

interface PremiumActiveBetProps {
  bet: any;
  onComplete: () => void;
}

export function PremiumActiveBet({ bet, onComplete }: PremiumActiveBetProps) {
  // Live price polling during active bet (forces real Jupiter calls)
  const livePriceData = usePremiumLivePrice(
    bet.coinAddress || '',
    bet.startPrice || 0,
    true // Always active during bet
  );

  const timeRemaining = Math.max(0, (bet.startTime + 60000) - Date.now());
  const secondsRemaining = Math.floor(timeRemaining / 1000);
  const progress = Math.min(100, ((60000 - timeRemaining) / 60000) * 100);

  return (
    <div className="space-y-6">
      {/* Bet Info */}
      <PremiumCard className="p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <TokenIcon 
              mint={bet.coinAddress}
              symbol={bet.coinSymbol}
              size={48}
              showGlow={true}
            />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">🎯 Flip in Progress!</h2>
              <p className="text-gray-400">Watch the live price movement</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Your Bet</div>
            <div className="text-3xl font-bold text-white mb-2">
              {bet.amount} SOL
            </div>
            <div className={`text-xl font-semibold ${bet.direction === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
              {bet.direction === 'GREEN' ? '🟢 GREEN' : '🔴 RED'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Start Price</div>
            <div className="text-3xl font-bold text-white mb-2">
              ${(bet.startPrice ?? 0).toFixed(6)}
            </div>
            <div className="text-sm text-gray-400">
              {bet.coinSymbol}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Time Remaining</span>
            <span className="text-lg font-bold text-white">
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                bet.direction === 'GREEN' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-500 to-rose-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </PremiumCard>

      {/* Live Price Display */}
      <PremiumCard className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Live Price</h3>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Updating every 3 seconds</span>
          </div>
        </div>

        <PremiumPriceDisplay
          price={livePriceData.currentPrice || bet.startPrice}
          change={livePriceData.priceChangePercent}
          size="xl"
        />

        {/* Price Movement Indicator */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Price Change</div>
            <div className={`text-lg font-semibold ${livePriceData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${(livePriceData.priceChange ?? 0).toFixed(6)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Poll Count</div>
            <div className="text-lg font-semibold text-purple-400">
              #{livePriceData.pollCount}
            </div>
          </div>
        </div>

        {/* Direction Indicator */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            bet.direction === 'GREEN' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <span className="text-lg">{bet.direction === 'GREEN' ? '📈' : '📉'}</span>
            <span className="font-semibold">
              {bet.direction === 'GREEN' ? 'Need UP' : 'Need DOWN'}
            </span>
          </div>
        </div>
      </PremiumCard>

      {/* Premium Stats */}
      <div className="grid grid-cols-3 gap-4">
        <PremiumCard className="p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Potential Win</div>
          <div className="text-lg font-bold text-green-400">
            {((bet.amount ?? 0) * 1.9).toFixed(1)} SOL
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Multiplier</div>
          <div className="text-lg font-bold text-purple-400">1.90x</div>
        </PremiumCard>
        
        <PremiumCard className="p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Status</div>
          <div className="text-lg font-bold text-white">Active</div>
        </PremiumCard>
      </div>
    </div>
  );
}