import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pushNotificationService } from '@/lib/notifications/push-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: session.user.id }
    });

    const stats = await pushNotificationService.getSubscriptionStats();

    return NextResponse.json({
      settings: settings || {
        scoreUpdates: true,
        tradeAlerts: true,
        injuryAlerts: true,
        battleInvitations: true,
        achievements: true,
        weeklyInsights: true,
        pushEnabled: false
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    await prisma.notificationSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...settings
      },
      update: settings
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}