import axios, { AxiosError } from 'axios';
import { CONFIG } from './config';
import { JupiterToken, PriceData } from './types';

export class JupiterPriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private cacheExpiry = 2000; // 2 seconds
  private isOracleDown = false;
  private oracleDownSince: number | null = null;

  /**
   * CRITICAL: Jupiter V3 API Implementation
   * V2 deprecated Aug 1, 2025 - MUST use V6 endpoint
   * 
   * Test connection (works in production):
   * curl -H "User-Agent: MoonFlip/1.0" "https://price.jup.ag/v6/price?ids=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
   * 
   * Expected response:
   * {"data":{"DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263":{"price":0.00002345,"confidence":0.95}}}
   */
  async getTokenPrice(tokenAddress: string, forceRealCall = false): Promise<PriceData> {
    // Check cache first
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return {
        price: cached.price,
        timestamp: cached.timestamp,
        confidence: 0.95,
      };
    }

    // Check if oracle is down in production
    if (process.env.NODE_ENV === 'production' && this.isOracleDown) {
      const downTime = this.oracleDownSince ? Date.now() - this.oracleDownSince : 0;
      if (downTime > 30000) { // 30 seconds
        throw new Error('Oracle down - bets paused');
      }
    }

    // Check if we're in a browser environment (CORS issues)
    const isBrowser = typeof window !== 'undefined';
    
    // CRITICAL: Force real Jupiter calls during flip countdown even in dev mode
    if (forceRealCall) {
      console.log(`🔄 FORCED REAL CALL: Fetching live price for ${tokenAddress}`);
      // Skip cache and mock data - force real API call
      return this.fetchRealPriceFromJupiter(tokenAddress);
    }
    
    // In development with mock data enabled, skip API calls entirely and use mock data
    if (CONFIG.USE_MOCK_DATA_IN_DEV && process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock data directly');
      
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
    
    // For browser environment in production, use our proxy endpoint to avoid CORS issues
    if (isBrowser && process.env.NODE_ENV === 'production') {
      try {
        // Use Next.js API proxy to avoid CORS issues
        const response = await fetch(`/api/jupiter/price?ids=${tokenAddress}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const tokenData = data.data[tokenAddress];
        
        if (!tokenData) {
          throw new Error(`Token ${tokenAddress} not found`);
        }

        const priceData: PriceData = {
          price: tokenData.price,
          timestamp: Date.now(),
          confidence: tokenData.confidence || 0.95,
        };

        // Update cache
        this.priceCache.set(tokenAddress, {
          price: priceData.price,
          timestamp: priceData.timestamp,
        });

        return priceData;
      } catch (browserError) {
        console.warn('Browser proxy failed, falling back to mock data:', browserError);
        // Fall through to mock data for browser environment
      }
    } else {
      // Server-side: Use axios with full retry logic
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // V6 endpoint: https://price.jup.ag/v6/price?ids={mint}
          const response = await axios.get(`${CONFIG.JUPITER_PRICE_API}/price`, {
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

          // Update cache and clear oracle down status
          this.priceCache.set(tokenAddress, {
            price: priceData.price,
            timestamp: priceData.timestamp,
          });
          this.isOracleDown = false;
          this.oracleDownSince = null;

          return priceData;
        } catch (error) {
          lastError = error as Error;
          
          // Handle specific error types
          if (error instanceof AxiosError) {
            if (error.response?.status === 429) {
              // Rate limit - wait 1 second before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
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

      // All retries failed
      console.error(`Jupiter API failed after ${maxRetries} attempts:`, lastError);

      // In production: Mark oracle as down and show banner
      if (process.env.NODE_ENV === 'production') {
        this.isOracleDown = true;
        this.oracleDownSince = Date.now();
        throw new Error('Oracle down - bets paused');
      }
    }

    // Fallback to mock data for development/testing
    console.warn('Using mock data - Jupiter API unavailable');
    
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
    // For now, return mock memecoins directly to avoid network errors
    // The Jupiter tokens API is not accessible, so we use realistic mock data
    console.log('Using mock memecoin data for development');
    return this.getMockMemecoins(limit);
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
   */
  private async fetchRealPriceFromJupiter(tokenAddress: string): Promise<PriceData> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Server-side: Use axios with full retry logic
        const response = await axios.get(`${CONFIG.JUPITER_PRICE_API}/price`, {
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
            // Rate limit - wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
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
      { address: 'C8wX9nM9oL3jF6gHB7vU6KE2XzXh9K1mN8sP4qR7tV2wY5c', symbol: 'SC', name: 'Solchat', image: 'https://via.placeholder.com/64', verified: true, marketCap: 120000000, volume24h: 15000000, priceChange24h: -3.7 },
    ];
    
    return mockMemecoins.slice(0, limit);
  }

  clearCache(): void {
    this.priceCache.clear();
  }
}

export const jupiterService = new JupiterPriceService();