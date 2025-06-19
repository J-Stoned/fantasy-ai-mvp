import { NextRequest, NextResponse } from 'next/server';
import { bettingService } from '@/lib/betting-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: userId' 
        },
        { status: 400 }
      );
    }

    const bettingHistory = await bettingService.getBettingHistory(userId);

    return NextResponse.json({
      success: true,
      data: bettingHistory,
      count: bettingHistory.length
    });

  } catch (error) {
    console.error('Error fetching betting history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch betting history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}