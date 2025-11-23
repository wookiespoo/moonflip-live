import { useState } from 'react';
import PremiumBetSection from '@/components/PremiumBetSection';
import { PremiumCard, PremiumPriceDisplay } from '@/components/PremiumUI';
import { TokenIcon } from '@/components/TokenIcon';

interface PremiumBetInterfaceProps {
  selectedCoin: any;
  onCreateBet: (amount: number, direction: 'GREEN' | 'RED') => void;
  isCreatingBet: boolean;
  isOracleDown: boolean;
}

export function PremiumBetInterface({ 
  selectedCoin, 
  onCreateBet, 
  isCreatingBet, 
  isOracleDown 
}: PremiumBetInterfaceProps) {
  const [betAmount, setBetAmount] = useState('');

  const handleDirectionSelect = (direction: 'up' | 'down') => {
    if (betAmount) {
      const directionMap = {
        'up': 'GREEN' as const,
        'down': 'RED' as const
      };
      onCreateBet(parseFloat(betAmount), directionMap[direction]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Selected Coin Display */}
      {selectedCoin && (
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TokenIcon 
                mint={selectedCoin.address}
                symbol={selectedCoin.symbol}
                size={64}
                priceChange24h={selectedCoin.priceChange24h}
                showGlow={true}
              />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCoin.symbol}</h3>
                <p className="text-gray-400">{selectedCoin.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Current Price</div>
              <div className="text-2xl font-bold text-white neon-premium-purple">
                ${(selectedCoin.price ?? 0).toFixed(6)}
              </div>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Premium Bet Section */}
      <PremiumBetSection
        amount={betAmount}
        onAmountChange={setBetAmount}
        onDirectionSelect={handleDirectionSelect}
        maxAmount={100}
        disabled={isCreatingBet || isOracleDown}
      />

      {/* Oracle Warning */}
      {isOracleDown && (
        <PremiumCard className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div>
              <div className="text-red-400 font-semibold">Oracle Down</div>
              <div className="text-red-400 text-sm opacity-80">Price feeds unavailable - bets paused</div>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Premium Payout Info */}
      <div className="text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-purple-400">⚡</span>
          <span>Instant 1.90x Payout</span>
          <span className="text-purple-400">⚡</span>
        </div>
        <div>60-second rounds • 2% house edge • Provably fair</div>
      </div>
    </div>
  );
}