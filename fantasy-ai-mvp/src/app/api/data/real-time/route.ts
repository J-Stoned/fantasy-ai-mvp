import { NextResponse } from 'next/server';
import { realTimeDataService } from '@/lib/real-time-data-service';

let isRunning = false;

export async function GET() {
  return NextResponse.json({
    status: isRunning ? 'running' : 'stopped',
    message: 'Real-time data collection service status'
  });
}

export async function POST() {
  try {
    if (isRunning) {
      return NextResponse.json({
        success: false,
        message: 'Real-time collection is already running'
      }, { status: 400 });
    }

    // Start real-time collection
    await realTimeDataService.startRealTimeCollection();
    isRunning = true;

    return NextResponse.json({
      success: true,
      message: 'Real-time data collection started',
      sources: [
        'ESPN NFL Scoreboard (30s updates)',
        'ESPN NBA Scoreboard (30s updates)',
        'ESPN Breaking News (5min updates)',
        'NFL.com News (5min updates)',
        'ESPN NFL Leaders (10min updates)'
      ]
    });

  } catch (error) {
    console.error('Failed to start real-time collection:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    realTimeDataService.stopAllCollection();
    isRunning = false;

    return NextResponse.json({
      success: true,
      message: 'Real-time data collection stopped'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}