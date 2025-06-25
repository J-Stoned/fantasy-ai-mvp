import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { subscription } = await req.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }
    
    // Store push subscription in database
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id || session.user.email,
        updatedAt: new Date()
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id || session.user.email
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Subscription stored successfully'
    });
    
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to store subscription' },
      { status: 500 }
    );
  }
}

// Get user's notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: {
        userId: session.user.id || session.user.email
      }
    });
    
    // Get active subscriptions count
    const subscriptions = await prisma.pushSubscription.count({
      where: {
        userId: session.user.id || session.user.email
      }
    });
    
    return NextResponse.json({
      preferences: preferences || {
        injuryAlerts: true,
        scoreUpdates: true,
        lineupLocks: true,
        tradeOffers: true,
        aiRecommendations: true,
        weeklyDigest: true
      },
      activeSubscriptions: subscriptions
    });
    
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}