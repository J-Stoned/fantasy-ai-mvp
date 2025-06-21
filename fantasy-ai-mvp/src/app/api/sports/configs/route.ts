import { NextRequest, NextResponse } from 'next/server';
import { multiSportService } from '@/lib/multi-sport-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const configs = activeOnly 
      ? await multiSportService.getActiveSports()
      : await multiSportService.getSportConfigs();

    return NextResponse.json({
      success: true,
      data: configs,
      count: configs.length
    });

  } catch (error) {
    console.error('Error fetching sport configs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sport configurations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}