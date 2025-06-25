import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { yahooFantasyAPI } from '@/lib/league-integrations/yahoo-fantasy-api';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle errors from Yahoo
    if (error) {
      console.error('Yahoo OAuth error:', error);
      return NextResponse.redirect('/settings?error=yahoo_auth_failed');
    }
    
    if (!code || !state) {
      return NextResponse.redirect('/settings?error=missing_params');
    }
    
    // Verify state to prevent CSRF
    const stateRecord = await prisma.oAuthState.findFirst({
      where: {
        state,
        provider: 'yahoo',
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!stateRecord) {
      return NextResponse.redirect('/settings?error=invalid_state');
    }
    
    // Exchange code for tokens
    const tokens = await yahooFantasyAPI.exchangeCodeForTokens(code);
    
    // Store tokens securely
    await prisma.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: stateRecord.userId,
          platform: 'YAHOO'
        }
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true
      },
      create: {
        userId: stateRecord.userId,
        platform: 'YAHOO',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true
      }
    });
    
    // Clean up used state
    await prisma.oAuthState.delete({
      where: { id: stateRecord.id }
    });
    
    // Import user's leagues in the background
    yahooFantasyAPI.importUserLeagues(stateRecord.userId, tokens.access_token)
      .catch(error => console.error('Background import error:', error));
    
    // Redirect to success page
    return NextResponse.redirect('/settings?success=yahoo_connected');
    
  } catch (error) {
    console.error('Yahoo callback error:', error);
    return NextResponse.redirect('/settings?error=callback_failed');
  }
}