import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

/**
 * Proxy endpoint for Jupiter price API to avoid CORS issues in the browser
 * This route handles price requests from the frontend and forwards them to Jupiter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    // Forward request to Jupiter Lite Price API V3 (FREE tier)
    const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${ids}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MoonFlip/1.0', // Required to avoid rate limits
      },
      // Add timeout using AbortController
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Jupiter API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the data to the frontend
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Jupiter proxy error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - Jupiter API is slow' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { error: `Proxy error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Unknown proxy error' },
      { status: 500 }
    );
  }
}

// Add CORS headers for browser requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
