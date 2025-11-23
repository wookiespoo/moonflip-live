import { NextRequest, NextResponse } from 'next/server';
import { gameManager } from '@/lib/game';
import { withSecurity } from '@/lib/security';

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'winnings' | 'win_rate' | 'volume' || 'winnings';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    const leaderboard = await gameManager.getLeaderboard(type, limit);
    
    return NextResponse.json({ 
      success: true, 
      leaderboard,
      type,
      count: leaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leaderboard' 
      },
      { status: 500 }
    );
  }
});