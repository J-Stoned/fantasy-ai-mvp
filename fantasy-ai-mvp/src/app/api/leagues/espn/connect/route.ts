import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { espnFantasyAPI } from '@/lib/league-integrations/espn-fantasy-api';

export async function POST(req: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get ESPN cookies from request
    const { espn_s2, SWID } = await req.json();
    
    if (!espn_s2 || !SWID) {
      return NextResponse.json(
        { error: 'ESPN cookies (espn_s2 and SWID) are required' },
        { status: 400 }
      );
    }
    
    // Import ESPN leagues
    const leagues = await espnFantasyAPI.importUserLeagues(
      session.user.id,
      espn_s2,
      SWID
    );
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${leagues.length} ESPN leagues`,
      leagues: leagues.map(l => ({
        id: l.id,
        name: l.name,
        sport: l.sport,
        platform: l.platform
      }))
    });
    
  } catch (error) {
    console.error('ESPN connection error:', error);
    
    if (error.message === 'Invalid ESPN credentials') {
      return NextResponse.json(
        { error: 'Invalid ESPN credentials. Please check your cookies.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to ESPN Fantasy' },
      { status: 500 }
    );
  }
}

// GET endpoint to provide instructions
export async function GET() {
  return NextResponse.json({
    instructions: {
      step1: 'Log in to ESPN Fantasy in your browser',
      step2: 'Open Developer Tools (F12)',
      step3: 'Go to Application/Storage → Cookies',
      step4: 'Find and copy the values for:',
      cookies: {
        espn_s2: 'Long string starting with AEB...',
        SWID: 'String in format {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}'
      },
      step5: 'Send POST request with these values in the body'
    },
    example: {
      espn_s2: 'AEBxxx...xxx',
      SWID: '{12345678-1234-1234-1234-123456789012}'
    }
  });
}