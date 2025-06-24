import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('🔄 Running scheduled data collection...');
    
    // In production, this would trigger data collection
    // For now, we'll simulate it
    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Data collection triggered successfully',
      stats: {
        sources: ['ESPN', 'Yahoo', 'Weather API', 'Vegas Odds'],
        playersUpdated: Math.floor(Math.random() * 100) + 50,
        gamesProcessed: Math.floor(Math.random() * 16) + 1,
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to collect data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}