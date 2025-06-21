import { NextRequest, NextResponse } from 'next/server';
import { multiSportService } from '@/lib/multi-sport-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  try {
    const { sport } = await context.params;
    const { searchParams } = new URL(request.url);
    
    const dateParam = searchParams.get('date');
    const liveOnly = searchParams.get('live') === 'true';
    
    let schedule;
    
    if (liveOnly) {
      schedule = await multiSportService.getLiveGames(sport);
    } else {
      const date = dateParam ? new Date(dateParam) : undefined;
      schedule = await multiSportService.getSchedule(sport, date);
    }

    return NextResponse.json({
      success: true,
      data: schedule,
      count: schedule.length,
      sport,
      ...(dateParam && { date: dateParam }),
      ...(liveOnly && { liveOnly: true })
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}