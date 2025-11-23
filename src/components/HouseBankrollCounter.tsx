'use client';

import { useState, useEffect } from 'react';
import { houseBankrollManager } from '@/lib/houseBankroll';
import { Coins } from 'lucide-react';

export function HouseBankrollCounter() {
  const [bankroll, setBankroll] = useState(houseBankrollManager.getBankrollBalance());
  const [isLow, setIsLow] = useState(!houseBankrollManager.isBankrollSufficient());

  useEffect(() => {
    // Update bankroll every 2 seconds
    const interval = setInterval(() => {
      const currentBankroll = houseBankrollManager.getBankrollBalance();
      const currentStatus = houseBankrollManager.getBettingStatus();
      
      setBankroll(currentBankroll);
      setIsLow(currentStatus.paused);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatBankroll = (amount: number) => {
    if (amount >= 1000) {
      return `${((amount ?? 0) / 1000).toFixed(1)}K`;
    }
    return (amount ?? 0).toFixed(0);
  };

  if (isLow) {
    return (
      <div className="glass-premium rounded-xl p-4 border border-red-500/30 bg-red-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
            <Coins className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm text-red-400 font-semibold">House Bankroll Low</div>
            <div className="text-xs text-red-300">Refueling in progress...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-premium rounded-xl p-4 border border-green-500/30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Coins className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <div className="text-sm text-gray-400">House Bankroll</div>
          <div className="text-xl font-bold text-green-400">
            {formatBankroll(bankroll)} SOL
          </div>
        </div>
      </div>
      
      {/* Trust indicator */}
      <div className="mt-2 pt-2 border-t border-green-500/20">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400">Liquidity Verified</span>
        </div>
      </div>
    </div>
  );
}

// Low bankroll warning banner
export function LowBankrollBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkBankroll = () => {
      const status = houseBankrollManager.getBettingStatus();
      setShowBanner(status.paused);
    };

    checkBankroll();
    const interval = setInterval(checkBankroll, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-sm border-b border-red-400/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 text-white">
          <div className="animate-pulse">⚠️</div>
          <span className="font-semibold">House bankroll refueling - betting temporarily paused</span>
          <div className="text-sm opacity-75">Back in 5 minutes</div>
        </div>
      </div>
    </div>
  );
}