'use client';

import { useState, useEffect } from 'react';
import { captureError } from '@/lib/monitoring';

interface AnalyticsData {
  hourlyVolume?: any[];
  coinStats?: any[];
  dailyStats?: any[];
  referralStats?: any[];
  userStats?: any;
  recentBets?: any[];
  bettingPattern?: any[];
  hourlyActivity?: any[];
  coinPerformance?: any[];
}

interface AnalyticsProps {
  walletAddress?: string;
}

export function Analytics({ walletAddress }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [walletAddress]);

  const fetchAnalytics = async () => {
    try {
      const url = walletAddress 
        ? `/api/analytics?wallet=${walletAddress}`
        : '/api/analytics';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add session ID if fetching user-specific analytics
      if (walletAddress) {
        const sessionId = localStorage.getItem('session-id');
        if (sessionId) {
          headers['x-session-id'] = sessionId;
        }
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      captureError(err as Error, {
        component: 'Analytics',
        action: 'fetchAnalytics',
        walletAddress
      });
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {walletAddress ? 'Your Analytics' : 'Global Analytics'}
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {walletAddress ? 'Your Analytics' : 'Global Analytics'}
        </h2>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!analytics || !Object.keys(analytics).length) return null;

  return (
    <div className="space-y-6">
      {/* User Stats (if wallet provided) */}
      {walletAddress && analytics.userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Bets</div>
            <div className="text-2xl font-bold text-white">{analytics.userStats.total_bets}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Win Rate</div>
            <div className="text-2xl font-bold text-green-400">{(analytics.userStats.win_rate ?? 0).toFixed(1)}%</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Won</div>
            <div className="text-2xl font-bold text-green-400">{(analytics.userStats.total_won ?? 0).toFixed(4)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Biggest Win</div>
            <div className="text-2xl font-bold text-purple-400">{analytics.userStats.biggest_win.toFixed(4)} SOL</div>
          </div>
        </div>
      )}

      {/* Betting Pattern (if wallet provided) */}
      {walletAddress && analytics.bettingPattern && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Betting Pattern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.bettingPattern.map((pattern, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${
                    pattern.direction === 'GREEN' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pattern.direction}
                  </span>
                  <span className="text-gray-400">{pattern.count} bets</span>
                </div>
                <div className="text-sm text-gray-300">
                  Avg: {pattern.avg_amount.toFixed(4)} SOL
                </div>
                <div className="text-sm text-gray-300">
                  Wins: {pattern.wins} / Losses: {pattern.losses}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Activity */}
      {analytics.hourlyActivity && analytics.hourlyActivity.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {walletAddress ? 'Your Activity by Hour' : 'Global Activity by Hour'}
          </h3>
          <div className="space-y-2">
            {analytics.hourlyActivity.map((hour, index) => {
              const maxCount = Math.max(...(analytics.hourlyActivity || []).map(h => h.count));
              const percentage = maxCount > 0 ? Math.min(100, (hour.count / maxCount) * 100) : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-12 text-gray-400">{hour.hour}:00</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-semibold">
                      {hour.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coin Performance */}
      {analytics.coinPerformance && analytics.coinPerformance.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {walletAddress ? 'Your Coin Performance' : 'Coin Performance'}
          </h3>
          <div className="space-y-2">
            {analytics.coinPerformance.slice(0, 10).map((coin, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-yellow-400 font-bold">#{index + 1}</div>
                  <div className="text-white font-semibold">{coin.coin_symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-300">{coin.bets} bets</div>
                  <div className="text-sm text-green-400">
                    {coin.wins}/{coin.bets} wins ({coin.bets > 0 ? ((coin.wins / coin.bets) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Stats (if no wallet provided) */}
      {!walletAddress && analytics.coinStats && analytics.coinStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Coins by Volume</h3>
          <div className="space-y-2">
            {analytics.coinStats.slice(0, 10).map((coin, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-yellow-400 font-bold">#{index + 1}</div>
                  <div className="text-white font-semibold">{coin.coin_symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{coin.volume.toFixed(2)} SOL</div>
                  <div className="text-gray-400 text-sm">{coin.bets} bets</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Stats (if no wallet provided) */}
      {!walletAddress && analytics.referralStats && analytics.referralStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Referrers</h3>
          <div className="space-y-2">
            {analytics.referralStats.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-yellow-400 font-bold">#{index + 1}</div>
                  <div className="text-gray-300 font-mono">
                    {referrer.referral_wallet.slice(0, 8)}...{referrer.referral_wallet.slice(-4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{referrer.total_earned.toFixed(4)} SOL</div>
                  <div className="text-gray-400 text-sm">{referrer.referrals} referrals</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchAnalytics}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Refresh Analytics
        </button>
      </div>
    </div>
  );
}