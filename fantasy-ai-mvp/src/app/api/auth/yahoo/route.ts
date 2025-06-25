import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { yahooFantasyAPI } from '@/lib/league-integrations/yahoo-fantasy-api';

export async function GET(req: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Generate Yahoo OAuth URL
    const authUrl = yahooFantasyAPI.getAuthorizationUrl(session.user.id);
    
    // Redirect to Yahoo
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('Yahoo auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Yahoo authentication' },
      { status: 500 }
    );
  }
}