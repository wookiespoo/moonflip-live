import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { captureError } from '@/lib/monitoring';
import { withSecurity } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async (request: NextRequest, session) => {
  try {
    // Get admin stats
    const stats = await database.getAdminStats();
    
    return NextResponse.json({
      success: true,
      stats,
      admin: session.wallet.slice(0, 8) + '...'
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    captureError(error as Error, {
      endpoint: '/api/admin/stats',
      method: 'GET'
    });
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
});