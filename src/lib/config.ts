export const CONFIG = {
  // House wallet for fee collection
  HOUSE_WALLET: 'B1vUK75FH7cBVJwtEs8KZr7d3MCUN2nTH9RdibFf1dfR',
  
  // Game settings
  MIN_BET: 0.1, // SOL
  MAX_BET: 10, // SOL
  GAME_DURATION: 60000, // 60 seconds in milliseconds
  PAYOUT_MULTIPLIER: 1.90,
  HOUSE_EDGE: 0.05,
  HOUSE_FEE: 0.04, // 4% of winning amount
  REFERRAL_FEE: 0.01, // 1% of winning amount
  
  // Rate limiting
  MAX_BETS_PER_MINUTE: 5,
  MAX_BETS_PER_HOUR: 50,
  
  // Jupiter API - CRITICAL: Use V3 endpoint (V2 deprecated Aug 1, 2025)
  JUPITER_PRICE_API: 'https://price.jup.ag/v6',
  JUPITER_TOKEN_API: 'https://tokens.jup.ag/tokens',
  
  // Development mode - use mock data when Jupiter API fails
  USE_MOCK_DATA_IN_DEV: true, // Set to false to test with real Jupiter API
  
  // Solana - Multiple RPC endpoints for reliability
  // Using devnet for testing with fake SOL
  SOLANA_RPC: 'https://api.devnet.solana.com',
  FALLBACK_RPC: 'https://rpc-devnet.helius.xyz/?api-key=default', // Alternative devnet RPC
  
  // UI
  COUNTDOWN_REFRESH_INTERVAL: 1000, // 1 second
  PRICE_REFRESH_INTERVAL: 2000, // 2 seconds
  
  // Social sharing
  TWITTER_SHARE_TEMPLATE: "I just flipped ${symbol} for ${multiplier}x in 60s on @MoonFlipLive! 🚀🎯",
  TIKTOK_SHARE_TEMPLATE: "Flipped ${symbol} ${direction} and won ${amount} SOL in 60 seconds! 🚀 #MoonFlip #Solana #Crypto",
} as const;

export const MEMECOIN_WHITELIST = [
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'EKpQGSJtj8qBJPAdaqNV3zYmbX9JvLa4c38jes3BZ2H6', // WIF
  '7GCYgB6TfK8dXq7U4uFzZXGAiVgr1B5VkcJ5S5br2n1S', // GOAT
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // BOME
  'D3T2D3uZfEm9paeSE2fG3wX9wzCMZG5g5xHn8KZ2nXLW', // POPCAT
  '5gNf5R4x5GCk2f6hxY3gg8yvkM5zc4xMnZedZKdQfG6U', // GME
  '8wXtPeU4737b5YPH3zBeR1d1W8Y3QGHCQ6wQFUPjWVaK', // MICHI
  'Faf89929Ni9fQ9g1gRw6bJfaZHQ6tXqCwbXstKGf9gPJ', // MEW
];

export const SUPPORTED_WALLETS = [
  'Phantom',
  'Backpack',
  'Solflare',
  'Torus',
  'Ledger',
];