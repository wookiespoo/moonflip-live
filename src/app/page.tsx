'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PremiumHeader, PremiumCoinCard } from '@/components/PremiumHeader';
import { PremiumCard } from '@/components/PremiumUI';
import { tokenFeedService, CombinedToken } from '@/lib/tokenFeed';
import { jupiterService } from '@/lib/jupiter';
import { AlertTriangle, Zap } from 'lucide-react';

export default function PremiumHomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [trendingTokens, setTrendingTokens] = useState<CombinedToken[]>([]);
  const [newTokens, setNewTokens] = useState<CombinedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<CombinedToken | null>(null);
  const [isOracleDown, setIsOracleDown] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'new'>('trending');

  useEffect(() => {
    loadTokens();
    
    // Auto-refresh tokens every 3 minutes (like pump.fun)
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing tokens...');
      loadTokens();
    }, 3 * 60 * 1000); // 3 minutes
    
    return () => clearInterval(interval);
  }, []);

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      
      // Check Oracle status
      const oracleDown = jupiterService.isOracleDownStatus();
      setIsOracleDown(oracleDown);
      
      // Load combined trending tokens (Pump.fun + Jupiter)
      const trending = await tokenFeedService.getCombinedTokenFeed({
        includeNewLaunches: true,
        includeJupiterFallback: true,
        limit: 12,
        sortBy: 'volume'
      });
      // Merge live prices into trending tokens
      const trendingAddresses = trending.map(t => (t as any).address || (t as any).mintAddress).filter(Boolean);
      const trendingPrices = await jupiterService.getBatchPrices(trendingAddresses);
      const trendingWithPrices = trending.map(t => {
        const addr = (t as any).address || (t as any).mintAddress;
        const p = addr ? trendingPrices.get(addr) : undefined;
        return { ...t, price: p?.price ?? 0 } as any;
      });
      setTrendingTokens(trendingWithPrices as any);
      
      // Load new tokens (Pump.fun new launches)
      const newTokensList = await tokenFeedService.getTrendingTokens(12);
      const newAddresses = newTokensList.map(t => (t as any).address || (t as any).mintAddress).filter(Boolean);
      const newPrices = await jupiterService.getBatchPrices(newAddresses);
      const newWithPrices = newTokensList.map(t => {
        const addr = (t as any).address || (t as any).mintAddress;
        const p = addr ? newPrices.get(addr) : undefined;
        return { ...t, price: p?.price ?? 0 } as any;
      });
      setNewTokens(newWithPrices as any);
      
      console.log(`✅ Loaded ${trending.length} trending tokens and ${newTokens.length} new tokens`);
    } catch (error) {
      console.error('Error loading tokens:', error);
      
      // Check if Oracle is down
      if (error instanceof Error && error.message.includes('Oracle down')) {
        setIsOracleDown(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoinSelect = (coin: CombinedToken) => {
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

          {/* Tab Navigation - Like Pump.fun */}
          <div className="flex justify-center mb-8">
            <div className="glass-premium rounded-2xl p-2 flex">
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'trending'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔥 Trending
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'new'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ✨ New & Hot
              </button>
            </div>
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
              {activeTab === 'trending'
                ? trendingTokens.map((token) => (
                    <div key={(token as any).address || (token as any).mintAddress} className="relative">
                      {/* NEW LAUNCH Badge */}
                      {token.isNewLaunch && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-green-500/30 animate-pulse">
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              NEW LAUNCH
                            </div>
                          </div>
                        </div>
                      )}
                      <PremiumCoinCard
                        coin={token}
                        onSelect={() => handleCoinSelect(token)}
                        isSelected={!!selectedCoin && ((selectedCoin as any).address === (token as any).address || (selectedCoin as any).mintAddress === (token as any).mintAddress)}
                        ageDisplay={tokenFeedService.getTokenAgeDisplay(token)}
                      />
                    </div>
                  ))
                : newTokens.map((token) => (
                    <div key={(token as any).address || (token as any).mintAddress} className="relative">
                      {/* NEW LAUNCH Badge */}
                      {token.isNewLaunch && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-green-500/30 animate-pulse">
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              NEW LAUNCH
                            </div>
                          </div>
                        </div>
                      )}
                      <PremiumCoinCard
                        coin={token}
                        onSelect={() => handleCoinSelect(token)}
                        isSelected={!!selectedCoin && ((selectedCoin as any).address === (token as any).address || (selectedCoin as any).mintAddress === (token as any).mintAddress)}
                        ageDisplay={tokenFeedService.getTokenAgeDisplay(token)}
                      />
                    </div>
                  ))
              }
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="text-center mt-8">
            <div className="text-gray-500 text-sm">
              {activeTab === 'trending' ? '🔥 Trending by volume' : '✨ Newest trending coins'} • 
              <button 
                onClick={loadTokens}
                className="text-purple-400 hover:text-purple-300 ml-1"
              >
                Refresh
              </button>
            </div>
          </div>
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
