'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PremiumHeader, PremiumCoinCard } from '@/components/PremiumHeader';
import { PremiumCard } from '@/components/PremiumUI';
import { jupiterService } from '@/lib/jupiter';
import { JupiterToken } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export default function PremiumHomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [memecoins, setMemecoins] = useState<JupiterToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<JupiterToken | null>(null);
  const [isOracleDown, setIsOracleDown] = useState(false);

  useEffect(() => {
    loadMemecoins();
  }, []);

  const loadMemecoins = async () => {
    try {
      setIsLoading(true);
      
      // Check Oracle status
      const oracleDown = jupiterService.isOracleDownStatus();
      setIsOracleDown(oracleDown);
      
      const coins = await jupiterService.getTopMemecoins(12);
      setMemecoins(coins);
    } catch (error) {
      console.error('Error loading memecoins:', error);
      
      // Check if Oracle is down
      if (error instanceof Error && error.message.includes('Oracle down')) {
        setIsOracleDown(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoinSelect = (coin: JupiterToken) => {
    setSelectedCoin(coin);
    // Always navigate to flip page, wallet connection will be handled there
    const coinData = encodeURIComponent(JSON.stringify(coin));
    router.push(`/flip?coin=${coinData}`);
  };

  return (
    <div className="min-h-screen relative">
      {/* Premium Header */}
      <PremiumHeader />

      {/* Premium Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="text-white">Flip </span>
            <span className="neon-premium-purple">Memecoins</span>
            <br />
            <span className="text-white">in </span>
            <span className="neon-premium-green">60 Seconds</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the most <span className="text-purple-400 font-semibold">premium Solana gambling</span> platform. 
            Bet on memecoin price direction with <span className="text-green-400 font-semibold">1.90x instant payouts</span>. 
            No registration. Just connect your wallet and flip.
          </p>
          
          {/* Premium Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <PremiumCard className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 neon-premium-green mb-2">1.90x</div>
              <div className="text-gray-400 font-semibold">Instant Payout</div>
            </PremiumCard>
            <PremiumCard className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 neon-premium-purple mb-2">60s</div>
              <div className="text-gray-400 font-semibold">Quick Flips</div>
            </PremiumCard>
            <PremiumCard className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 neon-premium-blue mb-2">0.1</div>
              <div className="text-gray-400 font-semibold">Min SOL</div>
            </PremiumCard>
          </div>

          {!connected && (
            <div className="mb-12">
              <div className="glass-premium rounded-2xl p-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔥</div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Flip?</h3>
                  <p className="text-gray-400 mb-4">Connect your Solana wallet to start playing</p>
                  <div className="text-sm text-purple-400">⚡ Instant connection • 🔒 Secure • 🎮 Ready to play</div>
                </div>
              </div>
            </div>
          )}



          {/* Oracle Warning */}
          {isOracleDown && (
            <div className="glass-premium border-red-500/30 bg-red-500/10 rounded-2xl p-6 max-w-lg mx-auto mb-12">
              <div className="flex items-center justify-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <div>
                  <div className="text-red-400 font-semibold text-lg">Oracle Down</div>
                  <div className="text-red-400 opacity-80">Price feeds unavailable - bets paused</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Premium Memecoins Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your <span className="neon-premium-purple">Memecoin</span>
            </h2>
            <p className="text-gray-400 text-lg">Select a coin to flip. Prices update in real-time.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-premium p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20" />
                      <div className="h-3 bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-700 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memecoins.map((coin) => (
                <PremiumCoinCard
                  key={coin.address}
                  coin={coin}
                  onSelect={() => handleCoinSelect(coin)}
                  isSelected={selectedCoin?.address === coin.address}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium Footer Stats */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <PremiumCard className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400 mb-2">$2.4M+</div>
                <div className="text-gray-400">Total Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-2">15.2K+</div>
                <div className="text-gray-400">Active Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-2">98.5%</div>
                <div className="text-gray-400">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400 mb-2">24/7</div>
                <div className="text-gray-400">Available</div>
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>
    </div>
  );
}