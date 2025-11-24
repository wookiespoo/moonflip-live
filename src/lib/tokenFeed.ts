import { jupiterService } from './jupiter';
import { JupiterToken } from './types';
import { pumpFunService, PumpFunToken } from './pumpfun';

export interface CombinedToken extends JupiterToken {
  isNewLaunch?: boolean;
  ageHours?: number;
  liquidity?: number;
  createdAt?: string;
  pumpFunData?: PumpFunToken;
}

export interface TokenFeedOptions {
  includeNewLaunches?: boolean;
  includeJupiterFallback?: boolean;
  limit?: number;
  sortBy?: 'newest' | 'volume' | 'price_change';
}

class TokenFeedService {
  private readonly DEFAULT_LIMIT = 20;
  private readonly NEW_LAUNCH_THRESHOLD_HOURS = 1;

  /**
   * Get combined token feed: Pump.fun new launches + Jupiter top memecoins
   * This is the main method that powers the homepage feed
   */
  async getCombinedTokenFeed(options: TokenFeedOptions = {}): Promise<CombinedToken[]> {
    const {
      includeNewLaunches = true,
      includeJupiterFallback = true,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'newest'
    } = options;

    const tokens: CombinedToken[] = [];

    // Step 1: Get fresh Pump.fun new tokens (primary source)
    if (includeNewLaunches) {
      try {
        const pumpFunTokens = await pumpFunService.getNewTokens(10); // Get 10 newest
        const pumpFunCombined = await this.transformPumpFunToCombined(pumpFunTokens);
        tokens.push(...pumpFunCombined);
        console.log(`✅ Added ${pumpFunCombined.length} Pump.fun new tokens`);
      } catch (error) {
        console.error('Failed to fetch Pump.fun tokens:', error);
      }
    }

    // Step 2: Fill remaining slots with Jupiter top memecoins
    const remainingSlots = limit - tokens.length;
    if (remainingSlots > 0 && includeJupiterFallback) {
      try {
        const jupiterTokens = await jupiterService.getTopMemecoins(remainingSlots + 10); // Get extra for filtering
        const jupiterCombined = await this.transformJupiterToCombined(jupiterTokens);
        
        // Filter out duplicates (tokens already from Pump.fun)
        const existingAddresses = new Set(tokens.map(t => t.address));
        const uniqueJupiterTokens = jupiterCombined.filter(t => !existingAddresses.has(t.address));
        
        tokens.push(...uniqueJupiterTokens.slice(0, remainingSlots));
        console.log(`✅ Added ${uniqueJupiterTokens.length} Jupiter fallback tokens`);
      } catch (error) {
        console.error('Failed to fetch Jupiter tokens:', error);
      }
    }

    // Step 3: Sort and limit
    const sortedTokens = this.sortTokens(tokens, sortBy);
    return sortedTokens.slice(0, limit);
  }

  /**
   * Get trending tokens (high volume/price change) from both sources
   */
  async getTrendingTokens(limit: number = 12): Promise<CombinedToken[]> {
    const tokens: CombinedToken[] = [];

    try {
      // Get Pump.fun trending tokens
      const pumpFunTrending = await pumpFunService.getTrendingTokens(6);
      const pumpFunCombined = await this.transformPumpFunToCombined(pumpFunTrending);
      tokens.push(...pumpFunCombined);
    } catch (error) {
      console.error('Failed to fetch Pump.fun trending tokens:', error);
    }

    try {
      // Get Jupiter newest trending tokens
      const jupiterNewest = await jupiterService.getNewestTrendingTokens(6);
      const jupiterCombined = await this.transformJupiterToCombined(jupiterNewest);
      
      // Filter out duplicates
      const existingAddresses = new Set(tokens.map(t => t.address));
      const uniqueJupiterTokens = jupiterCombined.filter(t => !existingAddresses.has(t.address));
      tokens.push(...uniqueJupiterTokens);
    } catch (error) {
      console.error('Failed to fetch Jupiter newest trending tokens:', error);
    }

    // Sort by volume and price change combined
    return tokens
      .sort((a, b) => {
        const aScore = (Math.abs(a.priceChange24h || 0) * 0.6) + 
                      ((a.volume24h || 0) / 1000000 * 0.4);
        const bScore = (Math.abs(b.priceChange24h || 0) * 0.6) + 
                      ((b.volume24h || 0) / 1000000 * 0.4);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Transform Pump.fun tokens to CombinedToken format
   */
  private async transformPumpFunToCombined(pumpFunTokens: PumpFunToken[]): Promise<CombinedToken[]> {
    return pumpFunTokens.map(token => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      image: token.logo || `https://via.placeholder.com/64`,
      verified: false, // Pump.fun tokens are not verified by Jupiter
      marketCap: 0, // Will be calculated from price and supply
      volume24h: token.liquidity || 0,
      priceChange24h: 0, // Pump.fun doesn't provide 24h change
      isNewLaunch: token.isNewLaunch || false,
      ageHours: token.ageHours || 0,
      liquidity: token.liquidity,
      createdAt: token.createdAt,
      pumpFunData: token,
    }));
  }

  /**
   * Transform Jupiter tokens to CombinedToken format
   */
  private async transformJupiterToCombined(jupiterTokens: JupiterToken[]): Promise<CombinedToken[]> {
    return jupiterTokens.map(token => ({
      ...token,
      isNewLaunch: false, // Jupiter tokens are established
      ageHours: 24, // Assume older tokens from Jupiter
      liquidity: token.volume24h, // Use volume as liquidity proxy
    }));
  }

  /**
   * Sort tokens based on different criteria
   */
  private sortTokens(tokens: CombinedToken[], sortBy: string): CombinedToken[] {
    switch (sortBy) {
      case 'newest':
        return tokens.sort((a, b) => {
          // New launches first, then by age (newer first)
          if (a.isNewLaunch && !b.isNewLaunch) return -1;
          if (!a.isNewLaunch && b.isNewLaunch) return 1;
          return (b.ageHours || 999) - (a.ageHours || 999);
        });
      
      case 'volume':
        return tokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
      
      case 'price_change':
        return tokens.sort((a, b) => 
          Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0)
        );
      
      default:
        return tokens;
    }
  }

  /**
   * Check if a token is a new launch (< 1 hour old)
   */
  isNewLaunch(token: CombinedToken): boolean {
    return token.isNewLaunch === true || (token.ageHours || 999) < this.NEW_LAUNCH_THRESHOLD_HOURS;
  }

  /**
   * Get token age in human readable format
   */
  getTokenAgeDisplay(token: CombinedToken): string {
    if (!token.ageHours) return '';
    
    if (token.ageHours < 1) {
      const minutes = Math.floor(token.ageHours * 60);
      return `${minutes}m ago`;
    } else if (token.ageHours < 24) {
      return `${Math.floor(token.ageHours)}h ago`;
    } else {
      const days = Math.floor(token.ageHours / 24);
      return `${days}d ago`;
    }
  }
}

export const tokenFeedService = new TokenFeedService();