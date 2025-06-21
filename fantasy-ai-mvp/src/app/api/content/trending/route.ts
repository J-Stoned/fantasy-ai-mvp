import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';

    if (!['1h', '6h', '24h', '7d'].includes(timeframe)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid timeframe. Must be: 1h, 6h, 24h, or 7d' 
        },
        { status: 400 }
      );
    }

    const trendingTopics = await contentService.getTrendingTopics(
      timeframe as '1h' | '6h' | '24h' | '7d'
    );

    return NextResponse.json({
      success: true,
      data: trendingTopics,
      count: trendingTopics.length,
      timeframe
    });

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trending topics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}