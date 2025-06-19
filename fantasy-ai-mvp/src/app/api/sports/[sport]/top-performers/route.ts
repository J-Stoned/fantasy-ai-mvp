import { NextRequest, NextResponse } from 'next/server';
import { multiSportService } from '@/lib/multi-sport-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  try {
    const { sport } = await context.params;
    const { searchParams } = new URL(request.url);
    
    const timeframe = searchParams.get('timeframe') || 'week';
    
    if (!['day', 'week', 'month', 'season'].includes(timeframe)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid timeframe. Must be: day, week, month, or season' 
        },
        { status: 400 }
      );
    }

    const topPerformers = await multiSportService.getTopPerformers(
      sport, 
      timeframe as 'day' | 'week' | 'month' | 'season'
    );

    return NextResponse.json({
      success: true,
      data: topPerformers,
      count: topPerformers.length,
      sport,
      timeframe
    });

  } catch (error) {
    console.error('Error fetching top performers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch top performers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}