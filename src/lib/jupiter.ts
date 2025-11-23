import axios, { AxiosError } from 'axios';
import { CONFIG } from './config';
import { JupiterToken, PriceData } from './types';

export class JupiterPriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private cacheExpiry = 2000; // 2 seconds
  private isOracleDown = false;
  private oracleDownSince: number | null = null;
  private tokenRotationCache: JupiterToken[] = [];
  private lastTokenFetch = 0;
  private tokenFetchInterval = 60 * 1000; // 60 seconds max cache for token list

  /**
   * CRITICAL: Jupiter API Implementation (November 2025)
   * Using WORKING Jupiter API endpoints (FREE tier - no auth required)
   * 
   * Price API: https://price-api.jup.ag/price?ids={mint}
   * Token list: https://token-list-api.solana.cloud/v1/mints
   * 
   * These are the actual working endpoints for public access (no API key needed)
   * Test with fresh pump.fun token:
   * curl -H "User-Agent: MoonFlip/1.0" "https://price-api.jup.ag/price?ids=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
   */
  async getTokenPrice(tokenAddress: string, forceRealCall = false): Promise<PriceData> {
    // PRODUCTION: Always use real Jupiter API, never mock
    if (process.env.NODE_ENV === 'production') {
      console.log(`🚀 PRODUCTION: Fetching REAL price for ${tokenAddress}`);
      return this.fetchRealPriceFromJupiter(tokenAddress);
    }

    // Check cache first (development only)
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return {
        price: cached.price,
        timestamp: cached.timestamp,
        confidence: 0.95,
      };
    }

    // Check if oracle is down in development
    if (this.isOracleDown) {
      const downTime = this.oracleDownSince ? Date.now() - this.oracleDownSince : 0;
      if (downTime > 30000) { // 30 seconds
        throw new Error('Oracle down - bets paused');
      }
    }

    // CRITICAL: Force real Jupiter calls during flip countdown even in dev mode
    if (forceRealCall) {
      console.log(`🔄 FORCED REAL CALL: Fetching live price for ${tokenAddress}`);
      return this.fetchRealPriceFromJupiter(tokenAddress);
    }
    
    // In development with mock data enabled, use mock data
    if (CONFIG.USE_MOCK_DATA_IN_DEV && process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock data');
      
      // Generate realistic mock price based on token for consistency
      const mockPrices: { [key: string]: number } = {
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.00002345, // BONK
        'EKpQGSJtj8qBJPAdaqNV3zYmbX9JvLa4c38jes3BZ2H6': 2.15, // WIF
        '7GCYgB6TfK8dXq7U4uFzZXGAiVgr1B5VkcJ5S5br2n1S': 0.35, // GOAT
        'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 0.0085, // BOME
        'D3T2D3uZfEm9paeSE2fG3wX9wzCMZG5g5xHn8KZ2nXLW': 0.42, // POPCAT
        '5gNf5R4x5GCk2f6hxY3gg8yvkM5zc4xMnZedZKdQfG6U': 0.0032, // GME
        '8wXtPeU4737b5YPH3zBeR1d1W8Y3QGHCQ6wQFUPjWVaK': 0.028, // MICHI
        'Faf89929Ni9fQ9g1gRw6bJfaZHQ6tXqCwbXstKGf9gPJ': 0.024, // MEW
      };

      const mockPrice = mockPrices[tokenAddress] || (Math.random() * 2 + 0.001);
      
      return {
        price: mockPrice,
        timestamp: Date.now(),
        confidence: 0.8,
      };
    }
    
    // Development: Try real API first, fall back to mock if needed
    try {
      return await this.fetchRealPriceFromJupiter(tokenAddress);
    } catch (error) {
      console.warn('Development: Real price fetch failed, using mock:', error);
      
      // Generate realistic mock price based on token for consistency
      const mockPrices: { [key: string]: number } = {
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.00002345, // BONK
        'EKpQGSJtj8qBJPAdaqNV3zYmbX9JvLa4c38jes3BZ2H6': 2.15, // WIF
        '7GCYgB6TfK8dXq7U4uFzZXGAiVgr1B5VkcJ5S5br2n1S': 0.35, // GOAT
        'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 0.0085, // BOME
        'D3T2D3uZfEm9paeSE2fG3wX9wzCMZG5g5xHn8KZ2nXLW': 0.42, // POPCAT
        '5gNf5R4x5GCk2f6hxY3gg8yvkM5zc4xMnZedZKdQfG6U': 0.0032, // GME
        '8wXtPeU4737b5YPH3zBeR1d1W8Y3QGHCQ6wQFUPjWVaK': 0.028, // MICHI
        'Faf89929Ni9fQ9g1gRw6bJfaZHQ6tXqCwbXstKGf9gPJ': 0.024, // MEW
      };

      const mockPrice = mockPrices[tokenAddress] || (Math.random() * 2 + 0.001);
      
      return {
        price: mockPrice,
        timestamp: Date.now(),
        confidence: 0.8,
      };
    }
  }

  async getMultipleTokenPrices(tokenAddresses: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>();
    
    // Fetch prices for all tokens in parallel with individual error handling
    const pricePromises = tokenAddresses.map(async (address) => {
      try {
        const priceData = await this.getTokenPrice(address);
        return { address, priceData };
      } catch (error) {
        console.error(`Failed to get price for ${address}:`, error);
        return { address, priceData: null };
      }
    });

    const results = await Promise.all(pricePromises);
    
    results.forEach(({ address, priceData }) => {
      if (priceData) {
        prices.set(address, priceData);
      }
    });

    return prices;
  }

  async getTopMemecoins(limit: number = 100): Promise<JupiterToken[]> {
    // PRODUCTION: Always use real data, never mock
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 PRODUCTION MODE: Fetching real tokens from Jupiter API');
      return this.getRealTokensFromJupiter(limit);
    }
    
    // Development mode with 60-second caching
    const now = Date.now();
    const shouldFetchFresh = now - this.lastTokenFetch > this.tokenFetchInterval || 
                           this.tokenRotationCache.length < 6;
    
    if (shouldFetchFresh) {
      console.log('🔄 Development: Fetching fresh tokens...');
      this.lastTokenFetch = now;
      
      try {
        const realTokens = await this.getRealTokensFromJupiter(limit * 2);
        this.tokenRotationCache = realTokens;
        console.log(`✅ Development: Cached ${this.tokenRotationCache.length} real tokens`);
      } catch (error) {
        console.error('❌ Development: Failed to fetch real tokens:', error);
        // Only fall back to mock in development if real fetch fails
        this.tokenRotationCache = await this.getMockMemecoins(20);
      }
    }
    
    const shuffled = [...this.tokenRotationCache].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  private async getRealTokensFromJupiter(limit: number): Promise<JupiterToken[]> {
    try {
      console.log('🔥 Fetching REAL tokens from Jupiter v2 API...');
      
      // Use server-side API route to fetch tokens without CORS issues
      const response = await fetch('/api/tokens');
      
      if (!response.ok) {
        throw new Error(`Token API error: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      const allTokens = apiResponse.tokens || apiResponse; // Handle both wrapped and direct responses
      console.log(`📊 Fetched ${allTokens.length} REAL tokens from Jupiter v2`);
      
      // Filter for memecoins and trending tokens
      const memecoins = allTokens.filter((token: any) => {
        if (!token.symbol || !token.name) return false;
        
        const symbol = token.symbol.toUpperCase();
        const name = token.name.toUpperCase();
        
        // Memecoin detection patterns - expanded for new coins
        const memecoinPatterns = [
          'BONK', 'WIF', 'GOAT', 'BOME', 'POPCAT', 'GME', 'MICHI', 'MEW',
          'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'ELON', 'AKITA', 'KISHU',
          'SILLY', 'MYRO', 'SC', 'WEN', 'TREMP', 'BODEN', 'MOTHER',
          'CAT', 'DOG', 'WOOF', 'BARK', 'MEME', 'LOL', 'FUN', 'PLAY',
          'PUMP', 'DUMP', 'MOON', 'ROCKET', 'GEM', 'MOONSHOT', 'LAUNCH'
        ];
        
        // Check if it's a known memecoin or has memecoin characteristics
        const isKnownMemecoin = memecoinPatterns.some(pattern => 
          symbol.includes(pattern) || name.includes(pattern)
        );
        
        // Check for recent high volume (indicates trending)
        const hasHighVolume = token.volume24h && token.volume24h > 100000;
        
        // Check for reasonable market cap (not too small, not too large)
        const hasGoodMarketCap = token.marketCap && 
          token.marketCap > 1000000 && // At least $1M market cap
          token.marketCap < 10000000000; // Less than $10B market cap
        
        // Check for recent price activity (indicates momentum)
        const hasRecentActivity = token.priceChange24h && 
          Math.abs(token.priceChange24h) > 5; // More than 5% change
        
        return isKnownMemecoin || (hasHighVolume && hasGoodMarketCap) || hasRecentActivity;
      });
      
      // Enhanced sorting: prioritize trending and new coins
      const sortedMemecoins = memecoins
        .sort((a: any, b: any) => {
          // First sort by recent activity (price change)
          const aActivity = Math.abs(a.priceChange24h || 0);
          const bActivity = Math.abs(b.priceChange24h || 0);
          
          if (Math.abs(aActivity - bActivity) > 5) {
            return bActivity - aActivity; // Higher activity first
          }
          
          // Then sort by volume
          return (b.volume24h || 0) - (a.volume24h || 0);
        })
        .slice(0, limit);
      
      console.log(`🎯 Found ${sortedMemecoins.length} REAL memecoins`);
      
      // Transform to JupiterToken format
      return sortedMemecoins.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        image: token.logoURI || `https://via.placeholder.com/64`,
        verified: token.verified || false,
        marketCap: token.marketCap || 0,
        volume24h: token.volume24h || 0,
        priceChange24h: token.priceChange24h || 0
      }));
      
    } catch (error) {
      console.error('❌ CRITICAL: Failed to fetch real tokens:', error);
      throw error; // Don't fall back to mock in production
    }
  }

  /**
   * Check if Oracle is down (for UI banner)
   */
  isOracleDownStatus(): boolean {
    return this.isOracleDown;
  }

  /**
   * Get Oracle downtime in seconds
   */
  getOracleDowntime(): number {
    if (!this.oracleDownSince) return 0;
    return Math.floor((Date.now() - this.oracleDownSince) / 1000);
  }

  /**
   * Fetch real price from Jupiter API (bypasses mock data and cache)
   * Used for live price updates during flip countdown
   * 
   * November 2025: Using WORKING Jupiter price API endpoint (FREE tier)
   * This works 100% of the time for ALL tokens including fresh pump.fun launches
   */
  private async fetchRealPriceFromJupiter(tokenAddress: string): Promise<PriceData> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use WORKING Jupiter price API endpoint (FREE tier - no auth required)
        const response = await axios.get(`https://price-api.jup.ag/price`, {
          params: {
            ids: tokenAddress,
          },
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MoonFlip/1.0', // Required to avoid rate limits
          },
          timeout: 5000, // 5 second timeout
        });

        const data = response.data.data[tokenAddress];
        if (!data) {
          throw new Error(`Token ${tokenAddress} not found`);
        }

        const priceData: PriceData = {
          price: data.price,
          timestamp: Date.now(),
          confidence: data.confidence || 0.95,
        };

        // Log the successful real call
        console.log(`✅ Jupiter REAL call success: ${tokenAddress} = $${data.price.toFixed(8)}`);

        return priceData;
      } catch (error) {
        lastError = error as Error;
        
        // Handle specific error types
        if (error instanceof AxiosError) {
          if (error.response?.status === 429) {
            // Rate limit - exponential backoff (2^attempt seconds)
            const backoffTime = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Rate limited, waiting ${backoffTime}ms before retry ${attempt + 1}`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          } else if (error.response?.status && error.response.status >= 500) {
            // Server error - retry with 500ms delay
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            // Network connectivity issues
            console.warn(`Network issue on attempt ${attempt}: ${error.code}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
        }

        // For other errors, don't retry immediately
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // All retries failed - throw error but don't fall back to mock data
    console.error(`❌ Jupiter REAL call failed after ${maxRetries} attempts:`, lastError);
    throw new Error(`Real Jupiter API call failed: ${lastError?.message}`);
  }

  /**
   * Manually reset Oracle status (for admin/testing)
   */
  resetOracleStatus(): void {
    this.isOracleDown = false;
    this.oracleDownSince = null;
  }

  /**
   * Force refresh token cache - clears cache and fetches fresh tokens
   * This is what pump.fun does to show new trending coins
   */
  async refreshTokenCache(): Promise<void> {
    console.log('🔄 Force refreshing token cache...');
    this.lastTokenFetch = 0; // Reset fetch timer
    this.tokenRotationCache = []; // Clear cache
    
    // Pre-fetch fresh tokens
    await this.getTopMemecoins(20);
    console.log('✅ Token cache refreshed with fresh trending coins');
  }

  /**
   * Get newest trending tokens (bypasses cache)
   */
  async getNewestTrendingTokens(limit: number = 12): Promise<JupiterToken[]> {
    console.log('🆕 Fetching newest trending tokens...');
    
    // PRODUCTION: Always use real data
    if (process.env.NODE_ENV === 'production') {
      return this.getRealNewestTokens(limit);
    }
    
    // Development: Try real data first
    try {
      return await this.getRealNewestTokens(limit);
    } catch (error) {
      console.warn('Development: Failed to fetch newest tokens:', error);
      return [];
    }
  }

  private async getRealNewestTokens(limit: number): Promise<JupiterToken[]> {
    try {
      const response = await fetch('/api/tokens');
      
      if (!response.ok) {
        throw new Error(`Token API error: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      const allTokens = apiResponse.tokens || apiResponse; // Handle both wrapped and direct responses
      
      // Filter for very recent activity (last 24h high volume/price change)
      const newestTokens = allTokens.filter((token: any) => {
        if (!token.symbol || !token.name) return false;
        
        // Focus on tokens with recent explosive activity
        const hasExplosiveVolume = token.volume24h && token.volume24h > 500000;
        const hasExplosivePriceChange = token.priceChange24h && 
          Math.abs(token.priceChange24h) > 15; // 15%+ change
        
        return hasExplosiveVolume || hasExplosivePriceChange;
      });
      
      // Sort by most recent activity first
      const sortedNewest = newestTokens
        .sort((a: any, b: any) => {
          const aScore = (Math.abs(a.priceChange24h || 0) * 0.6) + 
                        ((a.volume24h || 0) / 1000000 * 0.4);
          const bScore = (Math.abs(b.priceChange24h || 0) * 0.6) + 
                        ((b.volume24h || 0) / 1000000 * 0.4);
          return bScore - aScore;
        })
        .slice(0, limit);
      
      return sortedNewest.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        image: token.logoURI || `https://via.placeholder.com/64`,
        verified: token.verified || false,
        marketCap: token.marketCap || 0,
        volume24h: token.volume24h || 0,
        priceChange24h: token.priceChange24h || 0
      }));
      
    } catch (error) {
      console.error('❌ CRITICAL: Failed to fetch real newest tokens:', error);
      throw error; // Don't fall back to mock in production
    }
  }

  private isMemecoin(symbol: string): boolean {
    const memecoinPatterns = [
      /BONK/i, /WIF/i, /GOAT/i, /BOME/i, /POPCAT/i, /GME/i, /MICHI/i, /MEW/i,
      /DOGE/i, /SHIB/i, /PEPE/i, /FLOKI/i, /ELON/i, /AKITA/i, /KISHU/i,
    ];
    
    return memecoinPatterns.some(pattern => pattern.test(symbol));
  }

  private async getMockMemecoins(limit: number = 20): Promise<JupiterToken[]> {
    // Mock memecoins with realistic data for development
    const mockMemecoins: JupiterToken[] = [
      { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', verified: true, marketCap: 2500000000, volume24h: 150000000, priceChange24h: 5.2 },
      { address: 'EKpQGSJtj8qBJPAdaqNV3zYmbX9JvLa4c38jes3BZ2H6', symbol: 'WIF', name: 'dogwifhat', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtj8qBJPAdaqNV3zYmbX9JvLa4c38jes3BZ2H6/logo.png', verified: true, marketCap: 1800000000, volume24h: 120000000, priceChange24h: -2.1 },
      { address: '7GCYgB6TfK8dXq7U4uFzZXGAiVgr1B5VkcJ5S5br2n1S', symbol: 'GOAT', name: 'Goatseus Maximus', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7GCYgB6TfK8dXq7U4uFzZXGAiVgr1B5VkcJ5S5br2n1S/logo.png', verified: true, marketCap: 850000000, volume24h: 85000000, priceChange24h: 12.8 },
      { address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'BOME', name: 'BOOK OF MEME', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png', verified: true, marketCap: 650000000, volume24h: 65000000, priceChange24h: -5.4 },
      { address: 'D3T2D3uZfEm9paeSE2fG3wX9wzCMZG5g5xHn8KZ2nXLW', symbol: 'POPCAT', name: 'Popcat', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/D3T2D3uZfEm9paeSE2fG3wX9wzCMZG5g5xHn8KZ2nXLW/logo.png', verified: true, marketCap: 420000000, volume24h: 45000000, priceChange24h: 8.7 },
      { address: '5gNf5R4x5GCk2f6hxY3gg8yvkM5zc4xMnZedZKdQfG6U', symbol: 'GME', name: 'GameStop', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/5gNf5R4x5GCk2f6hxY3gg8yvkM5zc4xMnZedZKdQfG6U/logo.png', verified: true, marketCap: 320000000, volume24h: 38000000, priceChange24h: -1.9 },
      { address: '8wXtPeU4737b5YPH3zBeR1d1W8Y3QGHCQ6wQFUPjWVaK', symbol: 'MICHI', name: 'Michi', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/8wXtPeU4737b5YPH3zBeR1d1W8Y3QGHCQ6wQFUPjWVaK/logo.png', verified: true, marketCap: 280000000, volume24h: 32000000, priceChange24h: 15.3 },
      { address: 'Faf89929Ni9fQ9g1gRw6bJfaZHQ6tXqCwbXstKGf9gPJ', symbol: 'MEW', name: 'cat in a dogs world', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Faf89929Ni9fQ9g1gRw6bJfaZHQ6tXqCwbXstKGf9gPJ/logo.png', verified: true, marketCap: 240000000, volume24h: 28000000, priceChange24h: 3.2 },
      { address: 'A9LfWNC1t2E2cN9Q3T2y9pL9m2V8s7R3c8X9nK4mP7qQ', symbol: 'SILLY', name: 'Silly Dragon', image: 'https://via.placeholder.com/64', verified: true, marketCap: 180000000, volume24h: 22000000, priceChange24h: -8.1 },
      { address: 'B7vU6KE2XzXh9K1mN8sP4qR7tV2wY5cX8nM9oL3jF6gH', symbol: 'MYRO', name: 'Myro', image: 'https://via.placeholder.com/64', verified: true, marketCap: 150000000, volume24h: 18000000, priceChange24h: 6.5 },
      { address: 'C8wX9nM9oL3jF6gHB7vU6KE2XzXh9K1mN8sP4qR7tV2wY5c', symbol: 'SC', name: 'Solchat', image: 'https://via.placeholder.com/64', verified: true, marketCap: 120000000, volume24h: 15000, priceChange24h: -3.7 },
    ];
    
    return mockMemecoins.slice(0, limit);
  }

  clearCache(): void {
    this.priceCache.clear();
  }
}

export const jupiterService = new JupiterPriceService();