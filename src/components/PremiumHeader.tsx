import WalletButton from '@/components/WalletButton';
import { PremiumTrustBadge } from '@/components/PremiumUI';
import { TokenIcon } from '@/components/TokenIcon';
import { HouseBankrollCounter } from '@/components/HouseBankrollCounter';
import { useState } from 'react';

export function PremiumHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="glass-premium border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <span className="text-white font-bold text-xl">🌙</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MoonFlip.live
              </h1>
              <p className="text-sm text-gray-400">Premium Solana Gambling</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="hidden md:flex items-center gap-3">
            <HouseBankrollCounter />
            <PremiumTrustBadge text="Verified" type="verified" />
            <PremiumTrustBadge text="Secure" type="secure" />
            <PremiumTrustBadge text="Fair Play" type="fair" />
            <PremiumTrustBadge text="Solana" type="solana" />
          </div>

          {/* Wallet & Stats */}
          <div className="flex items-center gap-4">
            {/* Live Stats */}
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-400 font-bold">$2.4M</div>
                <div className="text-gray-400">Volume</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold">15.2K</div>
                <div className="text-gray-400">Players</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold">98.5%</div>
                <div className="text-gray-400">Win Rate</div>
              </div>
            </div>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>

        {/* Mobile Trust Indicators */}
        <div className="md:hidden flex items-center gap-2 mt-4">
          <HouseBankrollCounter />
          <PremiumTrustBadge text="Verified" type="verified" />
          <PremiumTrustBadge text="Secure" type="secure" />
        </div>
      </div>
    </header>
  );
}

export function PremiumCoinCard({ coin, onSelect, isSelected, ageDisplay }: {
  coin: any;
  onSelect: () => void;
  isSelected: boolean;
  ageDisplay?: string;
}) {
  return (
    <div 
      onClick={onSelect}
      className={`
        card-premium cursor-pointer relative overflow-hidden
        ${isSelected ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/25' : ''}
        micro-bounce
      `}
    >
      {/* Premium glow effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse" />
      )}
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TokenIcon 
              mint={coin.mintAddress || coin.address}
              symbol={coin.symbol}
              size={48}
              priceChange24h={coin.priceChange24h}
              showGlow={true}
            />
            <div>
              <h3 className="font-bold text-white">{coin.symbol}</h3>
              <p className="text-gray-400 text-sm">{coin.name}</p>
              {ageDisplay && (
                <p className="text-green-400 text-xs font-semibold">{ageDisplay}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">${(coin.price ?? 0).toFixed(6)}</div>
            <div className={`text-sm font-semibold ${(coin.priceChange24h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(coin.priceChange24h ?? 0) >= 0 ? '+' : ''}{(coin.priceChange24h ?? 0).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Premium stats bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Market Cap</span>
            <span className="text-white font-semibold">${((coin.marketCap ?? 0) / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">24h Volume</span>
            <span className="text-white font-semibold">${((coin.volume24h ?? 0) / 1000000).toFixed(1)}M</span>
          </div>
          {coin.liquidity && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Liquidity</span>
              <span className="text-white font-semibold">${((coin.liquidity ?? 0) / 1000).toFixed(0)}K</span>
            </div>
          )}
        </div>

        {/* Premium selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}