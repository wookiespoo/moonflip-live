'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export function NetworkIndicator() {
  const { connection } = useConnection();
  const [network, setNetwork] = useState<string>('');

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        
        // Common genesis hashes for different networks
        const networks = {
          'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wtyoLmFMlepy': 'devnet',
          '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': 'mainnet-beta',
          '4uhcVJyU9pJfCy6J6C8mJqdtdpJg6Tq1oZ8U9Z5U6X5d': 'testnet',
        };
        
        const currentNetwork = networks[genesisHash as keyof typeof networks] || 'unknown';
        setNetwork(currentNetwork);
      } catch (error) {
        console.error('Failed to get network:', error);
        setNetwork('unknown');
      }
    };

    checkNetwork();
  }, [connection]);

  if (network === 'mainnet-beta') return null; // Don't show indicator for mainnet

  return (
    <div className={`
      fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-semibold
      ${network === 'devnet' 
        ? 'bg-purple-600 text-white' 
        : 'bg-yellow-600 text-white'
      }
    `}>
      {network === 'devnet' ? '🧪 Devnet' : '⚠️ Test Network'}
    </div>
  );
}