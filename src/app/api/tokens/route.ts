import { NextRequest, NextResponse } from 'next/server';

// Cache for token data
let tokenCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds max cache (November 2025 standard)

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (tokenCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('🔄 Returning cached token list');
      return NextResponse.json(tokenCache);
    }

    console.log('🔄 Fetching fresh token list from Jupiter API...');
    
    // Fetch from Jupiter tokens endpoint (server-side only, no CORS issues)
    // This endpoint includes ALL new pump.fun tokens instantly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://tokens.jup.ag/tokens', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MoonFlip/1.0', // Required to avoid rate limits
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json();
    console.log(`✅ Fetched ${tokens.length} tokens from Jupiter tokens`);

    // Transform Jupiter strict format to our expected format
    const transformedTokens = tokens.map((token: any) => ({
      address: token.address || token.id,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI || token.logoUri || token.icon, // Handle multiple logo field names
      tags: token.tags || [],
      marketCap: token.marketCap || token.mcap || 0,
      volume24h: token.volume24h || token.stats24h?.volume || 0,
      priceChange24h: token.priceChange24h || token.stats24h?.priceChange || 0,
      verified: token.verified || token.isVerified || token.tags?.includes('verified') || false,
      daily_volume: token.daily_volume || 0,
      created_at: token.createdAt || new Date().toISOString()
    }));

    // Transform and cache the data
    tokenCache = {
      tokens: transformedTokens,
      timestamp: now,
      count: transformedTokens.length,
    };
    cacheTimestamp = now;

    return NextResponse.json(tokenCache);
    
  } catch (error) {
    console.error('❌ Token API error:', error);
    
    // Return cached data if available, even if stale
    if (tokenCache) {
      console.log('📦 Returning stale cache due to error');
      return NextResponse.json(tokenCache);
    }
    
    // Return mock data for popular tokens as fallback
    const mockTokens = [
      {
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        symbol: 'BONK',
        name: 'Bonk',
        decimals: 5,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
        tags: ['meme']
      },
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        tags: ['stablecoin']
      },
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        tags: ['solana']
      },
      {
        address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
        symbol: 'WIF',
        name: 'dogwifhat',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png',
        tags: ['meme']
      },
      {
        address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHyC7hE9jTJYo',
        symbol: 'POPCAT',
        name: 'Popcat',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHyC7hE9jTJYo/logo.png',
        tags: ['meme']
      }
    ];

    console.log('📦 Returning mock token data as fallback');
    return NextResponse.json({
      tokens: mockTokens,
      timestamp: Date.now(),
      count: mockTokens.length,
      fallback: true,
      error: 'Using mock data due to network issues'
    });
  }
}

// Revalidate every hour (Next.js 13+ feature)
// Export config for Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 3600;