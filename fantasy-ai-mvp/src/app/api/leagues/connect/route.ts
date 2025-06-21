import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl, exchangeCodeForToken, storeConnection, getConnectionStatus } from '@/lib/fantasy-oauth';

// POST /api/leagues/connect - Initiate OAuth connection
export async function POST(request: NextRequest) {
  try {
    const { platform, userId } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Check if already connected
    const status = getConnectionStatus(platform);
    if (status === 'connected') {
      return NextResponse.json({
        success: true,
        message: 'Platform already connected',
        status: 'connected'
      });
    }

    // Generate OAuth URL
    const state = `${platform}_${userId}_${Date.now()}`;
    const authUrl = generateAuthUrl(platform, state);

    return NextResponse.json({
      success: true,
      authUrl,
      state,
      platform
    });

  } catch (error) {
    console.error('League connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}

// GET /api/leagues/connect - Get connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform parameter required' },
        { status: 400 }
      );
    }

    const status = getConnectionStatus(platform);
    
    return NextResponse.json({
      success: true,
      platform,
      status
    });

  } catch (error) {
    console.error('Connection status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}