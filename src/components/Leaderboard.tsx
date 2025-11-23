'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, Target } from 'lucide-react';
import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardProps {
  className?: string;
}

export default function Leaderboard({ className = '' }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'winnings' | 'win_rate' | 'volume'>('winnings');

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Leaderboard
          </h2>
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-gray-600 rounded"></div>
                    <div className="w-16 h-3 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-gray-600 rounded"></div>
                  <div className="w-12 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setType('winnings')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              type === 'winnings' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" />
            Winnings
          </button>
          <button
            onClick={() => setType('win_rate')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              type === 'win_rate' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1" />
            Win Rate
          </button>
          <button
            onClick={() => setType('volume')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              type === 'volume' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Volume
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {leaderboard.map((entry, index) => (
          <div key={entry.wallet_address} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {formatWallet(entry.wallet_address)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {entry.total_bets} bets • {entry.win_rate?.toFixed(1) || 0}% win rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  {type === 'winnings' && `+${formatNumber(entry.total_won)} SOL`}
                  {type === 'win_rate' && `${entry.win_rate?.toFixed(1) || 0}%`}
                  {type === 'volume' && `${formatNumber(entry.total_wagered)} SOL`}
                </div>
                <div className="text-gray-400 text-sm">
                  {entry.best_streak} streak • {formatNumber(entry.biggest_win)} max
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No bets placed yet. Be the first to flip!</p>
          </div>
        )}
      </div>
    </div>
  );
}