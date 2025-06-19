import { NextRequest, NextResponse } from 'next/server';
import { bettingService } from '@/lib/betting-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ propId: string }> }
) {
  try {
    const { propId } = await context.params;

    if (!propId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing propId parameter' 
        },
        { status: 400 }
      );
    }

    const insights = await bettingService.getBettingInsights(propId);

    return NextResponse.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error fetching betting insights:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch betting insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}