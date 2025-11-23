'use client';

import { useEffect, useState } from 'react';
import { GameResult } from '@/lib/types';
import confetti from 'canvas-confetti';

interface ResultModalProps {
  result: GameResult;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResultModal({ result, isOpen, onClose }: ResultModalProps) {
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen && result.won) {
      // Trigger confetti for wins
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#9333ea'],
      });
    }
  }, [isOpen, result.won]);

  const handleShareTwitter = async () => {
    setIsSharing(true);
    try {
      const text = `I just flipped $${result.bet.coinSymbol} ${result.bet.direction} and ${result.won ? 'won' : 'lost'} ${Math.abs(result.profit).toFixed(2)} SOL in 60s on @MoonFlipLive! 🚀🎯\n\nTry your luck: https://moonflip.live`;
      const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error sharing to X:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareTikTok = async () => {
    setIsSharing(true);
    try {
      const text = `Flipped $${result.bet.coinSymbol} ${result.bet.direction} and won ${result.profit.toFixed(2)} SOL in 60 seconds! 🚀 #MoonFlip #Solana #Crypto`;
      // TikTok sharing typically requires their SDK, so we'll copy to clipboard
      await navigator.clipboard.writeText(text);
      alert('Caption copied to clipboard! Paste it in your TikTok video.');
    } catch (error) {
      console.error('Error sharing to TikTok:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  const { won, profit, payoutAmount, feeAmount } = result;
  const { bet } = result;
  const priceChange = ((bet.endPrice! - bet.startPrice) / bet.startPrice) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Result icon */}
        <div className="text-center mb-6">
          <div className={`text-6xl mb-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
            {won ? '🎉' : '😞'}
          </div>
          
          <h2 className={`text-3xl font-bold mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
            {won ? 'YOU WON!' : 'YOU LOST'}
          </h2>
          
          <p className="text-gray-400">
            {won ? `+${profit.toFixed(2)} SOL profit` : `${Math.abs(profit).toFixed(2)} SOL loss`}
          </p>
        </div>

        {/* Bet details */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Coin</div>
              <div className="font-semibold text-white">${bet.coinSymbol}</div>
            </div>
            <div>
              <div className="text-gray-400">Direction</div>
              <div className={`font-semibold ${bet.direction === 'GREEN' ? 'text-green-400' : 'text-red-400'}`}>
                {bet.direction}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Bet Amount</div>
              <div className="font-semibold text-white">{bet.amount} SOL</div>
            </div>
            <div>
              <div className="text-gray-400">Price Change</div>
              <div className={`font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>

          {won && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Payout</div>
                  <div className="font-semibold text-green-400">{payoutAmount.toFixed(2)} SOL</div>
                </div>
                <div>
                  <div className="text-gray-400">House Fee</div>
                  <div className="font-semibold text-amber-400">{feeAmount.toFixed(2)} SOL</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShareTwitter}
            disabled={isSharing}
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            {isSharing ? 'Sharing...' : 'Share on X'}
          </button>
          
          <button
            onClick={handleShareTikTok}
            disabled={isSharing}
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            {isSharing ? 'Preparing...' : 'Share on TikTok'}
          </button>
        </div>

        {/* Play again */}
        <button
          onClick={onClose}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}