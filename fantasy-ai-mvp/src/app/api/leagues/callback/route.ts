import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, storeConnection, validateState } from '@/lib/fantasy-oauth';

// GET /api/leagues/callback - Handle OAuth callbacks from fantasy platforms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/onboarding?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state || !platform) {
      return NextResponse.redirect(
        new URL('/onboarding?error=missing_parameters', request.url)
      );
    }

    // Extract platform from state if not provided directly
    const platformFromState = state.split('_')[0];
    const finalPlatform = platform || platformFromState;

    try {
      // Exchange code for access token
      const connection = await exchangeCodeForToken(finalPlatform, code, state);
      
      // Store connection
      await storeConnection(connection);

      // Redirect back to onboarding with success
      return NextResponse.redirect(
        new URL(`/onboarding?connected=${finalPlatform}&leagues=${connection.leagues.length}`, request.url)
      );

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        new URL(`/onboarding?error=token_exchange_failed&platform=${finalPlatform}`, request.url)
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/onboarding?error=callback_failed', request.url)
    );
  }
}

// POST /api/leagues/callback - Handle programmatic OAuth completion (for development/testing)
export async function POST(request: NextRequest) {
  try {
    const { platform, code, state } = await request.json();

    if (!platform || !code || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Exchange code for token
    const connection = await exchangeCodeForToken(platform, code, state);
    
    // Store connection
    await storeConnection(connection);

    return NextResponse.json({
      success: true,
      platform,
      leagues: connection.leagues.length,
      connectedAt: connection.connectedAt,
      message: `Successfully connected to ${platform}`
    });

  } catch (error) {
    console.error('OAuth callback POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete OAuth connection' },
      { status: 500 }
    );
  }
}