import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { CONFIG } from '@/lib/config';

export function useRpcConnection() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create connection without testing - let the actual usage handle errors
    try {
      const primaryConnection = new Connection(CONFIG.SOLANA_RPC, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });
      
      setConnection(primaryConnection);
      setError(null);
    } catch (connectionError) {
      console.error('Failed to create RPC connection:', connectionError);
      setError('Failed to create Solana connection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { connection, isLoading, error };
}