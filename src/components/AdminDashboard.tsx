'use client';

import { useState, useEffect } from 'react';
import { captureError } from '@/lib/monitoring';

interface AdminStats {
  totalBets: number;
  activeBets: number;
  completedBets: number;
  totalVolume: number;
  totalWon: number;
  totalLost: number;
  houseProfit: number;
  recentBets: any[];
  topUsers: any[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const sessionId = localStorage.getItem('session-id');
      if (!sessionId) {
        setError('Authentication required. Please sign in first.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      if (response.status === 401) {
        setError('Authentication failed. Please sign in again.');
        localStorage.removeItem('session-id');
        return;
      }
      
      if (response.status === 403) {
        setError('Admin access required. This area is restricted to administrators.');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      captureError(err as Error, {
        component: 'AdminDashboard',
        action: 'fetchStats'
      });
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
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
        <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Bets</div>
          <div className="text-2xl font-bold text-white">{stats.totalBets.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active Bets</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.activeBets.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-green-400">{stats.totalVolume.toFixed(2)} SOL</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">House Profit</div>
          <div className="text-2xl font-bold text-purple-400">{stats.houseProfit.toFixed(4)} SOL</div>
        </div>
      </div>

      {/* Recent Bets */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Bets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Coin</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Direction</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBets.map((bet, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="p-2 text-gray-300">
                    {new Date(bet.start_time).toLocaleTimeString()}
                  </td>
                  <td className="p-2 text-gray-300 font-mono">
                    {bet.user_wallet.slice(0, 8)}...{bet.user_wallet.slice(-4)}
                  </td>
                  <td className="p-2 text-gray-300">{bet.coin_symbol}</td>
                  <td className="p-2 text-gray-300">{bet.amount} SOL</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      bet.direction === 'GREEN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {bet.direction}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      bet.status === 'WON' ? 'bg-green-900 text-green-300' : 
                      bet.status === 'LOST' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {bet.status}
                    </span>
                  </td>
                  <td className="p-2">
                    {bet.status === 'COMPLETED' && (
                      <span className={bet.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {bet.profit >= 0 ? '+' : ''}{bet.profit?.toFixed(4)} SOL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Top Users by Winnings</h3>
        <div className="space-y-2">
          {stats.topUsers.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <div className="text-yellow-400 font-bold">#{index + 1}</div>
                <div className="text-gray-300 font-mono">
                  {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-4)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">{user.total_won.toFixed(4)} SOL</div>
                <div className="text-gray-400 text-sm">{user.total_bets} bets • {user.win_rate.toFixed(1)}% win</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  );
}