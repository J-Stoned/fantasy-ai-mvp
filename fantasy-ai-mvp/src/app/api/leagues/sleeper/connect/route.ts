import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sleeperAPI } from '@/lib/league-integrations/sleeper-api';

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
    
    // Get Sleeper username from request
    const { username } = await req.json();
    
    if (!username) {
      return NextResponse.json(
        { error: 'Sleeper username is required' },
        { status: 400 }
      );
    }
    
    // Import Sleeper leagues
    const leagues = await sleeperAPI.importUserLeagues(
      session.user.id,
      username
    );
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${leagues.length} Sleeper leagues`,
      leagues: leagues.map(l => ({
        id: l.id,
        name: l.name,
        sport: l.sport,
        platform: l.platform
      }))
    });
    
  } catch (error) {
    console.error('Sleeper connection error:', error);
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'Sleeper username not found. Please check your username.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to Sleeper' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if username exists
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const username = searchParams.get('username');
  
  if (!username) {
    return NextResponse.json({
      error: 'Username parameter is required'
    }, { status: 400 });
  }
  
  try {
    const user = await sleeperAPI.getUser(username);
    
    return NextResponse.json({
      exists: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return NextResponse.json({
        exists: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      error: 'Failed to check username'
    }, { status: 500 });
  }
}