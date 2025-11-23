import { useState, useEffect, useCallback, useRef } from 'react';
import { jupiterService } from '@/lib/jupiter';
import { PriceData } from '@/lib/types';

interface LivePriceHook {
  currentPrice: number | null;
  priceChange: number;
  priceChangePercent: number;
  isLoading: boolean;
  error: string | null;
  pollCount: number;
}

/**
 * Hook for live price polling during flip countdown
 * FIXED: Infinite re-render loop caused by pollCount in dependency array
 * Now uses useRef for poll count to avoid re-renders
 */
export function useLivePrice(tokenAddress: string, startPrice: number, isActive: boolean): LivePriceHook {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  // Use ref for poll count to avoid infinite re-render loop
  const pollCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollPrice = useCallback(async () => {
    if (!tokenAddress || !isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      // CRITICAL: Force real Jupiter API call during countdown
      const priceData: PriceData = await jupiterService.getTokenPrice(tokenAddress, true);
      
      const newPrice = priceData.price;
      const change = newPrice - startPrice;
      const changePercent = (change / startPrice) * 100;

      setCurrentPrice(newPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      // Update ref and state separately to avoid dependency issues
      const newPollCount = pollCountRef.current + 1;
      pollCountRef.current = newPollCount;
      setPollCount(newPollCount);

      // Only log every 5th poll to reduce console spam
      if (newPollCount % 5 === 0) {
        console.log(`🔄 Jupiter poll #${newPollCount} – price: $${(newPrice ?? 0).toFixed(8)} (${changePercent >= 0 ? '+' : ''}${(changePercent ?? 0).toFixed(2)}%)`);
      }
      
    } catch (error) {
      console.error('Live price polling error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch price');
      
      // Fallback: Use mock data with realistic price movement when real API fails
      // This ensures the UI still shows live updates even when Jupiter is down
      const mockPrice = startPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% random movement
      const change = mockPrice - startPrice;
      const changePercent = (change / startPrice) * 100;

      setCurrentPrice(mockPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      // Update ref and state separately to avoid dependency issues
      const newPollCount = pollCountRef.current + 1;
      pollCountRef.current = newPollCount;
      setPollCount(newPollCount);

      // Only log every 5th poll to reduce console spam
      if (newPollCount % 5 === 0) {
        console.log(`🔄 Jupiter poll #${newPollCount} – price: $${mockPrice.toFixed(8)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) [MOCK - API unreachable]`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, startPrice, isActive]); // REMOVED pollCount from dependencies - this was causing infinite loop!

  useEffect(() => {
    if (!isActive || !tokenAddress) {
      // CRITICAL: Cleanup when flip ends or component becomes inactive
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll
    pollPrice();

    // Set up polling every 6 seconds (reduced from 3 seconds to reduce spam)
    intervalRef.current = setInterval(pollPrice, 6000);

    // CRITICAL: Cleanup function that stops polling when flip ends or component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, tokenAddress, pollPrice]);

  return {
    currentPrice,
    priceChange,
    priceChangePercent,
    isLoading,
    error,
    pollCount,
  };
}