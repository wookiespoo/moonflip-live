'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { useRpcConnection } from '@/hooks/useRpcConnection';

export default function WalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection: walletConnection } = useConnection();
  const { connection: rpcConnection, isLoading: rpcLoading, error: rpcError } = useRpcConnection();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (connected && publicKey) {
      fetchBalance();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey || !walletConnection) return;
    
    setIsLoading(true);
    try {
      const balance = await walletConnection.getBalance(publicKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error: any) {
      console.warn('Balance fetch failed (RPC may be unavailable):', error.message);
      // Gracefully handle all RPC errors by showing unavailable balance
      setBalance(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setBalance(0);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (!connected) {
    return (
      <div suppressHydrationWarning>
        {isClient ? (
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !px-6 !py-3 !font-semibold !text-white !transition-all !duration-200 !border-0 !shadow-lg hover:!shadow-purple-500/25" />
        ) : (
          <button className="bg-purple-600 hover:bg-purple-700 rounded-lg px-6 py-3 font-semibold text-white transition-all duration-200 border-0 shadow-lg hover:shadow-purple-500/25">
            Connect Wallet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-gray-800 rounded-lg px-4 py-2">
        <div className="text-xs text-gray-400">Balance</div>
        <div className="text-sm font-semibold text-white">
          {isLoading ? (
            <div className="animate-pulse">...</div>
          ) : balance === -1 ? (
            <span title="Balance unavailable - RPC connection issue">-- SOL</span>
          ) : (
            `${(balance ?? 0).toFixed(4)} SOL`
          )}
        </div>
        {balance === -1 && (
          <div className="text-xs text-yellow-400 mt-1">⚠️ RPC Error</div>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg px-4 py-2">
        <div className="text-xs text-gray-400">Wallet</div>
        <div className="text-sm font-mono text-white">
          {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
        </div>
      </div>

      <button
        onClick={handleDisconnect}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
      >
        Disconnect
      </button>
    </div>
  );
}