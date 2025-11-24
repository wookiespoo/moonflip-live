import axios from 'axios';

export interface PumpFunToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  liquidity: number;
  createdAt: string;
  logo?: string;
  isNewLaunch?: boolean;
  ageHours?: number;
}

export interface MoralisPumpFunResponse {
  tokens: PumpFunToken[];
}

class PumpFunService {
  private readonly BASE_URL = 'https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun';
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  private setCacheData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private calculateAgeHours(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }

  async getNewTokens(limit: number = 20): Promise<PumpFunToken[]> {
    const cacheKey = `pumpfun-new-${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/new`, {
        params: { limit },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MoonFlip/1.0',
        },
      });

      if (response.data?.tokens && Array.isArray(response.data.tokens)) {
        const tokens = response.data.tokens.map((token: any) => {
          const ageHours = this.calculateAgeHours(token.createdAt);
          return {
            address: token.address || token.mint || '',
            symbol: token.symbol || 'UNKNOWN',
            name: token.name || 'Unknown Token',
            priceUsd: parseFloat(token.priceUsd) || 0,
            liquidity: parseFloat(token.liquidity) || 0,
            createdAt: token.createdAt,
            logo: token.logo || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`,
            isNewLaunch: ageHours < 1, // Less than 1 hour old
            ageHours,
          };
        });

        this.setCacheData(cacheKey, tokens);
        return tokens;
      }

      return [];
    } catch (error) {
      console.error('Pump.fun API error:', error);
      return [];
    }
  }

  async getTrendingTokens(limit: number = 20): Promise<PumpFunToken[]> {
    const cacheKey = `pumpfun-trending-${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/trending`, {
        params: { limit },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MoonFlip/1.0',
        },
      });

      if (response.data?.tokens && Array.isArray(response.data.tokens)) {
        const tokens = response.data.tokens.map((token: any) => {
          const ageHours = this.calculateAgeHours(token.createdAt);
          return {
            address: token.address || token.mint || '',
            symbol: token.symbol || 'UNKNOWN',
            name: token.name || 'Unknown Token',
            priceUsd: parseFloat(token.priceUsd) || 0,
            liquidity: parseFloat(token.liquidity) || 0,
            createdAt: token.createdAt,
            logo: token.logo || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`,
            isNewLaunch: ageHours < 1,
            ageHours,
          };
        });

        this.setCacheData(cacheKey, tokens);
        return tokens;
      }

      return [];
    } catch (error) {
      console.error('Pump.fun trending API error:', error);
      return [];
    }
  }

  // Fallback method for when Moralis API is down
  async getMockPumpFunTokens(): Promise<PumpFunToken[]> {
    return [
      {
        address: 'AUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wF',
        symbol: 'MOON',
        name: 'MoonFlip Token',
        priceUsd: 0.0001234,
        liquidity: 150000,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/AUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wF/logo.png',
        isNewLaunch: true,
        ageHours: 0.5,
      },
      {
        address: 'BUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wG',
        symbol: 'PUMP',
        name: 'Pump King',
        priceUsd: 0.0004567,
        liquidity: 250000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wG/logo.png',
        isNewLaunch: false,
        ageHours: 2,
      },
      {
        address: 'CUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wH',
        symbol: 'DEGEN',
        name: 'Degen Flipper',
        priceUsd: 0.000789,
        liquidity: 180000,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/CUKbrKti5Vcz4zAga5C6HBVjkp6g5Va1gr4bKU8uD9wH/logo.png',
        isNewLaunch: true,
        ageHours: 0.75,
      },
    ];
  }
}

export const pumpFunService = new PumpFunService();