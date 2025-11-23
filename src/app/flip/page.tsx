'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PremiumHeader } from '@/components/PremiumHeader';
import { PremiumBetInterface } from '@/components/PremiumBetInterface';
import { PremiumActiveBet } from '@/components/PremiumActiveBet';
import { PremiumCard, PremiumButton } from '@/components/PremiumUI';
import { Memecoin, FlipBet, GameResult } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { gameManager } from '@/lib/game';
import { jupiterService } from '@/lib/jupiter';
import { AlertTriangle } from 'lucide-react';

function PremiumFlipPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  
  const [selectedCoin, setSelectedCoin] = useState<Memecoin | null>(null);
  const [activeBet, setActiveBet] = useState<FlipBet | null>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isCreatingBet, setIsCreatingBet] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isOracleDown, setIsOracleDown] = useState(false);
  const [isLoadingCoin, setIsLoadingCoin] = useState(true);

  // Load coin data from URL
  useEffect(() => {
    const loadCoinData = async () => {
      try {
        setIsLoadingCoin(true);
        
        // Check Oracle status
        const oracleDown = jupiterService.isOracleDownStatus();
        setIsOracleDown(oracleDown);
        
        const coinDataParam = searchParams.get('coin');
        if (coinDataParam) {
          try {
            const coinData = JSON.parse(decodeURIComponent(coinDataParam));
            setSelectedCoin(coinData);
            
            // Get current price
            const priceData = await jupiterService.getTokenPrice(coinData.address);
            setCurrentPrice(priceData.price);
          } catch (error) {
            console.error('Error parsing coin data:', error);
            router.push('/');
            return;
          }
        } else {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error loading coin data:', error);
        if (error instanceof Error && error.message.includes('Oracle down')) {
          setIsOracleDown(true);
        }
      } finally {
        setIsLoadingCoin(false);
      }
    };

    if (searchParams.get('coin')) {
      loadCoinData();
    }
  }, [searchParams, router]);

  // Check for existing active bet
  useEffect(() => {
    if (connected && publicKey) {
      const activeBets = gameManager.getActiveBets().filter(bet => bet.userWallet === publicKey.toString());
      if (activeBets.length > 0) {
        const mostRecentBet = activeBets[activeBets.length - 1];
        if (mostRecentBet.coinAddress === selectedCoin?.address) {
          setActiveBet(mostRecentBet);
        }
      }
    }
  }, [connected, publicKey, selectedCoin]);

  // Listen for bet resolution
  useEffect(() => {
    if (activeBet && publicKey) {
      const checkInterval = setInterval(() => {
        try {
          const updatedBet = gameManager.getActiveBet(activeBet.id);
          if (!updatedBet || updatedBet.status !== 'PENDING') {
            // Bet has been resolved
            console.log(`Bet ${activeBet.id} has been resolved`);
            
            // Get the result
            const userBets = gameManager.getUserBets(publicKey.toString());
            const resolvedBet = userBets.find(b => b.id === activeBet.id);
            
            if (resolvedBet && resolvedBet.status !== 'PENDING') {
              setGameResult({
                bet: resolvedBet,
                won: resolvedBet.status === 'WON',
                profit: resolvedBet.status === 'WON' ? (resolvedBet.payout || 0) - resolvedBet.amount : -resolvedBet.amount,
                payoutAmount: resolvedBet.payout || 0,
                feeAmount: 0,
                referralAmount: undefined
              });
              setShowResult(true);
            }
            
            setActiveBet(null);
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error('Error checking bet status:', error);
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    }
  }, [activeBet, publicKey]);

  // Handle bet completion
  const handleBetComplete = async () => {
    console.log('Bet timer completed - triggering safe resolution for bet:', activeBet!.id);
    
    try {
      // Try to resolve the bet safely (won't throw errors)
      const result = await gameManager.safeResolveBet(activeBet!.id);
      if (result) {
        console.log('Bet resolved successfully:', result);
        setGameResult(result);
        setShowResult(true);
      } else {
        console.log('Bet resolution returned null (likely already resolved)');
      }
    } catch (error) {
      console.warn('Safe resolution failed:', error);
    }
    
    setActiveBet(null);
  };

  const handleCreateBet = async (amount: number, direction: 'GREEN' | 'RED') => {
    if (!selectedCoin || !publicKey) return;

    try {
      setIsCreatingBet(true);
      
      const bet = await gameManager.createBet(
        publicKey.toString(),
        selectedCoin.address,
        selectedCoin.symbol,
        amount,
        direction
      );

      console.log('Bet created successfully:', bet);
      setActiveBet(bet);
      
    } catch (error) {
      console.error('Error creating bet:', error);
      alert('Error creating bet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreatingBet(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <PremiumHeader />
        <div className="glass-premium rounded-2xl p-8 max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🔥</div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your Solana wallet to start flipping</p>
          <div className="text-sm text-purple-400">⚡ Instant connection • 🔒 Secure • 🎮 Ready to play</div>
        </div>
      </div>
    );
  }

  if (isLoadingCoin) {
    return (
      <div className="min-h-screen relative">
        <PremiumHeader />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="glass-premium rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Loading Coin Data</h2>
            <p className="text-gray-400">Preparing your flip experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <PremiumHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!activeBet ? (
            <PremiumBetInterface
              selectedCoin={selectedCoin}
              onCreateBet={handleCreateBet}
              isCreatingBet={isCreatingBet}
              isOracleDown={isOracleDown}
            />
          ) : (
            <PremiumActiveBet
              bet={activeBet}
              onComplete={handleBetComplete}
            />
          )}
        </div>
      </main>

      {/* Result Modal */}
      {gameResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-premium rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">
              {gameResult.won ? '🎉' : '😔'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {gameResult.won ? 'You Won!' : 'You Lost'}
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Payout:</span>
                <span className="font-bold text-white">{(gameResult.payoutAmount ?? 0).toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final Price:</span>
                <span className="font-bold text-white">${(gameResult.bet?.endPrice ?? 0).toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Direction:</span>
                <span className={`font-bold ${gameResult.bet?.direction === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                  {gameResult.bet?.direction}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <PremiumButton
                onClick={() => {
                  setShowResult(false);
                  setGameResult(null);
                }}
                className="flex-1"
              >
                Continue
              </PremiumButton>
              <PremiumButton
                onClick={() => {
                  setShowResult(false);
                  setGameResult(null);
                  router.push('/');
                }}
                variant="purple"
                className="flex-1"
              >
                New Coin
              </PremiumButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PremiumFlipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <PremiumFlipPageContent />
    </Suspense>
  );
}